"use client";

import { useState, useEffect } from "react";
import { Search, FileText, Check, X, Eye, Clock, Link2, Copy } from "lucide-react";
import { useNotification } from "@/components/Notifications";

interface Props {
  applications: any[];
  staff: any;
}

export default function ApplicationsClient({ applications, staff }: Props) {
  const { toast } = useNotification();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [viewApp, setViewApp] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [copied, setCopied] = useState(false);
  const [applyLink, setApplyLink] = useState("/apply");

  useEffect(() => {
    setApplyLink(`${window.location.origin}/apply`);
  }, []);

  const filtered = applications.filter((a) => {
    const q = search.toLowerCase();
    const matchesSearch = a.applicantName?.toLowerCase().includes(q) || a.applicantDiscord?.includes(q);
    if (filter === "all") return matchesSearch;
    return matchesSearch && a.status === filter;
  });

  const handleReview = async (appId: number, status: "approved" | "rejected") => {
    try {
      await fetch("/api/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: appId, status, reviewerNotes: reviewNotes }),
      });
      toast(status === "approved" ? "تم قبول الطلب" : "تم رفض الطلب", status === "approved" ? "success" : "info");
      window.location.reload();
    } catch {
      toast("حدث خطأ", "error");
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(applyLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("ar-SA", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const statusBadge = (s: string) => {
    switch (s) {
      case "pending": return { text: "معلق", class: "badge-pending" };
      case "approved": return { text: "مقبول", class: "badge-approved" };
      case "rejected": return { text: "مرفوض", class: "badge-rejected" };
      default: return { text: s, class: "badge-offline" };
    }
  };

  const pendingCount = applications.filter((a) => a.status === "pending").length;

  return (
    <>
      <div className="page-header">
        <h1>إدارة التقديمات</h1>
        <p>مراجعة وإدارة طلبات التقديم · {pendingCount} طلب معلق</p>
      </div>
      <div className="page-content">
        {/* Apply Link Card */}
        <div className="glass-card animate-in" style={{ marginBottom: 20, padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link2 size={18} style={{ color: "var(--accent-purple)" }} />
            <span style={{ fontWeight: 600, fontSize: 14 }}>رابط التقديم:</span>
            <code style={{ flex: 1, fontSize: 12, color: "var(--accent-cyan)", background: "var(--bg-input)", padding: "6px 12px", borderRadius: 6, direction: "ltr" }}>
              {applyLink}
            </code>
            <button className="btn btn-secondary btn-sm" onClick={copyLink}>
              <Copy size={12} /> {copied ? "تم النسخ!" : "نسخ"}
            </button>
          </div>
        </div>

        <div className="toolbar">
          <div className="search-box">
            <Search />
            <input className="input" placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="tabs">
            <button className={`tab ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>الكل</button>
            <button className={`tab ${filter === "pending" ? "active" : ""}`} onClick={() => setFilter("pending")}>معلق ({pendingCount})</button>
            <button className={`tab ${filter === "approved" ? "active" : ""}`} onClick={() => setFilter("approved")}>مقبول</button>
            <button className={`tab ${filter === "rejected" ? "active" : ""}`} onClick={() => setFilter("rejected")}>مرفوض</button>
          </div>
        </div>

        <div className="glass-card animate-in">
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>الاسم</th>
                  <th>Discord</th>
                  <th>العمر</th>
                  <th>الحالة</th>
                  <th>التاريخ</th>
                  <th>المراجع</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((app) => {
                  const badge = statusBadge(app.status);
                  return (
                    <tr key={app.id}>
                      <td>{app.id}</td>
                      <td style={{ fontWeight: 600 }}>{app.applicantName}</td>
                      <td className="mono">{app.applicantDiscord || "—"}</td>
                      <td>{app.applicantAge || "—"}</td>
                      <td><span className={`badge ${badge.class}`}>{badge.text}</span></td>
                      <td style={{ fontSize: 12 }}>{formatDate(app.createdAt)}</td>
                      <td>{app.reviewerName || "—"}</td>
                      <td>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button className="player-action-btn" title="عرض" onClick={() => { setViewApp(app); setReviewNotes(""); }}>
                            <Eye size={12} />
                          </button>
                          {app.status === "pending" && (
                            <>
                              <button className="player-action-btn" title="قبول" style={{ color: "var(--accent-green)" }} onClick={() => handleReview(app.id, "approved")}>
                                <Check size={12} />
                              </button>
                              <button className="player-action-btn danger" title="رفض" onClick={() => handleReview(app.id, "rejected")}>
                                <X size={12} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {viewApp && (
        <div className="modal-overlay" onClick={() => setViewApp(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <span className="modal-title">طلب تقديم - {viewApp.applicantName}</span>
              <button className="modal-close" onClick={() => setViewApp(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="input-group"><span className="input-label">الاسم</span><span>{viewApp.applicantName}</span></div>
                <div className="input-group"><span className="input-label">Discord</span><span className="mono">{viewApp.applicantDiscord || "—"}</span></div>
                <div className="input-group"><span className="input-label">العمر</span><span>{viewApp.applicantAge || "—"}</span></div>
                <div className="input-group"><span className="input-label">التاريخ</span><span>{formatDate(viewApp.createdAt)}</span></div>
              </div>
              {viewApp.answers && Object.keys(viewApp.answers).length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <h4 style={{ marginBottom: 12, fontSize: 14 }}>الإجابات</h4>
                  {Object.entries(viewApp.answers).map(([q, a]) => (
                    <div key={q} style={{ marginBottom: 12, padding: 12, background: "var(--bg-input)", borderRadius: 8 }}>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>{q}</div>
                      <div style={{ fontSize: 13 }}>{a as string}</div>
                    </div>
                  ))}
                </div>
              )}
              {viewApp.status === "pending" && (
                <div className="input-group" style={{ marginTop: 8 }}>
                  <label className="input-label">ملاحظات المراجعة</label>
                  <textarea className="input" rows={2} value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} placeholder="ملاحظات اختيارية..." />
                </div>
              )}
            </div>
            {viewApp.status === "pending" && (
              <div className="modal-footer">
                <button className="btn btn-success" onClick={() => handleReview(viewApp.id, "approved")}><Check size={14} /> قبول</button>
                <button className="btn btn-danger" onClick={() => handleReview(viewApp.id, "rejected")}><X size={14} /> رفض</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
