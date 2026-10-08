import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Container } from '../components/Container';
import { Header } from '../components/Header';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { SectionCard } from '../components/SectionCard';
import { useTheme } from '../context/ThemeContext';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../constants/theme';

export const RentCalculatorScreen = ({ navigation }) => {
  const { colors, isDark, shadows } = useTheme();
  const [totalRent, setTotalRent] = useState('18000');
  const [deposit, setDeposit] = useState('36000');
  const [peopleCount, setPeopleCount] = useState('3');
  const [electricity, setElectricity] = useState('1500');
  const [internet, setInternet] = useState('999');
  const [maintenance, setMaintenance] = useState('1200');
  const [otherExpenses, setOtherExpenses] = useState('600');

  const [errors, setErrors] = useState({});

  const parseNum = (val) => {
    if (!val || isNaN(val)) return 0;
    const num = parseFloat(val);
    return num < 0 ? 0 : num;
  };

  const validateInputs = () => {
    const errs = {};
    const people = parseNum(peopleCount);
    const rent = parseNum(totalRent);

    if (!peopleCount || people < 1) {
      errs.peopleCount = 'Number of people must be at least 1.';
    }

    if (!totalRent || rent < 0) {
      errs.totalRent = 'Rent must be a valid positive amount.';
    }

    if (parseNum(deposit) < 0) errs.deposit = 'Deposit cannot be negative.';
    if (parseNum(electricity) < 0) errs.electricity = 'Cannot be negative.';
    if (parseNum(internet) < 0) errs.internet = 'Cannot be negative.';
    if (parseNum(maintenance) < 0) errs.maintenance = 'Cannot be negative.';
    if (parseNum(otherExpenses) < 0) errs.otherExpenses = 'Cannot be negative.';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Perform Rent & Utility Split Calculations
  const people = Math.max(parseNum(peopleCount), 1);
  const rentVal = parseNum(totalRent);
  const depositVal = parseNum(deposit);
  const elecVal = parseNum(electricity);
  const netVal = parseNum(internet);
  const maintVal = parseNum(maintenance);
  const otherVal = parseNum(otherExpenses);

  const rentPerPerson = rentVal / people;
  const depositPerPerson = depositVal / people;
  const utilitiesPerPerson = (elecVal + netVal + maintVal) / people;
  const otherPerPerson = otherVal / people;

  const totalMonthlyPerPerson = rentPerPerson + utilitiesPerPerson + otherPerPerson;
  const totalUpfrontPerPerson = totalMonthlyPerPerson + depositPerPerson;

  const hasCalculation = rentVal > 0 && people >= 1;

  const handleReset = () => {
    setTotalRent('');
    setDeposit('');
    setPeopleCount('1');
    setElectricity('');
    setInternet('');
    setMaintenance('');
    setOtherExpenses('');
    setErrors({});
  };

  const handleShareSplit = async () => {
    if (!hasCalculation) return;

    const fmt = (v) => `₹${Math.round(v).toLocaleString('en-IN')}`;

    let message = `🏠 VFA Rent Split\n\n`;
    message += `Total Rent: ${fmt(rentVal)}\n`;
    message += `Flatmates: ${people}\n`;
    message += `Rent Per Person: ${fmt(rentPerPerson)}\n`;

    if (elecVal > 0 || netVal > 0 || maintVal > 0) {
      message += `\n⚡ Utilities (per person):\n`;
      if (elecVal > 0) message += `  • Electricity: ${fmt(elecVal / people)}\n`;
      if (netVal > 0) message += `  • Internet/Wi-Fi: ${fmt(netVal / people)}\n`;
      if (maintVal > 0) message += `  • Maintenance: ${fmt(maintVal / people)}\n`;
    }

    if (otherVal > 0) {
      message += `\n🧹 Other Expenses: ${fmt(otherPerPerson)} per person\n`;
    }

    message += `\n💰 Each Person Pays: ${fmt(totalMonthlyPerPerson)} / month\n`;

    if (depositVal > 0) {
      message += `🛡️ Deposit (one-time): ${fmt(depositPerPerson)} per person\n`;
      message += `📋 Total Upfront: ${fmt(totalUpfrontPerPerson)} per person\n`;
    }

    message += `\nCalculated using Verified Flatmate App.`;

    try {
      await Share.share({ message });
    } catch (err) {
      if (err?.message !== 'User did not share') {
        console.warn('Share error:', err);
        Alert.alert('Sharing Failed', 'Could not open the share sheet. Please try again.');
      }
    }
  };

  const dynamicStyles = {
    heading: {
      color: colors.textPrimary,
    },
    subheading: {
      color: colors.textSecondary,
    },
    resultsCard: {
      backgroundColor: isDark ? colors.surface : colors.primaryDark,
      borderColor: colors.border,
      borderWidth: isDark ? 1 : 0,
    },
    bigTotalBox: {
      backgroundColor: isDark ? colors.primaryLight : 'rgba(255, 255, 255, 0.12)',
    },
    bigTotalLabel: {
      color: isDark ? colors.primary : 'rgba(255, 255, 255, 0.8)',
    },
    bigTotalAmount: {
      color: isDark ? colors.textPrimary : colors.textWhite,
    },
    rowLabel: {
      color: isDark ? colors.textSecondary : 'rgba(255, 255, 255, 0.85)',
    },
    rowValue: {
      color: isDark ? colors.textPrimary : colors.textWhite,
    },
    breakdownDivider: {
      backgroundColor: isDark ? colors.border : 'rgba(255, 255, 255, 0.2)',
    },
    rowLabelHighlight: {
      color: isDark ? colors.warning : '#FDE047',
    },
    rowValueHighlight: {
      color: isDark ? colors.warning : '#FDE047',
    },
    resetBtn: {
      backgroundColor: isDark ? colors.surfaceAlt : 'rgba(255, 255, 255, 0.15)',
    },
    resetBtnText: {
      color: isDark ? colors.textSecondary : colors.textWhite,
    },
    shareBtn: {
      backgroundColor: isDark ? colors.primaryLight : colors.surface,
    },
    shareBtnText: {
      color: colors.primary,
    },
    shareBtnDisabled: {
      backgroundColor: isDark ? colors.surfaceAlt : colors.surfaceAlt,
      opacity: 0.5,
    },
    shareBtnTextDisabled: {
      color: colors.textMuted,
    },
  };

  return (
    <Container scrollable statusBarStyle={isDark ? 'light' : 'dark'}>
      <Header title="Rent & Utility Split" onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        {/* Title Header */}
        <View style={styles.titleSection}>
          <Text style={[styles.heading, dynamicStyles.heading]}>Rent Split Calculator</Text>
          <Text style={[styles.subheading, dynamicStyles.subheading]}>
            Split rent, security deposit, wifi, electricity, and maintenance transparently between flatmates.
          </Text>
        </View>

        {/* INPUTS SECTION */}
        <SectionCard
          icon="calculator-outline"
          title="Monthly Rent & Flatmates"
          subtitle="Core Property Costs"
        >
          <Input
            label="Total Monthly Rent (₹) *"
            placeholder="e.g. 18000"
            keyboardType="number-pad"
            value={totalRent}
            onChangeText={(t) => {
              setTotalRent(t);
              if (errors.totalRent) setErrors({ ...errors, totalRent: null });
            }}
            leftIcon={<Ionicons name="cash-outline" size={20} color={colors.textSecondary} />}
            error={errors.totalRent}
          />

          <Input
            label="Number of Flatmates (People) *"
            placeholder="e.g. 3"
            keyboardType="number-pad"
            value={peopleCount}
            onChangeText={(t) => {
              setPeopleCount(t);
              if (errors.peopleCount) setErrors({ ...errors, peopleCount: null });
            }}
            leftIcon={<Ionicons name="people-outline" size={20} color={colors.textSecondary} />}
            error={errors.peopleCount}
          />

          <Input
            label="Security Deposit (₹)"
            placeholder="e.g. 36000"
            keyboardType="number-pad"
            value={deposit}
            onChangeText={(t) => {
              setDeposit(t);
              if (errors.deposit) setErrors({ ...errors, deposit: null });
            }}
            leftIcon={<Ionicons name="shield-outline" size={20} color={colors.textSecondary} />}
            error={errors.deposit}
          />
        </SectionCard>

        {/* UTILITIES & EXTRA EXPENSES SECTION */}
        <SectionCard
          icon="flash-outline"
          title="Utilities & Maintenance"
          subtitle="Shared Monthly Bills"
        >
          <Input
            label="Electricity Bill (₹)"
            placeholder="e.g. 1500"
            keyboardType="number-pad"
            value={electricity}
            onChangeText={(t) => {
              setElectricity(t);
              if (errors.electricity) setErrors({ ...errors, electricity: null });
            }}
            leftIcon={<Ionicons name="flash-outline" size={20} color={colors.textSecondary} />}
            error={errors.electricity}
          />

          <Input
            label="Internet / Wi-Fi Bill (₹)"
            placeholder="e.g. 999"
            keyboardType="number-pad"
            value={internet}
            onChangeText={(t) => {
              setInternet(t);
              if (errors.internet) setErrors({ ...errors, internet: null });
            }}
            leftIcon={<Ionicons name="wifi-outline" size={20} color={colors.textSecondary} />}
            error={errors.internet}
          />

          <Input
            label="Society Maintenance (₹)"
            placeholder="e.g. 1200"
            keyboardType="number-pad"
            value={maintenance}
            onChangeText={(t) => {
              setMaintenance(t);
              if (errors.maintenance) setErrors({ ...errors, maintenance: null });
            }}
            leftIcon={<Ionicons name="construct-outline" size={20} color={colors.textSecondary} />}
            error={errors.maintenance}
          />

          <Input
            label="Other Monthly Expenses (₹)"
            placeholder="e.g. 600 (Cleaning / Maid)"
            keyboardType="number-pad"
            value={otherExpenses}
            onChangeText={(t) => {
              setOtherExpenses(t);
              if (errors.otherExpenses) setErrors({ ...errors, otherExpenses: null });
            }}
            leftIcon={<Ionicons name="receipt-outline" size={20} color={colors.textSecondary} />}
            error={errors.otherExpenses}
          />
        </SectionCard>

        {/* CALCULATION BREAKDOWN RESULTS CARD */}
        <View style={[styles.resultsCard, dynamicStyles.resultsCard, shadows.large]}>
          <View style={styles.resultsHeaderRow}>
            <Ionicons name="pie-chart" size={22} color={isDark ? colors.primary : colors.textWhite} style={{ marginRight: 6 }} />
            <Text style={[styles.resultsTitle, { color: isDark ? colors.textPrimary : colors.textWhite }]}>Per Person Cost Breakdown</Text>
          </View>

          <View style={[styles.bigTotalBox, dynamicStyles.bigTotalBox]}>
            <Text style={[styles.bigTotalLabel, dynamicStyles.bigTotalLabel]}>TOTAL MONTHLY COST PER PERSON</Text>
            <Text style={[styles.bigTotalAmount, dynamicStyles.bigTotalAmount]}>
              ₹{Math.round(totalMonthlyPerPerson).toLocaleString('en-IN')}
              <Text style={{ fontSize: 14, fontWeight: '400' }}> / month</Text>
            </Text>
          </View>

          <View style={styles.breakdownList}>
            <View style={styles.breakdownRow}>
              <Text style={[styles.rowLabel, dynamicStyles.rowLabel]}>🏠 Rent per person ({people} flatmates)</Text>
              <Text style={[styles.rowValue, dynamicStyles.rowValue]}>₹{Math.round(rentPerPerson).toLocaleString('en-IN')}</Text>
            </View>

            <View style={styles.breakdownRow}>
              <Text style={[styles.rowLabel, dynamicStyles.rowLabel]}>⚡ Utilities per person (Elec + Wi-Fi + Maint)</Text>
              <Text style={[styles.rowValue, dynamicStyles.rowValue]}>₹{Math.round(utilitiesPerPerson).toLocaleString('en-IN')}</Text>
            </View>

            <View style={styles.breakdownRow}>
              <Text style={[styles.rowLabel, dynamicStyles.rowLabel]}>🧹 Other expenses per person</Text>
              <Text style={[styles.rowValue, dynamicStyles.rowValue]}>₹{Math.round(otherPerPerson).toLocaleString('en-IN')}</Text>
            </View>

            <View style={[styles.breakdownDivider, dynamicStyles.breakdownDivider]} />

            <View style={styles.breakdownRow}>
              <Text style={[styles.rowLabelHighlight, dynamicStyles.rowLabelHighlight]}>🛡️ Deposit per person (One-time)</Text>
              <Text style={[styles.rowValueHighlight, dynamicStyles.rowValueHighlight]}>₹{Math.round(depositPerPerson).toLocaleString('en-IN')}</Text>
            </View>

            <View style={styles.breakdownRow}>
              <Text style={[styles.rowLabelHighlight, dynamicStyles.rowLabelHighlight]}>💰 Total Upfront Payment (1st Month + Deposit)</Text>
              <Text style={[styles.rowValueHighlight, dynamicStyles.rowValueHighlight]}>₹{Math.round(totalUpfrontPerPerson).toLocaleString('en-IN')}</Text>
            </View>
          </View>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.resetBtn, dynamicStyles.resetBtn]} onPress={handleReset}>
              <Ionicons name="refresh-outline" size={16} color={isDark ? colors.textSecondary : colors.textWhite} style={{ marginRight: 4 }} />
              <Text style={[styles.resetBtnText, dynamicStyles.resetBtnText]}>Reset Values</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.shareBtn,
                dynamicStyles.shareBtn,
                !hasCalculation && [styles.shareBtnDisabled, dynamicStyles.shareBtnDisabled],
              ]}
              onPress={handleShareSplit}
              disabled={!hasCalculation}
              activeOpacity={0.7}
            >
              <Ionicons
                name="share-social"
                size={16}
                color={hasCalculation ? colors.primary : colors.textMuted}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.shareBtnText,
                  dynamicStyles.shareBtnText,
                  !hasCalculation && dynamicStyles.shareBtnTextDisabled,
                ]}
              >
                Share Rent Split
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingVertical: SPACING.md,
  },
  titleSection: {
    marginBottom: SPACING.lg,
  },
  heading: {
    ...TYPOGRAPHY.h1,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  subheading: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  resultsCard: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  resultsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  bigTotalBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  bigTotalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  bigTotalAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textWhite,
  },
  breakdownList: {
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    flex: 1,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: SPACING.xs,
  },
  rowLabelHighlight: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FDE047',
    flex: 1,
  },
  rowValueHighlight: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FDE047',
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  resetBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  resetBtnText: {
    color: COLORS.textWhite,
    fontSize: 12,
    fontWeight: '700',
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  shareBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  shareBtnDisabled: {
    backgroundColor: COLORS.surfaceAlt,
    opacity: 0.6,
  },
  shareBtnTextDisabled: {
    color: COLORS.textMuted,
  },
});
