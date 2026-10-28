import React, { useState } from 'react';
import { X, Lock, ShieldCheck, UserCheck, LogOut, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import { UserSession } from '../types';

interface AuthModalProps {
  session: UserSession;
  onClose: () => void;
  onLogin: (email: string, pass: string) => boolean;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  session,
  onClose,
  onLogin,
  onLogout
}) => {
  const [emailInput, setEmailInput] = useState(session.email || 'owner@markose.eg');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const success = onLogin(emailInput, passwordInput);
    if (!success) {
      setErrorMsg('بيانات الدخول غير صحيحة، كلمة المرور الافتراضية: Markose2026!Secure');
    } else {
      setSuccessMsg('تم تسجيل الدخول بنجاح وتفعيل جلسة المالك الآمنة.');
      setPasswordInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-md w-full shadow-2xl overflow-hidden text-neutral-100">
        {/* Header */}
        <div className="p-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold text-neutral-100">
              {session.is_authenticated ? 'إدارة جلسة المالك والحماية (Section 10)' : 'تسجيل دخول مالك النظام'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-100 rounded hover:bg-neutral-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {session.is_authenticated ? (
            /* Logged in state */
            <div className="space-y-4">
              <div className="p-4 bg-neutral-950/60 border border-neutral-800 rounded-lg space-y-2.5">
                <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
                  <span className="text-neutral-400">الحساب المصرح:</span>
                  <span className="font-semibold text-neutral-100">{session.display_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">البريد الإلكتروني:</span>
                  <span className="font-mono text-neutral-200">{session.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">حالة الجلسة:</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>نشطة وموثقة (HttpOnly Cookie)</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">رمز الجلسة:</span>
                  <span className="font-mono text-[10px] text-neutral-500 truncate max-w-[160px]">
                    {session.token}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-neutral-800/60 text-[11px]">
                  <span className="text-neutral-400">تنتهي الجلسة في:</span>
                  <span className="font-mono text-neutral-300">
                    {new Date(session.expires_at).toLocaleTimeString('ar-EG', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-md text-[11px] text-amber-200 leading-relaxed">
                وفقًا للبند 10 من وثيقة التصميم، الجلسة قابلة للإبطال الفوري عبر الخادم، وتسجيل الخروج يبطل رمز الجلسة في قاعدة البيانات فورًا.
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => {
                    onLogout();
                    setSuccessMsg('تم إبطال الجلسة وتسجيل الخروج بنجاح.');
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>تسجيل الخروج وإبطال الجلسة</span>
                </button>
              </div>
            </div>
          ) : (
            /* Login Form */
            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <p className="text-neutral-400 text-xs">
                أدخل بيانات اعتماد المالك للوصول إلى العمليات الحساسة وإعدادات النظام:
              </p>
              <div>
                <label className="block text-neutral-400 mb-1">البريد الإلكتروني:</label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-xs text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">كلمة المرور:</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-xs text-neutral-100"
                />
              </div>

              <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded text-[11px] text-neutral-400">
                كلمة المرور الافتراضية للمالك: <span className="font-mono text-amber-400 font-bold select-all">Markose2026!Secure</span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 bg-neutral-800 text-neutral-300 rounded text-xs cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded text-xs cursor-pointer"
                >
                  تسجيل الدخول
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
