import React, { useState } from 'react';
import { Clock, CheckCircle2, Phone, AlertCircle, Calendar, ExternalLink, MessageCircle, Check } from 'lucide-react';
import { FollowUpTask } from '../types';
import { OrderService } from '../lib/orderService';

interface FollowUpsViewProps {
  tasks: FollowUpTask[];
  onTaskUpdated: () => void;
  onSelectOrder: (orderId: string) => void;
}

export const FollowUpsView: React.FC<FollowUpsViewProps> = ({
  tasks,
  onTaskUpdated,
  onSelectOrder
}) => {
  const [filterStatus, setFilterStatus] = useState<'OPEN' | 'COMPLETED' | 'ALL'>('OPEN');
  const [completionNotes, setCompletionNotes] = useState<Record<string, string>>({});

  const filteredTasks = tasks.filter(t => {
    if (filterStatus === 'ALL') return true;
    return t.status === filterStatus;
  });

  const handleCompleteTask = (taskId: string) => {
    const note = completionNotes[taskId] || 'تمت المتابعة مع العميل بنجاح';
    OrderService.completeFollowUpTask(taskId, note);
    setCompletionNotes(prev => ({ ...prev, [taskId]: '' }));
    onTaskUpdated();
  };

  const handleQuickConfirm = (task: FollowUpTask) => {
    const result = OrderService.transitionOrderStatus(
      task.order_id,
      'CONFIRMED',
      'تم تأكيد الطلب بنجاح خلال مكالمة المتابعة'
    );
    if (result.success) {
      OrderService.completeFollowUpTask(task.id, 'تم تأكيد الطلب هاتفياً وإغلاق المهمة');
      onTaskUpdated();
    }
  };

  const handleLogCallAttempt = (task: FollowUpTask) => {
    const ord = OrderService.getOrderById(task.order_id);
    if (ord) {
      OrderService.logInteraction(
        task.order_id,
        ord.customer_id,
        'CALL_NO_ANSWER',
        'محاولة اتصال للمتابعة: لم يرد العميل'
      );
      // Also update task note
      OrderService.completeFollowUpTask(
        task.id,
        'تم تسجيل محاولة اتصال دون رد - جدولة محاولة لاحقة'
      );
      // Transition order to CONTACT_ATTEMPTED if currently NEW or CONTACT_PENDING
      if (['NEW', 'CONTACT_PENDING'].includes(ord.status)) {
        OrderService.transitionOrderStatus(
          task.order_id,
          'CONTACT_ATTEMPTED',
          'محاولة اتصال للمتابعة دون رد'
        );
      }
      onTaskUpdated();
    }
  };

  const getWhatsAppLink = (phone: string, customerName: string, orderNumber: string) => {
    const cleanDigits = phone.replace(/\D/g, '');
    const intlDigits = cleanDigits.startsWith('20') ? cleanDigits : '20' + cleanDigits.replace(/^0+/, '');
    const message = encodeURIComponent(`السلام عليكم أستاذ ${customerName}، معكم متجر ماركوس بخصوص موعد توصيل طلبكم رقم ${orderNumber}`);
    return `https://wa.me/${intlDigits}?text=${message}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-800">
        <div>
          <h1 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <span>قائمة مهام المتابعة وخدمة العملاء</span>
            <span className="text-xs font-mono tabular-nums text-neutral-400 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded">
              {tasks.filter(t => t.status === 'OPEN').length} مستحقة
            </span>
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            تجدول المهام آليًا بعد محاولات الاتصال الفاشلة (4 ساعات) أو تعذر الوصول (24 ساعة)
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-lg">
          <button
            onClick={() => setFilterStatus('OPEN')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              filterStatus === 'OPEN'
                ? 'bg-neutral-800 text-amber-400 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            المفتوحة والمستحقة
          </button>
          <button
            onClick={() => setFilterStatus('COMPLETED')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              filterStatus === 'COMPLETED'
                ? 'bg-neutral-800 text-amber-400 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            المكتملة
          </button>
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              filterStatus === 'ALL'
                ? 'bg-neutral-800 text-amber-400 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            الكل ({tasks.length})
          </button>
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="p-12 text-center bg-neutral-900 border border-neutral-800 rounded-lg space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
          <h3 className="text-sm font-semibold text-neutral-200">لا توجد مهام متابعة في هذه القائمة</h3>
          <p className="text-xs text-neutral-400">
            جميع مواعيد الاتصال والمتابعات مع العملاء تم إنجازها بنجاح
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map(task => {
            const isOverdue =
              task.status === 'OPEN' && new Date(task.due_at).getTime() < Date.now();

            return (
              <div
                key={task.id}
                className={`p-4 rounded-lg border transition-all ${
                  isOverdue
                    ? 'bg-rose-950/20 border-rose-900/60'
                    : task.status === 'COMPLETED'
                    ? 'bg-neutral-950/40 border-neutral-800/80 opacity-70'
                    : 'bg-neutral-900 border-neutral-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800/80">
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        task.status === 'COMPLETED'
                          ? 'bg-emerald-500'
                          : isOverdue
                          ? 'bg-rose-500'
                          : 'bg-amber-400'
                      }`}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-neutral-100">
                          {task.task_type}
                        </span>
                        {isOverdue && (
                          <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20">
                            متأخرة عن الموعد
                          </span>
                        )}
                        {task.status === 'COMPLETED' && (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                            مكتملة
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-neutral-400 mt-1 flex flex-wrap items-center gap-2">
                        <span className="font-medium text-neutral-300">العميل: {task.customer_name}</span>
                        <span>·</span>
                        <div className="flex items-center gap-1.5 font-mono tabular-nums text-neutral-300">
                          <span>{task.customer_phone}</span>
                          <a
                            href={getWhatsAppLink(task.customer_phone || '', task.customer_name || '', task.order_number || '')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/60 rounded transition-colors"
                            title="محادثة واتساب"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={`tel:${task.customer_phone}`}
                            className="p-1 text-sky-400 hover:text-sky-300 hover:bg-sky-950/60 rounded transition-colors"
                            title="اتصال هاتفي"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right sm:text-left text-xs">
                      <div className="text-[11px] text-neutral-500">موعد الاستحقاق:</div>
                      <div className="font-mono tabular-nums text-neutral-300">
                        {new Date(task.due_at).toLocaleString('ar-EG', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectOrder(task.order_id)}
                      className="px-2.5 py-1 text-xs text-amber-400 hover:text-amber-300 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>فتح الطلب ({task.order_number})</span>
                    </button>
                  </div>
                </div>

                <div className="pt-3 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 text-xs border-t border-neutral-800/40">
                  <div className="text-neutral-400">
                    <span className="text-neutral-500 font-medium">ملاحظة المهمة: </span>
                    <span className="text-neutral-200">{task.note || 'متابعة الاتصال والتأكيد'}</span>
                  </div>

                  {task.status === 'OPEN' && (
                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                      <button
                        onClick={() => handleQuickConfirm(task)}
                        className="px-2.5 py-1 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                        title="تأكيد الطلب مباشرة وإغلاق المهمة"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>تأكيد الطلب</span>
                      </button>

                      <button
                        onClick={() => handleLogCallAttempt(task)}
                        className="px-2.5 py-1 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-600/40 rounded text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                        title="تسجيل محاولة اتصال فاشلة"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>تسجيل عدم رد</span>
                      </button>

                      <div className="flex items-center gap-1.5 flex-1 lg:flex-initial">
                        <input
                          type="text"
                          placeholder="ملاحظة مخصصة..."
                          value={completionNotes[task.id] || ''}
                          onChange={e =>
                            setCompletionNotes(prev => ({ ...prev, [task.id]: e.target.value }))
                          }
                          className="bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1 text-xs text-neutral-200 placeholder-neutral-500 w-full sm:w-48"
                        />
                        <button
                          onClick={() => handleCompleteTask(task.id)}
                          className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-xs font-medium whitespace-nowrap cursor-pointer transition-colors"
                        >
                          إتمام
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
