"use client";

import { useState, useEffect } from "react";
import { RefreshCw, AlertTriangle, Copy, Users, Package, Search, Trash2 } from "lucide-react";
import { useNotification } from "@/components/Notifications";

export default function DuplicatesPage() {
  const { toast, confirm } = useNotification();
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalScanned, setTotalScanned] = useState(0);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "cross" | "same">("all");

  const fetchDuplicates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/duplicates");
      const data = await res.json();
      setDuplicates(data.duplicates || []);
      setTotalScanned(data.totalScanned || 0);
    } catch {
      toast("حدث خطأ أثناء الفحص", "error");
    }
    setLoading(false);
  };

  useEffect(() => { fetchDuplicates(); }, []);

  const filtered = duplicates.filter((d) => {
    const q = search.toLowerCase();
    const matchesSearch =
      d.serial?.toLowerCase().includes(q) ||
      d.itemName?.toLowerCase().includes(q) ||
      d.entries?.some((e: any) =>
        e.playerName?.toLowerCase().includes(q) ||
        e.charName?.toLowerCase().includes(q) ||
        e.citizenid?.toLowerCase().includes(q)
      );
    if (filter === "cross") return matchesSearch && d.uniquePlayerCount > 1;
    if (filter === "same") return matchesSearch && d.uniquePlayerCount === 1;
    return matchesSearch;
  });

  const crossPlayerCount = duplicates.filter((d) => d.uniquePlayerCount > 1).length;
  const samePlayerCount = duplicates.filter((d) => d.uniquePlayerCount === 1).length;

  const handleDeleteItem = async (citizenid: string, slot: number, itemName: string, itemLabel: string, amount: number) => {
    const ok = await confirm({
      title: "حذف آيتم مكرر",
      message: `هل أنت متأكد من حذف "${itemLabel}" (Slot ${slot}) من مخزن اللاعب؟`,
      confirmText: "🗑️ حذف",
      type: "danger",
    });
    if (!ok) return;
    try {
      const res = await fetch("/api/players/inventory", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ citizenid, slot, itemName, amount }),
      });
      if (res.ok) {
        toast("تم حذف الآيتم بنجاح", "success");
        fetchDuplicates();
      } else {
        toast("حدث خطأ", "error");
      }
    } catch {
      toast("حدث خطأ في الاتصال", "error");
    }
  };

  return (
    <>
      <div className="page-header">
        <h1>لوحة التدبيل</h1>
        <p>كشف الآيتمات المكررة (نفس السيريال نمبر) بين اللاعبين</p>
      </div>
      <div className="page-content">
        {/* Stats */}
        <div className="stats-grid" style={{ marginBottom: 20 }}>
          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-card-icon red"><AlertTriangle size={20} /></div>
            </div>
            <div className="stat-card-value">{duplicates.length}</div>
            <div className="stat-card-label">إجمالي المكررات</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-card-icon orange"><Users size={20} /></div>
            </div>
            <div className="stat-card-value">{crossPlayerCount}</div>
            <div className="stat-card-label">تدبيل بين لاعبين مختلفين</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-card-icon cyan"><Package size={20} /></div>
            </div>
            <div className="stat-card-value">{samePlayerCount}</div>
            <div className="stat-card-label">تكرار عند نفس اللاعب</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-card-icon purple"><Search size={20} /></div>
            </div>
            <div className="stat-card-value">{totalScanned}</div>
            <div className="stat-card-label">شخصيات تم فحصها</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <div className="search-box">
            <Search />
            <input className="input" placeholder="بحث بالسيريال، اسم الآيتم، اللاعب..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="tabs">
            <button className={`tab ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>الكل ({duplicates.length})</button>
            <button className={`tab ${filter === "cross" ? "active" : ""}`} onClick={() => setFilter("cross")}>بين لاعبين ({crossPlayerCount})</button>
            <button className={`tab ${filter === "same" ? "active" : ""}`} onClick={() => setFilter("same")}>نفس اللاعب ({samePlayerCount})</button>
          </div>
          <button className="btn btn-secondary" onClick={fetchDuplicates} disabled={loading}>
            <RefreshCw size={14} className={loading ? "spin" : ""} /> {loading ? "جاري الفحص..." : "إعادة الفحص"}
          </button>
        </div>

        {loading && duplicates.length === 0 ? (
          <div className="empty-state">
            <div style={{ width: 48, height: 48, border: "3px solid var(--glass-border)", borderTop: "3px solid var(--accent-purple)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
            <h3>جاري فحص جميع المخزونات...</h3>
            <p>يتم مقارنة السيريال نمبر لجميع الآيتمات</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <AlertTriangle size={64} />
            <h3>لا توجد مكررات</h3>
            <p>لم يتم العثور على آيتمات بنفس السيريال نمبر</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {filtered.map((dup, i) => (
              <div key={i} className="glass-card animate-in">
                {/* Header */}
                <div className="glass-card-header">
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 8,
                      background: dup.uniquePlayerCount > 1 ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)",
                      color: dup.uniquePlayerCount > 1 ? "var(--accent-red)" : "var(--accent-orange)",
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      <AlertTriangle size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{dup.itemName}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", direction: "ltr", textAlign: "right" }}>
                        Serial: <span style={{ color: "var(--accent-cyan)", fontFamily: "monospace" }}>{dup.serial}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <span className={`badge ${dup.uniquePlayerCount > 1 ? "badge-banned" : "badge-pending"}`}>
                      {dup.uniquePlayerCount > 1 ? `⚠️ ${dup.uniquePlayerCount} لاعبين مختلفين` : "نفس اللاعب"}
                    </span>
                    <span className="badge badge-purple">{dup.count} نسخة</span>
                  </div>
                </div>

                {/* Entries table */}
                <div className="data-table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr><th>اللاعب</th><th>الشخصية</th><th>المعرف</th><th>الآيتم</th><th>Slot</th><th>الكمية</th><th>إجراء</th></tr>
                    </thead>
                    <tbody>
                      {dup.entries.map((entry: any, j: number) => (
                        <tr key={j}>
                          <td style={{ fontWeight: 600 }}>{entry.playerName}</td>
                          <td style={{ color: "var(--accent-cyan)" }}>{entry.charName}</td>
                          <td className="mono">{entry.citizenid}</td>
                          <td>{entry.itemLabel}</td>
                          <td>{entry.slot}</td>
                          <td>{entry.amount}</td>
                          <td>
                            <button
                              className="player-action-btn danger"
                              title="حذف هذا الآيتم"
                              onClick={() => handleDeleteItem(entry.citizenid, entry.slot, entry.itemName, entry.itemLabel, entry.amount)}
                            >
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
