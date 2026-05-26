"use client";

import { useState } from "react";
import { Search, Edit, Trash2, Save, X, User, Briefcase, DollarSign, Phone, Shield, MapPin, Swords } from "lucide-react";
import { useNotification } from "@/components/Notifications";

interface Props {
  characters: any[];
  staff: any;
}

export default function CharactersClient({ characters: initialChars, staff }: Props) {
  const { toast, confirm } = useNotification();
  const [characters, setCharacters] = useState(initialChars);
  const [search, setSearch] = useState("");
  const [editModal, setEditModal] = useState<any>(null);
  const [editTab, setEditTab] = useState<"charinfo" | "money" | "job" | "gang" | "meta">("charinfo");
  const [editData, setEditData] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const filtered = characters.filter((c) => {
    const q = search.toLowerCase();
    const charName = c.charinfo ? `${c.charinfo.firstname} ${c.charinfo.lastname}` : "";
    return (
      c.name?.toLowerCase().includes(q) ||
      c.citizenid?.toLowerCase().includes(q) ||
      charName.toLowerCase().includes(q) ||
      c.charinfo?.phone?.includes(q)
    );
  });

  const openEdit = (char: any) => {
    setEditModal(char);
    setEditTab("charinfo");
    setEditData({
      charinfo: { ...char.charinfo },
      money: { ...char.money },
      job: { ...char.job },
      gang: { ...char.gang },
      name: char.name,
      citizenid: char.citizenid,
    });
  };

  const saveField = async (field: string, value: any) => {
    if (!editModal) return;
    setSaving(true);
    try {
      const res = await fetch("/api/characters", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ citizenid: editModal.citizenid, field, value }),
      });
      if (res.ok) {
        toast(`تم حفظ ${fieldLabel(field)} بنجاح`, "success");
        // Update local state
        setCharacters((prev) =>
          prev.map((c) => {
            if (c.citizenid !== editModal.citizenid) return c;
            if (field === "charinfo" || field === "money" || field === "job" || field === "gang") {
              return { ...c, [field]: value };
            }
            return { ...c, [field]: value };
          })
        );
        setEditModal((prev: any) => {
          if (!prev) return prev;
          if (field === "charinfo" || field === "money" || field === "job" || field === "gang") {
            return { ...prev, [field]: value };
          }
          return { ...prev, [field]: value };
        });
      } else {
        const data = await res.json();
        toast(data.error || "حدث خطأ", "error");
      }
    } catch {
      toast("حدث خطأ في الاتصال", "error");
    }
    setSaving(false);
  };

  const handleDelete = async (char: any) => {
    const ok = await confirm({
      title: "حذف شخصية",
      message: `هل أنت متأكد من حذف شخصية ${char.charinfo?.firstname || ""} ${char.charinfo?.lastname || ""} (${char.citizenid})؟\n\nسيتم حذف جميع المركبات المرتبطة أيضاً.`,
      confirmText: "🗑️ حذف نهائي",
      type: "danger",
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/characters?citizenid=${char.citizenid}`, { method: "DELETE" });
      if (res.ok) {
        toast("تم حذف الشخصية بنجاح", "success");
        setCharacters((prev) => prev.filter((c) => c.citizenid !== char.citizenid));
        setEditModal(null);
      } else {
        toast("حدث خطأ أثناء الحذف", "error");
      }
    } catch {
      toast("حدث خطأ في الاتصال", "error");
    }
  };

  const fieldLabel = (f: string) => {
    const labels: Record<string, string> = {
      charinfo: "معلومات الشخصية",
      money: "الأموال",
      job: "الوظيفة",
      gang: "العصابة",
      name: "اسم اللاعب",
      citizenid: "المعرف",
    };
    return labels[f] || f;
  };

  return (
    <>
      <div className="page-header">
        <h1>جميع الشخصيات</h1>
        <p>عرض وتعديل بيانات جميع الشخصيات · إجمالي {characters.length} شخصية</p>
      </div>
      <div className="page-content">
        <div className="toolbar">
          <div className="search-box">
            <Search />
            <input className="input" placeholder="بحث بالاسم، المعرف، رقم الهاتف..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="glass-card animate-in">
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th><th>اسم اللاعب</th><th>اسم الشخصية</th><th>المعرف</th>
                  <th>الوظيفة</th><th>العصابة</th><th>الكاش</th><th>البنك</th><th>الهاتف</th><th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const charName = c.charinfo ? `${c.charinfo.firstname} ${c.charinfo.lastname}` : "—";
                  return (
                    <tr key={c.citizenid}>
                      <td>{c.id}</td>
                      <td style={{ fontWeight: 600 }}>{c.name}</td>
                      <td style={{ color: "var(--accent-cyan)" }}>{charName}</td>
                      <td className="mono">{c.citizenid}</td>
                      <td>{c.job ? <span className="badge badge-purple">{c.job.label || c.job.name}</span> : "—"}</td>
                      <td>{c.gang?.name && c.gang.name !== "none" ? <span className="badge badge-banned">{c.gang.label || c.gang.name}</span> : "—"}</td>
                      <td style={{ color: "var(--accent-green)" }}>${(c.money?.cash || 0).toLocaleString()}</td>
                      <td style={{ color: "var(--accent-orange)" }}>${(c.money?.bank || 0).toLocaleString()}</td>
                      <td className="mono">{c.charinfo?.phone || "—"}</td>
                      <td>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button className="player-action-btn" title="تعديل" onClick={() => openEdit(c)}><Edit size={12} /></button>
                          <button className="player-action-btn danger" title="حذف" onClick={() => handleDelete(c)}><Trash2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {filtered.length === 0 && (
          <div className="empty-state"><User size={64} /><h3>لا توجد شخصيات</h3></div>
        )}
      </div>

      {/* Edit Character Modal */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700, maxHeight: "90vh" }}>
            <div className="modal-header">
              <span className="modal-title">تعديل شخصية - {editData.charinfo?.firstname} {editData.charinfo?.lastname}</span>
              <button className="modal-close" onClick={() => setEditModal(null)}>✕</button>
            </div>

            {/* Tabs */}
            <div style={{ padding: "12px 24px 0", borderBottom: "1px solid var(--glass-border)" }}>
              <div className="tabs" style={{ marginBottom: 0 }}>
                <button className={`tab ${editTab === "charinfo" ? "active" : ""}`} onClick={() => setEditTab("charinfo")}><User size={12} style={{ marginLeft: 4 }} /> الشخصية</button>
                <button className={`tab ${editTab === "money" ? "active" : ""}`} onClick={() => setEditTab("money")}><DollarSign size={12} style={{ marginLeft: 4 }} /> الأموال</button>
                <button className={`tab ${editTab === "job" ? "active" : ""}`} onClick={() => setEditTab("job")}><Briefcase size={12} style={{ marginLeft: 4 }} /> الوظيفة</button>
                <button className={`tab ${editTab === "gang" ? "active" : ""}`} onClick={() => setEditTab("gang")}><Swords size={12} style={{ marginLeft: 4 }} /> العصابة</button>
                <button className={`tab ${editTab === "meta" ? "active" : ""}`} onClick={() => setEditTab("meta")}><Shield size={12} style={{ marginLeft: 4 }} /> متقدم</button>
              </div>
            </div>

            <div className="modal-body" style={{ overflowY: "auto", maxHeight: "55vh" }}>

              {/* Character Info Tab */}
              {editTab === "charinfo" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div className="input-group">
                      <label className="input-label">الاسم الأول</label>
                      <input className="input" value={editData.charinfo?.firstname || ""} onChange={(e) => setEditData({ ...editData, charinfo: { ...editData.charinfo, firstname: e.target.value } })} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">اسم العائلة</label>
                      <input className="input" value={editData.charinfo?.lastname || ""} onChange={(e) => setEditData({ ...editData, charinfo: { ...editData.charinfo, lastname: e.target.value } })} />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div className="input-group">
                      <label className="input-label">تاريخ الميلاد</label>
                      <input className="input" placeholder="MM/DD/YYYY" value={editData.charinfo?.birthdate || ""} onChange={(e) => setEditData({ ...editData, charinfo: { ...editData.charinfo, birthdate: e.target.value } })} style={{ direction: "ltr" }} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">الجنس (0=ذكر, 1=أنثى)</label>
                      <select className="input" value={editData.charinfo?.gender ?? 0} onChange={(e) => setEditData({ ...editData, charinfo: { ...editData.charinfo, gender: parseInt(e.target.value) } })}>
                        <option value={0}>ذكر</option>
                        <option value={1}>أنثى</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div className="input-group">
                      <label className="input-label">الجنسية</label>
                      <input className="input" value={editData.charinfo?.nationality || ""} onChange={(e) => setEditData({ ...editData, charinfo: { ...editData.charinfo, nationality: e.target.value } })} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">رقم الهاتف</label>
                      <input className="input" value={editData.charinfo?.phone || ""} onChange={(e) => setEditData({ ...editData, charinfo: { ...editData.charinfo, phone: e.target.value } })} style={{ direction: "ltr" }} />
                    </div>
                  </div>
                  <div className="input-group">
                    <label className="input-label">رقم الحساب</label>
                    <input className="input" value={editData.charinfo?.account || ""} onChange={(e) => setEditData({ ...editData, charinfo: { ...editData.charinfo, account: e.target.value } })} style={{ direction: "ltr" }} />
                  </div>
                  <button className="btn btn-primary" disabled={saving} onClick={() => saveField("charinfo", editData.charinfo)}>
                    <Save size={14} /> {saving ? "جاري الحفظ..." : "حفظ معلومات الشخصية"}
                  </button>
                </div>
              )}

              {/* Money Tab */}
              {editTab === "money" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                    <div className="input-group">
                      <label className="input-label">💵 الكاش</label>
                      <input className="input" type="number" min="0" value={editData.money?.cash ?? 0} onChange={(e) => setEditData({ ...editData, money: { ...editData.money, cash: parseInt(e.target.value) || 0 } })} style={{ direction: "ltr" }} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">🏦 البنك</label>
                      <input className="input" type="number" min="0" value={editData.money?.bank ?? 0} onChange={(e) => setEditData({ ...editData, money: { ...editData.money, bank: parseInt(e.target.value) || 0 } })} style={{ direction: "ltr" }} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">₿ كريبتو</label>
                      <input className="input" type="number" min="0" value={editData.money?.crypto ?? 0} onChange={(e) => setEditData({ ...editData, money: { ...editData.money, crypto: parseInt(e.target.value) || 0 } })} style={{ direction: "ltr" }} />
                    </div>
                  </div>
                  <div style={{ padding: 14, background: "var(--bg-input)", borderRadius: 10, display: "flex", justifyContent: "space-around" }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: "var(--accent-green)" }}>${(editData.money?.cash || 0).toLocaleString()}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>الكاش</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: "var(--accent-orange)" }}>${(editData.money?.bank || 0).toLocaleString()}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>البنك</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: "var(--accent-cyan)" }}>{(editData.money?.crypto || 0).toLocaleString()}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>كريبتو</div>
                    </div>
                  </div>
                  <button className="btn btn-primary" disabled={saving} onClick={() => saveField("money", editData.money)}>
                    <Save size={14} /> {saving ? "جاري الحفظ..." : "حفظ الأموال"}
                  </button>
                </div>
              )}

              {/* Job Tab */}
              {editTab === "job" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", background: "var(--bg-input)", padding: "10px 14px", borderRadius: 8 }}>
                    💡 أدخل اسم الوظيفة ومستوى الرتبة فقط — QBCore سيكمل باقي البيانات (الاسم، الراتب، إلخ) تلقائياً عند دخول اللاعب.
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div className="input-group">
                      <label className="input-label">اسم الوظيفة (Job Name)</label>
                      <input className="input" placeholder="police, ambulance, mechanic..." value={editData.job?.name || ""} onChange={(e) => setEditData({ ...editData, job: { ...editData.job, name: e.target.value } })} style={{ direction: "ltr" }} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">مستوى الرتبة (Grade Level)</label>
                      <input className="input" type="number" min="0" value={editData.job?.grade?.level ?? 0} onChange={(e) => setEditData({ ...editData, job: { ...editData.job, grade: { ...editData.job?.grade, level: parseInt(e.target.value) || 0 } } })} style={{ direction: "ltr" }} />
                    </div>
                  </div>
                  {editData.job?.name && (
                    <div style={{ padding: 14, background: "var(--bg-input)", borderRadius: 10, display: "flex", gap: 24 }}>
                      <div><span style={{ fontSize: 11, color: "var(--text-muted)" }}>الوظيفة الحالية: </span><span style={{ fontWeight: 700, color: "var(--accent-purple)" }}>{editData.job.label || editData.job.name}</span></div>
                      <div><span style={{ fontSize: 11, color: "var(--text-muted)" }}>الرتبة: </span><span style={{ fontWeight: 700 }}>{editData.job?.grade?.name || "—"} (Lv.{editData.job?.grade?.level ?? 0})</span></div>
                    </div>
                  )}
                  <button className="btn btn-primary" disabled={saving} onClick={() => saveField("job", editData.job)}>
                    <Save size={14} /> {saving ? "جاري الحفظ..." : "حفظ الوظيفة"}
                  </button>
                </div>
              )}

              {/* Gang Tab */}
              {editTab === "gang" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", background: "var(--bg-input)", padding: "10px 14px", borderRadius: 8 }}>
                    💡 أدخل اسم العصابة ومستوى الرتبة فقط — QBCore سيكمل باقي البيانات تلقائياً.
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div className="input-group">
                      <label className="input-label">اسم العصابة (Gang Name)</label>
                      <input className="input" placeholder="none, ballas, vagos..." value={editData.gang?.name || ""} onChange={(e) => setEditData({ ...editData, gang: { ...editData.gang, name: e.target.value } })} style={{ direction: "ltr" }} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">مستوى الرتبة (Grade Level)</label>
                      <input className="input" type="number" min="0" value={editData.gang?.grade?.level ?? 0} onChange={(e) => setEditData({ ...editData, gang: { ...editData.gang, grade: { ...editData.gang?.grade, level: parseInt(e.target.value) || 0 } } })} style={{ direction: "ltr" }} />
                    </div>
                  </div>
                  {editData.gang?.name && editData.gang.name !== "none" && (
                    <div style={{ padding: 14, background: "var(--bg-input)", borderRadius: 10, display: "flex", gap: 24 }}>
                      <div><span style={{ fontSize: 11, color: "var(--text-muted)" }}>العصابة الحالية: </span><span style={{ fontWeight: 700, color: "var(--accent-red)" }}>{editData.gang.label || editData.gang.name}</span></div>
                      <div><span style={{ fontSize: 11, color: "var(--text-muted)" }}>الرتبة: </span><span style={{ fontWeight: 700 }}>{editData.gang?.grade?.name || "—"} (Lv.{editData.gang?.grade?.level ?? 0})</span></div>
                    </div>
                  )}
                  <button className="btn btn-primary" disabled={saving} onClick={() => saveField("gang", editData.gang)}>
                    <Save size={14} /> {saving ? "جاري الحفظ..." : "حفظ العصابة"}
                  </button>
                </div>
              )}

              {/* Advanced Tab */}
              {editTab === "meta" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div className="input-group">
                      <label className="input-label">اسم اللاعب (Steam/FiveM)</label>
                      <input className="input" value={editData.name || ""} onChange={(e) => setEditData({ ...editData, name: e.target.value })} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Citizen ID</label>
                      <input className="input" value={editData.citizenid || ""} disabled style={{ opacity: 0.5, direction: "ltr" }} />
                      <span style={{ fontSize: 10, color: "var(--text-muted)" }}>لا يمكن تغيير المعرف</span>
                    </div>
                  </div>

                  <div style={{ borderTop: "1px solid var(--glass-border)", paddingTop: 14, marginTop: 4 }}>
                    <button className="btn btn-primary" disabled={saving} onClick={() => saveField("name", editData.name)} style={{ marginBottom: 14 }}>
                      <Save size={14} /> {saving ? "جاري الحفظ..." : "حفظ اسم اللاعب"}
                    </button>
                  </div>

                  <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: 16 }}>
                    <h4 style={{ color: "var(--accent-red)", marginBottom: 8, fontSize: 14 }}>⚠️ منطقة خطرة</h4>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>حذف الشخصية سيزيل جميع بياناتها بشكل نهائي بما في ذلك المركبات والمخزن.</p>
                    <button className="btn btn-danger" onClick={() => handleDelete(editModal)}>
                      <Trash2 size={14} /> حذف هذه الشخصية نهائياً
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  );
}
