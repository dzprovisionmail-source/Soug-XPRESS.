import React from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, FlatStyle } from 'react-native';

const categories = [
  { id: '1', title: 'سوبر ماركت', icon: '🛒' },
  { id: '2', title: 'مطاعم', icon: '🍔' },
  { id: '3', title: 'صيدليات', icon: '💊' },
  { id: '4', title: 'خضار وفواكه', icon: '🥦' },
];

const stores = [
  { id: '1', name: 'متجر الهناء للمواد الغذائية', rating: '4.8', status: 'مفتوح', zone: 'حي الضلعة' },
  { id: '2', name: 'مطعم ومشاوي القصر', rating: '4.9', status: 'مفتوح', zone: 'قصر البلاد' },
  { id: '3', name: 'صيدلية الشفاء المركزية', rating: '4.7', status: 'مغلق', zone: 'وسط المدينة' },
];

export default function Home() {
  return (
    <View style={styles.container}>
      {/* هيدر مخصص للزبون مع شعار الأخطبوط */}
      <View style={styles.header}>
        <Text style={styles.cartIcon}>🛒</Text>
        <View style={styles.locationContainer}>
          <Text style={styles.locationLabel}>التوصيل إلى 📍</Text>
          <Text style={styles.locationValue}>عين الصفراء، حي الضلعة</Text>
        </View>
        <Text style={styles.headerLogo}>🐙</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* شريط البحث الذكي */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث عن متجر، وجبة، أو دواء..."
            placeholderTextColor="#888888"
          />
        </View>

        {/* شبكة الأقسام الرئيسية - Categories Grid */}
        <Text style={styles.sectionTitle}>الأقسام الرئيسية</Text>
        <View style={styles.categoriesGrid}>
          {categories.map((cat) => (
            <TouchableOpacity key={cat.id} style={styles.categoryCard}>
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
              <Text style={styles.categoryText}>{cat.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* قائمة المتاجر المميزة الموصى بها */}
        <Text style={styles.sectionTitle}>المتاجر القريبة منك</Text>
        {stores.map((store) => (
          <View key={store.id} style={styles.storeCard}>
            <View style={styles.storeInfo}>
              <Text style={styles.storeName}>{store.name}</Text>
              <View style={styles.storeDetails}>
                <Text style={styles.storeZone}>{store.zone}</Text>
                <Text style={styles.storeRating}>⭐ {store.rating}</Text>
              </View>
            </View>
            <View style={styles.storeStatusContainer}>
              <Text style={[styles.statusBadge, store.status === 'مغلق' && styles.statusClosed]}>
                {store.status}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* زر إجراء ثابت عائم للاستدعاء السريع والطلبات الفورية */}
      <TouchableOpacity style={styles.floatingButton}>
        <Text style={styles.floatingButtonText}>ضع طلبيتك السريعة ⚡</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    backgroundColor: '#1B2A6B', // الأزرق الداكن الرسمي
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLogo: {
    fontSize: 28,
  },
  locationContainer: {
    alignItems: 'flex-end',
  },
  locationLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontFamily: 'Tajawal',
  },
  locationValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Cairo',
  },
  cartIcon: {
    fontSize: 22,
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 100, // مساحة للزر العائم وشريط الـ Tabs
  },
  searchContainer: {
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchInput: {
    backgroundColor: '#F1F3F5',
    borderRadius: 10,
    padding: 12,
    textAlign: 'right',
    fontFamily: 'Tajawal',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B2A6B',
    marginHorizontal: 15,
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'right',
    fontFamily: 'Cairo',
  },
  categoriesGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  categoryCard: {
    width: '23%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  categoryIcon: {
    fontSize: 26,
    marginBottom: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1B2A6B',
    fontFamily: 'Cairo',
    textAlign: 'center',
  },
  storeCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 14,
    padding: 15,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  storeInfo: {
    alignItems: 'flex-end',
    flex: 1,
    paddingRight: 10,
  },
  storeName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1B2A6B',
    fontFamily: 'Cairo',
    marginBottom: 4,
  },
  storeDetails: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  storeZone: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Tajawal',
    marginLeft: 10,
  },
  storeRating: {
    fontSize: 12,
    color: '#F26522',
    fontWeight: 'bold',
  },
  storeStatusContainer: {
    alignItems: 'center',
  },
  statusBadge: {
    backgroundColor: '#E6F4EA',
    color: '#137333',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Cairo',
  },
  statusClosed: {
    backgroundColor: '#FCE8E6',
    color: '#C5221F',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 15,
    left: 20,
    right: 20,
    backgroundColor: '#F26522', // البرتقالي الرسمي للتأكيد والطلبات
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#F26522',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  floatingButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Cairo',
  },
});
