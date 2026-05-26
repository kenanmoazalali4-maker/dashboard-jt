"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Save, HelpCircle, ArrowUp, ArrowDown, ToggleLeft, ToggleRight, User, AtSign, Calendar, Edit2 } from "lucide-react";
import { useNotification } from "@/components/Notifications";

interface BasicField {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  required: boolean;
  enabled: boolean;
  fixed: boolean;
}

export default function QuestionsPage() {
  const { toast, confirm } = useNotification();
  const [fields, setFields] = useState<BasicField[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetch("/api/questions")
      .then((r) => r.json())
      .then((data) => {
        setFields(data.fields || []);
        setQuestions(data.questions || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const fieldIcons: Record<string, any> = { name: User, discord: AtSign, age: Calendar };

  // Field handlers
  const toggleField = (index: number) => {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, enabled: !f.enabled } : f)));
    setHasChanges(true);
  };

  const toggleRequired = (index: number) => {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, required: !f.required } : f)));
    setHasChanges(true);
  };

  const updateFieldLabel = (index: number, label: string) => {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, label } : f)));
    setHasChanges(true);
  };

  const updateFieldPlaceholder = (index: number, placeholder: string) => {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, placeholder } : f)));
    setHasChanges(true);
  };

  // Question handlers
  const updateQuestion = (index: number, value: string) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? value : q)));
    setHasChanges(true);
  };

  const addQuestion = () => {
    setQuestions((prev) => [...prev, ""]);
    setHasChanges(true);
  };

  const removeQuestion = async (index: number) => {
    if (questions[index].trim()) {
      const ok = await confirm({
        title: "حذف سؤال",
        message: `هل أنت متأكد من حذف هذا السؤال؟`,
        confirmText: "🗑️ حذف",
        type: "danger",
      });
      if (!ok) return;
    }
    setQuestions((prev) => prev.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= questions.length) return;
    setQuestions((prev) => {
      const arr = [...prev];
      [arr[index], arr[target]] = [arr[target], arr[index]];
      return arr;
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields, questions }),
      });
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions);
        setFields(data.fields);
        setHasChanges(false);
        toast("تم حفظ الإعدادات بنجاح", "success");
      } else {
        toast("حدث خطأ أثناء الحفظ", "error");
      }
    } catch {
      toast("حدث خطأ في الاتصال", "error");
    }
    setSaving(false);
  };

  return (
    <>
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1>أسئلة التقديم</h1>
            <p>إدارة حقول وأسئلة نموذج التقديم · {fields.filter((f) => f.enabled).length} حقل · {questions.length} سؤال</p>
          </div>
          {hasChanges && (
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              <Save size={14} /> {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
            </button>
          )}
        </div>
      </div>
      <div className="page-content">
        {loading ? (
          <div className="empty-state">
            <div style={{ width: 48, height: 48, border: "3px solid var(--glass-border)", borderTop: "3px solid var(--accent-purple)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
            <h3>جاري التحميل...</h3>
          </div>
        ) : (
          <div style={{ maxWidth: 700, display: "flex", flexDirection: "column", gap: 20 }}>

            {/* ===== Basic Fields Section ===== */}
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <User size={18} style={{ color: "var(--accent-cyan)" }} />
                الحقول الأساسية
              </h3>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14 }}>
                تحكم بالحقول الأساسية في نموذج التقديم — فعّل/عطّل أي حقل وعدّل الاسم والنص التوضيحي.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {fields.map((field, i) => {
                  const Icon = fieldIcons[field.id] || HelpCircle;
                  return (
                    <div key={field.id} className="glass-card animate-in" style={{ padding: "16px 18px", opacity: field.enabled ? 1 : 0.5, transition: "opacity 0.2s" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        {/* Toggle */}
                        <button
                          onClick={() => toggleField(i)}
                          style={{ background: "none", border: "none", cursor: "pointer", flexShrink: 0, color: field.enabled ? "var(--accent-green)" : "var(--text-muted)" }}
                          title={field.enabled ? "مفعّل — اضغط للتعطيل" : "معطّل — اضغط للتفعيل"}
                        >
                          {field.enabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                        </button>

                        {/* Icon */}
                        <div style={{
                          width: 36, height: 36, borderRadius: 8,
                          background: "rgba(139,92,246,0.12)", color: "var(--accent-purple)",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}><Icon size={16} /></div>

                        {/* Label + Placeholder editable */}
                        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          <div className="input-group" style={{ gap: 4 }}>
                            <label style={{ fontSize: 10, color: "var(--text-muted)" }}>اسم الحقل</label>
                            <input className="input" value={field.label} onChange={(e) => updateFieldLabel(i, e.target.value)} style={{ padding: "6px 10px", fontSize: 13 }} />
                          </div>
                          <div className="input-group" style={{ gap: 4 }}>
                            <label style={{ fontSize: 10, color: "var(--text-muted)" }}>النص التوضيحي</label>
                            <input className="input" value={field.placeholder} onChange={(e) => updateFieldPlaceholder(i, e.target.value)} style={{ padding: "6px 10px", fontSize: 13 }} />
                          </div>
                        </div>

                        {/* Required toggle */}
                        <button
                          onClick={() => toggleRequired(i)}
                          className={`badge ${field.required ? "badge-banned" : "badge-offline"}`}
                          style={{ cursor: "pointer", border: "none", fontSize: 11 }}
                          title={field.required ? "مطلوب — اضغط لجعله اختياري" : "اختياري — اضغط لجعله مطلوب"}
                        >
                          {field.required ? "مطلوب *" : "اختياري"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ===== Divider ===== */}
            <div style={{ borderTop: "1px solid var(--glass-border)" }} />

            {/* ===== Custom Questions Section ===== */}
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <HelpCircle size={18} style={{ color: "var(--accent-orange)" }} />
                أسئلة مخصصة
              </h3>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14 }}>
                أضف أسئلة إضافية تظهر كحقول نص في نموذج التقديم. يمكنك إعادة ترتيبها بأسهم ⬆️⬇️
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {questions.map((q, i) => (
                  <div key={i} className="glass-card animate-in" style={{ padding: "14px 18px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: "rgba(245,158,11,0.12)", color: "var(--accent-orange)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 700, fontSize: 14, flexShrink: 0, marginTop: 2,
                      }}>{i + 1}</div>

                      <textarea
                        className="input"
                        value={q}
                        onChange={(e) => updateQuestion(i, e.target.value)}
                        placeholder="اكتب السؤال هنا..."
                        rows={2}
                        style={{ flex: 1, resize: "vertical" }}
                      />

                      <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
                        <button className="player-action-btn" title="نقل لأعلى" onClick={() => moveQuestion(i, "up")} disabled={i === 0} style={{ opacity: i === 0 ? 0.3 : 1 }}><ArrowUp size={12} /></button>
                        <button className="player-action-btn" title="نقل لأسفل" onClick={() => moveQuestion(i, "down")} disabled={i === questions.length - 1} style={{ opacity: i === questions.length - 1 ? 0.3 : 1 }}><ArrowDown size={12} /></button>
                        <button className="player-action-btn danger" title="حذف" onClick={() => removeQuestion(i)}><Trash2 size={12} /></button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add question button */}
                <button
                  className="glass-card"
                  onClick={addQuestion}
                  style={{
                    padding: "18px", textAlign: "center",
                    border: "2px dashed rgba(139,92,246,0.3)",
                    background: "transparent", cursor: "pointer",
                    color: "var(--accent-purple)", fontWeight: 600, fontSize: 14,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent-purple)"; e.currentTarget.style.background = "rgba(139,92,246,0.05)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(139,92,246,0.3)"; e.currentTarget.style.background = "transparent"; }}
                >
                  <Plus size={18} /> إضافة سؤال جديد
                </button>
              </div>
            </div>

            {/* Bottom save bar */}
            {hasChanges && (
              <div style={{
                position: "sticky", bottom: 16,
                background: "var(--bg-secondary)", border: "1px solid var(--border-active)",
                borderRadius: 12, padding: "12px 20px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                backdropFilter: "blur(12px)", boxShadow: "0 -4px 20px rgba(0,0,0,0.3)",
              }}>
                <span style={{ fontSize: 13, color: "var(--accent-orange)" }}>⚠️ لديك تغييرات غير محفوظة</span>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  <Save size={14} /> {saving ? "جاري الحفظ..." : "حفظ الأسئلة"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
