import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma, { getPlayerCount, getVehicleCount, getBanCount } from "@/lib/prisma";
import { getServerStatus } from "@/lib/fivem";
import {
  Users,
  Wifi,
  Ban,
  FileText,
  Car,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!(session as any)?.staff) redirect("/login");
  const staff = (session as any).staff;

  let totalPlayers = 0, totalVehicles = 0, totalBans = 0, pendingApps = 0;
  let serverStatus = { online: false, players: 0, maxPlayers: 32, hostname: "السيرفر" };
  let recentBans: any[] = [];
  let recentApps: any[] = [];

  try {
    [totalPlayers, totalVehicles, totalBans, pendingApps, recentBans, recentApps] = await Promise.all([
      getPlayerCount(),
      getVehicleCount(),
      getBanCount(),
      prisma.dashboardApplication.count({ where: { status: "pending" } }),
      prisma.$queryRawUnsafe('SELECT * FROM bans ORDER BY id DESC LIMIT 5') as Promise<any[]>,
      prisma.dashboardApplication.findMany({ where: { status: "pending" }, orderBy: { createdAt: "desc" }, take: 5 }),
    ]);
    serverStatus = await getServerStatus();
  } catch (e) {
    console.error("Dashboard data fetch error:", e);
  }

  return (
    <>
      <div className="page-header">
        <h1>الرئيسية</h1>
        <p>مرحباً {staff.username}، هذه نظرة عامة على السيرفر</p>
      </div>
      <div className="page-content">
        <div className="glass-card animate-in" style={{ marginBottom: 24, padding: "16px 24px", display: "flex", alignItems: "center", gap: 16 }}>
          <span className={`status-dot ${serverStatus.online ? "online" : "offline"}`} />
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>{serverStatus.hostname}</span>
            <span style={{ color: "var(--text-muted)", marginRight: 12, fontSize: 13 }}>
              {serverStatus.online ? "متصل" : "غير متصل"}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--accent-green)" }}>
            <Wifi size={16} />
            <span style={{ fontWeight: 700 }}>{serverStatus.players}/{serverStatus.maxPlayers}</span>
            <span style={{ color: "var(--text-muted)", fontSize: 12 }}>لاعب</span>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card animate-in stagger-1">
            <div className="stat-card-header">
              <div><div className="stat-card-value">{totalPlayers}</div><div className="stat-card-label">إجمالي اللاعبين</div></div>
              <div className="stat-card-icon purple"><Users size={20} /></div>
            </div>
          </div>
          <div className="stat-card animate-in stagger-2">
            <div className="stat-card-header">
              <div><div className="stat-card-value">{serverStatus.players}</div><div className="stat-card-label">اللاعبين المتصلين</div></div>
              <div className="stat-card-icon green"><Wifi size={20} /></div>
            </div>
          </div>
          <div className="stat-card animate-in stagger-3">
            <div className="stat-card-header">
              <div><div className="stat-card-value">{totalVehicles}</div><div className="stat-card-label">إجمالي المركبات</div></div>
              <div className="stat-card-icon cyan"><Car size={20} /></div>
            </div>
          </div>
          <div className="stat-card animate-in stagger-4">
            <div className="stat-card-header">
              <div><div className="stat-card-value">{totalBans}</div><div className="stat-card-label">حالات الحظر</div></div>
              <div className="stat-card-icon red"><Ban size={20} /></div>
            </div>
          </div>
          <div className="stat-card animate-in stagger-1">
            <div className="stat-card-header">
              <div><div className="stat-card-value">{pendingApps}</div><div className="stat-card-label">تقديمات معلقة</div></div>
              <div className="stat-card-icon orange"><FileText size={20} /></div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div className="glass-card animate-in">
            <div className="glass-card-header">
              <span className="glass-card-title">آخر حالات الحظر</span>
              <Ban size={16} style={{ color: "var(--accent-red)" }} />
            </div>
            <div className="glass-card-body">
              {recentBans.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: 20 }}>لا توجد حالات حظر</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {recentBans.map((ban: any) => (
                    <div key={ban.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "var(--bg-input)", borderRadius: "var(--radius-md)" }}>
                      <Ban size={14} style={{ color: "var(--accent-red)", flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ban.name || "غير معروف"}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ban.reason || "بدون سبب"}</div>
                      </div>
                      <span className={`badge ${ban.permanent ? "badge-banned" : "badge-pending"}`}>{ban.permanent ? "دائم" : "مؤقت"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="glass-card animate-in">
            <div className="glass-card-header">
              <span className="glass-card-title">التقديمات المعلقة</span>
              <FileText size={16} style={{ color: "var(--accent-orange)" }} />
            </div>
            <div className="glass-card-body">
              {recentApps.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: 20 }}>لا توجد تقديمات معلقة</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {recentApps.map((app: any) => (
                    <div key={app.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "var(--bg-input)", borderRadius: "var(--radius-md)" }}>
                      <FileText size={14} style={{ color: "var(--accent-orange)", flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{app.applicantName}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{app.applicantDiscord || "بدون Discord"}</div>
                      </div>
                      <span className="badge badge-pending">معلق</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
