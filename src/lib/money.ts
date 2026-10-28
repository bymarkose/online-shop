/**
 * Precise Decimal Financial Arithmetic according to Markose Spec (Section 6)
 * Avoids IEEE-754 floating point drift by calculating with integer cents (halalas/piastres)
 * and rounding half-up on line items.
 */

export function toCents(amount: string | number): number {
  if (typeof amount === 'number') {
    return Math.round(amount * 100);
  }
  const clean = (amount || '0').replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(clean);
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}

export function fromCents(cents: number): string {
  const isNegative = cents < 0;
  const abs = Math.abs(cents);
  const integerPart = Math.floor(abs / 100);
  const decimalPart = abs % 100;
  const sign = isNegative ? '-' : '';
  return `${sign}${integerPart}.${decimalPart.toString().padStart(2, '0')}`;
}

export function formatMoney(amount: string | number, currency = 'ج.م'): string {
  const cents = toCents(amount);
  const str = fromCents(cents);
  const parts = str.split('.');
  const intWithCommas = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${intWithCommas}.${parts[1]} ${currency}`;
}

export function calculateLineTotal(
  unitPrice: string | number,
  quantity: number,
  lineDiscount: string | number = '0'
): string {
  const priceCents = toCents(unitPrice);
  const discountCents = toCents(lineDiscount);
  const rawTotalCents = priceCents * quantity - discountCents;
  const finalCents = Math.max(0, rawTotalCents);
  return fromCents(finalCents);
}

export function calculateOrderTotals(
  items: { unit_price: string | number; quantity: number; line_discount?: string | number }[],
  orderDiscount: string | number = '0',
  shippingFee: string | number = '0'
): { subtotal: string; discount_amount: string; shipping_fee: string; total_amount: string } {
  let subtotalCents = 0;
  for (const item of items) {
    const lineTotal = toCents(
      calculateLineTotal(item.unit_price, item.quantity, item.line_discount || '0')
    );
    subtotalCents += lineTotal;
  }

  const requestedDiscountCents = toCents(orderDiscount);
  // discount cannot exceed subtotal
  const discountCents = Math.min(subtotalCents, Math.max(0, requestedDiscountCents));
  const shippingCents = Math.max(0, toCents(shippingFee));

  const totalCents = subtotalCents - discountCents + shippingCents;

  return {
    subtotal: fromCents(subtotalCents),
    discount_amount: fromCents(discountCents),
    shipping_fee: fromCents(shippingCents),
    total_amount: fromCents(totalCents)
  };
}
