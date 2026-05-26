"use client";

import { useState } from "react";
import { UserPlus, Trash2, Shield, Edit, Save, X } from "lucide-react";
import { useNotification } from "@/components/Notifications";
import { Permission } from "@/types";
import { PermissionLabels } from "@/lib/permissions";

interface Props {
  staffMembers: any[];
  currentStaff: any;
}

const allPermissions = Object.values(Permission);

export default function StaffClient({ staffMembers, currentStaff }: Props) {
  const { toast, confirm } = useNotification();
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState<any>(null);
  const [newDiscordId, setNewDiscordId] = useState("");
  const [newPerms, setNewPerms] = useState<string[]>([]);
  const [editPerms, setEditPerms] = useState<string[]>([]);

  const currentPerms: string[] = currentStaff.permissions || [];
  const canManageStaff = currentPerms.includes(Permission.SUPER_ADMIN) || currentPerms.includes(Permission.MANAGE_STAFF);

  const handleAdd = async () => {
    if (!newDiscordId.trim()) { toast("الرجاء إدخال معرف Discord", "warning"); return; }
    try {
      await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discordId: newDiscordId, permissions: newPerms }),
      });
      setAddModal(false);
      setNewDiscordId("");
      setNewPerms([]);
      window.location.reload();
    } catch {
      toast("حدث خطأ", "error");
    }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: "حذف عضو",
      message: "هل أنت متأكد من حذف هذا العضو من فريق الإدارة؟",
      confirmText: "🗑️ تأكيد الحذف",
      type: "danger",
    });
    if (!ok) return;
    try {
      await fetch(`/api/staff?id=${id}`, { method: "DELETE" });
      toast("تم حذف العضو بنجاح", "success");
      window.location.reload();
    } catch {
      toast("حدث خطأ", "error");
    }
  };

  const handleEdit = async () => {
    try {
      await fetch("/api/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editModal.id, permissions: editPerms }),
      });
      setEditModal(null);
      window.location.reload();
    } catch {
      toast("حدث خطأ", "error");
    }
  };

  const openEdit = (member: any) => {
    setEditModal(member);
    setEditPerms(member.permissions || []);
  };

  const togglePerm = (perm: string, target: "new" | "edit") => {
    if (target === "new") {
      setNewPerms((prev) => prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]);
    } else {
      setEditPerms((prev) => prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]);
    }
  };

  const isSuperAdmin = (perms: string[]) => perms?.includes(Permission.SUPER_ADMIN);

  const getPermCount = (perms: string[]) => {
    if (isSuperAdmin(perms)) return "جميع الصلاحيات";
    return `${perms?.length || 0} صلاحية`;
  };

  return (
    <>
      <div className="page-header">
        <h1>فريق الإدارة</h1>
        <p>إدارة أعضاء فريق الإدارة والصلاحيات · {staffMembers.length} عضو</p>
      </div>
      <div className="page-content">
        {canManageStaff && (
          <div className="toolbar">
            <button className="btn btn-primary" onClick={() => setAddModal(true)}>
              <UserPlus size={14} /> إضافة عضو جديد
            </button>
          </div>
        )}

        <div className="players-grid">
          {staffMembers.map((member) => (
            <div key={member.id} className="player-card animate-in">
              <div className="player-card-header">
                <div className="player-avatar">
                  {member.avatar ? (
                    <img src={member.avatar} alt="" />
                  ) : (
                    member.username?.[0]?.toUpperCase() || "?"
                  )}
                </div>
                <div>
                  <div className="player-name">{member.username || "غير معرف"}</div>
                  <div style={{ fontSize: 12, color: "var(--accent-purple)", fontWeight: 600 }}>
                    {isSuperAdmin(member.permissions) ? "المسؤول العام" : "طاقم الإدارة"}
                  </div>
                </div>
              </div>
              <div className="player-info">
                <div className="player-info-row">
                  <span className="player-info-label">Discord ID:</span>
                  <span className="player-info-value">{member.discordId}</span>
                </div>
                <div className="player-info-row">
                  <span className="player-info-label">الصلاحيات:</span>
                  <span style={{ color: "var(--accent-cyan)", fontSize: 12 }}>
                    {getPermCount(member.permissions)}
                  </span>
                </div>
                <div className="player-info-row">
                  <span className="player-info-label">تاريخ الإضافة:</span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {new Date(member.createdAt).toLocaleDateString("ar-SA")}
                  </span>
                </div>
              </div>
              {canManageStaff && member.discordId !== currentStaff.discordId && (
                <div className="player-card-actions">
                  <button className="player-action-btn" title="تعديل" onClick={() => openEdit(member)}>
                    <Edit size={14} />
                  </button>
                  <button className="player-action-btn danger" title="حذف" onClick={() => handleDelete(member.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add Staff Modal */}
      {addModal && (
        <div className="modal-overlay" onClick={() => setAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <span className="modal-title">إضافة عضو جديد</span>
              <button className="modal-close" onClick={() => setAddModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label className="input-label">معرف Discord</label>
                <input className="input" placeholder="مثال: 123456789012345678" value={newDiscordId} onChange={(e) => setNewDiscordId(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">الصلاحيات</label>
                <div className="permissions-grid">
                  {allPermissions.map((perm) => (
                    <label key={perm} className="permission-item">
                      <span>{PermissionLabels[perm] || perm}</span>
                      <label className="toggle">
                        <input type="checkbox" checked={newPerms.includes(perm)} onChange={() => togglePerm(perm, "new")} />
                        <span className="toggle-slider" />
                      </label>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={handleAdd}><UserPlus size={14} /> إضافة</button>
              <button className="btn btn-secondary" onClick={() => setAddModal(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Permissions Modal */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <span className="modal-title">تعديل صلاحيات - {editModal.username}</span>
              <button className="modal-close" onClick={() => setEditModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label className="input-label">الصلاحيات</label>
                <div className="permissions-grid">
                  {allPermissions.map((perm) => (
                    <label key={perm} className="permission-item">
                      <span>{PermissionLabels[perm] || perm}</span>
                      <label className="toggle">
                        <input type="checkbox" checked={editPerms.includes(perm)} onChange={() => togglePerm(perm, "edit")} />
                        <span className="toggle-slider" />
                      </label>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={handleEdit}><Save size={14} /> حفظ التغييرات</button>
              <button className="btn btn-secondary" onClick={() => setEditModal(null)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
