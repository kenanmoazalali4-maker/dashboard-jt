"use client";

import { useState, useCallback, createContext, useContext, ReactNode } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

// =============================================
// Toast Notification System
// =============================================

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
  icon?: ReactNode;
}

interface NotificationContextType {
  toast: (message: string, type?: ToastType) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotification must be used within NotificationProvider");
  return ctx;
}

let toastId = 0;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<{
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({ options, resolve });
    });
  }, []);

  const handleConfirm = () => {
    confirmState?.resolve(true);
    setConfirmState(null);
  };

  const handleCancel = () => {
    confirmState?.resolve(false);
    setConfirmState(null);
  };

  const toastIcon = (type: ToastType) => {
    switch (type) {
      case "success": return <CheckCircle size={18} />;
      case "error": return <XCircle size={18} />;
      case "warning": return <AlertTriangle size={18} />;
      case "info": return <Info size={18} />;
    }
  };

  return (
    <NotificationContext.Provider value={{ toast, confirm }}>
      {children}

      {/* Toast Container */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <div className="toast-icon">{toastIcon(t.type)}</div>
            <span className="toast-message">{t.message}</span>
            <button className="toast-close" onClick={() => removeToast(t.id)}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Confirm Dialog */}
      {confirmState && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <span className="modal-title">{confirmState.options.title}</span>
              <button className="modal-close" onClick={handleCancel}>✕</button>
            </div>
            <div className="modal-body" style={{ textAlign: "center", padding: "24px 20px" }}>
              {confirmState.options.icon && (
                <div style={{ marginBottom: 16 }}>{confirmState.options.icon}</div>
              )}
              <p style={{ fontSize: 14, lineHeight: 1.7 }}>{confirmState.options.message}</p>
              {confirmState.options.type === "danger" && (
                <p style={{ color: "var(--accent-red)", fontSize: 12, marginTop: 8 }}>هذا الإجراء لا يمكن التراجع عنه!</p>
              )}
            </div>
            <div className="modal-footer">
              <button
                className={`btn ${confirmState.options.type === "danger" ? "btn-danger" : "btn-primary"}`}
                onClick={handleConfirm}
              >
                {confirmState.options.confirmText || "تأكيد"}
              </button>
              <button className="btn btn-secondary" onClick={handleCancel}>
                {confirmState.options.cancelText || "إلغاء"}
              </button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}
