import type { LanguageCode } from '../types';

export interface TranslationDictionary {
  navCourses: string;
  navServices: string;
  navAbout: string;
  navBlog: string;
  navContact: string;
  portalBtn: string;
  enrollNow: string;
  exploreCourses: string;
  hireTeam: string;
  searchPlaceholder: string;
  studentsTrained: string;
  activeClients: string;
  coursesLabel: string;
  projectsCompleted: string;
  successRate: string;
  aboutLabel: string;
  missionLabel: string;
  visionLabel: string;
  coursesHeading: string;
  servicesHeading: string;
  testimonialsHeading: string;
  blogHeading: string;
  galleryHeading: string;
  faqHeading: string;
  contactHeading: string;
  easypaisaTitle: string;
  dir: 'ltr' | 'rtl';
}

export const TRANSLATIONS: Record<LanguageCode, TranslationDictionary> = {
  en: {
    navCourses: 'Courses',
    navServices: 'Services',
    navAbout: 'About',
    navBlog: 'Blog',
    navContact: 'Contact',
    portalBtn: 'Portal',
    enrollNow: 'Enroll Now',
    exploreCourses: 'Explore Courses',
    hireTeam: 'Hire Our Team',
    searchPlaceholder: 'Search courses, services, articles, or FAQ...',
    studentsTrained: 'Students Trained',
    activeClients: 'Active Clients',
    coursesLabel: 'Courses',
    projectsCompleted: 'Projects Completed',
    successRate: 'Success Rate',
    aboutLabel: 'About Velanza.co',
    missionLabel: 'Our Mission',
    visionLabel: 'Our Vision',
    coursesHeading: 'Practical eCommerce Training Programs',
    servicesHeading: 'Full-Service Account Management',
    testimonialsHeading: 'Student & Client Outcomes',
    blogHeading: 'Insights & Marketplace Playbooks',
    galleryHeading: 'Studio, Classroom & Student Events',
    faqHeading: 'Frequently Asked Questions',
    contactHeading: 'Start Your Training or Store Partnership',
    easypaisaTitle: 'Easypaisa Fee Verification',
    dir: 'ltr',
  },
  ur: {
    navCourses: 'کورسز',
    navServices: 'سروسز',
    navAbout: 'تعارف',
    navBlog: 'بلاگ',
    navContact: 'رابطہ',
    portalBtn: 'پورٹل',
    enrollNow: 'داخلہ لیں',
    exploreCourses: 'کورسز دیکھیں',
    hireTeam: 'ٹیم ہائر کریں',
    searchPlaceholder: 'کورسز، سروسز، یا مضامین تلاش کریں...',
    studentsTrained: 'تربیت یافتہ طلبہ',
    activeClients: 'فعال کلائنٹس',
    coursesLabel: 'کورسز',
    projectsCompleted: 'مکمل پراجیکٹس',
    successRate: 'کامیابی کی شرح',
    aboutLabel: 'ویلینزا اسٹوڈیو کا تعارف',
    missionLabel: 'ہمارا مشن',
    visionLabel: 'ہمارا وژن',
    coursesHeading: 'عملی ای کامرس تربیتی پروگرام',
    servicesHeading: 'مکمل اکاؤنٹ مینجمنٹ سروسز',
    testimonialsHeading: 'طلبہ اور کلائنٹس کی کامیابیاں',
    blogHeading: 'ای کامرس بلاگ اور رہنمائی',
    galleryHeading: 'اسٹوڈیو، کلاس روم اور سرگرمیاں',
    faqHeading: 'اکثر پوچھے گئے سوالات',
    contactHeading: 'آج ہی رابطہ کریں',
    easypaisaTitle: 'ایزی پیسہ فیس تصدیق',
    dir: 'rtl',
  },
  ar: {
    navCourses: 'الدورات',
    navServices: 'الخدمات',
    navAbout: 'من نحن',
    navBlog: 'المدونة',
    navContact: 'اتصل بنا',
    portalBtn: 'البوابة',
    enrollNow: 'سجل الآن',
    exploreCourses: 'تصفح الدورات',
    hireTeam: 'وظف فريقنا',
    searchPlaceholder: 'ابحث في الدورات أو الخدمات أو المقالات...',
    studentsTrained: 'الطلاب المدربون',
    activeClients: 'العملاء النشطون',
    coursesLabel: 'الدورات',
    projectsCompleted: 'المشاريع المنجزة',
    successRate: 'معدل النجاح',
    aboutLabel: 'عن استوديو Velanza.co',
    missionLabel: 'رسالتنا',
    visionLabel: 'رؤيتنا',
    coursesHeading: 'برامج التدريب العملي للتجارة الإلكترونية',
    servicesHeading: 'إدارة حسابات المتاجر بالكامل',
    testimonialsHeading: 'نتائج الطلاب والعملاء',
    blogHeading: 'أدلة التجارة الإلكترونية والمدونة',
    galleryHeading: 'الاستوديو والفصول والفعاليات',
    faqHeading: 'الأسئلة الشائعة',
    contactHeading: 'ابدأ التدريب أو شراكة المتجر',
    easypaisaTitle: 'التحقق من دفع Easypaisa',
    dir: 'rtl',
  },
  es: {
    navCourses: 'Cursos',
    navServices: 'Servicios',
    navAbout: 'Nosotros',
    navBlog: 'Blog',
    navContact: 'Contacto',
    portalBtn: 'Portal',
    enrollNow: 'Inscribirse',
    exploreCourses: 'Explorar Cursos',
    hireTeam: 'Contratar Equipo',
    searchPlaceholder: 'Buscar cursos, servicios, artículos o preguntas...',
    studentsTrained: 'Estudiantes',
    activeClients: 'Clientes Activos',
    coursesLabel: 'Cursos',
    projectsCompleted: 'Proyectos',
    successRate: 'Tasa de Éxito',
    aboutLabel: 'Sobre Velanza.co',
    missionLabel: 'Nuestra Misión',
    visionLabel: 'Nuestra Visión',
    coursesHeading: 'Programas Prácticos de Comercio Electrónico',
    servicesHeading: 'Gestión Completa de Cuentas',
    testimonialsHeading: 'Resultados de Estudiantes y Clientes',
    blogHeading: 'Guías y Estrategias de Marketplace',
    galleryHeading: 'Estudio, Aulas y Eventos',
    faqHeading: 'Preguntas Frecuentes',
    contactHeading: 'Inicia tu Formación o Alianza Comercial',
    easypaisaTitle: 'Verificación de Pago Easypaisa',
    dir: 'ltr',
  },
};
