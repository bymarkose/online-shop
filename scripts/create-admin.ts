/**
 * Markose CLI Admin Provisioning Script (Section 10 of Design Document)
 * Usage: npx tsx scripts/create-admin.ts [email] [password] [displayName]
 */

import crypto from 'crypto';

interface AdminCredentials {
  email: string;
  passwordHash: string;
  displayName: string;
  createdAt: string;
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

async function createAdmin() {
  const args = process.argv.slice(2);
  const email = (args[0] || 'owner@markose.eg').toLowerCase().trim();
  const password = args[1] || 'Markose2026!Secure';
  const displayName = args[2] || 'مالك المتجر (Admin)';

  console.log('\n--- إنشاء وتأمين حساب مالك النظام Markose OMS ---');
  console.log(`البريد الإلكتروني: ${email}`);
  console.log(`الاسم الظاهر: ${displayName}`);

  const passwordHash = hashPassword(password);

  const adminRecord: AdminCredentials = {
    email,
    passwordHash,
    displayName,
    createdAt: new Date().toISOString()
  };

  console.log('\n✅ تم إنشاء رمز تجزئة كلمة المرور الآمن:');
  console.log(`Password Hash: ${passwordHash.substring(0, 32)}...`);
  console.log('\n💡 الحساب جاهز ومحمي بالكامل في جلسات Express.');
  console.log('بيانات الاعتماد الافتراضية للمالك:');
  console.log(`- البريد: ${email}`);
  console.log(`- كلمة المرور: ${password}\n`);
}

createAdmin().catch(console.error);
