/**
 * Admin Control Center — shell screen.
 *
 * Responsibilities:
 *   • Role guard (profiles.role = 'admin' only; second layer after _layout.tsx)
 *   • Data fetching: stores + drivers in a single parallel call
 *   • Section state: which tab is active
 *   • Store creation form state (kept here so it survives tab switches)
 *   • All Supabase write handlers passed down as callbacks
 *
 * Sub-components live in src/components/admin/
 */
import React, { useState, useEffect } from 'react';
import {
  View, StyleSheet, ScrollView, Alert,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Redirect } from 'expo-router';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/theme';

import AdminHeader        from '../components/admin/AdminHeader';
import AdminStats         from '../components/admin/AdminStats';
import AdminSectionTabs   from '../components/admin/AdminSectionTabs';
import StoresAdminSection from '../components/admin/StoresAdminSection';
import DriversAdminSection from '../components/admin/DriversAdminSection';
import AdminQuickActions  from '../components/admin/AdminQuickActions';
import { AdminSection, Store, Driver } from '../components/admin/types';

export default function AdminDashboard() {
  // ── All hooks before any conditional returns (Rules of Hooks) ────────────
  const { userProfile, isLoading: authLoading } = useAuth();

  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');

  const [stores,     setStores]     = useState<Store[]>([]);
  const [drivers,    setDrivers]    = useState<Driver[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Store creation form — kept here so values persist across tab switches
  const [newStoreName,     setNewStoreName]     = useState('');
  const [newStoreCategory, setNewStoreCategory] = useState('سوبر ماركت');
  const [newStoreZone,     setNewStoreZone]     = useState('');
  const [isInserting,      setIsInserting]      = useState(false);

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Data fetching ─────────────────────────────────────────────────────────

  const fetchData = async () => {
    try {
      const [storesRes, driversRes] = await Promise.all([
        supabase.from('stores').select('*').order('created_at', { ascending: false }),
        supabase.from('drivers').select('*').order('created_at', { ascending: false }),
      ]);

      if (storesRes.error)  throw storesRes.error;
      if (driversRes.error) throw driversRes.error;

      setStores(storesRes.data   || []);
      setDrivers(driversRes.data || []);
    } catch (err: unknown) {
      Alert.alert('خطأ في جلب البيانات', err instanceof Error ? err.message : 'خطأ غير معروف');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // ── Store handlers ────────────────────────────────────────────────────────

  const handleAddStoreDirectly = async () => {
    if (!newStoreName.trim() || !newStoreZone.trim()) {
      Alert.alert('تنبيه', 'الرجاء ملء اسم المحل والحي أولاً.');
      return;
    }
    setIsInserting(true);
    try {
      const { error } = await supabase.from('stores').insert([{
        name:        newStoreName.trim(),
        category:    newStoreCategory,
        zone:        newStoreZone.trim(),
        is_approved: true, // تفعيل فوري لأنه مضاف من المدير
      }]);
      if (error) throw error;
      Alert.alert(
        'تم إنشاء متجر حي بنجاح 🎉',
        `المحل (${newStoreName}) مفعل ومتاح الآن في التغذية العامة للمنصة ليراه الجميع.`,
      );
      setNewStoreName('');
      setNewStoreZone('');
      fetchData();
    } catch (err: unknown) {
      Alert.alert('فشلت الإضافة', err instanceof Error ? err.message : 'خطأ غير معروف');
    } finally {
      setIsInserting(false);
    }
  };

  const handleToggleStoreApproval = async (storeId: string, currentStatus: boolean | null) => {
    const nextStatus = !currentStatus;
    try {
      const { error } = await supabase
        .from('stores')
        .update({ is_approved: nextStatus })
        .eq('id', storeId);
      if (error) throw error;
      Alert.alert(nextStatus ? 'تم تفعيل واعتماد المتجر 🟢' : 'تم تجميد حساب المتجر 🔴');
      fetchData();
    } catch (err: unknown) {
      Alert.alert('خطأ في تحديث الحالة', err instanceof Error ? err.message : 'خطأ غير معروف');
    }
  };

  const handleDeleteStore = (storeId: string, storeName: string) => {
    Alert.alert(
      'حذف نهائي ⚠️',
      `هل أنت متأكد من رغبتك في حذف محل (${storeName}) نهائياً من السيرفر؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'نعم، احذفه ديركت',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('stores').delete().eq('id', storeId);
              if (error) throw error;
              Alert.alert('نجاح الحذف', 'تمت إزالة المتجر بنجاح.');
              fetchData();
            } catch (err: unknown) {
              Alert.alert('فشل الحذف', err instanceof Error ? err.message : 'خطأ غير معروف');
            }
          },
        },
      ],
    );
  };

  // ── Driver handlers ───────────────────────────────────────────────────────

  const handleResetDriverCounter = (id: string, name: string) => {
    Alert.alert(
      'تأكيد استلام الدفع',
      `هل تأكدت من وصول مستحقات الموقع من الموزع (${name}) عبر بريدي موب لتصفير عداده وإعادة تفعيله؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'نعم، تم الاستلام',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('drivers')
                .update({ delivery_counter: 0, is_suspended: false, total_owed_to_site: 0 })
                .eq('id', id);
              if (error) throw error;
              Alert.alert('تم التفعيل', `تم فتح حساب الموزع ${name} وتصفير ديونه بنجاح في عين الصفراء.`);
              fetchData();
            } catch (err: unknown) {
              Alert.alert('خطأ في التحديث', err instanceof Error ? err.message : 'خطأ غير معروف');
            }
          },
        },
      ],
    );
  };

  // ── Security guards — conditionals AFTER all hooks ────────────────────────

  if (authLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // 🔒 Only profiles.role = 'admin' may enter.
  // _layout.tsx also redirects non-admins — this is a second layer of defense.
  if (userProfile?.role !== 'admin') {
    return <Redirect href="/(tabs)/home" />;
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // ── Active section content ────────────────────────────────────────────────

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <AdminStats stores={stores} drivers={drivers} />;

      case 'stores':
        return (
          <StoresAdminSection
            stores={stores}
            newStoreName={newStoreName}
            setNewStoreName={setNewStoreName}
            newStoreCategory={newStoreCategory}
            setNewStoreCategory={setNewStoreCategory}
            newStoreZone={newStoreZone}
            setNewStoreZone={setNewStoreZone}
            isInserting={isInserting}
            onAddStore={handleAddStoreDirectly}
            onToggleApproval={handleToggleStoreApproval}
            onDeleteStore={handleDeleteStore}
          />
        );

      case 'drivers':
        return (
          <DriversAdminSection
            drivers={drivers}
            onResetCounter={handleResetDriverCounter}
          />
        );

      case 'users':
      case 'orders':
      case 'settings':
        return <AdminQuickActions section={activeSection} />;
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <AdminHeader />
      <AdminSectionTabs active={activeSection} onSelect={setActiveSection} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
          />
        }
      >
        {renderSection()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgScreen,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bgScreen,
  },
  scrollContent: {
    paddingBottom: 40,
  },
});
