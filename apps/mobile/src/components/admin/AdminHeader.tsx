import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing } from '../../constants/theme';

export default function AdminHeader() {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>لوحة التحكم العليا للمدير العام 👑</Text>
      <Text style={styles.subtitle}>إدارة سيرفر سوق عين الصفراء الحي | DZ Pro Vision</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.navyDark,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.headerTop,
    paddingBottom: Spacing.lg,
    alignItems: 'flex-end',
    borderBottomWidth: 3,
    borderColor: Colors.primary,
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
    color: Colors.white,
    fontFamily: 'Cairo',
  },
  subtitle: {
    fontSize: 10,
    color: Colors.textOnDarkMuted,
    fontFamily: 'Tajawal',
    marginTop: Spacing.xs,
  },
});
