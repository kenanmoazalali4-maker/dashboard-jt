"use client";

import { useState } from "react";
import { Search, Trash2, Car, Fuel, Wrench } from "lucide-react";
import { useNotification } from "@/components/Notifications";

interface Props {
  vehicles: any[];
  staff: any;
}

export default function VehiclesClient({ vehicles, staff }: Props) {
  const { toast } = useNotification();
  const [search, setSearch] = useState("");
  const [deleteModal, setDeleteModal] = useState<any>(null);

  const filtered = vehicles.filter((v) => {
    const q = search.toLowerCase();
    return (
      v.vehicle?.toLowerCase().includes(q) ||
      v.plate?.toLowerCase().includes(q) ||
      v.ownerName?.toLowerCase().includes(q) ||
      v.citizenid?.toLowerCase().includes(q) ||
      v.garage?.toLowerCase().includes(q)
    );
  });

  const handleDelete = async (vehicleId: number) => {
    try {
      const res = await fetch(`/api/vehicles?id=${vehicleId}`, { method: "DELETE" });
      if (res.ok) {
        toast("تم حذف المركبة بنجاح", "success");
        window.location.reload();
      } else {
        toast("حدث خطأ أثناء الحذف", "error");
      }
    } catch {
      toast("حدث خطأ في الاتصال", "error");
    }
    setDeleteModal(null);
  };

  const stateLabel = (s: number) => {
    switch (s) {
      case 0: return { text: "خارج", class: "badge-offline" };
      case 1: return { text: "في الكراج", class: "badge-online" };
      case 2: return { text: "محجوز", class: "badge-pending" };
      default: return { text: "غير معروف", class: "badge-offline" };
    }
  };

  return (
    <>
      <div className="page-header">
        <h1>جميع المركبات</h1>
        <p>عرض جميع مركبات اللاعبين · إجمالي {vehicles.length} مركبة</p>
      </div>
      <div className="page-content">
        <div className="toolbar">
          <div className="search-box">
            <Search />
            <input className="input" placeholder="بحث بالمركبة، اللوحة، المالك..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="glass-card animate-in">
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>المركبة</th>
                  <th>اللوحة</th>
                  <th>المالك</th>
                  <th>الكراج</th>
                  <th>الوقود</th>
                  <th>المحرك</th>
                  <th>الهيكل</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => {
                  const state = stateLabel(v.state);
                  return (
                    <tr key={v.id}>
                      <td>{v.id}</td>
                      <td style={{ fontWeight: 600 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Car size={14} style={{ color: "var(--accent-cyan)" }} />
                          {v.vehicle}
                        </div>
                      </td>
                      <td className="mono" style={{ color: "var(--accent-purple)" }}>{v.plate}</td>
                      <td>{v.ownerName}</td>
                      <td>{v.garage || "—"}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Fuel size={12} style={{ color: v.fuel > 50 ? "var(--accent-green)" : "var(--accent-red)" }} />
                          {v.fuel}%
                        </div>
                      </td>
                      <td style={{ color: v.engine >= 800 ? "var(--accent-green)" : "var(--accent-red)" }}>
                        {((v.engine / 1000) * 100).toFixed(0)}%
                      </td>
                      <td style={{ color: v.body >= 800 ? "var(--accent-green)" : "var(--accent-red)" }}>
                        {((v.body / 1000) * 100).toFixed(0)}%
                      </td>
                      <td><span className={`badge ${state.class}`}>{state.text}</span></td>
                      <td>
                        <button className="player-action-btn danger" title="حذف" onClick={() => setDeleteModal(v)}>
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {filtered.length === 0 && (
          <div className="empty-state">
            <Car size={64} />
            <h3>لا توجد مركبات</h3>
            <p>لم يتم العثور على مركبات مطابقة</p>
          </div>
        )}
      </div>

      {deleteModal && (
        <div className="modal-overlay" onClick={() => setDeleteModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">حذف مركبة</span>
              <button className="modal-close" onClick={() => setDeleteModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p>هل أنت متأكد من حذف المركبة <strong>{deleteModal.vehicle}</strong> (لوحة: {deleteModal.plate}) من كراج <strong>{deleteModal.ownerName}</strong>؟</p>
              <p style={{ color: "var(--accent-red)", fontSize: 12 }}>هذا الإجراء لا يمكن التراجع عنه!</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-danger" onClick={() => handleDelete(deleteModal.id)}>
                <Trash2 size={14} /> تأكيد الحذف
              </button>
              <button className="btn btn-secondary" onClick={() => setDeleteModal(null)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
