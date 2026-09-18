'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Play, Square, Zap, RefreshCcw,
  Activity, AlertCircle, CheckCircle2, Clock,
  Package, Lock, SkipForward, XCircle,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AutomationState {
  id: string;
  status: 'running' | 'stopped' | 'paused';
  current_section_id: string | null;
  current_page: number;
  section_products_imported: number;
  next_run_at: string | null;
  last_run_at: string | null;
  locked_at: string | null;
  total_imported: number;
  total_skipped: number;
  total_failed: number;
  updated_at: string;
  sections?: { title: string } | null;
}

interface AutomationLog {
  id: number;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  section_id: string | null;
  asin: string | null;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isLocked(state: AutomationState): boolean {
  if (!state.locked_at) return false;
  const tenMinsAgo = Date.now() - 10 * 60 * 1000;
  return new Date(state.locked_at).getTime() > tenMinsAgo;
}

function getDisplayStatus(state: AutomationState): {
  label: string;
  color: string;
  dot: string;
} {
  if (isLocked(state)) {
    return {
      label: 'Worker يعمل الآن 🔒',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      dot: 'bg-blue-500',
    };
  }
  switch (state.status) {
    case 'running':
      return {
        label: 'قيد التشغيل 🟢',
        color: 'bg-green-100 text-green-800 border-green-200',
        dot: 'bg-green-500',
      };
    case 'stopped':
      return {
        label: 'متوقف 🔴',
        color: 'bg-red-100 text-red-800 border-red-200',
        dot: 'bg-red-500',
      };
    default:
      return {
        label: state.status,
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        dot: 'bg-gray-400',
      };
  }
}

function fmtDate(iso: string | null): string {
  if (!iso) return '---';
  return new Date(iso).toLocaleString('ar-EG', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function LogIcon({ level }: { level: string }) {
  switch (level) {
    case 'success': return <CheckCircle2 className="text-green-500 shrink-0" size={15} />;
    case 'error':   return <XCircle      className="text-red-500 shrink-0"   size={15} />;
    case 'warning': return <AlertCircle  className="text-yellow-500 shrink-0" size={15} />;
    default:        return <Activity     className="text-blue-400 shrink-0"  size={15} />;
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AutomationDashboard() {
  const [state, setState]         = useState<AutomationState | null>(null);
  const [logs, setLogs]           = useState<AutomationLog[]>([]);
  const [loading, setLoading]     = useState(true);
  const [actionBusy, setActionBusy] = useState(false);
  const [error, setError]         = useState('');
  const [toast, setToast]         = useState('');

  // ── fetch ──────────────────────────────────────────────────────────────────
  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/automation');
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setState(data.state);
      setLogs(data.logs);
      setError('');
    } catch (err: any) {
      setError(err.message || 'خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
    const id = setInterval(fetchState, 15_000);
    return () => clearInterval(id);
  }, [fetchState]);

  // ── show toast ────────────────────────────────────────────────────────────
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  // ── control action ────────────────────────────────────────────────────────
  const handleAction = async (action: string) => {
    setActionBusy(true);
    try {
      const res = await fetch('/api/admin/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(`❌ ${data.error || 'حدث خطأ'}`);
      } else {
        const msgs: Record<string, string> = {
          start:    '✅ تم تشغيل الأتمتة — ستبدأ في الدورة القادمة',
          resume:   '✅ تم استئناف الأتمتة',
          stop:     '⏹ تم إيقاف الأتمتة — التقدم محفوظ',
          run_now:  '⚡ تم طلب تشغيل فوري — ستنفّذ في الدورة القادمة للـ Cron',
        };
        showToast(msgs[action] || '✅ تم');
        await fetchState();
      }
    } catch (err: any) {
      showToast(`❌ ${err.message}`);
    } finally {
      setActionBusy(false);
    }
  };

  // ── stop confirmation ─────────────────────────────────────────────────────
  const handleStop = () => {
    if (window.confirm('هل تريد إيقاف الأتمتة؟\nسيتم الاحتفاظ بالتقدم الحالي وستُستأنف من نفس النقطة عند التشغيل مجدداً.')) {
      handleAction('stop');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  if (loading && !state) {
    return (
      <div className="p-10 text-center">
        <Activity className="w-8 h-8 animate-spin mx-auto text-blue-500" />
        <p className="mt-3 text-gray-500 text-sm">جاري تحميل حالة الأتمتة…</p>
      </div>
    );
  }

  if (error && !state) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-xl m-4 border border-red-200">
        <h3 className="font-bold flex items-center gap-2 mb-1">
          <AlertCircle size={18} /> خطأ في الاتصال
        </h3>
        <p className="text-sm">{error}</p>
        <p className="text-xs mt-2 text-red-400">
          تأكد من تشغيل Migration SQL لإنشاء جداول الأتمتة في Supabase.
        </p>
        <button
          onClick={fetchState}
          className="mt-3 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm flex items-center gap-1"
        >
          <RefreshCcw size={14} /> إعادة المحاولة
        </button>
      </div>
    );
  }

  if (!state) return null;

  const display  = getDisplayStatus(state);
  const locked   = isLocked(state);
  const running  = state.status === 'running';
  const stopped  = state.status === 'stopped';

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-5 mb-20" dir="rtl">

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm px-5 py-3 rounded-xl shadow-lg animate-pulse">
          {toast}
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-xl font-black text-gray-900 mb-0.5">
            أتمتة استيراد المنتجات
          </h1>
          <p className="text-gray-500 text-xs">
            يستورد 3 منتجات لكل فئة فرعية · انتظار عشوائي 5–12 دقيقة بين كل منتج
          </p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border font-bold text-sm ${display.color}`}>
          <span className={`w-2 h-2 rounded-full ${display.dot} ${running ? 'animate-pulse' : ''}`} />
          {display.label}
        </div>
      </div>

      {/* ── Action Buttons ── */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-3">
        <h2 className="font-bold text-sm text-gray-700 border-b pb-2 mb-3">التحكم في النظام</h2>

        <div className="flex flex-wrap gap-3">

          {/* Start — only when stopped */}
          {stopped && (
            <button
              disabled={actionBusy}
              onClick={() => handleAction('start')}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all text-sm shadow-sm"
            >
              <Play size={16} />
              تشغيل الأتمتة
            </button>
          )}

          {/* Stop — only when running or locked */}
          {(running || locked) && (
            <button
              disabled={actionBusy}
              onClick={handleStop}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all text-sm shadow-sm"
            >
              <Square size={16} />
              إيقاف الأتمتة
            </button>
          )}

          {/* Run Now — only when running and NOT currently locked */}
          {running && !locked && (
            <button
              disabled={actionBusy}
              onClick={() => handleAction('run_now')}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all text-sm shadow-sm"
              title="يلغي فترة الانتظار ويشغّل الدورة القادمة فوراً عند أول Cron tick"
            >
              <Zap size={16} />
              تشغيل الآن
            </button>
          )}

          {/* Refresh */}
          <button
            disabled={actionBusy}
            onClick={fetchState}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 font-semibold rounded-xl transition-all text-sm"
          >
            <RefreshCcw size={15} className={loading ? 'animate-spin' : ''} />
            تحديث
          </button>
        </div>

        {/* Lock warning */}
        {locked && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-blue-700 text-xs">
            <Lock size={13} />
            Worker يعمل حالياً منذ {fmtDate(state.locked_at)} — لا تضغط إيقاف إلا بعد انتهائه لتجنب بيانات ناقصة.
          </div>
        )}
      </div>

      {/* ── State Details ── */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <h2 className="font-bold text-sm text-gray-700 border-b pb-2">معلومات الحالة الحالية</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">

          {/* Current section */}
          <div className="flex items-start gap-2">
            <Package className="text-gray-400 mt-0.5 shrink-0" size={16} />
            <div>
              <p className="text-xs text-gray-400">الفئة الحالية</p>
              <p className="font-semibold">
                {state.sections?.title || state.current_section_id || 'لم تبدأ بعد'}
              </p>
            </div>
          </div>

          {/* Current page */}
          <div className="flex items-start gap-2">
            <SkipForward className="text-gray-400 mt-0.5 shrink-0" size={16} />
            <div>
              <p className="text-xs text-gray-400">صفحة البحث الحالية</p>
              <p className="font-semibold">{state.current_page || 1}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex items-start gap-2 sm:col-span-2">
            <Activity className="text-gray-400 mt-0.5 shrink-0" size={16} />
            <div className="flex-1">
              <p className="text-xs text-gray-400 mb-1">تقدم الفئة الحالية (3 منتجات)</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full transition-all"
                    style={{ width: `${((state.section_products_imported || 0) / 3) * 100}%` }}
                  />
                </div>
                <span className="font-bold text-blue-600 text-sm w-10 text-left">
                  {state.section_products_imported || 0} / 3
                </span>
              </div>
            </div>
          </div>

          {/* Last run */}
          <div className="flex items-start gap-2">
            <Clock className="text-gray-400 mt-0.5 shrink-0" size={16} />
            <div>
              <p className="text-xs text-gray-400">آخر تشغيل للـ Worker</p>
              <p className="font-semibold text-xs" dir="ltr">{fmtDate(state.last_run_at)}</p>
            </div>
          </div>

          {/* Next run */}
          <div className="flex items-start gap-2">
            <RefreshCcw className="text-gray-400 mt-0.5 shrink-0" size={16} />
            <div>
              <p className="text-xs text-gray-400">التشغيل القادم المتوقع</p>
              <p className="font-semibold text-xs text-green-600" dir="ltr">
                {fmtDate(state.next_run_at)}
              </p>
            </div>
          </div>

          {/* Lock status */}
          <div className="flex items-start gap-2">
            <Lock className="text-gray-400 mt-0.5 shrink-0" size={16} />
            <div>
              <p className="text-xs text-gray-400">حالة الـ Lock</p>
              {locked ? (
                <p className="font-semibold text-blue-600 text-xs">
                  مقفل — Worker نشط (Recovery تلقائي بعد 10 دقائق)
                </p>
              ) : (
                <p className="font-semibold text-gray-400 text-xs">غير مقفل</p>
              )}
            </div>
          </div>

        </div>

        {/* Counters */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-50">
          <div className="text-center bg-green-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">إجمالي المستورد</p>
            <p className="font-black text-xl text-green-600">{state.total_imported || 0}</p>
          </div>
          <div className="text-center bg-yellow-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">تخطي (مكرر)</p>
            <p className="font-black text-xl text-yellow-600">{state.total_skipped || 0}</p>
          </div>
          <div className="text-center bg-red-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">أخطاء</p>
            <p className="font-black text-xl text-red-600">{state.total_failed || 0}</p>
          </div>
        </div>
      </div>

      {/* ── Logs ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
          <h2 className="font-bold text-sm">السجل (Logs)</h2>
          <span className="text-xs text-gray-400">آخر 50 عملية · يتجدد كل 15 ثانية</span>
        </div>
        <div className="max-h-96 overflow-y-auto p-4 space-y-2.5">
          {logs.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">لا توجد سجلات بعد</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex gap-2.5 text-xs border-b border-gray-50 pb-2.5 last:border-0">
                <div className="pt-0.5">
                  <LogIcon level={log.level} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`${
                    log.level === 'error'   ? 'text-red-700 font-semibold' :
                    log.level === 'warning' ? 'text-yellow-700' :
                    log.level === 'success' ? 'text-green-700' : 'text-gray-700'
                  } break-words`}>
                    {log.message}
                    {log.asin && (
                      <span className="text-gray-400 ml-1 font-mono">[{log.asin}]</span>
                    )}
                  </p>
                  <p className="text-gray-400 mt-0.5" dir="ltr">
                    {fmtDate(log.created_at)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
