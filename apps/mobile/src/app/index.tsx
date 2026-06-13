import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'تسوق بسرعة',
    description: 'احصل على كل احتياجاتك من المتاجر المحلية في لمح البصر',
    icon: '🛒',
  },
  {
    id: '2',
    title: 'توصيل فوري',
    description: 'خدمة توصيل سريعة وموثوقة لباب منزلك في عين الصفراء',
    icon: '🛵',
  },
  {
    id: '3',
    title: 'تجار محليون موثوقون',
    description: 'ندعم تجارنا المحليين ونوفر أفضل الأسعار لجميع سكان المنطقة',
    icon: '🏪',
  },
];

export default function Onboarding() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      router.push('/register'); // الانتقال التلقائي لشاشة التسجيل عند النهاية
    }
  };

  return (
    <View style={styles.container}>
      {/* الهوية البصرية العلوية للشعار */}
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>🐙 SOUG XPRESS</Text>
      </View>

      {/* محتوى الشريحة الحالية */}
      <View style={styles.slide}>
        <Text style={styles.icon}>{slides[currentIndex].icon}</Text>
        <Text style={styles.title}>{slides[currentIndex].title}</Text>
        <Text style={styles.description}>{slides[currentIndex].description}</Text>
      </View>

      {/* نقاط المؤشر السفلي البرتقالي */}
      <View style={styles.indicatorContainer}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              currentIndex === index ? styles.activeIndicator : styles.inactiveIndicator,
            ]}
          />
        ))}
      </View>

      {/* أزرار التحكم والضغط التفاعلية */}
      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>
          {currentIndex === slides.length - 1 ? 'ابدأ الآن' : 'التالي'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1B2A6B', // الأزرق الداكن الرسمي
    fontFamily: 'Cairo',
  },
  slide: {
    alignItems: 'center',
    width: width - 40,
  },
  icon: {
    fontSize: 90,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1B2A6B',
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: 'Cairo',
  },
  description: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 26,
    fontFamily: 'Tajawal',
    paddingHorizontal: 15,
  },
  indicatorContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeIndicator: {
    width: 24,
    backgroundColor: '#F26522', // البرتقالي النشط
  },
  inactiveIndicator: {
    width: 8,
    backgroundColor: '#E0E0E0',
  },
  button: {
    width: '100%',
    backgroundColor: '#F26522', // البرتقالي الرسمي للأزرار
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Cairo',
  },
});
