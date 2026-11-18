import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCourseProgress,
  summarizeClientMetrics,
  filterCatalogItems,
  validateEnrollmentForm,
  validateContactForm,
  computeFinancialSummary,
  getCertificateVerificationCode,
} from './velanzaLogic';

test('calculateCourseProgress computes completion percentage accurately', () => {
  const summary = calculateCourseProgress(['l1', 'l3', 'other'], ['l1', 'l2', 'l3', 'l4']);
  assert.equal(summary.completedCount, 2);
  assert.equal(summary.totalCount, 4);
  assert.equal(summary.percent, 50);

  const empty = calculateCourseProgress([], []);
  assert.equal(empty.percent, 0);
});

test('summarizeClientMetrics aggregates pending/completed work and order revenue', () => {
  const result = summarizeClientMetrics(
    [{ id: 'w1', title: 'Listing audit', status: 'pending', dueDate: '2026-12-01', assignee: 'Ali' }],
    [
      { id: 'w2', title: 'Store setup', status: 'completed', dueDate: '2026-11-10', assignee: 'Sami' },
      { id: 'w3', title: 'Keyword sheet', status: 'completed', dueDate: '2026-11-12', assignee: 'Sami' },
    ],
    [
      { id: 'o1', orderNumber: 'EB-101', marketplace: 'eBay', productName: 'Ceramic Set', amountUsd: 120.5, status: 'delivered', date: '2026-11-15' },
      { id: 'o2', orderNumber: 'EB-102', marketplace: 'eBay', productName: 'Desk Lamp', amountUsd: 79.5, status: 'shipped', date: '2026-11-16' },
    ],
  );
  assert.equal(result.pendingWorkCount, 1);
  assert.equal(result.completedWorkCount, 2);
  assert.equal(result.completionRatePercent, 67);
  assert.equal(result.totalOrdersCount, 2);
  assert.equal(result.ordersRevenueUsd, 200);
});

test('filterCatalogItems filters by search query and category', () => {
  const items = [
    { title: 'eBay Complete Course', category: 'Marketplaces', description: 'Dropshipping and private label' },
    { title: 'Shopify Course', category: 'D2C', description: 'Store design and conversion' },
  ];
  const filtered = filterCatalogItems(items, 'ebay', 'all', (i) => [i.title, i.description]);
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].title, 'eBay Complete Course');

  const categoryOnly = filterCatalogItems(items, '', 'D2C', (i) => [i.title]);
  assert.equal(categoryOnly.length, 1);
  assert.equal(categoryOnly[0].title, 'Shopify Course');
});

test('validateEnrollmentForm catches invalid inputs and spam honeypot', () => {
  const spam = validateEnrollmentForm({
    studentName: 'Bot',
    studentEmail: 'bot@example.com',
    studentPhone: '03301234567',
    courseId: 'ebay',
    transactionRef: 'TX12345',
    honeypot: 'http://spam.link',
  });
  assert.equal(spam.valid, false);

  const badEmail = validateEnrollmentForm({
    studentName: 'Ayesha Khan',
    studentEmail: 'not-an-email',
    studentPhone: '03301234567',
    courseId: 'ebay',
    transactionRef: 'TX12345',
  });
  assert.equal(badEmail.valid, false);

  const valid = validateEnrollmentForm({
    studentName: 'Ayesha Khan',
    studentEmail: 'ayesha@example.com',
    studentPhone: '03301234567',
    courseId: 'ebay',
    transactionRef: 'EP-994821',
  });
  assert.equal(valid.valid, true);
});

test('validateContactForm validates message length and email', () => {
  assert.equal(
    validateContactForm({ name: 'Bilal', email: 'bilal@test.com', message: 'Hi' }).valid,
    false,
  );
  assert.equal(
    validateContactForm({
      name: 'Bilal',
      email: 'bilal@test.com',
      message: 'I want to hire Velanza.co for eBay account management.',
    }).valid,
    true,
  );
});

test('computeFinancialSummary totals approved vs pending PKR revenue', () => {
  const summary = computeFinancialSummary([
    {
      id: '1', userId: 'u1', studentName: 'A', studentEmail: 'a@a.com', studentPhone: '1234567',
      courseId: 'c1', courseTitle: 'eBay', amountPkr: 15000, paymentMethod: 'Easypaisa',
      transactionRef: 'T1', screenshotUrl: '', status: 'approved', submittedAt: '2026-11-01',
    },
    {
      id: '2', userId: 'u2', studentName: 'B', studentEmail: 'b@b.com', studentPhone: '1234567',
      courseId: 'c2', courseTitle: 'Amazon', amountPkr: 20000, paymentMethod: 'Easypaisa',
      transactionRef: 'T2', screenshotUrl: '', status: 'pending', submittedAt: '2026-11-02',
    },
  ]);
  assert.equal(summary.verifiedRevenuePkr, 15000);
  assert.equal(summary.pendingRevenuePkr, 20000);
  assert.equal(summary.approvedCount, 1);
  assert.equal(summary.pendingCount, 1);
});

test('getCertificateVerificationCode generates deterministic verifiable ID', () => {
  assert.equal(getCertificateVerificationCode('usr_student_1', 'course-ebay'), 'VLZ-USRSTU-COURSE-2026');
});
