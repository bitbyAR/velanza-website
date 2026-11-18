import type { ClientOrder, ClientWorkItem, Enrollment } from '../types';

export interface CourseProgressSummary {
  completedCount: number;
  totalCount: number;
  percent: number;
}

export function calculateCourseProgress(
  completedLessonIds: string[],
  courseLessonIds: string[],
): CourseProgressSummary {
  const totalCount = courseLessonIds.length;
  if (totalCount === 0) {
    return { completedCount: 0, totalCount: 0, percent: 0 };
  }
  const completedSet = new Set(completedLessonIds);
  const completedCount = courseLessonIds.filter((id) => completedSet.has(id)).length;
  const percent = Math.round((completedCount / totalCount) * 100);
  return { completedCount, totalCount, percent };
}

export interface ClientMetricsSummary {
  pendingWorkCount: number;
  completedWorkCount: number;
  completionRatePercent: number;
  totalOrdersCount: number;
  ordersRevenueUsd: number;
}

export function summarizeClientMetrics(
  pendingWork: ClientWorkItem[],
  completedWork: ClientWorkItem[],
  orders: ClientOrder[],
): ClientMetricsSummary {
  const pendingWorkCount = pendingWork.length;
  const completedWorkCount = completedWork.length;
  const totalWork = pendingWorkCount + completedWorkCount;
  const completionRatePercent =
    totalWork === 0 ? 100 : Math.round((completedWorkCount / totalWork) * 100);
  const totalOrdersCount = orders.length;
  const ordersRevenueUsd = orders.reduce((sum, order) => sum + Number(order.amountUsd || 0), 0);

  return {
    pendingWorkCount,
    completedWorkCount,
    completionRatePercent,
    totalOrdersCount,
    ordersRevenueUsd: Math.round(ordersRevenueUsd * 100) / 100,
  };
}

export function filterCatalogItems<T extends { category?: string }>(
  items: T[],
  query: string,
  category: string,
  fields: (item: T) => string[],
): T[] {
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedCategory = category.trim().toLowerCase();

  return items.filter((item) => {
    const categoryMatch =
      !normalizedCategory ||
      normalizedCategory === 'all' ||
      (item.category || '').toLowerCase() === normalizedCategory;

    if (!categoryMatch) return false;
    if (!normalizedQuery) return true;

    return fields(item).some((value) =>
      String(value || '').toLowerCase().includes(normalizedQuery),
    );
  });
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validateEnrollmentForm(input: {
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  courseId: string;
  transactionRef: string;
  honeypot?: string;
}): ValidationResult {
  if (input.honeypot && input.honeypot.trim().length > 0) {
    return { valid: false, error: 'Submission rejected by spam protection.' };
  }
  if (!input.studentName || input.studentName.trim().length < 2) {
    return { valid: false, error: 'Please enter your full name.' };
  }
  if (!validateEmailFormat(input.studentEmail)) {
    return { valid: false, error: 'Please enter a valid email address.' };
  }
  if (!input.studentPhone || input.studentPhone.trim().length < 7) {
    return { valid: false, error: 'Please enter a valid WhatsApp or phone number.' };
  }
  if (!input.courseId) {
    return { valid: false, error: 'Please select a course to enroll.' };
  }
  if (!input.transactionRef || input.transactionRef.trim().length < 4) {
    return { valid: false, error: 'Please enter your Easypaisa transaction ID or reference.' };
  }
  return { valid: true };
}

export function validateContactForm(input: {
  name: string;
  email: string;
  message: string;
  honeypot?: string;
}): ValidationResult {
  if (input.honeypot && input.honeypot.trim().length > 0) {
    return { valid: false, error: 'Submission rejected by spam protection.' };
  }
  if (!input.name || input.name.trim().length < 2) {
    return { valid: false, error: 'Please enter your name.' };
  }
  if (!validateEmailFormat(input.email)) {
    return { valid: false, error: 'Please enter a valid email address.' };
  }
  if (!input.message || input.message.trim().length < 10) {
    return { valid: false, error: 'Please write a message of at least 10 characters.' };
  }
  return { valid: true };
}

export interface FinancialSummary {
  verifiedRevenuePkr: number;
  pendingRevenuePkr: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
}

export function computeFinancialSummary(enrollments: Enrollment[]): FinancialSummary {
  let verifiedRevenuePkr = 0;
  let pendingRevenuePkr = 0;
  let approvedCount = 0;
  let pendingCount = 0;
  let rejectedCount = 0;

  for (const item of enrollments) {
    const amount = Number(item.amountPkr || 0);
    if (item.status === 'approved') {
      verifiedRevenuePkr += amount;
      approvedCount += 1;
    } else if (item.status === 'pending') {
      pendingRevenuePkr += amount;
      pendingCount += 1;
    } else {
      rejectedCount += 1;
    }
  }

  return {
    verifiedRevenuePkr,
    pendingRevenuePkr,
    approvedCount,
    pendingCount,
    rejectedCount,
  };
}

export function getCertificateVerificationCode(userId: string, courseId: string): string {
  const cleanUser = userId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6) || 'STU';
  const cleanCourse = courseId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6) || 'CRS';
  return `VLZ-${cleanUser}-${cleanCourse}-2026`;
}
