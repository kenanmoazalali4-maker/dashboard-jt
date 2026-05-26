"use client";

import { useState, useEffect } from "react";
import { Send, CheckCircle } from "lucide-react";
import { useNotification } from "@/components/Notifications";

interface BasicField {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  required: boolean;
  enabled: boolean;
}

export default function ApplyPage() {
  const { toast } = useNotification();
  const [form, setForm] = useState<Record<string, string>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fields, setFields] = useState<BasicField[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [configLoading, setConfigLoading] = useState(true);

  useEffect(() => {
    fetch("/api/questions")
      .then((r) => r.json())
      .then((data) => {
        setFields(data.fields || []);
        setQuestions(data.questions || []);
        setConfigLoading(false);
      })
      .catch(() => setConfigLoading(false));
  }, []);

  const enabledFields = fields.filter((f) => f.enabled);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate required fields
    for (const field of enabledFields) {
      if (field.required && !form[field.id]?.trim()) {
        toast(`الرجاء تعبئة حقل "${field.label}"`, "warning");
        return;
      }
    }
    setLoading(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicantName: form.name || "غير معروف",
          applicantDiscord: form.discord || null,
          applicantAge: form.age ? parseInt(form.age) : null,
          answers: answers,
        }),
      });
      if (res.ok) setSubmitted(true);
      else toast("حدث خطأ، حاول مرة أخرى", "error");
    } catch {
      toast("حدث خطأ في الاتصال", "error");
    }
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="apply-page">
        <div className="apply-card animate-in" style={{ textAlign: "center" }}>
          <CheckCircle size={64} style={{ color: "var(--accent-green)", margin: "0 auto 20px" }} />
          <h1>تم إرسال طلبك بنجاح!</h1>
          <p className="subtitle">سيتم مراجعة طلبك من قبل فريق الإدارة. شكراً لك!</p>
        </div>
      </div>
    );
  }

  if (configLoading) {
    return (
      <div className="apply-page">
        <div className="apply-card animate-in" style={{ textAlign: "center", padding: 60 }}>
          <div style={{ width: 40, height: 40, border: "3px solid rgba(75,85,99,0.3)", borderTop: "3px solid var(--accent-purple)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "var(--text-muted)" }}>جاري تحميل النموذج...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="apply-page">
      <div className="apply-card animate-in">
        <h1>تقديم طلب انضمام</h1>
        <p className="subtitle">قم بملء النموذج التالي للتقديم على السيرفر</p>
        <form className="apply-form" onSubmit={handleSubmit}>
          {/* Dynamic basic fields */}
          {enabledFields.map((field) => (
            <div key={field.id} className="input-group">
              <label className="input-label">{field.label}{field.required ? " *" : ""}</label>
              <input
                className="input"
                type={field.type}
                placeholder={field.placeholder}
                required={field.required}
                min={field.type === "number" ? "1" : undefined}
                max={field.type === "number" ? "99" : undefined}
                value={form[field.id] || ""}
                onChange={(e) => setForm({ ...form, [field.id]: e.target.value })}
              />
            </div>
          ))}

          {/* Dynamic questions */}
          {questions.map((q, i) => (
            <div key={i} className="input-group">
              <label className="input-label">{q}</label>
              <textarea
                className="input"
                rows={2}
                placeholder="إجابتك..."
                value={answers[q] || ""}
                onChange={(e) => setAnswers({ ...answers, [q]: e.target.value })}
              />
            </div>
          ))}

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%", justifyContent: "center", padding: "12px" }}>
            <Send size={16} /> {loading ? "جاري الإرسال..." : "إرسال الطلب"}
          </button>
        </form>
      </div>
    </div>
  );
}
