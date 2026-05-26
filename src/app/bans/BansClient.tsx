"use client";

import { useState } from "react";
import { Search, Ban, ShieldOff, Plus } from "lucide-react";
import { useNotification } from "@/components/Notifications";
import { Permission } from "@/types";

interface Props {
  bans: any[];
  staff: any;
}

export default function BansClient({ bans, staff }: Props) {
  const { toast, confirm } = useNotification();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "permanent" | "temporary">("all");
  const [addModal, setAddModal] = useState(false);
  const [newBan, setNewBan] = useState({ identifier: "", name: "", reason: "", duration: "0" });

  const perms: string[] = staff?.permissions || [];
  const canManageBans = perms.includes(Permission.SUPER_ADMIN) || perms.includes(Permission.MANAGE_BANS);

  const filtered = bans.filter((b) => {
    const q = search.toLowerCase();
    const matchesSearch =
      b.name?.toLowerCase().includes(q) ||
      b.license?.toLowerCase().includes(q) ||
      b.discord?.toLowerCase().includes(q) ||
      b.reason?.toLowerCase().includes(q) ||
      b.bannedby?.toLowerCase().includes(q);
    if (filter === "permanent") return matchesSearch && b.permanent;
    if (filter === "temporary") return matchesSearch && !b.permanent;
    return matchesSearch;
  });

  const handleUnban = async (ban: any) => {
    const ok = await confirm({
      title: "رفع الحظر",
      message: `هل أنت متأكد من رفع الحظر عن ${ban.name || "هذا اللاعب"}؟`,
      confirmText: "✅ رفع الحظر",
      type: "warning",
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/bans?id=${ban.id}`, { method: "DELETE" });
      if (res.ok) {
        toast(`تم رفع الحظر عن ${ban.name || "اللاعب"} بنجاح`, "success");
        window.location.reload();
      } else {
        toast("حدث خطأ", "error");
      }
    } catch {
      toast("حدث خطأ في الاتصال", "error");
    }
  };

  const handleAddBan = async () => {
    if (!newBan.identifier.trim()) { toast("الرجاء إدخال المعرف", "warning"); return; }
    try {
      const res = await fetch("/api/bans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newBan.name,
          license: newBan.identifier,
          reason: newBan.reason,
          duration: parseInt(newBan.duration),
          bannedBy: staff.username,
        }),
      });
      if (res.ok) {
        setAddModal(false);
        setNewBan({ identifier: "", name: "", reason: "", duration: "0" });
        toast("تم إضافة الحظر بنجاح", "success");
        window.location.reload();
      } else {
        toast("حدث خطأ أثناء الحظر", "error");
      }
    } catch {
      toast("حدث خطأ في الاتصال", "error");
    }
  };

  const formatDate = (expire: number | null) => {
    if (!expire) return "دائم";
    return new Date(expire * 1000).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <>
      <div className="page-header">
        <h1>إدارة الحظر</h1>
        <p>عرض وإدارة جميع حالات الحظر · إجمالي {bans.length} حظر</p>
      </div>
      <div className="page-content">
        <div className="toolbar">
          <div className="search-box">
            <Search />
            <input className="input" placeholder="بحث بالاسم، المعرف، السبب..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="tabs">
            <button className={`tab ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>الكل ({bans.length})</button>
            <button className={`tab ${filter === "permanent" ? "active" : ""}`} onClick={() => setFilter("permanent")}>دائم</button>
            <button className={`tab ${filter === "temporary" ? "active" : ""}`} onClick={() => setFilter("temporary")}>مؤقت</button>
          </div>
          {canManageBans && (
            <button className="btn btn-primary" style={{ marginRight: "auto" }} onClick={() => setAddModal(true)}>
              <Plus size={14} /> إضافة حظر
            </button>
          )}
        </div>

        <div className="glass-card animate-in">
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr><th>ID</th><th>الاسم</th><th>المعرف</th><th>Discord</th><th>السبب</th><th>النوع</th><th>تنتهي في</th><th>بواسطة</th>{canManageBans && <th>الإجراءات</th>}</tr>
              </thead>
              <tbody>
                {filtered.map((ban) => (
                  <tr key={ban.id}>
                    <td>{ban.id}</td>
                    <td style={{ fontWeight: 600 }}>{ban.name || "—"}</td>
                    <td className="mono" style={{ maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis" }}>{ban.license || "—"}</td>
                    <td className="mono">{ban.discord || "—"}</td>
                    <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>{ban.reason || "—"}</td>
                    <td>
                      <span className={`badge ${ban.permanent ? "badge-banned" : "badge-pending"}`}>
                        {ban.permanent ? "دائم" : "مؤقت"}
                      </span>
                    </td>
                    <td style={{ fontSize: 12 }}>{ban.permanent ? "—" : formatDate(ban.expire)}</td>
                    <td>{ban.bannedby || "—"}</td>
                    {canManageBans && (
                      <td>
                        <button className="btn btn-success btn-sm" onClick={() => handleUnban(ban)}>
                          <ShieldOff size={12} /> رفع الحظر
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filtered.length === 0 && (
          <div className="empty-state"><Ban size={64} /><h3>لا توجد حالات حظر</h3></div>
        )}
      </div>

      {addModal && (
        <div className="modal-overlay" onClick={() => setAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">إضافة حظر جديد</span>
              <button className="modal-close" onClick={() => setAddModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label className="input-label">اسم اللاعب</label>
                <input className="input" placeholder="اسم اللاعب" value={newBan.name} onChange={(e) => setNewBan({ ...newBan, name: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">المعرف (License / Discord / Steam)</label>
                <input className="input" placeholder="license:xxxx أو discord:xxxx" value={newBan.identifier} onChange={(e) => setNewBan({ ...newBan, identifier: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">سبب الحظر</label>
                <textarea className="input" rows={3} placeholder="سبب الحظر..." value={newBan.reason} onChange={(e) => setNewBan({ ...newBan, reason: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">المدة بالأيام (0 = دائم)</label>
                <input className="input" type="number" min="0" value={newBan.duration} onChange={(e) => setNewBan({ ...newBan, duration: e.target.value })} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-danger" onClick={handleAddBan}><Ban size={14} /> تأكيد الحظر</button>
              <button className="btn btn-secondary" onClick={() => setAddModal(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
