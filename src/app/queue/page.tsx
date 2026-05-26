"use client";

import { useState, useEffect, useRef } from "react";
import { RefreshCw, Users, Clock, ArrowUp, Hash, Zap, Shield } from "lucide-react";
import { useNotification } from "@/components/Notifications";

interface QueueEntry {
  position: number;
  name: string;
  license: string;
  discord: string;
  source: number;
  priority: number;
  waitTime: number;
}

export default function QueuePage() {
  const { toast, confirm } = useNotification();
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchQueue = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/queue");
      const data = await res.json();
      setQueue(data.queue || []);
    } catch {
      if (!silent) toast("حدث خطأ في الاتصال بالسيرفر", "error");
    }
    if (!silent) setLoading(false);
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  // Auto refresh
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => fetchQueue(true), 5000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh]);

  const formatWaitTime = (seconds: number) => {
    if (!seconds || seconds <= 0) return "—";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins}د ${secs}ث`;
    return `${secs}ث`;
  };

  const handleSkip = async (license: string, name: string) => {
    const ok = await confirm({
      title: "تخطي اللاعب للأمام",
      message: `هل تريد نقل "${name}" إلى أول القائمة؟`,
      confirmText: "⚡ تخطي",
      type: "warning",
    });
    if (!ok) return;
    setActionLoading(license);
    try {
      const res = await fetch("/api/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "skip", license }),
      });
      const data = await res.json();
      if (data.success) {
        toast(`تم نقل ${name} لأول القائمة`, "success");
        fetchQueue(true);
      } else {
        toast(data.error || "حدث خطأ", "error");
      }
    } catch {
      toast("حدث خطأ في الاتصال", "error");
    }
    setActionLoading(null);
  };



  const handleSetPosition = async (license: string, name: string) => {
    const input = prompt(`أدخل الترتيب الجديد لـ "${name}":`);
    if (!input) return;
    const position = parseInt(input);
    if (isNaN(position) || position < 1) {
      toast("ترتيب غير صالح", "warning");
      return;
    }
    setActionLoading(license);
    try {
      const res = await fetch("/api/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setpos", license, position }),
      });
      const data = await res.json();
      if (data.success) {
        toast(`تم نقل ${name} للترتيب ${position}`, "success");
        fetchQueue(true);
      } else {
        toast(data.error || "حدث خطأ", "error");
      }
    } catch {
      toast("حدث خطأ في الاتصال", "error");
    }
    setActionLoading(null);
  };

  return (
    <>
      <div className="page-header">
        <h1>طابور الانتظار</h1>
        <p>إدارة طابور اللاعبين المنتظرين للدخول للسيرفر</p>
      </div>
      <div className="page-content">
        {/* Stats */}
        <div className="stats-grid" style={{ marginBottom: 20 }}>
          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-card-icon purple"><Users size={20} /></div>
            </div>
            <div className="stat-card-value">{queue.length}</div>
            <div className="stat-card-label">في الطابور</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-card-icon cyan"><Shield size={20} /></div>
            </div>
            <div className="stat-card-value">{queue.filter((q) => q.priority > 0).length}</div>
            <div className="stat-card-label">أولوية خاصة</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-card-icon orange"><Clock size={20} /></div>
            </div>
            <div className="stat-card-value">
              {queue.length > 0 ? formatWaitTime(Math.max(...queue.map((q) => q.waitTime))) : "—"}
            </div>
            <div className="stat-card-label">أطول انتظار</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="btn btn-secondary" onClick={() => fetchQueue()} disabled={loading}>
              <RefreshCw size={14} className={loading ? "spin" : ""} /> تحديث
            </button>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                style={{ accentColor: "var(--accent-purple)" }}
              />
              تحديث تلقائي (5 ثوان)
            </label>
          </div>
          {autoRefresh && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--accent-green)" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent-green)", animation: "pulse 2s infinite" }} />
              مباشر
            </div>
          )}
        </div>

        {/* Queue list */}
        {loading && queue.length === 0 ? (
          <div className="empty-state">
            <div style={{ width: 48, height: 48, border: "3px solid var(--glass-border)", borderTop: "3px solid var(--accent-purple)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
            <h3>جاري تحميل الطابور...</h3>
          </div>
        ) : queue.length === 0 ? (
          <div className="empty-state">
            <Users size={64} />
            <h3>الطابور فارغ</h3>
            <p>لا يوجد لاعبين في طابور الانتظار حالياً</p>
          </div>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>اللاعب</th>
                  <th>License</th>
                  <th>Discord</th>
                  <th>الأولوية</th>
                  <th>وقت الانتظار</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((entry) => (
                  <tr key={entry.license || entry.position}>
                    <td>
                      <div style={{
                        width: 28, height: 28, borderRadius: 6,
                        background: entry.position === 1 ? "rgba(245,158,11,0.15)" : "rgba(139,92,246,0.1)",
                        color: entry.position === 1 ? "var(--accent-orange)" : "var(--accent-purple)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 700, fontSize: 13,
                      }}>{entry.position}</div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{entry.name}</td>
                    <td className="mono" style={{ fontSize: 11 }}>{entry.license?.replace("license:", "").substring(0, 16)}...</td>
                    <td style={{ color: entry.discord ? "var(--accent-cyan)" : "var(--text-muted)" }}>
                      {entry.discord ? entry.discord.replace("discord:", "") : "—"}
                    </td>
                    <td>
                      {entry.priority > 0 ? (
                        <span className="badge badge-purple">⭐ {entry.priority}</span>
                      ) : (
                        <span className="badge badge-offline">عادي</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Clock size={12} style={{ color: "var(--text-muted)" }} />
                        {formatWaitTime(entry.waitTime)}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          className="player-action-btn"
                          title="نقل لأول القائمة"
                          onClick={() => handleSkip(entry.license, entry.name)}
                          disabled={actionLoading === entry.license || entry.position === 1}
                          style={{ opacity: entry.position === 1 ? 0.3 : 1 }}
                        ><Zap size={12} /></button>
                        <button
                          className="player-action-btn"
                          title="تغيير الترتيب"
                          onClick={() => handleSetPosition(entry.license, entry.name)}
                          disabled={actionLoading === entry.license}
                        ><Hash size={12} /></button>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
