import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { AdminSection } from './types';

interface AdminSectionTabsProps {
  active: AdminSection;
  onSelect: (section: AdminSection) => void;
}

const TABS: { key: AdminSection; label: string }[] = [
  { key: 'dashboard', label: '📊 الرئيسية'    },
  { key: 'stores',    label: '🛒 المحلات'     },
  { key: 'drivers',   label: '🛵 الموزعون'    },
  { key: 'users',     label: '👥 المستخدمون'  },
  { key: 'orders',    label: '📦 الطلبات'     },
  { key: 'settings',  label: '⚙️ الإعدادات'  },
];

export default function AdminSectionTabs({ active, onSelect }: AdminSectionTabsProps) {
  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, active === tab.key && styles.activeTab]}
            onPress={() => onSelect(tab.key)}
            activeOpacity={0.75}
          >
            <Text style={[styles.tabText, active === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  row: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
    flexDirection: 'row',
  },
  tab: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgSubtle,
  },
  activeTab: {
    backgroundColor: Colors.navyDark,
    borderColor: Colors.navyDark,
  },
  tabText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    fontFamily: 'Cairo',
  },
  activeTabText: {
    color: Colors.white,
  },
});
