import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, Shadow } from '../../constants/theme';

// Official logo from apps/mobile/assets/images/logo.png
const logoAsset = require('../../assets/images/logo.png');

const categories = [
  { id: '1', title: 'سوبر ماركت', icon: '🛒' },
  { id: '2', title: 'مطاعم',       icon: '🍔' },
  { id: '3', title: 'صيدليات',    icon: '💊' },
  { id: '4', title: 'خضار وفواكه', icon: '🥦' },
];

// TODO(Phase 3): Remove mock data. Replace with empty [] initial state and proper empty-state UI.
// This mock data shows when the `stores` Supabase table is empty.
// Real stores added by merchants via the merchant dashboard will replace this automatically.
const mockStores = [
  { id: '1', name: 'متجر الهناء للمواد الغذائية', rating: '4.8', status: 'مفتوح', zone: 'حي الضلعة' },
  { id: '2', name: 'مطعم ومشاوي القصر',           rating: '4.9', status: 'مفتوح', zone: 'قصر البلاد' },
  { id: '3', name: 'صيدلية الشفاء المركزية',       rating: '4.7', status: 'مغلق', zone: 'وسط المدينة' },
];

export default function Home() {
  const router = useRouter();
  const [stores, setStores] = useState(mockStores);

  useEffect(() => {
    async function fetchLiveStores() {
      try {
        const { data, error } = await supabase.from('stores').select('*');
        if (data && !error) setStores(data);
      } catch (err) {
        console.log('Error fetching stores:', err);
      }
    }
    fetchLiveStores();
  }, []);

  return (
    <View style={styles.container}>
      {/* Header — logo (long-press → admin), location, cart */}
      <View style={styles.header}>
        <Text style={styles.cartIcon}>🛒</Text>

        <View style={styles.locationContainer}>
          <Text style={styles.locationLabel}>التوصيل إلى 📍</Text>
          <Text style={styles.locationValue}>عين الصفراء، حي الضلعة</Text>
        </View>

        {/* 🔐 Long-press on logo opens admin panel */}
        <TouchableOpacity onLongPress={() => router.push('/admin')} activeOpacity={0.8}>
          <Image source={logoAsset} style={styles.headerLogoImage} resizeMode="contain" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Search bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث عن متجر، وجبة، أو دواء..."
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        {/* Categories */}
        <Text style={styles.sectionTitle}>الأقسام الرئيسية</Text>
        <View style={styles.categoriesGrid}>
          {categories.map((cat) => (
            <TouchableOpacity key={cat.id} style={styles.categoryCard}>
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
              <Text style={styles.categoryText}>{cat.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Nearby stores */}
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
            <View>
              <Text style={[styles.statusBadge, store.status === 'مغلق' && styles.statusClosed]}>
                {store.status}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Floating CTA */}
      <TouchableOpacity style={styles.floatingButton}>
        <Text style={styles.floatingButtonText}>ضع طلبيتك السريعة (التوصيل 100 دج ثابت) ⚡</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgScreen },

  // Header
  header: {
    flexDirection: 'row',
    backgroundColor: Colors.navyMid,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.headerTop,
    paddingBottom: Spacing.base,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLogoImage: { width: 46, height: 46 },
  locationContainer: { alignItems: 'flex-end' },
  locationLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: 'Tajawal' },
  locationValue: { color: Colors.white, fontSize: 14, fontWeight: 'bold', fontFamily: 'Cairo' },
  cartIcon: { fontSize: 22, color: Colors.white },

  scrollContent: { paddingBottom: 110 },

  // Search
  searchContainer: {
    padding: Spacing.base,
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    backgroundColor: Colors.bgScreen,
    borderRadius: Radius.md,
    padding: Spacing.md,
    textAlign: 'right',
    fontFamily: 'Tajawal',
    fontSize: 14,
    color: Colors.textPrimary,
  },

  // Section title
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: Colors.navyMid,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    textAlign: 'right',
    fontFamily: 'Cairo',
  },

  // Categories
  categoriesGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
  },
  categoryCard: {
    width: '23%',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadow.card,
  },
  categoryIcon: { fontSize: 26, marginBottom: 6 },
  categoryText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.navyMid,
    fontFamily: 'Cairo',
    textAlign: 'center',
  },

  // Store cards
  storeCard: {
    backgroundColor: Colors.bgCard,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadow.card,
  },
  storeInfo: { alignItems: 'flex-end', flex: 1, paddingRight: 10 },
  storeName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.navyMid,
    fontFamily: 'Cairo',
    marginBottom: 4,
  },
  storeDetails: { flexDirection: 'row-reverse', alignItems: 'center' },
  storeZone: { fontSize: 12, color: Colors.textMuted, fontFamily: 'Tajawal', marginLeft: 10 },
  storeRating: { fontSize: 12, color: Colors.primary, fontWeight: 'bold' },

  // Status badge
  statusBadge: {
    backgroundColor: Colors.successBg,
    color: Colors.success,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radius.full,
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Cairo',
    overflow: 'hidden',
  },
  statusClosed: { backgroundColor: Colors.dangerBg, color: Colors.danger },

  // Floating button
  floatingButton: {
    position: 'absolute',
    bottom: 16,
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    borderRadius: Radius.lg,
    alignItems: 'center',
    ...Shadow.primaryBtn,
  },
  floatingButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Cairo',
  },
});
