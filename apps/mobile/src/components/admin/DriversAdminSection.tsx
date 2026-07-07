import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Radius, Shadow } from '../../constants/theme';
import { Driver } from './types';

interface DriversAdminSectionProps {
  drivers: Driver[];
  onResetCounter: (id: string, name: string) => void;
}

export default function DriversAdminSection({ drivers, onResetCounter }: DriversAdminSectionProps) {
  return (
    <View>
      <Text style={styles.sectionTitle}>
        💳 رقابة الموزعين وتأكيد دفع الـ 1000 دج عبر بريدي موب ({drivers.length})
      </Text>

      {drivers.length === 0 ? (
        <Text style={styles.emptyText}>لا يوجد موزعون مسجلون حالياً بالمنصة.</Text>
      ) : (
        drivers.map(driver => (
          <View key={driver.id} style={styles.driverCard}>
            {/* اسم وحالة الموزع */}
            <View style={styles.driverHeader}>
              <Text style={styles.driverName}>{driver.name}</Text>
              <Text style={[styles.statusBadge, driver.is_suspended && styles.statusSuspended]}>
                {driver.is_suspended ? '🔴 محظور لوجوب الدفع' : '🟢 نشط ماليّاً'}
              </Text>
            </View>

            {/* العداد والديون */}
            <Text style={styles.tripsCount}>
              العداد الميداني: {driver.delivery_counter} / 50 توصيلة
            </Text>
            <Text style={styles.debt}>
              حق الموقع المتراكم: {driver.total_owed_to_site} دج
            </Text>

            {/* زر تصفير العداد — يظهر فقط عند التعليق */}
            {driver.is_suspended && (
              <TouchableOpacity
                style={styles.resetBtn}
                onPress={() => onResetCounter(driver.id, driver.name)}
              >
                <Text style={styles.resetBtnText}>✅ تأكيد استلام الدفع المالي وإعادة التفعيل</Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.navyDark,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
    textAlign: 'right',
    fontFamily: 'Cairo',
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.textMuted,
    marginVertical: Spacing.base,
    fontFamily: 'Tajawal',
    fontSize: 12,
  },
  driverCard: {
    backgroundColor: Colors.bgCard,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.md,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  driverHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: Spacing.sm,
  },
  driverName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.navyDark,
    fontFamily: 'Cairo',
  },
  statusBadge: {
    backgroundColor: Colors.successBg,
    color: Colors.success,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.lg,
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'Cairo',
    overflow: 'hidden',
  },
  statusSuspended: {
    backgroundColor: Colors.dangerBg,
    color: Colors.danger,
  },
  tripsCount: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: Spacing.sm,
    fontFamily: 'Tajawal',
  },
  debt: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: 'bold',
    textAlign: 'right',
    marginTop: 2,
    fontFamily: 'Tajawal',
  },
  resetBtn: {
    backgroundColor: Colors.success,
    paddingVertical: Spacing.md,
    borderRadius: Radius.sm,
    alignItems: 'center',
    marginTop: Spacing.md,
    ...Shadow.medium,
  },
  resetBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'Cairo',
  },
});
