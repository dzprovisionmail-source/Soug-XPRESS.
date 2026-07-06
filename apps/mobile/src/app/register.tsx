import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { AINSEFRA_ZONES } from '../constants/zones';
import { Colors, Spacing, Radius, Shadow } from '../constants/theme';

export default function RegisterScreen() {
  const { userProfile, refreshProfile, signOut } = useAuth();
  const [loading, setLoading]               = useState(false);
  const [fullName, setFullName]             = useState('');
  const [phone, setPhone]                   = useState('');
  const [selectedZone, setSelectedZone]     = useState<string | null>(null);
  const [showZoneModal, setShowZoneModal]   = useState(false);

  const handleSelectRole = async (chosenRole: 'customer' | 'merchant' | 'delivery') => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: userProfile?.id, role: chosenRole, updated_at: new Date() });
      if (error) throw error;
      await refreshProfile();
    } catch (error: unknown) {
      Alert.alert('خطأ في حفظ نوع الحساب', error instanceof Error ? error.message : 'خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfileDetails = async () => {
    if (!fullName.trim() || !phone.trim() || !selectedZone) {
      return Alert.alert('تنبيه', 'الرجاء ملء جميع الحقول واختيار الحي الحقيقي.');
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          phone: phone.trim(),
          zone: selectedZone,
          is_profile_complete: true,
          updated_at: new Date(),
        })
        .eq('id', userProfile?.id);
      if (error) throw error;
      Alert.alert('🎉 نجاح', 'تم إكمال ملفك وتأمين حسابك بنجاح في سوق إكسبريس!');
      await refreshProfile();
    } catch (error: unknown) {
      Alert.alert('خطأ في حفظ البيانات', error instanceof Error ? error.message : 'خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>جاري تأمين وحفظ البيانات سحابياً...</Text>
      </View>
    );
  }

  if (!userProfile?.role) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>مرحباً بك في سوق إكسبريس 🚀</Text>
        <Text style={styles.subtitle}>
          عين الصفراء — اختر نوع حسابك لإكمال البيانات لمرة واحدة:
        </Text>
        <View style={styles.btnContainer}>
          <TouchableOpacity style={styles.cardBtn} onPress={() => handleSelectRole('customer')}>
            <Text style={styles.cardBtnText}>🛒 أنا زبون (متسوق)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cardBtn} onPress={() => handleSelectRole('merchant')}>
            <Text style={styles.cardBtnText}>🏪 أنا تاجر (صاحب محل)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cardBtn} onPress={() => handleSelectRole('delivery')}>
            <Text style={styles.cardBtnText}>🛵 أنا موصل (سائق توصيل)</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={signOut} style={styles.logoutBtn}>
          <Text style={styles.logoutBtnText}>رجوع للخلف 🔙</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>إكمال ملف الحساب 📝</Text>
      <Text style={styles.subtitle}>
        الرجاء ملء بياناتك لمرة واحدة فقط لربطها بطلباتك وعروضك بمدينة عين الصفراء:
      </Text>

      <TextInput
        style={styles.input}
        placeholder="الاسم الكامل أو اسم النشاط"
        value={fullName}
        onChangeText={setFullName}
        textAlign="right"
        placeholderTextColor={Colors.textMuted}
      />

      <TextInput
        style={styles.input}
        placeholder="رقم الهاتف للتواصل النشط"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        textAlign="right"
        placeholderTextColor={Colors.textMuted}
      />

      <TouchableOpacity
        style={styles.dropdownBtn}
        onPress={() => setShowZoneModal(!showZoneModal)}
      >
        <Text style={styles.dropdownBtnText}>
          {selectedZone ? `📍 حيك الحالي: ${selectedZone}` : '🗺️ اختر حي إقامتك في عين الصفراء'}
        </Text>
      </TouchableOpacity>

      {showZoneModal && (
        <View style={styles.modalInlineContainer}>
          {AINSEFRA_ZONES.map((zone) => (
            <TouchableOpacity
              key={zone}
              style={[styles.zoneItem, selectedZone === zone && styles.zoneItemActive]}
              onPress={() => { setSelectedZone(zone); setShowZoneModal(false); }}
            >
              <Text style={[styles.zoneItemText, selectedZone === zone && styles.zoneItemTextActive]}>
                {zone}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.submitBtn} onPress={handleSaveProfileDetails}>
        <Text style={styles.submitBtnText}>حفظ المخطط والدخول ديركت 🚀</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={signOut} style={styles.logoutBtn}>
        <Text style={styles.logoutBtnText}>تسجيل الخروج ❌</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bgScreen,
    padding: Spacing.lg,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.bgScreen,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bgScreen,
  },
  loadingText: {
    marginTop: Spacing.base,
    fontFamily: 'Tajawal',
    color: Colors.navyMid,
    fontWeight: 'bold',
    fontSize: 13,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.navyMid,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    fontFamily: 'Cairo',
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: Spacing.xxl,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: 'Tajawal',
  },
  btnContainer: {
    width: '100%',
    gap: Spacing.base,
  },
  cardBtn: {
    width: '100%',
    padding: 18,
    borderWidth: 2,
    borderRadius: Radius.lg,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    borderColor: Colors.border,
    ...Shadow.card,
  },
  cardBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textBody,
    fontFamily: 'Cairo',
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.base,
    color: Colors.textBody,
    fontFamily: 'Tajawal',
    fontSize: 14,
  },
  dropdownBtn: {
    width: '100%',
    height: 50,
    backgroundColor: Colors.navyDark,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.base,
    ...Shadow.medium,
  },
  dropdownBtnText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 13,
    fontFamily: 'Cairo',
  },
  modalInlineContainer: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
    marginBottom: Spacing.base,
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadow.card,
  },
  zoneItem: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgSubtle,
  },
  zoneItemActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  zoneItemText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    fontFamily: 'Tajawal',
  },
  zoneItemTextActive: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  submitBtn: {
    width: '100%',
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.base,
    ...Shadow.primaryBtn,
  },
  submitBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Cairo',
  },
  logoutBtn: {
    marginTop: Spacing.xl,
    alignSelf: 'center',
  },
  logoutBtnText: {
    color: Colors.textMuted,
    fontWeight: 'bold',
    fontSize: 13,
    fontFamily: 'Tajawal',
  },
});
