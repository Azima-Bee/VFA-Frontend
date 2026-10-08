# VFA (Verified Flatmate App) — Real-User Beta Testing Guide

## Objective
This document outlines the standardized end-to-end verification and testing workflow for students, hostel partners, and administrators participating in the controlled beta release.

---

## 📋 Controlled Beta Testing Workflow

```text
Student A Registers
       ↓
Student A Logs In
       ↓
Student A Completes Profile
       ↓
Student A Submits Student Verification
       ↓
Administrator Reviews & Approves Verification
       ↓
Student A Posts a Room Listing
       ↓
Student B Searches & Opens Student A's Listing
       ↓
Student B Sends Connection Request to Student A
       ↓
Student A Receives Notification & Accepts Connection
       ↓
Both Students Direct Message Each Other in Real Time
       ↓
Real-Time Push Notifications Verified
       ↓
Safety Tools Tested (Report & Direct Block)
       ↓
Logout & Relogin Verification
```

---

## 🧪 Detailed Step-by-Step Scenario

### Step 1: Student A Registration & Login
1. Open the VFA mobile app.
2. Navigate to **Create Account**.
3. Fill in Full Name, `.edu` / university email, password (`>= 6` chars), and mobile number.
4. Tap **Create Account** & verify redirect into the app.

### Step 2: Student A Profile Setup
1. Open the **Profile** tab.
2. Fill in University name, Course/Major, Year of Study, Gender, Bio, and City.
3. Save changes and confirm profile completion status updates on the dashboard.

### Step 3: Student Verification Submission
1. In the Profile tab or Dashboard banner, tap **Verify Student ID**.
2. Select Document Type (`College ID`, `Admission Letter`, or `Bonafide Certificate`).
3. Upload / provide student identity document image.
4. Enter University Email & Student Roll / ID Number.
5. Tap **Submit for Verification** -> Status displays **Pending**.

### Step 4: Administrator Approval
1. Log in with an administrator account (`/admin` portal or admin login).
2. Open **Pending Verifications Queue**.
3. Review Student A's submitted document and university details.
4. Tap **Approve Verification**.
5. Switch back to Student A's account -> Verified Student badge displays instantly.

### Step 5: Post Room Listing
1. Navigate to **Explore / Listings**.
2. Tap **Post a Room / Create Listing**.
3. Fill in Property Title, Property Type (`Flat`, `Room`, `Hostel`), City, Address, Rent (`₹/month`), Deposit, Furnishing, Gender Preference, and Photo.
4. Submit listing and verify appearance in the main listings feed.

### Step 6: Student B Search & Connection Request
1. Log in as Student B on a separate device or test session.
2. Browse the **Listings** tab using City / Rent filters.
3. Tap on Student A's room listing to view specs and owner profile.
4. Tap **Connect with Flatmate / Send Connection Request**.

### Step 7: Connection Acceptance & Notification
1. Student A checks **Notifications** tab -> **New Connection Request** is displayed.
2. Open **Connections** tab -> Incoming request from Student B appears under **Requests**.
3. Tap **Accept** -> Request moves to **Connections** tab.
4. Student B receives **Connection Accepted** notification.

### Step 8: Direct Messaging & Chat
1. Open **Messages** tab or tap **Message** on the connected profile.
2. Exchange real-time flatmate messages regarding move-in date, amenities, and room sharing.
3. Verify message delivery, unread indicators, and read receipts.

### Step 9: Safety & Moderation (Reporting & Blocking)
1. Open user profile / listing menu and test **Report User / Listing** with reason and description.
2. Admin verifies report in **Admin Reports Portal** and marks it **Resolved**.
3. Test **Direct Block** -> Verify all messaging and connection attempts are blocked.
4. Test **Direct Unblock** -> Verify permissions are restored.

### Step 10: Persistence & Session Integrity
1. Tap **Settings / Profile -> Logout**.
2. Close and restart the mobile application.
3. Log in again with credentials.
4. Confirm user profile, listings, connections, and chat messages remain preserved.

---

## 📝 Beta Tester Feedback Form

Please record feedback from each real student session:

1. **What was confusing or unintuitive?**
   > _[Record student feedback here]_

2. **What failed or gave an unexpected error?**
   > _[Record student feedback here]_

3. **What was slow or lagging?**
   > _[Record student feedback here]_

4. **What feature or detail was missing?**
   > _[Record student feedback here]_

5. **What did you expect to happen that didn't?**
   > _[Record student feedback here]_

6. **Overall Rating (1 to 5 Stars):**
   > ⭐ ⭐ ⭐ ⭐ ⭐
