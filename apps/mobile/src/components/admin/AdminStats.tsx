import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Shadow } from '../../constants/theme';
import { Store, Driver } from './types';

interface AdminStatsProps {
  stores: Store[];
  drivers: Driver[];
}

export default function AdminStats({ stores, drivers }: AdminStatsProps) {
  const approvedStores   = stores.filter(s => s.is_approved).length;
  const suspendedDrivers = drivers.filter(d => d.is_suspended).length;
  const totalOwed        = drivers.reduce((sum, d) => sum + (d.total_owed_to_site || 0), 0);

  const stats: { label: string; value: string | number; color: string }[] = [
    { label: 'إجمالي المحلات',         value: stores.length,    color: Colors.navyMid },
    { label: 'محلات مفعّلة',           value: approvedStores,   color: Colors.success },
    { label: 'موزعون مسجلون',          value: drivers.length,   color: Colors.info },
    { label: 'موزعون محظورون',          value: suspendedDrivers, color: Colors.danger },
    { label: 'مستحقات متراكمة (دج)',   value: totalOwed,        color: Colors.primary },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>📊 إحصائيات المنصة اللحظية</Text>
      <View style={styles.grid}>
        {stats.map((stat, i) => (
          <View key={i} style={styles.statCard}>
            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.navyDark,
    textAlign: 'right',
    fontFamily: 'Cairo',
    marginBottom: Spacing.md,
  },
  grid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  statCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '45%',
    flexGrow: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'Cairo',
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: 'Tajawal',
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
});
