"use client";

import { useState } from "react";
import { Save, Server, Shield, Globe } from "lucide-react";
import { useNotification } from "@/components/Notifications";

export default function SettingsPage() {
  const { toast } = useNotification();
  const [settings, setSettings] = useState({
    serverName: "",
    fivemUrl: "",
    apiKey: "",
    discordGuildId: "",
  });
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      toast("حدث خطأ", "error");
    }
  };

  return (
    <>
      <div className="page-header">
        <h1>الإعدادات</h1>
        <p>إعدادات لوحة التحكم والاتصال بالسيرفر</p>
      </div>
      <div className="page-content">
        <div style={{ maxWidth: 600, display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="glass-card animate-in">
            <div className="glass-card-header">
              <span className="glass-card-title"><Server size={16} style={{ marginLeft: 8, verticalAlign: "middle" }} /> إعدادات السيرفر</span>
            </div>
            <div className="glass-card-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="input-group">
                <label className="input-label">اسم السيرفر</label>
                <input className="input" placeholder="اسم السيرفر" value={settings.serverName} onChange={(e) => setSettings({ ...settings, serverName: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">رابط سيرفر FiveM</label>
                <input className="input" placeholder="http://ip:30120" value={settings.fivemUrl} onChange={(e) => setSettings({ ...settings, fivemUrl: e.target.value })} style={{ direction: "ltr" }} />
              </div>
              <div className="input-group">
                <label className="input-label">مفتاح API</label>
                <input className="input" type="password" placeholder="المفتاح المشترك مع ريسورس FiveM" value={settings.apiKey} onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="glass-card animate-in">
            <div className="glass-card-header">
              <span className="glass-card-title"><Globe size={16} style={{ marginLeft: 8, verticalAlign: "middle" }} /> إعدادات Discord</span>
            </div>
            <div className="glass-card-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="input-group">
                <label className="input-label">معرف سيرفر Discord</label>
                <input className="input" placeholder="Guild ID" value={settings.discordGuildId} onChange={(e) => setSettings({ ...settings, discordGuildId: e.target.value })} style={{ direction: "ltr" }} />
              </div>
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleSave} style={{ width: "fit-content" }}>
            <Save size={14} /> {saved ? "تم الحفظ ✓" : "حفظ الإعدادات"}
          </button>
        </div>
      </div>
    </>
  );
}
