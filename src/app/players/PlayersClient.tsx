"use client";

import { useState } from "react";
import { Search, Ban, Package, Skull, Car, Trash2 } from "lucide-react";
import { useNotification } from "@/components/Notifications";

interface Props {
  players: any[];
  staff: any;
}

export default function PlayersClient({ players, staff }: Props) {
  const { toast, confirm } = useNotification();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [banModal, setBanModal] = useState<any>(null);
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState("0");
  const [inventoryModal, setInventoryModal] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [vehicleModal, setVehicleModal] = useState<any>(null);
  const [vehicleForm, setVehicleForm] = useState({ vehicle: "", plate: "", garage: "pillboxgarage" });

  const filtered = players.filter((p) => {
    const q = search.toLowerCase();
    const fullname = p.charinfo ? `${p.charinfo.firstname} ${p.charinfo.lastname}` : "";
    return (
      p.name?.toLowerCase().includes(q) ||
      p.citizenid?.toLowerCase().includes(q) ||
      p.license?.toLowerCase().includes(q) ||
      fullname.toLowerCase().includes(q) ||
      p.phone_number?.includes(q)
    );
  });

  const handleDeleteItem = async (citizenid: string, slot: number, itemName: string) => {
    const ok = await confirm({
      title: "حذف من المخزن",
      message: `هل أنت متأكد من حذف "${itemName}" من مخزن اللاعب؟`,
      confirmText: "🗑️ تأكيد الحذف",
      type: "danger",
    });
    if (!ok) return;
    try {
      const res = await fetch("/api/players/inventory", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ citizenid, slot }),
      });
      if (res.ok) {
        setInventory((prev) => prev.filter((item) => item.slot !== slot));
        toast(`تم حذف "${itemName}" بنجاح`, "success");
      } else {
        toast("حدث خطأ أثناء الحذف", "error");
      }
    } catch {
      toast("حدث خطأ في الاتصال", "error");
    }
  };

  const handleBan = async (player: any) => {
    try {
      const res = await fetch("/api/bans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: player.name,
          license: player.license,
          reason: banReason,
          duration: parseInt(banDuration),
          bannedBy: staff.username,
        }),
      });
      if (res.ok) {
        setBanModal(null);
        setBanReason("");
        setBanDuration("0");
        toast(`تم حظر اللاعب ${player.name} بنجاح`, "success");
      } else {
        toast("حدث خطأ أثناء الحظر", "error");
      }
    } catch {
      toast("حدث خطأ في الاتصال", "error");
    }
  };

  const handleViewInventory = async (player: any) => {
    setInventoryModal(player);
    setInventoryLoading(true);
    setInventory([]);
    try {
      const dbRes = await fetch(`/api/players/inventory?citizenid=${player.citizenid}`);
      const dbData = await dbRes.json();
      setInventory(dbData.inventory || []);
    } catch {
      setInventory([]);
    }
    setInventoryLoading(false);
  };

  const handleAddVehicle = async (player: any) => {
    if (!vehicleForm.vehicle.trim()) { toast("الرجاء إدخال اسم المركبة", "warning"); return; }
    try {
      const res = await fetch("/api/players/vehicle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          citizenid: player.citizenid,
          vehicle: vehicleForm.vehicle,
          plate: vehicleForm.plate || undefined,
          garage: vehicleForm.garage,
        }),
      });
      if (res.ok) {
        setVehicleModal(null);
        setVehicleForm({ vehicle: "", plate: "", garage: "pillboxgarage" });
        toast(`تم إضافة المركبة ${vehicleForm.vehicle} بنجاح`, "success");
      } else {
        toast("حدث خطأ أثناء الإضافة", "error");
      }
    } catch {
      toast("حدث خطأ في الاتصال", "error");
    }
  };

  const handleKill = async (player: any) => {
    const ok = await confirm({
      title: "قتل لاعب",
      message: `هل أنت متأكد من قتل اللاعب ${player.name}؟`,
      confirmText: "☠️ تأكيد القتل",
      type: "danger",
    });
    if (!ok) return;
    try {
      await fetch("/api/fivem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "kill", serverId: player.id }),
      });
      toast("تم قتل اللاعب", "success");
    } catch {
      toast("اللاعب غير متصل أو حدث خطأ", "error");
    }
  };

  return (
    <>
      <div className="page-header">
        <h1>جميع اللاعبين</h1>
        <p>عرض جميع اللاعبين المسجلين بالسيرفر · إجمالي {players.length} لاعب</p>
      </div>

      <div className="page-content">
        <div className="toolbar">
          <div className="search-box">
            <Search />
            <input className="input" placeholder="بحث بالاسم، المعرف، الرخصة..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="tabs">
            <button className={`tab ${viewMode === "grid" ? "active" : ""}`} onClick={() => setViewMode("grid")}>بطاقات</button>
            <button className={`tab ${viewMode === "table" ? "active" : ""}`} onClick={() => setViewMode("table")}>جدول</button>
          </div>
        </div>

        {viewMode === "grid" ? (
          <div className="players-grid">
            {filtered.map((player) => {
              const charName = player.charinfo ? `${player.charinfo.firstname} ${player.charinfo.lastname}` : "غير معروف";
              return (
                <div key={player.id} className="player-card animate-in">
                  <span className="player-card-id">ID: {player.id}</span>
                  <div className="player-card-header">
                    <div className="player-avatar">{player.name?.[0]?.toUpperCase() || "?"}</div>
                    <div>
                      <div className="player-name">{player.name}</div>
                      <div className="player-citizenid">{player.citizenid}</div>
                    </div>
                  </div>
                  <div className="player-info">
                    <div className="player-info-row">
                      <span className="player-info-label">الشخصية:</span>
                      <span style={{ color: "var(--accent-cyan)" }}>{charName}</span>
                    </div>
                    <div className="player-info-row">
                      <span className="player-info-label">الرخصة:</span>
                      <span className="player-info-value">{player.license?.substring(0, 20)}...</span>
                    </div>
                    {player.job && (
                      <div className="player-info-row">
                        <span className="player-info-label">الوظيفة:</span>
                        <span style={{ color: "var(--accent-green)" }}>{player.job.label || player.job.name}</span>
                      </div>
                    )}
                    {player.money && (
                      <div className="player-info-row">
                        <span className="player-info-label">المال:</span>
                        <span style={{ color: "var(--accent-orange)" }}>
                          ${(player.money.cash || 0).toLocaleString()} | ${(player.money.bank || 0).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="player-card-actions">
                    <button className="player-action-btn" title="عرض المخزن" onClick={() => handleViewInventory(player)}><Package size={14} /></button>
                    <button className="player-action-btn" title="حظر" onClick={() => setBanModal(player)}><Ban size={14} /></button>
                    <button className="player-action-btn" title="إضافة مركبة" onClick={() => { setVehicleModal(player); setVehicleForm({ vehicle: "", plate: "", garage: "pillboxgarage" }); }}><Car size={14} /></button>
                    <button className="player-action-btn danger" title="قتل" onClick={() => handleKill(player)}><Skull size={14} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-card">
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr><th>ID</th><th>الاسم</th><th>الشخصية</th><th>المعرف</th><th>الوظيفة</th><th>المال</th><th>الإجراءات</th></tr>
                </thead>
                <tbody>
                  {filtered.map((player) => {
                    const charName = player.charinfo ? `${player.charinfo.firstname} ${player.charinfo.lastname}` : "—";
                    return (
                      <tr key={player.id}>
                        <td>{player.id}</td>
                        <td style={{ fontWeight: 600 }}>{player.name}</td>
                        <td style={{ color: "var(--accent-cyan)" }}>{charName}</td>
                        <td className="mono">{player.citizenid}</td>
                        <td>{player.job?.label || "—"}</td>
                        <td style={{ color: "var(--accent-orange)" }}>{player.money ? `$${(player.money.cash || 0).toLocaleString()}` : "—"}</td>
                        <td>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button className="player-action-btn" title="عرض المخزن" onClick={() => handleViewInventory(player)}><Package size={12} /></button>
                            <button className="player-action-btn" title="حظر" onClick={() => setBanModal(player)}><Ban size={12} /></button>
                            <button className="player-action-btn" title="إضافة مركبة" onClick={() => { setVehicleModal(player); setVehicleForm({ vehicle: "", plate: "", garage: "pillboxgarage" }); }}><Car size={12} /></button>
                            <button className="player-action-btn danger" title="قتل" onClick={() => handleKill(player)}><Skull size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="empty-state"><Search size={64} /><h3>لا توجد نتائج</h3><p>لم يتم العثور على لاعبين مطابقين لبحثك</p></div>
        )}
      </div>

      {/* Inventory Modal */}
      {inventoryModal && (
        <div className="modal-overlay" onClick={() => setInventoryModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <span className="modal-title">مخزن اللاعب - {inventoryModal.name}</span>
              <button className="modal-close" onClick={() => setInventoryModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              {inventoryLoading ? (
                <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
                  <div style={{ margin: "0 auto 12px", width: 32, height: 32, border: "3px solid var(--glass-border)", borderTop: "3px solid var(--accent-cyan)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                  جاري تحميل المخزن...
                </div>
              ) : inventory.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
                  <Package size={48} style={{ margin: "0 auto 12px", display: "block", opacity: 0.3 }} />
                  المخزن فارغ أو اللاعب غير متصل
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8, maxHeight: 400, overflowY: "auto" }}>
                  {inventory.map((item: any, i: number) => (
                    <div key={i} style={{ padding: "10px 12px", background: "var(--bg-input)", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label || item.name}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Slot {item.slot} · x{item.amount}</div>
                      </div>
                      <button className="player-action-btn danger" title="حذف من المخزن" onClick={() => handleDeleteItem(inventoryModal.citizenid, item.slot, item.label || item.name)} style={{ flexShrink: 0 }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Vehicle Modal */}
      {vehicleModal && (
        <div className="modal-overlay" onClick={() => setVehicleModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">إضافة مركبة - {vehicleModal.name}</span>
              <button className="modal-close" onClick={() => setVehicleModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label className="input-label">اسم المركبة (Spawn Name) *</label>
                <input className="input" placeholder="مثال: adder, zentorno, sultan" value={vehicleForm.vehicle} onChange={(e) => setVehicleForm({ ...vehicleForm, vehicle: e.target.value })} style={{ direction: "ltr" }} />
              </div>
              <div className="input-group">
                <label className="input-label">لوحة المركبة (اختياري)</label>
                <input className="input" placeholder="مثال: ABC12345" maxLength={8} value={vehicleForm.plate} onChange={(e) => setVehicleForm({ ...vehicleForm, plate: e.target.value.toUpperCase() })} style={{ direction: "ltr" }} />
              </div>
              <div className="input-group">
                <label className="input-label">الكراج</label>
                <select className="input" value={vehicleForm.garage} onChange={(e) => setVehicleForm({ ...vehicleForm, garage: e.target.value })}>
                  <option value="pillboxgarage">Pillbox Garage</option>
                  <option value="sapcounsel">SA Parking</option>
                  <option value="intairport">Airport Garage</option>
                  <option value="lsairport">LS Airport</option>
                  <option value="motelgarage">Motel Garage</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => handleAddVehicle(vehicleModal)}><Car size={14} /> إضافة المركبة</button>
              <button className="btn btn-secondary" onClick={() => setVehicleModal(null)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Ban Modal */}
      {banModal && (
        <div className="modal-overlay" onClick={() => setBanModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">حظر لاعب - {banModal.name}</span>
              <button className="modal-close" onClick={() => setBanModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label className="input-label">سبب الحظر</label>
                <textarea className="input" rows={3} placeholder="أدخل سبب الحظر..." value={banReason} onChange={(e) => setBanReason(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">مدة الحظر (بالأيام، 0 = دائم)</label>
                <input className="input" type="number" min="0" value={banDuration} onChange={(e) => setBanDuration(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-danger" onClick={() => handleBan(banModal)}><Ban size={14} /> تأكيد الحظر</button>
              <button className="btn btn-secondary" onClick={() => setBanModal(null)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
