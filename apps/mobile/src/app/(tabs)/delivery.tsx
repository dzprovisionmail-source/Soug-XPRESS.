import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';

const deliveryRequests = [
  { id: 'D-401', store: 'متجر الهناء للمواد الغذائية', destination: 'حي الضلعة', distance: '1.8 كم', earnings: '150 د.ج' },
  { id: 'D-402', store: 'مطعم ومشاوي القصر', destination: 'حي قصر البلاد', distance: '3.2 كم', earnings: '250 د.ج' },
];

export default function DeliveryDashboard() {
  const [vehicle, setVehicle] = useState<'motorcycle' | 'car'>('motorcycle');

  const handleAccept = (id: string) => {
    Alert.alert('تم القبول', `الطلب ${id} قيد التنفيذ الآن. توجه إلى المتجر لاستلام الشحنة.`);
  };

  return (
    <View style={styles.container}>
      {/* هيدر لوحة التحكم للموصل */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>لوحة تحكم الموصل 🛵</Text>
        <Text style={styles.deliveryName}>مرحبا بك، كابتن إكسبريس</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* إعداد نوع المركبة - Vehicle Profile Setup */}
        <Text style={styles.sectionTitle}>إعداد ملف المركبة الحالي</Text>
        <View style={styles.vehicleContainer}>
          <TouchableOpacity
            style={[styles.vehicleCard, vehicle === 'car' && styles.activeVehicleCard]}
            onPress={() => setVehicle('car')}
          >
            <Text style={styles.vehicleIcon}>🚗</Text>
            <Text style={[styles.vehicleText, vehicle === 'car' && styles.activeVehicleText]}>سيارة</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.vehicleCard, vehicle === 'motorcycle' && styles.activeVehicleCard]}
            onPress={() => setVehicle('motorcycle')}
          >
            <Text style={styles.vehicleIcon}>🛵</Text>
            <Text style={[styles.vehicleText, vehicle === 'motorcycle' && styles.activeVehicleText]}>دراجة نارية</Text>
          </TouchableOpacity>
        </View>

        {/* طلبات التوصيل المتاحة حالياً - Active Requests */}
        <Text style={styles.sectionTitle}>طلبات التوصيل المتاحة (عين الصفراء)</Text>
        {deliveryRequests.map((req) => (
          <View key={req.id} style={styles.requestCard}>
            <View style={styles.requestHeader}>
              <Text style={styles.requestId}>شحنة #{req.id}</Text>
              <Text style={styles.earningsValue}>{req.earnings}</Text>
            </View>

            <View style={styles.requestDetails}>
              <Text style={styles.routeText}>🏪 <Text style={styles.boldText}>من:</Text> {req.store}</Text>
              <Text style={styles.routeText}>📍 <Text style={styles.boldText}>إلى:</Text> {req.destination}</Text>
              <Text style={styles.routeText}>📏 <Text style={styles.boldText}>المسافة:</Text> {req.distance}</Text>
            </View>

            {/* أزرار التحكم الفوري - Accept / Reject Controls */}
            <View style={styles.buttonGroup}>
              <TouchableOpacity style={styles.rejectButton}>
                <Text style={styles.rejectButtonText}>رفض</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.acceptButton} onPress={() => handleAccept(req.id)}>
                <Text style={styles.acceptButtonText}>قبول الطلب</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F9',
  },
  header: {
    backgroundColor: '#1B2A6B', // الأزرق الداكن الرسمي
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Cairo',
  },
  deliveryName: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Tajawal',
    marginTop: 4,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B2A6B',
    marginHorizontal: 15,
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'right',
    fontFamily: 'Cairo',
  },
  vehicleContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  vehicleCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  activeVehicleCard: {
    borderColor: '#F26522',
    backgroundColor: 'rgba(242, 101, 34, 0.05)',
  },
  vehicleIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  vehicleText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666666',
    fontFamily: 'Cairo',
  },
  activeVehicleText: {
    color: '#F26522',
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 15,
    marginBottom: 12,
    borderRadius: 14,
    padding: 15,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  requestHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 10,
    marginBottom: 12,
  },
  requestId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1B2A6B',
    fontFamily: 'Cairo',
  },
  earningsValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#137333',
    fontFamily: 'Cairo',
  },
  requestDetails: {
    alignItems: 'flex-end',
    marginBottom: 15,
  },
  routeText: {
    fontSize: 13,
    color: '#444444',
    fontFamily: 'Tajawal',
    marginBottom: 6,
    textAlign: 'right',
  },
  boldText: {
    fontWeight: 'bold',
    color: '#1B2A6B',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  acceptButton: {
    flex: 2,
    backgroundColor: '#F26522', // البرتقالي الرسمي للتأكيد والقبول
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 10,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Cairo',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#F4F6F9',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  rejectButtonText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Cairo',
  },
});
