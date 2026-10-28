import React, { useState, useMemo } from 'react';
import { Shield, Search, Clock, FileCode, CheckCircle2, ChevronDown, ChevronRight, X } from 'lucide-react';
import { AuditLog } from '../types';

interface AuditLogsViewProps {
  logs: AuditLog[];
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ logs }) => {
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      if (filterAction !== 'ALL' && l.action !== filterAction) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const actionMatch = l.action.toLowerCase().includes(q);
        const entityMatch = l.entity_type.toLowerCase().includes(q) || l.entity_id.toLowerCase().includes(q);
        const reqMatch = l.request_id.toLowerCase().includes(q);
        const userMatch = (l.user_id || '').toLowerCase().includes(q);
        if (!actionMatch && !entityMatch && !reqMatch && !userMatch) return false;
      }
      return true;
    });
  }, [logs, filterAction, searchQuery]);

  const uniqueActions = Array.from(new Set(logs.map(l => l.action)));
  const selectedLog = logs.find(l => l.id === selectedLogId);

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-neutral-800">
        <h1 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-400" />
          <span>سجل التدقيق الأمني والعمليات (Append-Only Audit Logs)</span>
          <span className="text-xs font-mono tabular-nums text-neutral-400 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded">
            {logs.length} سجل
          </span>
        </h1>
        <p className="text-xs text-neutral-400 mt-0.5">
          سجل غير قابل للتعديل أو الحذف (Append-only) يوثق التغييرات في حالات الطلبات، الحسابات المالية، وقرارات الحظر الإداري
        </p>
      </div>

      {/* Filters */}
      <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-500 absolute right-3 top-2.5" />
          <input
            type="text"
            placeholder="ابحث بنوع العملية، معرف الكيان، المستخدم، أو رقم الطلب..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-md pr-9 pl-3 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        <div className="w-full sm:w-64">
          <select
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-500/50"
          >
            <option value="ALL">كافة أنواع العمليات ({uniqueActions.length})</option>
            {uniqueActions.map(act => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table & Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className={`space-y-4 ${selectedLog ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400">
                    <th className="py-2.5 px-3">التوقيت (Africa/Cairo)</th>
                    <th className="py-2.5 px-3">نوع العملية (Action)</th>
                    <th className="py-2.5 px-3">الكيان والمعرف</th>
                    <th className="py-2.5 px-3">المستخدم / الفاعل</th>
                    <th className="py-2.5 px-3 text-center">التفاصيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 font-mono text-[11px]">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-neutral-500 font-sans">
                        لا توجد سجلات تطابق الفلترة
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map(l => {
                      const isSelected = selectedLogId === l.id;
                      return (
                        <tr
                          key={l.id}
                          onClick={() => setSelectedLogId(isSelected ? null : l.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-neutral-800' : 'hover:bg-neutral-800/40'
                          }`}
                        >
                          <td className="py-2.5 px-3 text-neutral-400 whitespace-nowrap">
                            {new Date(l.created_at).toLocaleString('ar-EG')}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded bg-neutral-950 text-amber-400 font-semibold border border-neutral-800">
                              {l.action}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-neutral-300">
                            <span className="text-neutral-500">{l.entity_type}:</span> {l.entity_id}
                          </td>
                          <td className="py-2.5 px-3 text-neutral-300">
                            {l.user_id}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button className="text-amber-400 hover:text-amber-300 font-sans text-xs">
                              {isSelected ? 'إغلاق' : 'عرض'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Selected Log Inspector Panel */}
        {selectedLog && (
          <div className="lg:col-span-5 bg-neutral-900 border border-neutral-800 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h2 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-amber-400" />
                <span>فحص حمولة التدقيق (Audit Payload)</span>
              </h2>
              <button
                onClick={() => setSelectedLogId(null)}
                className="text-neutral-400 hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between bg-neutral-950 p-2 rounded border border-neutral-800">
                <span className="text-neutral-500">معرف السجل:</span>
                <span className="text-neutral-200">{selectedLog.id}</span>
              </div>
              <div className="flex justify-between bg-neutral-950 p-2 rounded border border-neutral-800">
                <span className="text-neutral-500">معرف الطلب (Request ID):</span>
                <span className="text-amber-400">{selectedLog.request_id}</span>
              </div>
              <div className="flex justify-between bg-neutral-950 p-2 rounded border border-neutral-800">
                <span className="text-neutral-500">العملية:</span>
                <span className="text-emerald-400 font-bold">{selectedLog.action}</span>
              </div>
              <div className="flex justify-between bg-neutral-950 p-2 rounded border border-neutral-800">
                <span className="text-neutral-500">الكيان:</span>
                <span className="text-neutral-200">{selectedLog.entity_type} ({selectedLog.entity_id})</span>
              </div>
            </div>

            {/* Old vs New Values */}
            <div className="space-y-3 pt-2">
              <div>
                <span className="text-xs font-semibold text-neutral-400 block mb-1">
                  القيم القديمة (Old Values):
                </span>
                <pre className="p-3 bg-neutral-950 border border-neutral-800 rounded text-[11px] text-neutral-400 font-mono overflow-x-auto max-h-48">
                  {selectedLog.old_values ? JSON.stringify(selectedLog.old_values, null, 2) : 'null (إنشاء أولي)'}
                </pre>
              </div>

              <div>
                <span className="text-xs font-semibold text-neutral-400 block mb-1">
                  القيم الجديدة (New Values):
                </span>
                <pre className="p-3 bg-neutral-950 border border-neutral-800 rounded text-[11px] text-amber-300 font-mono overflow-x-auto max-h-48">
                  {selectedLog.new_values ? JSON.stringify(selectedLog.new_values, null, 2) : 'null'}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
