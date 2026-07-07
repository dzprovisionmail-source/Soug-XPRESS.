import React from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, Radius, Shadow } from '../../constants/theme';
import { Store } from './types';

interface StoresAdminSectionProps {
  stores: Store[];
  // Create-store form fields (controlled by admin.tsx to survive tab switches)
  newStoreName: string;
  setNewStoreName: (v: string) => void;
  newStoreCategory: string;
  setNewStoreCategory: (v: string) => void;
  newStoreZone: string;
  setNewStoreZone: (v: string) => void;
  isInserting: boolean;
  // Callbacks
  onAddStore: () => void;
  onToggleApproval: (id: string, current: boolean | null) => void;
  onDeleteStore: (id: string, name: string) => void;
}

const CATEGORIES = ['سوبر ماركت', 'مطاعم', 'صيدليات', 'خضار وفواكه'];

export default function StoresAdminSection({
  stores,
  newStoreName, setNewStoreName,
  newStoreCategory, setNewStoreCategory,
  newStoreZone, setNewStoreZone,
  isInserting,
  onAddStore,
  onToggleApproval,
  onDeleteStore,
}: StoresAdminSectionProps) {
  return (
    <View>
      {/* ── إنشاء متجر حي ── */}
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>🎯 إنشاء متجر حي (أمثلة جذب وتغذية المنصة)</Text>

        <Text style={styles.inputLabel}>اسم المحل التجاري:</Text>
        <TextInput
          style={styles.input}
          placeholder="مثال: مخبزة الفتح، ملبنة الشفاء..."
          value={newStoreName}
          onChangeText={setNewStoreName}
          textAlign="right"
          placeholderTextColor={Colors.textMuted}
        />

        <Text style={styles.inputLabel}>التصنيف الرئيسي للنشاط:</Text>
        <View style={styles.categoryRow}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.pickerBtn, newStoreCategory === cat && styles.pickerBtnActive]}
              onPress={() => setNewStoreCategory(cat)}
            >
              <Text style={[styles.pickerBtnText, newStoreCategory === cat && styles.pickerBtnTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.inputLabel}>الحي أو المنطقة داخل عين الصفراء:</Text>
        <TextInput
          style={styles.input}
          placeholder="مثال: حي الضلعة، وسط المدينة..."
          value={newStoreZone}
          onChangeText={setNewStoreZone}
          textAlign="right"
          placeholderTextColor={Colors.textMuted}
        />

        <TouchableOpacity style={styles.insertBtn} onPress={onAddStore} disabled={isInserting}>
          {isInserting
            ? <ActivityIndicator color={Colors.white} />
            : <Text style={styles.insertBtnText}>🚀 حقن ونشر المتجر حياً في السيرفر</Text>}
        </TouchableOpacity>
      </View>

      {/* ── قائمة المحلات ── */}
      <Text style={styles.sectionTitle}>
        🛒 إدارة ومراقبة المحلات النشطة في قاعدة البيانات ({stores.length})
      </Text>

      {stores.length === 0 ? (
        <Text style={styles.emptyText}>لا توجد أي محلات مسجلة حالياً.</Text>
      ) : (
        stores.map(store => (
          <View key={store.id} style={styles.storeCard}>
            {/* معلومات المتجر */}
            <View style={styles.storeMeta}>
              <Text style={styles.storeName}>
                <Text style={styles.bold}>{store.name}</Text>{' '}({store.category})
              </Text>
              <Text style={styles.storeSub}>
                الموقع: {store.zone} | كود: {store.id.substring(0, 8)}...
              </Text>
            </View>

            {/* أزرار الصلاحيات */}
            <View style={styles.storeActions}>
              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  store.is_approved ? styles.toggleBtnSuspend : styles.toggleBtnApprove,
                ]}
                onPress={() => onToggleApproval(store.id, store.is_approved)}
              >
                <Text style={styles.actionBtnText}>
                  {store.is_approved ? 'تجميد 🔒' : 'اعتماد ✅'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => onDeleteStore(store.id, store.name)}
              >
                <Text style={styles.actionBtnText}>حذف 🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Create form ──
  formCard: {
    backgroundColor: Colors.bgCard,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  formTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.navyMid,
    textAlign: 'right',
    fontFamily: 'Cairo',
    marginBottom: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: Spacing.sm,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    textAlign: 'right',
    marginBottom: 6,
    fontFamily: 'Cairo',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    fontSize: 13,
    fontFamily: 'Tajawal',
    backgroundColor: Colors.bgSubtle,
    marginBottom: Spacing.base,
    color: Colors.textBody,
  },
  categoryRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.base,
    gap: 5,
  },
  pickerBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  pickerBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMid,
  },
  pickerBtnText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontFamily: 'Tajawal',
  },
  pickerBtnTextActive: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  insertBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.base,
    borderRadius: Radius.md,
    alignItems: 'center',
    ...Shadow.primaryBtn,
  },
  insertBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Cairo',
  },

  // ── List ──
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
  storeCard: {
    backgroundColor: Colors.bgCard,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  storeMeta: {
    alignItems: 'flex-end',
    width: '100%',
  },
  storeName: {
    fontSize: 14,
    color: Colors.textBody,
    fontFamily: 'Tajawal',
  },
  bold: {
    fontWeight: 'bold',
    color: Colors.navyDark,
  },
  storeSub: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: 'Tajawal',
    marginTop: 2,
  },
  storeActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
  },
  toggleBtn: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
  },
  toggleBtnApprove: {
    backgroundColor: '#E6FFFA',
    borderWidth: 1,
    borderColor: '#319795',
  },
  toggleBtnSuspend: {
    backgroundColor: Colors.dangerBg,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  deleteBtn: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
    backgroundColor: Colors.border,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'Tajawal',
    color: Colors.textSecondary,
  },
});
