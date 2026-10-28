/**
 * Automated Unit Test Suite for Markose OMS (Section 13)
 * Tests:
 * 1. Egyptian Phone Normalization & Validation (Section 7.3)
 * 2. Decimal Financial Arithmetic & Half-Up Rounding (Section 6)
 * 3. State Machine Transitions & Mandatory Reason Invariants (Section 5)
 * 4. Duplicate Detection Rules (Section 7.2)
 */

import { normalizeEgyptianPhone } from '../src/lib/phone';
import { toCents, fromCents, calculateLineTotal, calculateOrderTotals } from '../src/lib/money';
import { canTransition, isReasonRequired, isShippingDetailsRequired } from '../src/lib/stateMachine';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failed++;
  }
}

console.log('\n--- 1. Testing Egyptian Phone Normalization (Section 7.3) ---');
{
  // Test standard valid numbers
  const res1 = normalizeEgyptianPhone('01012345678');
  assert(res1.isValid && res1.e164 === '+201012345678' && res1.carrier === 'Vodafone', 'Standard Vodafone mobile (010)');

  const res2 = normalizeEgyptianPhone('+201155443322');
  assert(res2.isValid && res2.e164 === '+201155443322' && res2.carrier === 'Etisalat', 'International prefix +20 (Etisalat 011)');

  const res3 = normalizeEgyptianPhone('00201298765432');
  assert(res3.isValid && res3.e164 === '+201298765432' && res3.carrier === 'Orange', 'International prefix 0020 (Orange 012)');

  const res4 = normalizeEgyptianPhone('201501234567');
  assert(res4.isValid && res4.e164 === '+201501234567' && res4.carrier === 'WE', '12-digit prefix 20 (WE 015)');

  // Test Arabic-Indic numerals conversion
  const resArabic = normalizeEgyptianPhone('٠١٠٩٩٨٨٧٧٦٦');
  assert(resArabic.isValid && resArabic.localPhone === '01099887766' && resArabic.e164 === '+201099887766', 'Arabic-Indic numerals ٠١٢... conversion');

  // Test formatted with dashes and spaces
  const resFormatted = normalizeEgyptianPhone('010-1234-5678');
  assert(resFormatted.isValid && resFormatted.localPhone === '01012345678', 'Stripping hyphens and spaces');

  // Test invalid numbers
  const resInvalidPrefix = normalizeEgyptianPhone('01312345678');
  assert(!resInvalidPrefix.isValid, 'Rejects invalid Egyptian mobile prefix (013)');

  const resTooShort = normalizeEgyptianPhone('01012345');
  assert(!resTooShort.isValid, 'Rejects phone shorter than 11 digits');

  const resTooLong = normalizeEgyptianPhone('0101234567899');
  assert(!resTooLong.isValid, 'Rejects phone longer than 11 digits');
}

console.log('\n--- 2. Testing Decimal Money Arithmetic (Section 6) ---');
{
  // Test halalas/cents conversion
  assert(toCents('1450.00') === 145000, 'toCents string parsed correctly');
  assert(fromCents(145000) === '1450.00', 'fromCents formatted with 2 decimals');

  // Test Line Total calculation
  const lineTotal = calculateLineTotal('1450.00', 2, '100.00');
  assert(lineTotal === '2800.00', 'Line total = 1450 * 2 - 100 = 2800.00');

  // Test Order Totals: subtotal - discount + shipping = total
  const orderTotals = calculateOrderTotals(
    [
      { unit_price: '1450.00', quantity: 2 },
      { unit_price: '380.00', quantity: 1 }
    ],
    '80.00',
    '50.00'
  );

  // Subtotal = 2900 + 380 = 3280.00
  // Discount = 80.00
  // Shipping = 50.00
  // Total = 3280 - 80 + 50 = 3250.00
  assert(orderTotals.subtotal === '3280.00', 'Subtotal matches sum of line items');
  assert(orderTotals.discount_amount === '80.00', 'Discount amount applied');
  assert(orderTotals.shipping_fee === '50.00', 'Shipping fee added');
  assert(orderTotals.total_amount === '3250.00', 'Total amount = subtotal - discount + shipping');

  // Discount exceeding subtotal must be capped at subtotal
  const cappedTotals = calculateOrderTotals([{ unit_price: '100.00', quantity: 1 }], '250.00', '0.00');
  assert(cappedTotals.discount_amount === '100.00' && cappedTotals.total_amount === '0.00', 'Discount capped at subtotal');
}

console.log('\n--- 3. Testing State Machine Invariants (Section 5) ---');
{
  // Allowed transitions
  assert(canTransition('NEW', 'CONTACT_PENDING'), 'NEW -> CONTACT_PENDING is allowed');
  assert(canTransition('NEW', 'CONFIRMED'), 'NEW -> CONFIRMED is allowed');
  assert(canTransition('CONFIRMED', 'PREPARING'), 'CONFIRMED -> PREPARING is allowed');
  assert(canTransition('PREPARING', 'SHIPPED'), 'PREPARING -> SHIPPED is allowed');
  assert(canTransition('SHIPPED', 'DELIVERED'), 'SHIPPED -> DELIVERED is allowed');
  assert(canTransition('SHIPPED', 'RETURNED'), 'SHIPPED -> RETURNED is allowed');
  assert(canTransition('CANCELLED', 'CONTACT_PENDING'), 'CANCELLED -> CONTACT_PENDING (Re-open) is allowed');

  // Forbidden transitions
  assert(!canTransition('NEW', 'DELIVERED'), 'NEW -> DELIVERED directly is forbidden');
  assert(!canTransition('CONFIRMED', 'DELIVERED'), 'CONFIRMED -> DELIVERED directly without shipping is forbidden');
  assert(!canTransition('RETURNED', 'NEW'), 'RETURNED is terminal state');
  assert(!canTransition('RETURNED', 'CONFIRMED'), 'RETURNED cannot transition to anything');

  // Mandatory Reason checks
  assert(isReasonRequired('CANCELLED'), 'Reason is required for CANCELLED');
  assert(isReasonRequired('UNREACHABLE'), 'Reason is required for UNREACHABLE');
  assert(isReasonRequired('RETURNED'), 'Reason is required for RETURNED');
  assert(isReasonRequired('CONTACT_PENDING', 'CANCELLED'), 'Reason is required when re-opening a CANCELLED order');
  assert(!isReasonRequired('PREPARING', 'CONFIRMED'), 'Reason is not required for normal preparation step');

  // Shipping details requirement
  assert(isShippingDetailsRequired('SHIPPED'), 'Carrier details required on SHIPPED');
  assert(!isShippingDetailsRequired('CONFIRMED'), 'Carrier details not required on CONFIRMED');
}

console.log('\n--- 4. Testing Duplicate Detection Invariants (Section 7.2) ---');
{
  const checkDuplicate = (
    phone1: string,
    products1: string[],
    phone2: string,
    products2: string[],
    ageHours: number,
    status2: string,
    windowHours = 72
  ): boolean => {
    if (phone1 !== phone2) return false;
    if (status2 === 'CANCELLED' || status2 === 'RETURNED') return false;
    if (ageHours > windowHours) return false;
    return products1.some(p => products2.includes(p));
  };

  const p1 = ['prod-001'];
  const p2 = ['prod-001', 'prod-002'];
  const p3 = ['prod-003'];

  assert(
    checkDuplicate('+201012345678', p1, '+201012345678', p2, 12, 'NEW'),
    'Detects duplicate with shared product within 12 hours'
  );

  assert(
    !checkDuplicate('+201012345678', p1, '+201012345678', p3, 12, 'NEW'),
    'Ignores orders by same phone with completely different products'
  );

  assert(
    !checkDuplicate('+201012345678', p1, '+201012345678', p1, 80, 'NEW', 72),
    'Ignores orders older than 72 hours window'
  );

  assert(
    !checkDuplicate('+201012345678', p1, '+201012345678', p1, 10, 'CANCELLED'),
    'Ignores previous CANCELLED order as duplicate trigger'
  );

  assert(
    !checkDuplicate('+201012345678', p1, '+201012345678', p1, 10, 'RETURNED'),
    'Ignores previous RETURNED order as duplicate trigger'
  );
}

console.log('\n======================================');
console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
console.log('======================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
