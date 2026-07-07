import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Shadow } from '../../constants/theme';
import { AdminSection } from './types';

interface AdminQuickActionsProps {
  /** The placeholder section currently selected (users | orders | settings) */
  section: AdminSection;
}

const SECTION_META: Partial<Record<AdminSection, { icon: string; label: string; description: string }>> = {
  users: {
    icon: '👥',
    label: 'إدارة المستخدمين',
    description:
      'عرض وإدارة جميع حسابات المنصة: الزبائن، التجار، والموزعين.\n' +
      'تعيين الأدوار، تجميد الحسابات المخالفة، ومراجعة سجل النشاط.',
  },
  orders: {
    icon: '📦',
    label: 'إدارة الطلبات',
    description:
      'مراقبة حالة الطلبات لحظةً بلحظة، متابعة رحلات التوصيل،\n' +
      'حل النزاعات بين الزبائن والتجار والموزعين.',
  },
  settings: {
    icon: '⚙️',
    label: 'إعدادات المنصة',
    description:
      'ضبط رسوم التوصيل والعمولات، إدارة المناطق المخدومة في عين الصفراء،\n' +
      'والخيارات العامة للسيرفر.',
  },
};

export default function AdminQuickActions({ section }: AdminQuickActionsProps) {
  const meta = SECTION_META[section];
  if (!meta) return null;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.icon}>{meta.icon}</Text>
        <Text style={styles.label}>{meta.label}</Text>
        <Text style={styles.description}>{meta.description}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>قريباً 🔜</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  icon: {
    fontSize: 52,
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.navyDark,
    fontFamily: 'Cairo',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: 13,
    color: Colors.textMuted,
    fontFamily: 'Tajawal',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  badge: {
    backgroundColor: Colors.warningBg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  badgeText: {
    color: Colors.warning,
    fontWeight: 'bold',
    fontFamily: 'Cairo',
    fontSize: 13,
  },
});
