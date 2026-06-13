import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';

export default function Register() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<'customer' | 'merchant' | 'delivery'>('customer');
  const [zoneName, setZoneName] = useState('');
  const router = useRouter();

  const handleRegister = () => {
    if (!phoneNumber) {
      Alert.alert('تنبيه', 'الرجاء إدخال رقم الهاتف أولاً');
      return;
    }
    if (!zoneName) {
      Alert.alert('تنبيه', 'الرجاء تحديد اسم الحي أو المنطقة لتسهيل التوصيل');
      return;
    }
    
    Alert.alert('نجاح', 'تم تسجيل حسابك بنجاح في سوق عين الصفراء');
    // التوجيه التلقائي للواجهة المناسبة بناءً على الدور المختر
    if (role === 'customer') router.push('/(tabs)/home');
    if (role === 'merchant') router.push('/(tabs)/merchant');
    if (role === 'delivery') router.push('/(tabs)/delivery');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.headerTitle}>إنشاء حساب جديد</Text>
      <Text style={styles.subTitle}>انضم إلى منصة سوق عين الصفراء الرقمية</Text>

      {/* حقل إدخال رقم الهاتف */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>رقم الهاتف</Text>
        <TextInput
          style={styles.input}
          placeholder="05XXXXXXXX"
          keyboardType="phone-pad"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
        />
      </View>

      {/* اختيار نوع الحساب - Role Selection */}
      <Text style={styles.label}>اختر نوع الحساب</Text>
      <View style={styles.roleContainer}>
        <TouchableOpacity
          style={[styles.roleCard, role === 'customer' && styles.activeRoleCard]}
          onPress={() => setRole('customer')}
        >
          <Text style={styles.roleIcon}>👤</Text>
          <Text style={[styles.roleText, role === 'customer' && styles.activeRoleText]}>زبون</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleCard, role === 'merchant' && styles.activeRoleCard]}
          onPress={() => setRole('merchant')}
        >
          <Text style={styles.roleIcon}>🏪</Text>
          <Text style={[styles.roleText, role === 'merchant' && styles.activeRoleText]}>تاجر</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleCard, role === 'delivery' && styles.activeRoleCard]}
          onPress={() => setRole('delivery')}
        >
          <Text style={styles.roleIcon}>🛵</Text>
          <Text style={[styles.roleText, role === 'delivery' && styles.activeRoleText]}>موصل</Text>
        </TouchableOpacity>
      </View>

      {/* حاوية الخريطة التفاعلية (محاكاة عين الصفراء) */}
      <Text style={styles.label}>الموقع الجغرافي الافتراضي (عين الصفراء)</Text>
      <View style={styles.mapMock}>
        <Text style={styles.mapPin}>📍</Text>
        <Text style={styles.mapText}>خريطة تفاعلية ممركزة على بلدية عين الصفراء</Text>
        <Text style={styles.mapCoordinates}>32.7510° N, 0.5841° W</Text>
      </View>

      {/* حقل تسمية المنطقة المخصصة */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>تحديد الحي أو المنطقة بدقة</Text>
        <TextInput
          style={styles.input}
          placeholder="مثال: حي الضلعة، حي قصر البلاد..."
          value={zoneName}
          onChangeText={setZoneName}
        />
      </View>

      {/* زر إتمام التسجيل الحاسم */}
      <TouchableOpacity style={styles.submitButton} onPress={handleRegister}>
        <Text style={styles.submitButtonText}>تأكيد الحساب والدخول</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1B2A6B',
    textAlign: 'right',
    marginTop: 10,
    fontFamily: 'Cairo',
  },
  subTitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'right',
    marginBottom: 25,
    fontFamily: 'Tajawal',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B2A6B',
    textAlign: 'right',
    marginBottom: 8,
    fontFamily: 'Cairo',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 14,
    textAlign: 'right',
    fontSize: 16,
    fontFamily: 'Tajawal',
    backgroundColor: '#FAFAFA',
  },
  roleContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  roleCard: {
    width: '30%',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  activeRoleCard: {
    borderColor: '#F26522',
    backgroundColor: 'rgba(242, 101, 34, 0.05)',
  },
  roleIcon: {
    fontSize: 28,
    marginBottom: 5,
  },
  roleText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666666',
    fontFamily: 'Cairo',
  },
  activeRoleText: {
    color: '#F26522',
  },
  mapMock: {
    height: 150,
    backgroundColor: '#F0F4FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1B2A6B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  mapPin: {
    fontSize: 32,
    marginBottom: 5,
  },
  mapText: {
    fontSize: 14,
    color: '#1B2A6B',
    fontWeight: 'bold',
    fontFamily: 'Tajawal',
  },
  mapCoordinates: {
    fontSize: 12,
    color: '#888888',
    marginTop: 2,
  },
  submitButton: {
    backgroundColor: '#F26522',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Cairo',
  },
});
