import React, { createContext, useState, useEffect, useCallback } from 'react';
import safeStorage from '../utils/storage';
import { AUTH_TOKEN_KEY } from '../services/api';
import { authService } from '../services/authService';
import { profileService } from '../services/profileService';
import { verificationService } from '../services/verificationService';
import { notificationService } from '../services/notificationService';
import { adminService } from '../services/adminService';
import api from '../services/api';
import { INITIAL_NOTIFICATIONS } from '../data/mockNotifications';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [userVerification, setUserVerification] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState(null);

  // Verification State: 'Not Verified' | 'Pending' | 'Verified' | 'Rejected'
  const [verificationStatus, setVerificationStatus] = useState('Not Verified');
  const [isEmailOtpVerified, setIsEmailOtpVerified] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  // Blocked Users State
  const [blockedUsers, setBlockedUsers] = useState([
    { id: 'usr_blocked_1', name: 'Suspicious User', date: '2026-09-01' },
  ]);

  // Preferences & Settings State
  const [notifPreferences, setNotifPreferences] = useState({
    connectionRequests: true,
    messages: true,
    roomRequests: true,
    matchingListings: true,
    verificationUpdates: true,
  });

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: true,
    showCollege: true,
    showApproxLocation: true,
    allowConnectionRequests: true,
  });

  // Admin Panel State - Real Live Backend Data Only
  const [adminStats, setAdminStats] = useState({
    totalStudents: 0,
    verifiedStudents: 0,
    pendingVerifications: 0,
    rejectedVerifications: 0,
    activeListings: 0,
    totalListings: 0,
    totalConnections: 0,
    pendingConnections: 0,
    reportsCount: 0,
    suspendedUsers: 0,
  });
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminVerifications, setAdminVerifications] = useState([]);
  const [adminListings, setAdminListings] = useState([]);
  const [adminReports, setAdminReports] = useState([]);

  const fetchOwnProfile = async () => {
    try {
      const res = await profileService.getOwnProfile();
      if (res.success && res.profile) {
        setProfile(res.profile);
        setUser((prev) => (prev ? { ...prev, ...res.profile } : prev));
        return res.profile;
      } else {
        setProfile(null);
        return null;
      }
    } catch (err) {
      setProfile(null);
      return null;
    }
  };

  const fetchOwnVerification = async () => {
    try {
      const res = await verificationService.getOwnVerification();
      if (res.success) {
        setVerificationStatus(res.latestStatus);
        setUserVerification(res.verifications[0] || null);
        return res.latestStatus;
      }
    } catch (err) {
      console.warn('Fetch verification error:', err);
    }
    return 'Not Verified';
  };

  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getNotifications();
      if (res.success && Array.isArray(res.notifications)) {
        setNotifications(res.notifications);
        return res.notifications;
      }
    } catch (err) {
      console.warn('Fetch notifications error:', err);
    }
    return [];
  };

  const fetchAdminData = useCallback(async () => {
    try {
      const [statsRes, usersRes, verifsRes, listingsRes, reportsRes] = await Promise.all([
        adminService.getStats(),
        adminService.getUsers(),
        adminService.getVerifications(),
        adminService.getListings(),
        adminService.getReports(),
      ]);

      if (statsRes.success && statsRes.stats) {
        setAdminStats(statsRes.stats);
      }
      if (usersRes.success && Array.isArray(usersRes.users)) {
        setAdminUsers(usersRes.users);
      }
      if (verifsRes.success && Array.isArray(verifsRes.verifications)) {
        setAdminVerifications(verifsRes.verifications);
      }
      if (listingsRes.success && Array.isArray(listingsRes.listings)) {
        setAdminListings(listingsRes.listings);
      }
      if (reportsRes.success && Array.isArray(reportsRes.reports)) {
        setAdminReports(reportsRes.reports);
      }
    } catch (err) {
      console.warn('[AuthContext] Error fetching admin data from backend:', err?.message || err);
    }
  }, []);

  // Automatic session restoration on app startup
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedToken = await safeStorage.getItem(AUTH_TOKEN_KEY);
        if (storedToken) {
          const res = await authService.getCurrentUser();
          if (res.success && res.user) {
            setUser(res.user);
            setToken(storedToken);
            
            if (res.user.role === 'admin') {
              await fetchAdminData();
            } else {
              // Fetch student profile, verification, and notifications asynchronously
              await Promise.all([fetchOwnProfile(), fetchOwnVerification(), fetchNotifications()]);
            }
          } else {
            await safeStorage.removeItem(AUTH_TOKEN_KEY);
            setUser(null);
            setToken(null);
          }
        }
      } catch (err) {
        console.warn('[AuthContext] Session restore failed, clearing token:', err?.message || err);
        await safeStorage.removeItem(AUTH_TOKEN_KEY);
        setUser(null);
        setToken(null);
      } finally {
        setIsInitializing(false);
      }
    };

    restoreSession();
  }, [fetchAdminData]);

  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(email, password);
      setUser(response.user);
      setToken(response.token);

      if (response.user?.role === 'admin') {
        await fetchAdminData();
      } else {
        // Fetch profile, verification status, and notifications
        await Promise.all([fetchOwnProfile(), fetchOwnVerification(), fetchNotifications()]);
      }

      return { success: true, user: response.user };
    } catch (err) {
      const errorMsg = err.message || 'Invalid email or password.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (formData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.register(formData);
      setVerificationStatus('Not Verified');
      return { success: true, user: response.user };
    } catch (err) {
      const errorMsg = err.message || 'Registration failed. Please try again.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (profileData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await profileService.createOrUpdateProfile(profileData);
      if (response.success && response.profile) {
        setProfile(response.profile);
        setUser((prev) => ({ ...prev, ...response.profile }));
        return { success: true, profile: response.profile };
      } else {
        const msg = response.error || 'Failed to update profile.';
        setError(msg);
        return { success: false, error: msg };
      }
    } catch (err) {
      const errorMsg = err.message || 'Failed to update profile.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const sendVerificationOtp = async (email) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await verificationService.sendOtp(email);
      return { success: true, message: response.message, demoOtp: response.demoOtp };
    } catch (err) {
      const errorMsg = err.message || 'Failed to send OTP.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmailOtp = async (email, otpCode) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await verificationService.verifyOtp(email, otpCode);
      setIsEmailOtpVerified(true);
      return { success: true, message: response.message };
    } catch (err) {
      const errorMsg = err.message || 'OTP verification failed.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const submitStudentVerification = async (data) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await verificationService.submitVerification(data);
      if (response.success) {
        setVerificationStatus('Pending');
        setUserVerification(response.verification);
        if (user) {
          setUser({
            ...user,
            verificationStatus: 'Pending',
            verificationBadge: 'Pending .edu Verification',
          });
        }
        return { success: true, message: response.message, status: 'Pending' };
      } else {
        const errorMsg = response.error || 'Verification submission failed.';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      const errorMsg = err.message || 'Verification submission failed.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.resetPassword(email);
      return { success: true, message: response.message };
    } catch (err) {
      const errorMsg = err.message || 'Failed to send reset link.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setToken(null);
      setVerificationStatus('Not Verified');
      setIsEmailOtpVerified(false);
    } catch (err) {
      console.warn('Logout error', err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAccount = async () => {
    setIsLoading(true);
    try {
      setUser(null);
      setToken(null);
      setVerificationStatus('Not Verified');
      setIsEmailOtpVerified(false);
      setNotifications([]);
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Failed to delete account.' };
    } finally {
      setIsLoading(false);
    }
  };

  // Notification methods
  const markAsRead = async (id) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === String(id) ? { ...item, isRead: true, is_read: true } : item))
    );
    try {
      await notificationService.markAsRead(id);
    } catch (err) {
      console.warn('Mark notification read API error:', err);
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true, is_read: true })));
    try {
      await notificationService.markAllAsRead(notifications);
    } catch (err) {
      console.warn('Mark all notifications read API error:', err);
    }
  };

  const unreadNotifCount = notifications.filter((n) => !n.isRead && !n.is_read).length;

  // Blocked Users methods
  const blockUser = (targetUser) => {
    if (!targetUser) return;
    const userId = targetUser.id || `usr_block_${Date.now()}`;
    const userName = targetUser.fullName || targetUser.name || 'User';
    setBlockedUsers((prev) => {
      if (prev.some((u) => u.id === userId)) return prev;
      return [...prev, { id: userId, name: userName, date: new Date().toISOString().split('T')[0] }];
    });
  };

  const unblockUser = (userId) => {
    setBlockedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const isUserBlocked = (userId) => {
    return blockedUsers.some((u) => u.id === userId);
  };

  // Admin Methods with Real Backend Integration
  const toggleSuspendUser = async (userId) => {
    const targetUser = adminUsers.find((u) => u.id === userId);
    const newStatus = targetUser?.accountStatus === 'Active' ? 'suspended' : 'active';

    try {
      const res = await adminService.toggleSuspendUser(userId, newStatus);
      if (res.success) {
        setAdminUsers((prev) =>
          prev.map((u) => {
            if (u.id === userId) {
              return { ...u, accountStatus: newStatus === 'active' ? 'Active' : 'Suspended' };
            }
            return u;
          })
        );
        adminService.getStats().then((s) => s.success && setAdminStats(s.stats));
        return { success: true, message: res.message };
      } else {
        console.warn('Backend toggle suspend user error:', res.error);
        return { success: false, error: res.error };
      }
    } catch (err) {
      console.warn('Toggle suspend API exception:', err);
      return { success: false, error: err.message || 'Failed to update user account status' };
    }
  };

  const approveVerification = async (verifId) => {
    try {
      const res = await adminService.updateVerificationStatus(verifId, 'verified');
      if (res.success) {
        setAdminVerifications((prev) =>
          prev.map((v) => (v.id === verifId ? { ...v, status: 'Approved' } : v))
        );
        setAdminStats((prev) => ({
          ...prev,
          verifiedStudents: prev.verifiedStudents + 1,
          pendingVerifications: Math.max(0, prev.pendingVerifications - 1),
        }));
        adminService.getStats().then((s) => s.success && setAdminStats(s.stats));
        return { success: true, message: res.message };
      } else {
        console.warn('Backend approve verification error:', res.error);
        return { success: false, error: res.error };
      }
    } catch (err) {
      console.warn('Approve verification API exception:', err);
      return { success: false, error: err.message || 'Failed to approve verification' };
    }
  };

  const rejectVerification = async (verifId) => {
    try {
      const res = await adminService.updateVerificationStatus(verifId, 'rejected');
      if (res.success) {
        setAdminVerifications((prev) =>
          prev.map((v) => (v.id === verifId ? { ...v, status: 'Rejected' } : v))
        );
        setAdminStats((prev) => ({
          ...prev,
          rejectedVerifications: (prev.rejectedVerifications || 0) + 1,
          pendingVerifications: Math.max(0, prev.pendingVerifications - 1),
        }));
        adminService.getStats().then((s) => s.success && setAdminStats(s.stats));
        return { success: true, message: res.message };
      } else {
        console.warn('Backend reject verification error:', res.error);
        return { success: false, error: res.error };
      }
    } catch (err) {
      console.warn('Reject verification API exception:', err);
      return { success: false, error: err.message || 'Failed to reject verification' };
    }
  };

  const approveListing = async (listingId) => {
    setAdminListings((prev) =>
      prev.map((l) => (l.id === listingId ? { ...l, status: 'Approved' } : l))
    );

    try {
      await adminService.updateListingStatus(listingId, 'active');
      adminService.getStats().then((s) => s.success && setAdminStats(s.stats));
    } catch (err) {
      console.warn('Approve listing error:', err);
    }
  };

  const rejectListing = async (listingId) => {
    setAdminListings((prev) =>
      prev.map((l) => (l.id === listingId ? { ...l, status: 'Rejected' } : l))
    );

    try {
      await adminService.updateListingStatus(listingId, 'inactive');
      adminService.getStats().then((s) => s.success && setAdminStats(s.stats));
    } catch (err) {
      console.warn('Reject listing error:', err);
    }
  };

  const removeListing = async (listingId) => {
    setAdminListings((prev) => prev.filter((l) => l.id !== listingId));
    setAdminStats((prev) => ({
      ...prev,
      activeListings: Math.max(0, prev.activeListings - 1),
    }));

    try {
      await adminService.removeListing(listingId);
      adminService.getStats().then((s) => s.success && setAdminStats(s.stats));
    } catch (err) {
      console.warn('Remove listing error:', err);
    }
  };

  const resolveReport = async (reportId) => {
    setAdminReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status: 'Resolved' } : r))
    );
    setAdminStats((prev) => ({
      ...prev,
      reportsCount: Math.max(0, prev.reportsCount - 1),
    }));

    try {
      await adminService.updateReportStatus(reportId, 'resolved');
      adminService.getStats().then((s) => s.success && setAdminStats(s.stats));
    } catch (err) {
      console.warn('Resolve report error:', err);
    }
  };

  const submitReport = async (reportData) => {
    try {
      const payload = {
        reported_user_id: reportData.reportedUserId || reportData.reported_user_id || null,
        listing_id: reportData.listingId || reportData.listing_id || null,
        reason: reportData.reason || 'Inappropriate content',
        description: reportData.details || reportData.description || '',
      };
      const res = await api.post('/reports', payload);
      if (res.data?.success) {
        adminService.getReports().then((r) => r.success && setAdminReports(r.reports));
        adminService.getStats().then((s) => s.success && setAdminStats(s.stats));
        return { success: true, message: res.data.message };
      }
      return { success: false, error: res.data?.message || 'Failed to submit report' };
    } catch (err) {
      console.warn('Submit report error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to submit report';
      return { success: false, error: errorMsg };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        userVerification,
        fetchOwnProfile,
        fetchOwnVerification,
        token,
        isAuthenticated: !!user,
        isLoading,
        isInitializing,
        error,
        verificationStatus,
        setVerificationStatus,
        isEmailOtpVerified,
        setIsEmailOtpVerified,
        login,
        register,
        updateProfile,
        sendVerificationOtp,
        verifyEmailOtp,
        submitStudentVerification,
        resetPassword,
        logout,
        deleteAccount,
        setError,
        // Notifications
        notifications,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        unreadNotifCount,
        // Blocked Users
        blockedUsers,
        blockUser,
        unblockUser,
        isUserBlocked,
        // Preferences & Privacy
        notifPreferences,
        setNotifPreferences,
        privacySettings,
        setPrivacySettings,
        // Admin State & Actions
        adminStats,
        adminUsers,
        adminVerifications,
        adminListings,
        adminReports,
        fetchAdminData,
        toggleSuspendUser,
        approveVerification,
        rejectVerification,
        approveListing,
        rejectListing,
        removeListing,
        resolveReport,
        submitReport,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
