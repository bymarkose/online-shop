/**
 * Egyptian Phone Number Normalization & Validation according to Markose Spec (Section 7.3)
 * Rules:
 * 1. Convert Arabic-Indic numerals (٠١٢...) to Latin (012...).
 * 2. Remove spaces, hyphens, parentheses, dots.
 * 3. Prefixes +20, 0020, 20 are normalized to local 01...
 * 4. Must match Egyptian mobile pattern: ^01[0125][0-9]{8}$ (11 digits starting with 010, 011, 012, 015)
 * 5. Returns raw input, clean local format, and E.164 (+201012345678)
 */

export interface PhoneNormalizationResult {
  isValid: boolean;
  rawInput: string;
  localPhone: string;
  e164: string;
  carrier?: 'Vodafone' | 'Orange' | 'Etisalat' | 'WE' | 'Unknown';
  error?: string;
}

export function normalizeEgyptianPhone(input: string): PhoneNormalizationResult {
  if (!input || typeof input !== 'string') {
    return {
      isValid: false,
      rawInput: input || '',
      localPhone: '',
      e164: '',
      error: 'رقم الهاتف مطلوب'
    };
  }

  const raw = input.trim();

  // 1. Convert Arabic-Indic digits to Latin
  const arabicIndicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let clean = '';
  for (let i = 0; i < raw.length; i++) {
    const char = raw[i];
    const index = arabicIndicDigits.indexOf(char);
    if (index !== -1) {
      clean += index.toString();
    } else {
      clean += char;
    }
  }

  // 2. Remove formatting characters (spaces, dashes, parentheses, dots)
  clean = clean.replace(/[\s\-\(\)\.]/g, '');

  // 3. Handle international prefixes
  // e.g. +201012345678 -> 01012345678
  // 00201012345678 -> 01012345678
  // 201012345678 -> 01012345678
  if (clean.startsWith('+20')) {
    clean = '0' + clean.slice(3);
  } else if (clean.startsWith('0020')) {
    clean = '0' + clean.slice(4);
  } else if (clean.startsWith('20') && clean.length === 12) {
    clean = '0' + clean.slice(2);
  }

  // 4. Validate with Egyptian mobile regex
  // ^01[0125][0-9]{8}$
  const egMobileRegex = /^01[0125][0-9]{8}$/;
  const isValid = egMobileRegex.test(clean);

  if (!isValid) {
    let error = 'رقم الموبايل يجب أن يتكون من 11 رقم ويبدأ بـ 010 أو 011 أو 012 أو 015';
    if (clean.length < 11) {
      error = 'رقم الموبايل ناقص (أقل من 11 رقم)';
    } else if (clean.length > 11) {
      error = 'رقم الموبايل زائد عن 11 رقم';
    } else if (!clean.startsWith('01')) {
      error = 'رقم الموبايل في مصر يجب أن يبدأ بـ 01';
    }

    return {
      isValid: false,
      rawInput: raw,
      localPhone: clean,
      e164: '',
      error
    };
  }

  // Determine Carrier
  let carrier: PhoneNormalizationResult['carrier'] = 'Unknown';
  if (clean.startsWith('010')) carrier = 'Vodafone';
  else if (clean.startsWith('011')) carrier = 'Etisalat';
  else if (clean.startsWith('012')) carrier = 'Orange';
  else if (clean.startsWith('015')) carrier = 'WE';

  // E.164: +20 + digits without the leading 0
  const e164 = '+20' + clean.slice(1);

  return {
    isValid: true,
    rawInput: raw,
    localPhone: clean,
    e164,
    carrier
  };
}
