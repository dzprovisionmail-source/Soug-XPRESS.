import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

const activeOrders = [
  { id: '1024', customer: 'محمد علي', items: '2x حليب صومام + 1x خبز دار', total: '340 د.ج', status: 'جديد' },
  { id: '1023', customer: 'أحمد بوعلام', items: '1x وجبة شواء عائلية + لتر حمود بوعلام', total: '1850 د.ج', status: 'قيد التحضير' },
  { id: '1022', customer: 'كريم بلحاج', items: '1x دواء باراسيتامول 500 مغ', total: '120 د.ج', status: 'جاهز' },
];

export default function MerchantDashboard() {
  return (
    <View style={styles.container}>
      {/* هيدر لوحة التحكم للتاجر */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>لوحة تحكم التاجر 🏪</Text>
        <Text style={styles.storeName}>مخبزة ومواد غذائية الهناء</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* قسم الإحصائيات السريعة - Analytics Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>18</Text>
            <Text style={styles.statLabel}>طلبات اليوم</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#137333' }]}>6,420</Text>
            <Text style={styles.statLabel}>المبيعات (د.ج)</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#F26522' }]}>4.8 ⭐</Text>
            <Text style={styles.statLabel}>تقييم المتجر</Text>
          </View>
        </View>

        {/* طابور إدارة الطلبات الحية - Order Queue */}
        <Text style={styles.sectionTitle}>إدارة الطلبات النشطة</Text>
        {activeOrders.map((order) => (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderId}>طلب رقم #{order.id}</Text>
              <Text 
                style={[
                  styles.statusBadge, 
                  order.status === 'قيد التحضير' && styles.statusPreparing,
                  order.status === 'جاهز' && styles.statusReady
                ]}
              >
                {order.status}
              </Text>
            </View>

            <View style={styles.orderDetails}>
              <Text style={styles.orderText}><Text style={styles.boldText}>الزبون:</Text> {order.customer}</Text>
              <Text style={styles.orderText}><Text style={styles.boldText}>المحتويات:</Text> {order.items}</Text>
              <Text style={styles.orderPrice}><Text style={styles.boldText}>الإجمالي:</Text> {order.total}</Text>
            </View>

            {/* أزرار اتخاذ الإجراءات السريعة على الطلب */}
            <View style={styles.actionButtonsContainer}>
              {order.status === 'جديد' && (
                <TouchableOpacity style={styles.acceptButton}>
                  <Text style={styles.actionButtonText}>قبول وبدء التحضير</Text>
                </TouchableOpacity>
              )}
              {order.status === 'قيد التحضير' && (
                <TouchableOpacity style={styles.readyButton}>
                  <Text style={styles.actionButtonText}>تجهيز الطلب للموصل</Text>
                </TouchableOpacity>
              )}
              {order.status === 'جاهز' && (
                <Text style={styles.waitingText}>⏳ بانتظار وصول موصل سوق إكسبريس...</Text>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* ميزة الاختصار السريع لإدارة السلع وإضافة منتج */}
      <TouchableOpacity style={styles.addProductButton}>
        <Text style={styles.addProductButtonText}>+ إضافة منتج جديد للمتجر</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F9',
  },
  header: {
    backgroundColor: '#1B2A6B', // الأزرق الداكن المؤسسي
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
  storeName: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Tajawal',
    marginTop: 4,
  },
  scrollContent: {
    paddingBottom: 90,
  },
  statsContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    padding: 15,
  },
  statCard: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B2A6B',
    fontFamily: 'Cairo',
  },
  statLabel: {
    fontSize: 11,
    color: '#666666',
    fontFamily: 'Tajawal',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B2A6B',
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 12,
    textAlign: 'right',
    fontFamily: 'Cairo',
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 15,
    marginBottom: 12,
    borderRadius: 14,
    padding: 15,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  orderHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 10,
    marginBottom: 10,
  },
  orderId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1B2A6B',
    fontFamily: 'Cairo',
  },
  statusBadge: {
    backgroundColor: '#FFF4E5',
    color: '#B06000',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Cairo',
  },
  statusPreparing: {
    backgroundColor: '#E8F0FE',
    color: '#1A73E8',
  },
  statusReady: {
    backgroundColor: '#E6F4EA',
    color: '#137333',
  },
  orderDetails: {
    alignItems: 'flex-end',
  },
  orderText: {
    fontSize: 13,
    color: '#444444',
    fontFamily: 'Tajawal',
    marginBottom: 5,
    textAlign: 'right',
  },
  orderPrice: {
    fontSize: 14,
    color: '#1B2A6B',
    fontFamily: 'Cairo',
    marginTop: 2,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#1B2A6B',
  },
  actionButtonsContainer: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  acceptButton: {
    backgroundColor: '#1B2A6B',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  readyButton: {
    backgroundColor: '#F26522', // البرتقالي للحث على الإرسال والجهوزية
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Cairo',
  },
  waitingText: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Tajawal',
    textAlign: 'center',
  },
  addProductButton: {
    position: 'absolute',
    bottom: 15,
    left: 15,
    right: 15,
    backgroundColor: '#F26522',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  addProductButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Cairo',
  },
});
