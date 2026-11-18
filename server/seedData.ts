import crypto from 'node:crypto';
import type {
  BlogPost,
  ClientAccount,
  ContactInquiry,
  Course,
  Enrollment,
  FaqItem,
  GalleryItem,
  ServiceItem,
  SiteSettings,
  StudentProgressRecord,
  SupportRequest,
  Testimonial,
  UserRecord,
} from '../src/types';

export const IMG_FOUNDER = '/src/assets/images/founder_samiullah_basra_1795020954238.jpg';
export const IMG_STUDIO = '/src/assets/images/hero_studio_workspace_1795020955040.jpg';
export const IMG_MARKETPLACE = '/src/assets/images/course_marketplace_thumb_1795020956002.jpg';
export const IMG_SHOPIFY = '/src/assets/images/course_shopify_freelance_1795020956232.jpg';
export const IMG_CLASSROOM = '/src/assets/images/gallery_classroom_training_1795020957219.jpg';

export function hashPassword(password: string, existingSalt?: string): { hash: string; salt: string } {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const derived = crypto.scryptSync(password, salt, 64);
  const stored = Buffer.from(hash, 'hex');
  if (derived.length !== stored.length) return false;
  return crypto.timingSafeEqual(derived, stored);
}

export interface DatabaseState {
  settings: SiteSettings;
  users: UserRecord[];
  courses: Course[];
  services: ServiceItem[];
  enrollments: Enrollment[];
  studentProgress: Record<string, StudentProgressRecord>;
  clients: ClientAccount[];
  supportRequests: SupportRequest[];
  testimonials: Testimonial[];
  blogPosts: BlogPost[];
  gallery: GalleryItem[];
  faqs: FaqItem[];
  contactInquiries: ContactInquiry[];
}

export function createSeedDatabase(): DatabaseState {
  const adminCreds = hashPassword('Admin@123');
  const studentCreds = hashPassword('Student@123');
  const clientCreds = hashPassword('Client@123');

  const settings: SiteSettings = {
    brandName: 'Velanza.co Working & Learning Studio',
    founderName: 'Mr. Samiullah Basra',
    founderTitle: 'Founder & CEO · Global eCommerce Strategist',
    founderBio:
      'Mr. Samiullah Basra founded Velanza.co to bridge practical marketplace execution with real-world career training—mentoring thousands of international learners while scaling multi-channel seller operations across the US, UK, EU, and UAE.',
    founderImage: '/assets/aistudio/WhatsApp_Image_2026-11-18_at_9.16.16_AM_0d5d3762.jpeg',
    heroHeadline: 'Learn Today. Earn Tomorrow.',
    heroSubheading:
      'Professional eCommerce Training & Complete Account Management Services for Students, Entrepreneurs, and Businesses Worldwide.',
    announcementBanner:
      'New Cohort Open: Practical eBay, Amazon, Walmart, Shopify & TikTok Shop Studio Training · Easypaisa Verification Active',
    aboutHeadline: 'An International eCommerce Academy & Account Management Studio',
    aboutDescription:
      'Velanza.co Working & Learning Studio operates simultaneously as a hands-on training institute and a full-service marketplace agency. Students learn inside live store workflows rather than outdated slides, while global brands rely on our dedicated account teams for daily operations and scaling.',
    aboutMission:
      'Empower students with practical eCommerce skills and help businesses grow through professional account management.',
    aboutVision:
      "Become one of the world's most trusted eCommerce learning and service platforms.",
    studioImage: IMG_STUDIO,
    easypaisaNumber: '0330-3677175',
    easypaisaTitle: 'Samiullah Basra (Velanza.co Studio)',
    whatsappNumber: '0330-3677175',
    contactEmail: 'sunnyleader69@gmail.com',
    linkedinUrl: 'https://www.linkedin.com/in/samiullah-basra-a6a368430',
    officeAddress: 'Velanza.co Working & Learning Studio · International Operations Hub (Remote & On-Campus)',
    seoTitle: 'Velanza.co Working & Learning Studio – eCommerce Training & Agency',
    seoDescription:
      'Learn Today. Earn Tomorrow. Practical eBay, Amazon, Walmart, Shopify & TikTok Shop training plus global account management by Velanza.co.',
    primaryAccentHex: '#DC2626',
    stats: {
      studentsTrained: 2480,
      activeClients: 185,
      coursesCount: 10,
      projectsCompleted: 640,
      successRatePercent: 96,
    },
    futureModules: {
      onlineExams: true,
      qrCertificates: true,
      liveClasses: true,
      aiAssistantReady: true,
      multiInstructor: true,
      extraGateways: true,
      mobileAppSync: true,
    },
  };

  const courses: Course[] = [
    {
      id: 'course-ebay',
      title: 'eBay Complete Course',
      category: 'Marketplaces',
      thumbnail: IMG_MARKETPLACE,
      description:
        'Master international eBay seller account creation, supplier sourcing, high-converting SEO listings, defect-free order processing, and scaling limits.',
      duration: '8 Weeks · 24 Lessons',
      feePkr: 15000,
      feeUsd: 55,
      instructor: 'Mr. Samiullah Basra',
      demoVideoUrl: 'demo://ebay-intro',
      syllabusPdfUrl: '/api/syllabus/course-ebay',
      featured: true,
      modules: [
        {
          id: 'mod-ebay-1',
          title: 'Module 1: Account Architecture & Compliance',
          lessons: [
            {
              id: 'les-ebay-1',
              title: 'International eBay Seller Setup & Verification (Demo)',
              durationMinutes: 18,
              videoUrl: 'demo://ebay-intro',
              isDemo: true,
              summary: 'Walkthrough of UK/US/EU account policies, Payoneer linking, and initial selling limits.',
              resourceName: 'eBay Seller Onboarding Checklist.pdf',
              resourceUrl: '/api/syllabus/course-ebay',
            },
            {
              id: 'les-ebay-2',
              title: 'Account Health Metrics & Defect Prevention',
              durationMinutes: 22,
              videoUrl: 'demo://ebay-health',
              isDemo: false,
              summary: 'Protecting Late Shipment Rate, Tracking Upload Validation, and Top Rated Seller criteria.',
            },
          ],
        },
        {
          id: 'mod-ebay-2',
          title: 'Module 2: Product Hunting & SEO Listing',
          lessons: [
            {
              id: 'les-ebay-3',
              title: 'Competitor Store Sniping & Margin Calculation',
              durationMinutes: 26,
              videoUrl: 'demo://ebay-hunting',
              isDemo: false,
              summary: 'Using Terapeak & Zik Analytics logic to verify 30-day sell-through rates.',
            },
            {
              id: 'les-ebay-4',
              title: 'Cassini Search Optimization & Promoted Listings',
              durationMinutes: 24,
              videoUrl: 'demo://ebay-seo',
              isDemo: false,
              summary: 'Structuring 80-character titles, item specifics, and promoted ad bid strategy.',
            },
          ],
        },
      ],
    },
    {
      id: 'course-amazon',
      title: 'Amazon Course',
      category: 'Marketplaces',
      thumbnail: IMG_MARKETPLACE,
      description:
        'Practical Amazon FBA Wholesale, Online Arbitrage, and Private Label training covering Keepa analysis, brand approval, PPC, and Seller Central operations.',
      duration: '10 Weeks · 30 Lessons',
      feePkr: 22000,
      feeUsd: 80,
      instructor: 'Mr. Samiullah Basra',
      demoVideoUrl: 'demo://amazon-intro',
      syllabusPdfUrl: '/api/syllabus/course-amazon',
      featured: true,
      modules: [
        {
          id: 'mod-amz-1',
          title: 'Module 1: Seller Central & Wholesale Sourcing',
          lessons: [
            {
              id: 'les-amz-1',
              title: 'Amazon FBA vs Wholesale Business Models (Demo)',
              durationMinutes: 20,
              videoUrl: 'demo://amazon-intro',
              isDemo: true,
              summary: 'Comparing capital requirements, ROI velocity, and Buy Box rotation across US & UK.',
              resourceName: 'Amazon FBA ROI Calculator Guide.pdf',
              resourceUrl: '/api/syllabus/course-amazon',
            },
            {
              id: 'les-amz-2',
              title: 'Reading Keepa Charts & Supplier Outreach',
              durationMinutes: 28,
              videoUrl: 'demo://amazon-keepa',
              isDemo: false,
              summary: 'Evaluating BSR stability, Amazon-in-stock history, and distributor invoice requirements.',
            },
          ],
        },
      ],
    },
    {
      id: 'course-walmart',
      title: 'Walmart Course',
      category: 'Marketplaces',
      thumbnail: IMG_MARKETPLACE,
      description:
        'Learn US Walmart Marketplace onboarding, WFS logistics, buy-box pricing automation, and catalog compliance for fast-growing domestic demand.',
      duration: '6 Weeks · 18 Lessons',
      feePkr: 18000,
      feeUsd: 65,
      instructor: 'Velanza Marketplace Faculty',
      demoVideoUrl: 'demo://walmart-intro',
      syllabusPdfUrl: '/api/syllabus/course-walmart',
      featured: false,
      modules: [
        {
          id: 'mod-wm-1',
          title: 'Module 1: Walmart Seller Center & WFS',
          lessons: [
            {
              id: 'les-wm-1',
              title: 'Walmart Marketplace Approval & Compliance (Demo)',
              durationMinutes: 16,
              videoUrl: 'demo://walmart-intro',
              isDemo: true,
              summary: 'LLC documentation, EIN verification, and WFS vs seller-fulfilled performance.',
            },
          ],
        },
      ],
    },
    {
      id: 'course-shopify',
      title: 'Shopify Course',
      category: 'D2C Storefronts',
      thumbnail: IMG_SHOPIFY,
      description:
        'Build high-converting direct-to-consumer Shopify brands from theme architecture and payment gateways to Meta/TikTok ad creatives and retention.',
      duration: '8 Weeks · 22 Lessons',
      feePkr: 16000,
      feeUsd: 58,
      instructor: 'Mr. Samiullah Basra',
      demoVideoUrl: 'demo://shopify-intro',
      syllabusPdfUrl: '/api/syllabus/course-shopify',
      featured: true,
      modules: [
        {
          id: 'mod-shp-1',
          title: 'Module 1: Branded Storefront Engineering',
          lessons: [
            {
              id: 'les-shp-1',
              title: 'High-Converting Product Page Architecture (Demo)',
              durationMinutes: 19,
              videoUrl: 'demo://shopify-intro',
              isDemo: true,
              summary: 'Structuring offer stacks, trust signals, speed optimization, and checkout upsells.',
              resourceName: 'Shopify Launch Blueprint.pdf',
              resourceUrl: '/api/syllabus/course-shopify',
            },
            {
              id: 'les-shp-2',
              title: 'Payment Gateways & Order Fulfillment Automation',
              durationMinutes: 21,
              videoUrl: 'demo://shopify-ops',
              isDemo: false,
              summary: 'Connecting Stripe, Payoneer Checkout, local COD workflows, and supplier sync.',
            },
          ],
        },
      ],
    },
    {
      id: 'course-tiktok',
      title: 'TikTok Shop Course',
      category: 'Social Commerce',
      thumbnail: IMG_SHOPIFY,
      description:
        'Capitalize on creator-led social commerce: TikTok Shop setup, viral short-form hooks, affiliate outreach, and rapid fulfillment metrics.',
      duration: '6 Weeks · 16 Lessons',
      feePkr: 15000,
      feeUsd: 55,
      instructor: 'Velanza Growth Faculty',
      demoVideoUrl: 'demo://tiktok-intro',
      syllabusPdfUrl: '/api/syllabus/course-tiktok',
      featured: true,
      modules: [
        {
          id: 'mod-tt-1',
          title: 'Module 1: TikTok Shop Creator Engine',
          lessons: [
            {
              id: 'les-tt-1',
              title: 'TikTok Shop UK & US Store Launch (Demo)',
              durationMinutes: 17,
              videoUrl: 'demo://tiktok-intro',
              isDemo: true,
              summary: 'Setting up seller verification, affiliate commission tiers, and sample seeding.',
            },
          ],
        },
      ],
    },
    {
      id: 'course-research',
      title: 'Product Research',
      category: 'Core Operations',
      thumbnail: IMG_MARKETPLACE,
      description:
        'Data-backed product hunting across eBay, Amazon, and TikTok Shop using demand velocity, supplier reliability, and net landed profit modeling.',
      duration: '4 Weeks · 12 Lessons',
      feePkr: 10000,
      feeUsd: 38,
      instructor: 'Velanza Research Lead',
      demoVideoUrl: 'demo://research-intro',
      syllabusPdfUrl: '/api/syllabus/course-research',
      featured: false,
      modules: [
        {
          id: 'mod-res-1',
          title: 'Module 1: Winning Product Validation',
          lessons: [
            {
              id: 'les-res-1',
              title: '7-Point Product Validation Matrix (Demo)',
              durationMinutes: 15,
              videoUrl: 'demo://research-intro',
              isDemo: true,
              summary: 'Filtering out IP-risk items, seasonal traps, and low-margin SKUs.',
            },
          ],
        },
      ],
    },
    {
      id: 'course-listing',
      title: 'Product Listing',
      category: 'Core Operations',
      thumbnail: IMG_SHOPIFY,
      description:
        'Write high-ranking marketplace titles, structured bullet points, backend search terms, and clean visual galleries that turn impressions into orders.',
      duration: '4 Weeks · 12 Lessons',
      feePkr: 9000,
      feeUsd: 34,
      instructor: 'Velanza Catalog Team',
      demoVideoUrl: 'demo://listing-intro',
      syllabusPdfUrl: '/api/syllabus/course-listing',
      featured: false,
      modules: [
        {
          id: 'mod-lst-1',
          title: 'Module 1: Search Indexing & Conversion Copy',
          lessons: [
            {
              id: 'les-lst-1',
              title: 'Marketplace Keyword Architecture (Demo)',
              durationMinutes: 14,
              videoUrl: 'demo://listing-intro',
              isDemo: true,
              summary: 'How Cassini, A9, and Walmart search rank listings by keyword placement.',
            },
          ],
        },
      ],
    },
    {
      id: 'course-orders',
      title: 'Order Processing',
      category: 'Core Operations',
      thumbnail: IMG_MARKETPLACE,
      description:
        'Execute zero-error daily order fulfillment, supplier tracking synchronization, returns handling, and carrier dispute prevention for agency clients.',
      duration: '3 Weeks · 10 Lessons',
      feePkr: 8500,
      feeUsd: 32,
      instructor: 'Velanza Operations Desk',
      demoVideoUrl: 'demo://orders-intro',
      syllabusPdfUrl: '/api/syllabus/course-orders',
      featured: false,
      modules: [
        {
          id: 'mod-ord-1',
          title: 'Module 1: Daily Fulfillment SOPs',
          lessons: [
            {
              id: 'les-ord-1',
              title: 'SLA Tracking & Dispute Prevention (Demo)',
              durationMinutes: 15,
              videoUrl: 'demo://orders-intro',
              isDemo: true,
              summary: 'Managing dispatch deadlines, valid tracking uploads, and RMA workflows.',
            },
          ],
        },
      ],
    },
    {
      id: 'course-support',
      title: 'Customer Support',
      category: 'Core Operations',
      thumbnail: IMG_CLASSROOM,
      description:
        'Handle buyer messages, refund negotiations, INR/SNAD cases, and feedback protection professionally to keep international stores 100% healthy.',
      duration: '3 Weeks · 10 Lessons',
      feePkr: 8500,
      feeUsd: 32,
      instructor: 'Velanza CX Lead',
      demoVideoUrl: 'demo://support-intro',
      syllabusPdfUrl: '/api/syllabus/course-support',
      featured: false,
      modules: [
        {
          id: 'mod-sup-1',
          title: 'Module 1: Case Resolution & Account Protection',
          lessons: [
            {
              id: 'les-sup-1',
              title: 'De-escalating Buyer Cases Without Defects (Demo)',
              durationMinutes: 14,
              videoUrl: 'demo://support-intro',
              isDemo: true,
              summary: 'Proven response templates for international buyers across US and UK timezones.',
            },
          ],
        },
      ],
    },
    {
      id: 'course-freelancing',
      title: 'Freelancing (Fiverr & Upwork)',
      category: 'Career & Agency',
      thumbnail: IMG_SHOPIFY,
      description:
        'Package your eCommerce skills into high-value monthly retainers on Fiverr and Upwork with winning proposals, portfolio proof, and client closing calls.',
      duration: '6 Weeks · 18 Lessons',
      feePkr: 12000,
      feeUsd: 45,
      instructor: 'Mr. Samiullah Basra',
      demoVideoUrl: 'demo://freelancing-intro',
      syllabusPdfUrl: '/api/syllabus/course-freelancing',
      featured: true,
      modules: [
        {
          id: 'mod-frl-1',
          title: 'Module 1: High-Ticket Client Acquisition',
          lessons: [
            {
              id: 'les-frl-1',
              title: 'Positioning eCommerce VA & Store Management Offers (Demo)',
              durationMinutes: 20,
              videoUrl: 'demo://freelancing-intro',
              isDemo: true,
              summary: 'Turning marketplace skills into $500–$1,500/month recurring client retainers.',
            },
          ],
        },
      ],
    },
  ];

  const services: ServiceItem[] = [
    {
      id: 'srv-ebay-mgmt',
      title: 'eBay Account Management',
      category: 'Full-Service Management',
      description: 'End-to-end daily store operation led by dedicated Velanza account managers to maintain Top Rated metrics and consistent net profit.',
      benefits: ['Daily inventory & pricing sync', 'Account health & defect protection', 'Weekly revenue & margin reports'],
      deliveryModel: 'Dedicated Manager + Client Portal Access',
    },
    {
      id: 'srv-store-setup',
      title: 'Store Setup',
      category: 'Launch & Compliance',
      description: 'Compliant store formation, shipping policies, tax templates, payment linking, and branded storefront configuration.',
      benefits: ['Policy-compliant account setup', 'Configured shipping & return rules', 'Ready-to-sell catalog foundation'],
      deliveryModel: '7-Day Turnaround Launch Package',
    },
    {
      id: 'srv-product-research',
      title: 'Product Research',
      category: 'Merchandising',
      description: 'Deep quantitative market analysis identifying profitable categories with verified buyer demand and sustainable margins.',
      benefits: ['Competitor gap benchmarking', 'Landed cost & fee modeling', 'Supplier verification sheet'],
      deliveryModel: 'Weekly Curated Product Dossiers',
    },
    {
      id: 'srv-product-hunting',
      title: 'Product Hunting',
      category: 'Merchandising',
      description: 'Rapid winning-SKU discovery tailored to your budget, target marketplace, and supplier fulfillment model.',
      benefits: ['High sell-through velocity SKUs', 'IP & brand restriction screening', 'Ready-to-list supplier links'],
      deliveryModel: 'Custom Batch Delivery',
    },
    {
      id: 'srv-product-listing',
      title: 'Product Listing',
      category: 'Catalog Operations',
      description: 'Accurate, high-volume SKU publishing with complete item specifics, variations, and clean product imagery.',
      benefits: ['100% populated item specifics', 'Clean variation & pricing tiers', 'Zero policy-violation keywords'],
      deliveryModel: 'Daily Catalog Publishing',
    },
    {
      id: 'srv-listing-opt',
      title: 'Listing Optimization',
      category: 'Catalog Operations',
      description: 'Search ranking overhaul for existing catalogs—rewriting titles, upgrading imagery hierarchy, and fixing indexing gaps.',
      benefits: ['Higher organic search impressions', 'Improved click-through & conversion', 'Competitor keyword parity'],
      deliveryModel: 'Audit + Full Catalog Rewrite',
    },
    {
      id: 'srv-order-proc',
      title: 'Order Processing',
      category: 'Fulfillment',
      description: 'Same-day order routing, valid tracking verification, and supplier coordination so shipments stay on schedule.',
      benefits: ['On-time tracking upload guarantee', 'Automated exception escalation', 'Reduced cancellation rates'],
      deliveryModel: '7-Day Operations Desk',
    },
    {
      id: 'srv-customer-support',
      title: 'Customer Support',
      category: 'Buyer Experience',
      description: 'Prompt, courteous buyer inbox management, case mediation, and positive feedback retention across global time zones.',
      benefits: ['Under 4-hour response SLA', 'INR & return dispute resolution', 'Protected seller feedback score'],
      deliveryModel: 'Dedicated CX Specialist',
    },
    {
      id: 'srv-store-growth',
      title: 'Store Growth',
      category: 'Scaling',
      description: 'Structured campaign execution combining promoted listings, bundle offers, and repeat-buyer promotions.',
      benefits: ['Data-backed ad ROAS optimization', 'Winning SKU catalog expansion', 'Bi-weekly growth roadmap reviews'],
      deliveryModel: 'Monthly Retainer',
    },
    {
      id: 'srv-store-scaling',
      title: 'Store Scaling',
      category: 'Scaling',
      description: 'Multi-marketplace expansion and limit elevation for established brands moving from single-store revenue to global channels.',
      benefits: ['Cross-channel eBay/Amazon/Walmart sync', 'Selling limit increase strategy', 'Executive KPI dashboard tracking'],
      deliveryModel: 'Enterprise Growth Partner',
    },
  ];

  const users: UserRecord[] = [
    {
      id: 'usr-admin-1',
      name: 'Mr. Samiullah Basra',
      email: 'admin@velanza.co',
      phone: '0330-3677175',
      role: 'admin',
      status: 'active',
      createdAt: '2026-01-01T00:00:00Z',
      passwordHash: adminCreds.hash,
      passwordSalt: adminCreds.salt,
    },
    {
      id: 'usr-student-1',
      name: 'Ayesha Siddiqui',
      email: 'student@velanza.co',
      phone: '+92-301-5541290',
      role: 'student',
      status: 'active',
      createdAt: '2026-09-12T09:30:00Z',
      passwordHash: studentCreds.hash,
      passwordSalt: studentCreds.salt,
      attendancePercent: 94,
      certificateIssued: true,
      certificateCode: 'VLZ-USR1-EBAY-2026',
    },
    {
      id: 'usr-client-1',
      name: 'Tariq Mahmood (Apex Home Goods)',
      email: 'client@velanza.co',
      phone: '+44-7700-900412',
      role: 'client',
      status: 'active',
      createdAt: '2026-08-05T14:00:00Z',
      passwordHash: clientCreds.hash,
      passwordSalt: clientCreds.salt,
    },
  ];

  const enrollments: Enrollment[] = [
    {
      id: 'enr-1',
      userId: 'usr-student-1',
      studentName: 'Ayesha Siddiqui',
      studentEmail: 'student@velanza.co',
      studentPhone: '+92-301-5541290',
      courseId: 'course-ebay',
      courseTitle: 'eBay Complete Course',
      amountPkr: 15000,
      paymentMethod: 'Easypaisa',
      transactionRef: 'EP-8841209',
      screenshotUrl: IMG_MARKETPLACE,
      status: 'approved',
      submittedAt: '2026-09-12T10:00:00Z',
      verifiedAt: '2026-09-12T11:15:00Z',
      notes: 'Verified by Admin Desk',
    },
    {
      id: 'enr-2',
      userId: 'usr-student-1',
      studentName: 'Ayesha Siddiqui',
      studentEmail: 'student@velanza.co',
      studentPhone: '+92-301-5541290',
      courseId: 'course-shopify',
      courseTitle: 'Shopify Course',
      amountPkr: 16000,
      paymentMethod: 'Easypaisa',
      transactionRef: 'EP-9023411',
      screenshotUrl: IMG_SHOPIFY,
      status: 'approved',
      submittedAt: '2026-10-03T13:20:00Z',
      verifiedAt: '2026-10-03T14:00:00Z',
    },
    {
      id: 'enr-3',
      userId: 'usr-student-pending',
      studentName: 'Hamza Raza',
      studentEmail: 'hamza.raza@example.com',
      studentPhone: '+92-321-8891204',
      courseId: 'course-amazon',
      courseTitle: 'Amazon Course',
      amountPkr: 22000,
      paymentMethod: 'Easypaisa',
      transactionRef: 'EP-9918442',
      screenshotUrl: IMG_MARKETPLACE,
      status: 'pending',
      submittedAt: '2026-11-17T16:40:00Z',
      notes: 'Awaiting Easypaisa screenshot verification',
    },
  ];

  const studentProgress: Record<string, StudentProgressRecord> = {
    'usr-student-1': {
      userId: 'usr-student-1',
      completedLessonIds: ['les-ebay-1', 'les-ebay-2'],
      lastWatchedLessonId: 'les-ebay-3',
      lastWatchedCourseId: 'course-ebay',
      lastPositionSeconds: 420,
      notesByLesson: {
        'les-ebay-1': 'Link Payoneer EUR/GBP receiving accounts before requesting limit bump.',
        'les-ebay-3': 'Filter Zik Analytics results by 30-day sold >= 12 and active competition <= 8.',
      },
    },
  };

  const clients: ClientAccount[] = [
    {
      id: 'cli-1',
      userId: 'usr-client-1',
      businessName: 'Apex Home Goods UK & US',
      marketplace: 'eBay UK · Amazon US',
      accountStatus: 'Healthy & Active',
      monthlyFeeUsd: 650,
      revenueTotalUsd: 48920,
      pendingWork: [
        {
          id: 'pw-1',
          title: 'Publish 45 Q4 Kitchen Organizer SKUs with Cassini SEO',
          status: 'in_progress',
          dueDate: '2026-11-22',
          assignee: 'Velanza Catalog Desk',
        },
        {
          id: 'pw-2',
          title: 'Promoted Listings Ad Bid Optimization Audit',
          status: 'pending',
          dueDate: '2026-11-25',
          assignee: 'Mr. Samiullah Basra',
        },
      ],
      completedWork: [
        {
          id: 'cw-1',
          title: 'eBay UK Seller Limit Elevation (250 -> 1,500 items)',
          status: 'completed',
          dueDate: '2026-11-05',
          assignee: 'Mr. Samiullah Basra',
        },
        {
          id: 'cw-2',
          title: 'Top 80 Existing Listings Title & Spec Overhaul',
          status: 'completed',
          dueDate: '2026-11-11',
          assignee: 'Velanza Catalog Desk',
        },
        {
          id: 'cw-3',
          title: '100% Tracking Validation Sync Setup',
          status: 'completed',
          dueDate: '2026-11-14',
          assignee: 'Operations Team',
        },
      ],
      orders: [
        {
          id: 'ord-101',
          orderNumber: 'EB-20491',
          marketplace: 'eBay UK',
          productName: 'Minimalist Ceramic Pour-Over Set',
          amountUsd: 64.0,
          status: 'delivered',
          date: '2026-11-16',
        },
        {
          id: 'ord-102',
          orderNumber: 'EB-20498',
          marketplace: 'eBay UK',
          productName: 'Bamboo Drawer Organizer (6-Pack)',
          amountUsd: 42.5,
          status: 'shipped',
          date: '2026-11-17',
        },
        {
          id: 'ord-103',
          orderNumber: 'AMZ-88312',
          marketplace: 'Amazon US',
          productName: 'Stainless Spice Rack Tiered Stand',
          amountUsd: 89.0,
          status: 'processing',
          date: '2026-11-18',
        },
      ],
      salesHistory: [
        { month: 'Jul', revenueUsd: 6420, ordersCount: 118 },
        { month: 'Aug', revenueUsd: 7850, ordersCount: 142 },
        { month: 'Sep', revenueUsd: 9640, ordersCount: 176 },
        { month: 'Oct', revenueUsd: 11890, ordersCount: 215 },
        { month: 'Nov', revenueUsd: 13120, ordersCount: 238 },
      ],
      timeline: [
        {
          id: 'tl-1',
          date: '2026-11-18',
          title: 'Weekly Margin & Sales Report Uploaded',
          detail: 'Net margin held at 24.8% across 238 November orders.',
        },
        {
          id: 'tl-2',
          date: '2026-11-11',
          title: 'Catalog Optimization Milestone Completed',
          detail: '80 core listings updated; organic impressions rose 34% week-over-week.',
        },
        {
          id: 'tl-3',
          date: '2026-11-05',
          title: 'Selling Limit Approved to 1,500 Monthly Items',
          detail: 'Zero defects recorded over 90-day evaluation window.',
        },
      ],
      files: [
        {
          id: 'doc-1',
          name: 'November 2026 Store Performance & Margin Report.pdf',
          category: 'Sales Report',
          url: '/api/syllabus/client-report-nov',
          uploadedAt: '2026-11-18',
        },
        {
          id: 'doc-2',
          name: 'Q4 Winning Product Research Shortlist.pdf',
          category: 'Product Research',
          url: '/api/syllabus/client-research-q4',
          uploadedAt: '2026-11-12',
        },
      ],
      notifications: [
        {
          id: 'not-1',
          message: 'November Mid-Month Sales Report is ready in your File Downloads.',
          date: '2026-11-18',
          read: false,
        },
        {
          id: 'not-2',
          message: 'eBay UK Top Rated Seller status maintained at 99.8% positive feedback.',
          date: '2026-11-15',
          read: true,
        },
      ],
      internalNotes: 'Priority UK/US scaling client. Focus on home storage Q4 seasonal SKUs.',
    },
  ];

  const supportRequests: SupportRequest[] = [
    {
      id: 'sup-1',
      clientId: 'cli-1',
      clientName: 'Tariq Mahmood (Apex Home Goods)',
      subject: 'Expand catalog into eBay Germany (DE)',
      message: 'We would like to discuss translating our top 30 SKUs for eBay DE next month.',
      status: 'open',
      createdAt: '2026-11-16T11:00:00Z',
    },
  ];

  const testimonials: Testimonial[] = [
    {
      id: 'test-1',
      name: 'Ayesha Siddiqui',
      role: 'eBay & Shopify Graduate',
      organization: 'Freelance Store Manager · Lahore',
      type: 'student',
      rating: 5,
      outcome: 'Signed 3 UK eBay retainers within 60 days',
      quote:
        'Before Velanza.co I only knew theory. Working through Mr. Samiullah Basra’s live order and listing modules gave me the confidence to manage three UK seller accounts independently.',
    },
    {
      id: 'test-2',
      name: 'Tariq Mahmood',
      role: 'Managing Director',
      organization: 'Apex Home Goods · Manchester, UK',
      type: 'client',
      rating: 5,
      outcome: '+104% monthly store revenue in 4 months',
      quote:
        'Velanza.co took over our product hunting, listing SEO, and customer inbox. Seeing real-time orders and completed tasks in our Client Portal gives us total operational clarity.',
    },
    {
      id: 'test-3',
      name: 'Usman Farooq',
      role: 'Amazon & Freelancing Student',
      organization: 'Upwork Top Rated Specialist · Islamabad',
      type: 'student',
      rating: 5,
      outcome: 'Earned $1,850/month managing catalog operations',
      quote:
        'The combination of practical Keepa research and Fiverr/Upwork positioning helped me replace my full-time commute with stable international agency clients.',
    },
  ];

  const blogPosts: BlogPost[] = [
    {
      id: 'blog-1',
      title: 'How to Build a Defect-Free eBay Account From Day One in 2026',
      category: 'eBay',
      author: 'Mr. Samiullah Basra',
      publishedAt: 'November 12, 2026',
      readTime: '6 min read',
      thumbnail: IMG_MARKETPLACE,
      excerpt:
        'Learn the exact shipping, tracking, and supplier verification rules international sellers use to stay Top Rated and scale limits smoothly.',
      content:
        'International eBay growth depends far more on operational discipline than luck. Start by separating supplier dispatch lead times from your handling time buffer, verify every tracking number carrier-side before upload, and organize item specifics so Cassini search indexes every variation accurately. Inside Velanza.co Working & Learning Studio, students practice these workflows on real checklists before touching live client accounts.',
    },
    {
      id: 'blog-2',
      title: 'Amazon FBA Wholesale vs Shopify D2C: Choosing Your Capital Path',
      category: 'Amazon',
      author: 'Velanza Research Desk',
      publishedAt: 'November 05, 2026',
      readTime: '5 min read',
      thumbnail: IMG_SHOPIFY,
      excerpt:
        'A practical comparison of inventory turnover, creative testing budgets, and margin stability between marketplace wholesale and branded storefronts.',
      content:
        'Choosing between Amazon Wholesale and Shopify D2C comes down to whether you prefer existing marketplace demand or brand-owned traffic. Amazon rewards analytical supplier sourcing and Buy Box discipline, while Shopify rewards creative hooks, conversion rate optimization, and repeat email retention. Many Velanza.co agency clients combine both channels once cash flow stabilizes.',
    },
    {
      id: 'blog-3',
      title: 'Turning Marketplace Operations Skills Into Recurring Freelance Retainers',
      category: 'Freelancing',
      author: 'Mr. Samiullah Basra',
      publishedAt: 'October 28, 2026',
      readTime: '4 min read',
      thumbnail: IMG_CLASSROOM,
      excerpt:
        'Why global store owners prefer hiring trained specialists for listing optimization, order processing, and CX rather than one-off gigs.',
      content:
        'Store owners rarely want a single product upload—they want peace of mind that orders ship on time, buyer messages receive courteous replies, and listings convert consistently. Packaging your Fiverr and Upwork profile around measurable operational outcomes positions you as a long-term partner instead of a commodity freelancer.',
    },
  ];

  const gallery: GalleryItem[] = [
    {
      id: 'gal-1',
      title: 'Velanza.co Agency & Operations Floor',
      category: 'Office Photos',
      imageUrl: IMG_STUDIO,
      caption: 'Account managers and mentors collaborating on international client portfolios.',
      date: 'November 2026',
    },
    {
      id: 'gal-2',
      title: 'Live eCommerce Strategy Workshop',
      category: 'Classroom Photos',
      imageUrl: IMG_CLASSROOM,
      caption: 'Practical cohort session reviewing live marketplace product research metrics.',
      date: 'October 2026',
    },
    {
      id: 'gal-3',
      title: 'Marketplace Catalog & Fulfillment Lab',
      category: 'Student Activities',
      imageUrl: IMG_MARKETPLACE,
      caption: 'Hands-on fulfillment and barcode label verification training station.',
      date: 'October 2026',
    },
    {
      id: 'gal-4',
      title: 'Storefront Design & Freelance Portfolio Sprint',
      category: 'Events',
      imageUrl: IMG_SHOPIFY,
      caption: 'Students building verified Shopify & Upwork portfolio case studies.',
      date: 'September 2026',
    },
    {
      id: 'gal-5',
      title: 'Certified Graduate Recognition',
      category: 'Certificates',
      imageUrl: IMG_FOUNDER,
      caption: 'Mr. Samiullah Basra mentoring graduating eCommerce specialists.',
      date: 'September 2026',
    },
  ];

  const faqs: FaqItem[] = [
    {
      id: 'faq-1',
      category: 'Courses & Enrollment',
      question: 'How do I enroll and verify my Easypaisa payment?',
      answer:
        'Select your course, click Enroll Now, send the course fee to the displayed Easypaisa number (0330-3677175), upload your payment screenshot with the transaction ID, and submit. Once Admin verifies your screenshot, your Video Learning Portal unlocks automatically.',
    },
    {
      id: 'faq-2',
      category: 'Learning Format',
      question: 'Are the courses suitable for complete beginners worldwide?',
      answer:
        'Yes. Every course starts from foundational marketplace rules and progresses step-by-step into live product research, listing SEO, order processing, and client acquisition—accessible globally from any device.',
    },
    {
      id: 'faq-3',
      category: 'Agency Services',
      question: 'How does the Client Dashboard work if I hire Velanza.co for my store?',
      answer:
        'Each client receives private, encrypted login credentials. Inside your portal you see only your store status, pending and completed agency tasks, order logs, monthly sales charts, downloadable PDF reports, and direct support requests.',
    },
    {
      id: 'faq-4',
      category: 'Certification',
      question: 'Do graduates receive verifiable certificates?',
      answer:
        'Yes. Students who complete course modules and attendance milestones receive a verifiable Velanza.co certificate code managed through our Admin Portal and ready for QR verification.',
    },
  ];

  const contactInquiries: ContactInquiry[] = [];

  return {
    settings,
    users,
    courses,
    services,
    enrollments,
    studentProgress,
    clients,
    supportRequests,
    testimonials,
    blogPosts,
    gallery,
    faqs,
    contactInquiries,
  };
}
