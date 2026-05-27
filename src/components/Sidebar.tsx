"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Car,
  Shield,
  FileText,
  UserCog,
  Settings,
  ChevronDown,
  LogOut,
  Wifi,
  Ban,
  Menu,
  X,
  AlertTriangle,
  HelpCircle,
  ListOrdered,
} from "lucide-react";
import { Permission } from "@/types";

interface SidebarProps {
  staff?: {
    username?: string;
    avatar?: string;
    permissions?: string[];
  };
}

interface NavSubItem {
  href: string;
  label: string;
  permission?: Permission;
}

interface NavItem {
  href?: string;
  icon: any;
  label: string;
  permission?: Permission;
  submenu?: NavSubItem[];
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const navItems: NavSection[] = [
  {
    label: "عام",
    items: [
      { href: "/", icon: LayoutDashboard, label: "الرئيسية" },
    ],
  },
  {
    label: "السيرفر",
    items: [
      {
        icon: Users,
        label: "اللاعبين",
        permission: Permission.VIEW_PLAYERS,
        submenu: [
          { href: "/players", label: "جميع اللاعبين", permission: Permission.VIEW_PLAYERS },
          { href: "/players/online", label: "اللاعبين المتصلين", permission: Permission.VIEW_PLAYERS },
          { href: "/players/characters", label: "جميع الشخصيات", permission: Permission.VIEW_PLAYERS },
          { href: "/players/vehicles", label: "جميع المركبات", permission: Permission.MANAGE_VEHICLES },
        ],
      },
      { href: "/bans", icon: Ban, label: "الحظر", permission: Permission.VIEW_BANS },
      { href: "/duplicates", icon: AlertTriangle, label: "لوحة التدبيل", permission: Permission.VIEW_PLAYERS },
      { href: "/queue", icon: ListOrdered, label: "طابور الانتظار", permission: Permission.MANAGE_QUEUE },
    ],
  },
  {
    label: "الإدارة",
    items: [
      { href: "/applications", icon: FileText, label: "التقديمات", permission: Permission.MANAGE_APPLICATIONS },
      { href: "/applications/questions", icon: HelpCircle, label: "أسئلة التقديم", permission: Permission.MANAGE_APPLICATIONS },
      { href: "/staff", icon: UserCog, label: "فريق الإدارة", permission: Permission.MANAGE_STAFF },
      { href: "/settings", icon: Settings, label: "الإعدادات", permission: Permission.MANAGE_SETTINGS },
    ],
  }
];

function hasPerm(permissions: string[] | undefined, required?: Permission): boolean {
  if (!required) return true; // No permission required (e.g. dashboard home)
  if (!permissions || permissions.length === 0) return false;
  if (permissions.includes(Permission.SUPER_ADMIN)) return true;
  return permissions.includes(required);
}

export default function Sidebar({ staff }: SidebarProps) {
  const pathname = usePathname();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>("اللاعبين");
  const [mobileOpen, setMobileOpen] = useState(false);
  const perms = staff?.permissions;

  const isSuperAdmin = perms?.includes(Permission.SUPER_ADMIN);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      <button
        className="mobile-menu-btn"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="فتح القائمة"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="sidebar-header" style={{ padding: '20px 16px', borderBottom: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '14px', flexShrink: 0,
              background: 'rgba(9,226,164,0.08)', border: '1px solid rgba(9,226,164,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(9,226,164,0.15)', overflow: 'hidden', padding: '4px'
            }}>
              <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div>
              <div style={{
                fontSize: '15px', fontWeight: 800, letterSpacing: '-0.3px',
                background: 'linear-gradient(135deg, #09e2a4, #00c9b1)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
              }}>لوحة التحكم</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', letterSpacing: '0.5px' }}>إدارة السيرفر</div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, overflowY: "auto" }}>
          {navItems.map((section) => {
            // Filter items by permission
            const visibleItems = section.items.filter((item) => {
              if ("submenu" in item && item.submenu) {
                // Show parent if at least one sub-item is visible
                return item.submenu.some((sub) => hasPerm(perms, sub.permission));
              }
              return hasPerm(perms, item.permission);
            });

            if (visibleItems.length === 0) return null;

            return (
              <div key={section.label} className="sidebar-section">
                <div className="sidebar-section-label">{section.label}</div>
                <ul className="sidebar-nav">
                  {visibleItems.map((item) => {
                    if ("submenu" in item && item.submenu) {
                      const visibleSubs = item.submenu.filter((sub) => hasPerm(perms, sub.permission));
                      const isSubmenuOpen = openSubmenu === item.label;
                      const isSubmenuActive = visibleSubs.some((sub) =>
                        isActive(sub.href)
                      );
                      return (
                        <li key={item.label}>
                          <button
                            className={`sidebar-link ${isSubmenuActive ? "active" : ""}`}
                            onClick={() =>
                              setOpenSubmenu(isSubmenuOpen ? null : item.label)
                            }
                            style={{
                              width: "100%",
                              background: "none",
                              border: "none",
                              textAlign: "right",
                            }}
                          >
                            <item.icon size={18} />
                            <span style={{ flex: 1 }}>{item.label}</span>
                            <ChevronDown
                              size={14}
                              style={{
                                transform: isSubmenuOpen
                                  ? "rotate(180deg)"
                                  : "rotate(0)",
                                transition: "transform 0.2s",
                              }}
                            />
                          </button>
                          {isSubmenuOpen && (
                            <ul className="sidebar-submenu">
                              {visibleSubs.map((sub) => (
                                <li key={sub.href}>
                                  <Link
                                    href={sub.href}
                                    className={`sidebar-link ${isActive(sub.href) ? "active" : ""}`}
                                    onClick={() => setMobileOpen(false)}
                                  >
                                    {sub.label}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      );
                    }

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href!}
                          className={`sidebar-link ${isActive(item.href!) ? "active" : ""}`}
                          onClick={() => setMobileOpen(false)}
                        >
                          <item.icon size={18} />
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-avatar">
            {staff?.avatar ? (
              <img src={staff.avatar} alt="" />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
                  color: "white",
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                {staff?.username?.[0] || "A"}
              </div>
            )}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">
              {staff?.username || "المدير"}
            </div>
            <div className="sidebar-user-role">
              {isSuperAdmin ? "المسؤول العام" : "طاقم الإدارة"}
            </div>
          </div>
          <Link href="/api/auth/signout" title="تسجيل خروج">
            <LogOut size={16} style={{ color: "var(--text-muted)" }} />
          </Link>
        </div>
      </aside>
    </>
  );
}
