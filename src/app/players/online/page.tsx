"use client";

import { useState, useEffect } from "react";
import { Wifi, RefreshCw, Shield, Ban, Search, Settings, X, Trash2, Package, DollarSign, MessageSquare, UserX } from "lucide-react";
import { useNotification } from "@/components/Notifications";

export default function OnlinePlayersPage() {
  const { toast } = useNotification();
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [managedPlayer, setManagedPlayer] = useState<any>(null);
  const [playerDetails, setPlayerDetails] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [kickModal, setKickModal] = useState<any>(null);
  const [kickReason, setKickReason] = useState("تم الطرد من لوحة التحكم");
  const [banModal, setBanModal] = useState<any>(null);
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState("0");
  const [giveMoneyModal, setGiveMoneyModal] = useState(false);
  const [moneyAmount, setMoneyAmount] = useState("");
  const [moneyType, setMoneyType] = useState<"cash" | "bank">("cash");
  const [moneyAction, setMoneyAction] = useState<"give_money" | "remove_money">("give_money");
  const [msgModal, setMsgModal] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [jobModal, setJobModal] = useState(false);
  const [jobName, setJobName] = useState("");
  const [jobGrade, setJobGrade] = useState("0");
  const [gangModal, setGangModal] = useState(false);
  const [gangName, setGangName] = useState("");
  const [gangGrade, setGangGrade] = useState("0");
  const [teleportModal, setTeleportModal] = useState(false);
  const [teleportLocation, setTeleportLocation] = useState("");
  const [activeTab, setActiveTab] = useState<"info" | "inventory">("info");

  // Preset teleport locations  vector3(1.65, 1.47, 70.94)
  const LOCATIONS = [
    { label: "🏥 مستشفى LS", x: 295.9, y: -1447.7, z: 29.9 },
    { label: "🏛️ المحكمة", x: -263.9, y: -955.3, z: 31.2 },
    { label: "🚓 مركز الشرطة", x: 441.0, y: -982.0, z: 30.7 },
    { label: "🎰 كازينو", x: 1.65, y: 1.47, z: 70.94 },
  ];

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/fivem?action=online_players");
      const data = await res.json();
      setPlayers(data.players || []);
    } catch { setPlayers([]); }
    setLoading(false);
  };

  useEffect(() => {
    fetchPlayers();
    const interval = setInterval(fetchPlayers, 15000);
    return () => clearInterval(interval);
  }, []);

  const openManage = async (player: any) => {
    setManagedPlayer(player);
    setPlayerDetails(null);
    setInventory([]);
    setActiveTab("info");
    setLoadingDetails(true);

    try {
      // Extract from identifiers array as fallback
      const identifiers: string[] = player.identifiers || [];
      const license = player.license || identifiers.find((i: string) => i.startsWith("license:")) || null;
      const discord = player.discord || identifiers.find((i: string) => i.startsWith("discord:"))?.replace("discord:", "") || null;

      const params = new URLSearchParams();
      if (license) params.set("license", license);
      if (discord) params.set("discord", discord);
      if (player.name) params.set("name", player.name);

      if (params.toString()) {
        const detRes = await fetch(`/api/players/details?${params}`).then(r => r.json());
        setPlayerDetails(detRes.player || null);

        if (detRes.player?.citizenid) {
          const inv = await fetch(`/api/players/inventory?citizenid=${detRes.player.citizenid}`)
            .then(r => r.json())
            .catch(() => ({ inventory: [] }));
          setInventory(inv.inventory || []);
        }
      }
    } catch { }

    setLoadingDetails(false);
  };

  const closeManage = () => { setManagedPlayer(null); setPlayerDetails(null); setInventory([]); };

  const tryFivemAction = async (action: string, extra: any = {}) => {
    try {
      const res = await fetch("/api/fivem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, serverId: managedPlayer?.id, ...extra }),
      });
      return res.ok;
    } catch { return false; }
  };

  const handleKick = async () => {
    if (!managedPlayer) return;
    const ok = await tryFivemAction("kick", { reason: kickReason });
    setKickModal(false);
    closeManage();
    if (ok) {
      toast("تم طرد اللاعب بنجاح", "success");
      fetchPlayers();
    } else {
      toast("لم يتم الاتصال بالسيرفر - تعذر الطرد المباشر", "error");
    }
  };

  const handleBan = async () => {
    if (!managedPlayer) return;
    try {
      // Get license from DB-fetched playerDetails (most reliable) or fall back to FiveM identifiers
      const licenseRaw = playerDetails?.license ||
        managedPlayer.license ||
        managedPlayer.identifiers?.find((i: string) => i.startsWith("license:")) || "";
      const licenseClean = licenseRaw.replace("license:", "");

      await fetch("/api/bans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: managedPlayer.name,
          license: licenseClean,
          reason: banReason || "حظر من لوحة التحكم",
          duration: parseInt(banDuration) || 0,
          bannedBy: "Dashboard",
        }),
      });
      // Also attempt live kick
      await tryFivemAction("kick", { reason: `[حظر] ${banReason || "تم حظرك من لوحة التحكم"}` });
      toast("تم حظر اللاعب بنجاح وحفظه في قاعدة البيانات", "success");
    } catch {
      toast("حدث خطأ أثناء الحظر", "error");
    }
    setBanModal(false);
    closeManage();
    fetchPlayers();
  };

  const removeItem = async (item: any) => {
    if (!window.confirm(`هل تريد حذف "${item.label}"؟`)) return;
    await fetch(`/api/players/inventory`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ citizenid: playerDetails?.citizenid, slot: item.slot, itemName: item.name, amount: item.amount }),
    });
    setInventory(prev => prev.filter(i => i.slot !== item.slot));
    toast("تم حذف الآيتم", "success");
  };

  const filtered = players.filter(p => {
    const q = search.toLowerCase();
    return p.name?.toLowerCase().includes(q) || String(p.id).includes(q);
  });

  const fivemPost = async (action: string, extra: any = {}) => {
    try {
      const res = await fetch("/api/fivem", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, serverId: managedPlayer?.id, ...extra }),
      });
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, data };
    } catch { return { ok: false, data: {} }; }
  };

  const actionBtns = [
    { icon: "💼", label: "تغيير الوظيفة", action: () => { setJobName(""); setJobGrade("0"); setJobModal(true); } },
    {
      icon: "👗", label: "تغيير الملابس", action: async () => {
        const { ok } = await fivemPost("clothes");
        toast(ok ? "تم فتح قائمة الملابس ✅" : "تعذر الاتصال بالسيرفر", ok ? "success" : "error");
      }
    },
    { icon: "💰", label: "إزالة المال", action: () => { setMoneyAction("remove_money"); setMoneyAmount(""); setGiveMoneyModal(true); } },
    { icon: "💵", label: "إعطاء المال", action: () => { setMoneyAction("give_money"); setMoneyAmount(""); setGiveMoneyModal(true); } },
    { icon: "✉️", label: "إرسال رسالة", action: () => { setMsgText(""); setMsgModal(true); } },
    { icon: "🏴", label: "تعيين عصابة", action: () => { setGangName(""); setGangGrade("0"); setGangModal(true); } },
    { icon: "🚗", label: "نقل اللاعب", action: () => { setTeleportLocation(""); setTeleportModal(true); } },
    { icon: "🥾", label: "طرد من السيرفر", action: () => setKickModal(true) },
    {
      icon: "💀", label: "قتل اللاعب", action: async () => {
        if (window.confirm(`قتل ${managedPlayer?.name}؟`)) {
          const { ok } = await fivemPost("kill");
          toast(ok ? "تم قتل اللاعب ✅" : "تعذر الاتصال بالسيرفر", ok ? "success" : "error");
        }
      }
    },
    { icon: "🔨", label: "حظر", action: () => setBanModal(true) },
  ];

  return (
    <>
      <div className="page-header">
        <h1>اللاعبين المتصلين</h1>
        <p>عرض اللاعبين المتصلين حالياً · {players.length} لاعب</p>
      </div>
      <div className="page-content">
        <div className="toolbar">
          <div className="search-box">
            <Search />
            <input className="input" placeholder="بحث بالاسم أو ID..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-secondary" onClick={fetchPlayers}>
            <RefreshCw size={14} className={loading ? "spin" : ""} /> تحديث
          </button>
          <span className="badge badge-online" style={{ marginRight: "auto" }}>
            <Wifi size={12} style={{ marginLeft: 6 }} /> {players.length} متصل
          </span>
        </div>

        {loading && players.length === 0 ? (
          <div className="empty-state"><p>جاري التحميل...</p></div>
        ) : (
          <div className="players-grid">
            {filtered.map(player => (
              <div key={player.id} className="player-card animate-in">
                <span className="player-card-id">ID: {player.id}</span>
                <div className="player-card-header">
                  <div className="player-avatar" style={{ background: "linear-gradient(135deg, #09e2a4, #00c9b1)" }}>
                    {player.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <div className="player-name">{player.name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span className="status-dot online" />
                      <span style={{ fontSize: 11, color: "var(--accent-green)" }}>متصل</span>
                      {player.ping !== undefined && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{player.ping}ms</span>}
                    </div>
                  </div>
                </div>
                <div className="player-info">
                  {player.discord && <div className="player-info-row"><span className="player-info-label">Discord:</span><span className="player-info-value">{player.discord}</span></div>}
                  {player.license && <div className="player-info-row"><span className="player-info-label">License:</span><span className="player-info-value" style={{ fontSize: 10 }}>{player.license.substring(0, 22)}...</span></div>}
                </div>
                <div className="player-card-actions">
                  <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => openManage(player)}>
                    <Settings size={13} /> إدارة
                  </button>
                  <button className="player-action-btn danger" title="حظر" onClick={() => { setManagedPlayer(player); setBanModal(true); }}>
                    <Ban size={14} />
                  </button>
                  <button className="player-action-btn danger" title="طرد" onClick={() => { setManagedPlayer(player); setKickModal(true); }}>
                    <Shield size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="empty-state"><Wifi size={64} /><h3>لا يوجد لاعبين متصلين</h3></div>
        )}
      </div>

      {/* ===== MANAGEMENT PANEL ===== */}
      {managedPlayer && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--glass-border)", borderRadius: 20, width: "100%", maxWidth: 950, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {/* Header */}
            <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--glass-border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(9,226,164,0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #09e2a4, #00c9b1)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18, color: "#050f0d" }}>
                  {managedPlayer.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{managedPlayer.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span className="status-dot online" />
                    <span style={{ fontSize: 12, color: "var(--accent-green)" }}>متصل الآن</span>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>· ID: {managedPlayer.id}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-danger btn-sm" onClick={() => setBanModal(true)}><Ban size={13} /> حظر</button>
                <button className="btn btn-secondary btn-sm" onClick={() => setKickModal(true)}><UserX size={13} /> طرد</button>
                <button onClick={closeManage} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 8 }}><X size={20} /></button>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 4, padding: "12px 24px 0", borderBottom: "1px solid var(--glass-border)" }}>
              {[{ id: "info", label: "معلومات اللاعب" }, { id: "inventory", label: "الحقيبة" }].map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id as any)} style={{ padding: "8px 20px", borderRadius: "8px 8px 0 0", border: "none", background: activeTab === t.id ? "rgba(9,226,164,0.15)" : "transparent", color: activeTab === t.id ? "var(--accent-cyan)" : "var(--text-muted)", fontWeight: activeTab === t.id ? 700 : 500, fontSize: 13, cursor: "pointer", borderBottom: activeTab === t.id ? "2px solid var(--accent-cyan)" : "2px solid transparent" }}>
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
              {loadingDetails ? (
                <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>جاري تحميل البيانات...</div>
              ) : activeTab === "info" ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  {/* Identifiers */}
                  <div className="glass-card">
                    <div className="glass-card-header"><span className="glass-card-title">المعرفات</span></div>
                    <div className="glass-card-body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {[
                        { label: "🔢 رقم الهوية", value: playerDetails?.citizenid },
                        { label: "📱 رقم الجوال", value: playerDetails?.phone },
                        { label: "🎮 Steam", value: managedPlayer.identifiers?.find((i: string) => i.startsWith("steam:")) },
                        { label: "🪪 الرخصة", value: managedPlayer.license },
                        { label: "🎂 تاريخ الميلاد", value: playerDetails?.birthdate },
                        { label: "🌍 الجنسية", value: playerDetails?.nationality },
                        { label: "🖐 البصمة", value: playerDetails?.fingerprint },
                        { label: "🩸 فصيلة الدم", value: playerDetails?.bloodtype },
                        { label: "📞 الكول سين", value: playerDetails?.callsign },
                        { label: "💬 العصابة", value: playerDetails?.gang?.label },
                      ].map((row, i) => row.value ? (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                          <span style={{ color: "var(--text-muted)", fontSize: 12, flexShrink: 0 }}>{row.label}</span>
                          <span style={{ fontFamily: "monospace", fontSize: 11, color: "var(--text-secondary)", direction: "ltr", textAlign: "right", wordBreak: "break-all", maxWidth: "60%" }}>{String(row.value)}</span>
                        </div>
                      ) : null)}
                    </div>
                  </div>

                  {/* Job & Money */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div className="glass-card">
                      <div className="glass-card-header"><span className="glass-card-title">💼 الوظيفة</span></div>
                      <div className="glass-card-body">
                        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--accent-cyan)" }}>{playerDetails?.job?.label || playerDetails?.job?.name || "—"}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{playerDetails?.job?.grade?.name || ""}</div>
                      </div>
                    </div>
                    <div className="glass-card">
                      <div className="glass-card-header"><span className="glass-card-title">💰 المال</span></div>
                      <div className="glass-card-body" style={{ display: "flex", gap: 20 }}>
                        <div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>الكاش</div>
                          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--accent-green)" }}>${(playerDetails?.money?.cash || 0).toLocaleString()}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>البنك</div>
                          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--accent-cyan)" }}>${(playerDetails?.money?.bank || 0).toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ gridColumn: "1 / -1" }}>
                    <div style={{ marginBottom: 12, fontWeight: 700, fontSize: 14 }}>الإجراءات</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 10 }}>
                      {actionBtns.map((btn, i) => (
                        <button key={i} onClick={btn.action} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "12px 8px", background: "var(--bg-input)", border: "1px solid var(--glass-border)", borderRadius: 12, cursor: "pointer", transition: "all 0.2s", color: "var(--text-primary)", fontSize: 12 }}
                          onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--accent-cyan)")}
                          onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--glass-border)")}>
                          <span style={{ fontSize: 22 }}>{btn.icon}</span>
                          <span style={{ textAlign: "center", lineHeight: 1.3 }}>{btn.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Inventory Tab */
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                    {inventory.length === 0 ? (
                      <div className="empty-state" style={{ gridColumn: "1/-1" }}><Package size={48} /><h3>الحقيبة فارغة</h3></div>
                    ) : inventory.map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "var(--bg-input)", border: "1px solid var(--glass-border)", borderRadius: 12, gap: 10 }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{item.label || item.name}</div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>الكمية: {item.amount}</div>
                        </div>
                        <button onClick={() => removeItem(item)} style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 8, padding: "6px 8px", cursor: "pointer", color: "var(--accent-red)" }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Kick Modal */}
      {kickModal && (
        <div className="modal-overlay" onClick={() => setKickModal(false)} style={{ zIndex: 1100 }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><span className="modal-title">طرد - {managedPlayer?.name}</span><button className="modal-close" onClick={() => setKickModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="input-group"><label className="input-label">سبب الطرد</label><textarea className="input" rows={2} value={kickReason} onChange={e => setKickReason(e.target.value)} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-danger" onClick={handleKick}><Shield size={14} /> تأكيد الطرد</button>
              <button className="btn btn-secondary" onClick={() => setKickModal(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Ban Modal */}
      {banModal && (
        <div className="modal-overlay" onClick={() => setBanModal(false)} style={{ zIndex: 1100 }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><span className="modal-title">حظر - {managedPlayer?.name}</span><button className="modal-close" onClick={() => setBanModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="input-group"><label className="input-label">سبب الحظر</label><textarea className="input" rows={3} value={banReason} onChange={e => setBanReason(e.target.value)} placeholder="أدخل سبب الحظر..." /></div>
              <div className="input-group"><label className="input-label">المدة بالأيام (0 = دائم)</label><input className="input" type="number" min="0" value={banDuration} onChange={e => setBanDuration(e.target.value)} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-danger" onClick={handleBan}><Ban size={14} /> تأكيد الحظر</button>
              <button className="btn btn-secondary" onClick={() => setBanModal(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Give / Remove Money Modal */}
      {giveMoneyModal && (
        <div className="modal-overlay" onClick={() => setGiveMoneyModal(false)} style={{ zIndex: 1100 }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{moneyAction === "give_money" ? "إعطاء مال" : "إزالة مال"} — {managedPlayer?.name}</span>
              <button className="modal-close" onClick={() => setGiveMoneyModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="input-group"><label className="input-label">نوع المال</label>
                <select className="input" value={moneyType} onChange={e => setMoneyType(e.target.value as any)}>
                  <option value="cash">كاش</option><option value="bank">بنك</option>
                </select>
              </div>
              <div className="input-group"><label className="input-label">المبلغ</label>
                <input className="input" type="number" min="1" value={moneyAmount} onChange={e => setMoneyAmount(e.target.value)} placeholder="0" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={async () => {
                if (!playerDetails?.citizenid || !moneyAmount) { toast("أدخل المبلغ", "error"); return; }
                const res = await fetch("/api/players/actions", {
                  method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: moneyAction, citizenid: playerDetails.citizenid, moneyType, amount: moneyAmount }),
                }).then(r => r.json());
                if (res.success) { toast(moneyAction === "give_money" ? "تم إعطاء المال ✅" : "تم إزالة المال ✅", "success"); setGiveMoneyModal(false); }
                else toast(res.error || "فشلت العملية", "error");
              }}><DollarSign size={14} /> تأكيد</button>
              <button className="btn btn-secondary" onClick={() => setGiveMoneyModal(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {msgModal && (
        <div className="modal-overlay" onClick={() => setMsgModal(false)} style={{ zIndex: 1100 }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><span className="modal-title">إرسال رسالة — {managedPlayer?.name}</span><button className="modal-close" onClick={() => setMsgModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="input-group"><label className="input-label">الرسالة</label><textarea className="input" rows={3} value={msgText} onChange={e => setMsgText(e.target.value)} placeholder="أدخل الرسالة..." /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={async () => {
                if (!msgText.trim()) { toast("أدخل نص الرسالة", "error"); return; }
                const res = await fetch("/api/players/actions", {
                  method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "notify", serverId: managedPlayer?.id, message: msgText }),
                }).then(r => r.json());
                toast(res.success ? "تم إرسال الرسالة ✅" : "تعذر الإرسال — السيرفر غير متصل", res.success ? "success" : "error");
                setMsgModal(false);
              }}><MessageSquare size={14} /> إرسال</button>
              <button className="btn btn-secondary" onClick={() => setMsgModal(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Change Job Modal */}
      {jobModal && (
        <div className="modal-overlay" onClick={() => setJobModal(false)} style={{ zIndex: 1100 }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><span className="modal-title">تغيير الوظيفة — {managedPlayer?.name}</span><button className="modal-close" onClick={() => setJobModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="input-group"><label className="input-label">اسم الوظيفة (مثال: police)</label><input className="input" value={jobName} onChange={e => setJobName(e.target.value)} placeholder="unemployed" /></div>
              <div className="input-group"><label className="input-label">الرتبة (رقم)</label><input className="input" type="number" min="0" value={jobGrade} onChange={e => setJobGrade(e.target.value)} placeholder="0" /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={async () => {
                if (!jobName.trim()) { toast("أدخل اسم الوظيفة", "error"); return; }
                if (!playerDetails?.citizenid) { toast("لم يتم تحميل بيانات اللاعب بعد", "error"); return; }
                // Try live bridge first
                const { ok: bridgeOk } = await fivemPost("set_job", { jobName: jobName.trim(), jobGrade: parseInt(jobGrade) || 0 });
                if (bridgeOk) { toast("تم تغيير الوظيفة في اللعبة الآن ✅", "success"); setJobModal(false); return; }
                // Fallback to DB
                const res = await fetch("/api/players/actions", {
                  method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "set_job", citizenid: playerDetails.citizenid, jobName: jobName.trim(), jobGrade: parseInt(jobGrade) || 0 }),
                }).then(r => r.json());
                if (res.success) { toast("تم تغيير الوظيفة ✅ (يطبق عند إعادة الدخول)", "success"); setJobModal(false); }
                else toast(res.error || "فشلت العملية", "error");
              }}>💼 تأكيد</button>
              <button className="btn btn-secondary" onClick={() => setJobModal(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Set Gang Modal */}
      {gangModal && (
        <div className="modal-overlay" onClick={() => setGangModal(false)} style={{ zIndex: 1100 }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><span className="modal-title">تعيين عصابة — {managedPlayer?.name}</span><button className="modal-close" onClick={() => setGangModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="input-group"><label className="input-label">اسم العصابة (مثال: ballas)</label><input className="input" value={gangName} onChange={e => setGangName(e.target.value)} placeholder="none" /></div>
              <div className="input-group"><label className="input-label">الرتبة (رقم)</label><input className="input" type="number" min="0" value={gangGrade} onChange={e => setGangGrade(e.target.value)} placeholder="0" /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={async () => {
                if (!gangName.trim()) { toast("أدخل اسم العصابة", "error"); return; }
                if (!playerDetails?.citizenid) { toast("لم يتم تحميل بيانات اللاعب بعد", "error"); return; }
                const res = await fetch("/api/fivem", {
                  method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "set_gang", serverId: managedPlayer?.id, gangName: gangName.trim(), gangGrade: parseInt(gangGrade) || 0 }),
                });
                if (res.ok) { toast("تم تعيين العصابة في اللعبة الآن ✅", "success"); setGangModal(false); return; }
                // Fallback to DB
                const dbRes = await fetch("/api/players/actions", {
                  method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "set_gang", citizenid: playerDetails.citizenid, gangName: gangName.trim(), gangGrade: parseInt(gangGrade) || 0 }),
                }).then(r => r.json());
                if (dbRes.success) { toast("تم تعيين العصابة ✅ (يطبق عند إعادة الدخول)", "success"); setGangModal(false); }
                else toast(dbRes.error || "فشلت العملية", "error");
              }}>🏴 تأكيد</button>
              <button className="btn btn-secondary" onClick={() => setGangModal(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Teleport Modal */}
      {teleportModal && (
        <div className="modal-overlay" onClick={() => setTeleportModal(false)} style={{ zIndex: 1100 }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header"><span className="modal-title">نقل اللاعب — {managedPlayer?.name}</span><button className="modal-close" onClick={() => setTeleportModal(false)}>✕</button></div>
            <div className="modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                {LOCATIONS.map((loc, i) => (
                  <button key={i} onClick={() => setTeleportLocation(JSON.stringify(loc))}
                    style={{
                      padding: "10px 8px", borderRadius: 8, border: teleportLocation === JSON.stringify(loc) ? "2px solid var(--accent-cyan)" : "1px solid var(--glass-border)",
                      background: teleportLocation === JSON.stringify(loc) ? "rgba(9,226,164,0.12)" : "var(--bg-tertiary)",
                      color: "var(--text-primary)", fontSize: 12, cursor: "pointer", textAlign: "center", transition: "all 0.2s"
                    }}>
                    {loc.label}
                  </button>
                ))}
              </div>
              <div className="input-group">
                <label className="input-label">أو أدخل كوردينيت يدوياً (X,Y,Z)</label>
                <input className="input" placeholder="مثال: 441.0,-982.0,30.7" value={typeof teleportLocation === "string" && teleportLocation.startsWith("{") ? "" : teleportLocation}
                  onChange={e => setTeleportLocation(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={async () => {
                let coords = { x: 0, y: 0, z: 0 };
                if (teleportLocation.startsWith("{")) {
                  const loc = JSON.parse(teleportLocation);
                  coords = { x: loc.x, y: loc.y, z: loc.z };
                } else if (teleportLocation.includes(",")) {
                  const parts = teleportLocation.split(",").map(Number);
                  coords = { x: parts[0] || 0, y: parts[1] || 0, z: parts[2] || 0 };
                } else { toast("اختر موقع أو أدخل كوردينيت", "error"); return; }
                const { ok } = await fivemPost("teleport", coords);
                toast(ok ? "تم نقل اللاعب ✅" : "تعذر الاتصال بالسيرفر", ok ? "success" : "error");
                setTeleportModal(false);
              }}>🚗 نقل</button>
              <button className="btn btn-secondary" onClick={() => setTeleportModal(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
