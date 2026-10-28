export interface Governorate {
  id: string;
  nameAr: string;
  nameEn: string;
  zone: 'Cairo/Giza' | 'Alexandria' | 'Delta' | 'Canal' | 'Upper Egypt' | 'Frontier';
  defaultShippingFee: string;
}

export const EGYPT_GOVERNORATES: Governorate[] = [
  { id: 'cairo', nameAr: 'القاهرة', nameEn: 'Cairo', zone: 'Cairo/Giza', defaultShippingFee: '45.00' },
  { id: 'giza', nameAr: 'الجيزة', nameEn: 'Giza', zone: 'Cairo/Giza', defaultShippingFee: '45.00' },
  { id: 'alexandria', nameAr: 'الإسكندرية', nameEn: 'Alexandria', zone: 'Alexandria', defaultShippingFee: '50.00' },
  { id: 'dakahlia', nameAr: 'الدقهلية', nameEn: 'Dakahlia', zone: 'Delta', defaultShippingFee: '55.00' },
  { id: 'sharqia', nameAr: 'الشرقية', nameEn: 'Sharqia', zone: 'Delta', defaultShippingFee: '55.00' },
  { id: 'qalyubia', nameAr: 'القليوبية', nameEn: 'Qalyubia', zone: 'Cairo/Giza', defaultShippingFee: '50.00' },
  { id: 'monufia', nameAr: 'المنوفية', nameEn: 'Monufia', zone: 'Delta', defaultShippingFee: '55.00' },
  { id: 'gharbia', nameAr: 'الغربية', nameEn: 'Gharbia', zone: 'Delta', defaultShippingFee: '55.00' },
  { id: 'beheira', nameAr: 'البحيرة', nameEn: 'Beheira', zone: 'Delta', defaultShippingFee: '60.00' },
  { id: 'kafr_el_sheikh', nameAr: 'كفر الشيخ', nameEn: 'Kafr El Sheikh', zone: 'Delta', defaultShippingFee: '60.00' },
  { id: 'damietta', nameAr: 'دمياط', nameEn: 'Damietta', zone: 'Delta', defaultShippingFee: '60.00' },
  { id: 'port_said', nameAr: 'بورسعيد', nameEn: 'Port Said', zone: 'Canal', defaultShippingFee: '60.00' },
  { id: 'ismailia', nameAr: 'الإسماعيلية', nameEn: 'Ismailia', zone: 'Canal', defaultShippingFee: '60.00' },
  { id: 'suez', nameAr: 'السويس', nameEn: 'Suez', zone: 'Canal', defaultShippingFee: '60.00' },
  { id: 'fayoum', nameAr: 'الفيوم', nameEn: 'Fayoum', zone: 'Upper Egypt', defaultShippingFee: '65.00' },
  { id: 'beni_suef', nameAr: 'بني سويف', nameEn: 'Beni Suef', zone: 'Upper Egypt', defaultShippingFee: '65.00' },
  { id: 'minya', nameAr: 'المنيا', nameEn: 'Minya', zone: 'Upper Egypt', defaultShippingFee: '70.00' },
  { id: 'assiut', nameAr: 'أسيوط', nameEn: 'Assiut', zone: 'Upper Egypt', defaultShippingFee: '70.00' },
  { id: 'sohag', nameAr: 'سوهاج', nameEn: 'Sohag', zone: 'Upper Egypt', defaultShippingFee: '75.00' },
  { id: 'qena', nameAr: 'قنا', nameEn: 'Qena', zone: 'Upper Egypt', defaultShippingFee: '75.00' },
  { id: 'luxor', nameAr: 'الأقصر', nameEn: 'Luxor', zone: 'Upper Egypt', defaultShippingFee: '80.00' },
  { id: 'aswan', nameAr: 'أسوان', nameEn: 'Aswan', zone: 'Upper Egypt', defaultShippingFee: '85.00' },
  { id: 'red_sea', nameAr: 'البحر الأحمر', nameEn: 'Red Sea', zone: 'Frontier', defaultShippingFee: '90.00' },
  { id: 'new_valley', nameAr: 'الوادي الجديد', nameEn: 'New Valley', zone: 'Frontier', defaultShippingFee: '95.00' },
  { id: 'matrouh', nameAr: 'مطروح', nameEn: 'Matrouh', zone: 'Frontier', defaultShippingFee: '90.00' },
  { id: 'north_sinai', nameAr: 'شمال سيناء', nameEn: 'North Sinai', zone: 'Frontier', defaultShippingFee: '95.00' },
  { id: 'south_sinai', nameAr: 'جنوب سيناء', nameEn: 'South Sinai', zone: 'Frontier', defaultShippingFee: '95.00' },
];

export function getShippingFeeForGovernorate(govName: string, fallback = '50.00'): string {
  const match = EGYPT_GOVERNORATES.find(
    g => g.nameAr === govName || g.nameEn.toLowerCase() === govName.toLowerCase()
  );
  return match ? match.defaultShippingFee : fallback;
}
