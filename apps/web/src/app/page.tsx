import React from 'react';

export default function WebLandingPage() {
  return (
    <div style={styles.container}>
      {/* شريط التنقل العلوي للموقع الإلكتروني */}
      <header style={styles.header}>
        <div style={styles.logoContainer}>
          <span style={styles.logoIcon}>🐙</span>
          <h1 style={styles.logoText}>SOUG XPRESS</h1>
        </div>
        <nav style={styles.navLinks}>
          <a href="#drivers" style={styles.navLink}>انضم كعامل توصيل</a>
          <a href="#merchants" style={styles.navLink}>سجل كتاجر</a>
          <a href="#features" style={styles.navLink}>المميزات</a>
        </nav>
      </header>

      {/* القسم الرئيسي الترحيبي - Hero Section */}
      <main style={styles.hero}>
        <h2 style={styles.heroTitle}>سوق عين الصفراء في جيبك 📱</h2>
        <p style={styles.heroSubtitle}>
          المنصة الرقمية الأولى والأسراع للربط بين الزبائن، المحلات التجارية، وفرسان التوصيل في مدينة عين الصفراء وضواحيها.
        </p>
        <div style={styles.ctaButtons}>
          <button style={styles.primaryButton}>تحميل التطبيق الآن (Expo Go)</button>
          <button style={styles.secondaryButton}>اكتشف المتاجر النشطة</button>
        </div>
      </main>

      {/* قسم استعراض النظام الثلاثي للمنصة */}
      <section id="features" style={styles.featuresSection}>
        <h3 style={styles.sectionTitle}>منظومة واحدة تخدم الجميع</h3>
        <div style={styles.grid}>
          {/* كارت الزبون */}
          <div style={styles.card}>
            <div style={styles.cardIcon}>👤</div>
            <h4 style={styles.cardTitle}>الزبائن</h4>
            <p style={styles.cardText}>طلب سريع من السوبرماركت، المطاعم والصيدليات مع تحديد دقيق للأحياء والمواقع لتوصيل فوري.</p>
          </div>

          {/* كارت التاجر */}
          <div style={styles.card} id="merchants">
            <div style={styles.cardIcon}>🏪</div>
            <h4 style={styles.cardTitle}>التجار وأصحاب المحلات</h4>
            <p style={styles.cardText}>لوحة تحكم ذكية لمراقبة المبيعات اليومية، إدارة طوابير الطلبات النشطة وتحديث قائمة السلع بمرونة.</p>
          </div>

          {/* كارت الموصل */}
          <div style={styles.card} id="drivers">
            <div style={styles.cardIcon}>🛵</div>
            <h4 style={styles.cardTitle}>فرسان التوصيل</h4>
            <p style={styles.cardText}>إدارة الطلبات الحية بناءً على نوع المركبة، مع احتساب دقيق للمسافات والأرباح لضمان كفاءة العمل.</p>
          </div>
        </div>
      </section>

      {/* تذييل الصفحة - Footer */}
      <footer style={styles.footer}>
        <p>© 2026 جميع الحقوق محفوظة لـ DZ Pro Vision - مشروع تطوير سوق عين الصفراء الرقمي</p>
      </footer>
    </div>
  );
}

const styles = {
  container: {
    fontFamily: 'Cairo, sans-serif',
    backgroundColor: '#FAFAFA',
    color: '#333',
    direction: 'rtl' as const,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 50px',
    backgroundColor: '#1B2A6B', // الأزرق الداكن الرسمي
    color: '#FFF',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoIcon: {
    fontSize: '32px',
  },
  logoText: {
    fontSize: '22px',
    fontWeight: 'bold',
    margin: 0,
  },
  navLinks: {
    display: 'flex',
    gap: '25px',
  },
  navLink: {
    color: '#FFF',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  hero: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    textAlign: 'center' as const,
    padding: '100px 20px',
    backgroundColor: '#1B2A6B',
    color: '#FFF',
    borderBottomLeftRadius: '40px',
    borderBottomRightRadius: '40px',
  },
  heroTitle: {
    fontSize: '42px',
    fontWeight: 'bold',
    marginBottom: '20px',
  },
  heroSubtitle: {
    fontSize: '18px',
    maxWidth: '600px',
    lineHeight: '1.8',
    color: '#E0E4FF',
    marginBottom: '40px',
  },
  ctaButtons: {
    display: 'flex',
    gap: '15px',
  },
  primaryButton: {
    backgroundColor: '#F26522', // البرتقالي الرسمي للتفاعل والأزرار الحاسمة
    color: '#FFF',
    border: 'none',
    padding: '12px 30px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    color: '#FFF',
    border: '2px solid #FFF',
    padding: '12px 30px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  featuresSection: {
    padding: '8px 20px 80px 20px',
    maxWidth: '1200px',
    margin: '0 auto',
    textAlign: 'center' as const,
  },
  sectionTitle: {
    fontSize: '28px',
    color: '#1B2A6B',
    fontWeight: 'bold',
    marginTop: '60px',
    marginBottom: '40px',
  },
  grid: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '20px',
    flexWrap: 'wrap' as const,
  },
  card: {
    flex: '1',
    minWidth: '280px',
    backgroundColor: '#FFF',
    padding: '30px 20px',
    borderRadius: '16px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    border: '1px solid #EFEFEF',
    textAlign: 'center' as const,
  },
  cardIcon: {
    fontSize: '40px',
    marginBottom: '15px',
  },
  cardTitle: {
    fontSize: '20px',
    color: '#1B2A6B',
    fontWeight: 'bold',
    marginBottom: '10px',
  },
  cardText: {
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.6',
  },
  footer: {
    backgroundColor: '#111A44',
    color: '#AAA',
    textAlign: 'center' as const,
    padding: '20px',
    fontSize: '12px',
    borderTop: '1px solid #222',
  },
};
