import { useState, useEffect, useRef } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import {
  db,
  BUSINESS_ID,
  startOnboardingCallable,
  saveOnboardingDraftCallable,
  confirmOnboardingCallable
} from "../../firebase";

function normalizePhone(phone) {
  return String(phone || "").replace(/\D/g, "").slice(-10);
}

export function OnboardingScreen(props) {
  const initialPhone = normalizePhone(props.phone || "");
  const onClose = props.onClose;
  const onApproved = props.onApproved;
  const [sessionId, setSessionId] = useState(sessionStorage.getItem("tiffin_onboard_session") || "");
  const [draft, setDraft] = useState(() => ({
    name: "",
    phone: initialPhone,
    address: "",
    group: "",
    plan: "daily",
    food: "",
    rate: "",
    notes: "",
  }));
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Tell me your name, phone, address, meal plan, food order, and monthly rate. You can type naturally or use voice." },
  ]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("collecting");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef(null);
  const lastSessionStatusRef = useRef("");

  useEffect(() => {
    setDraft((prev) => Object.assign({}, prev, { phone: initialPhone || prev.phone }));
  }, [initialPhone]);

  useEffect(() => {
    try {
      const savedDraft = sessionStorage.getItem("tiffin_onboard_draft");
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        setDraft((prev) => Object.assign({}, prev, parsed, { phone: initialPhone || parsed.phone || prev.phone }));
      }
    } catch (error) {
      console.error("Onboarding draft restore failed:", error);
    }
  }, [initialPhone]);

  useEffect(() => {
    sessionStorage.setItem("tiffin_onboard_draft", JSON.stringify(draft));
  }, [draft]);

  useEffect(() => {
    setVoiceSupported(Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    const sessionRef = doc(db, "businesses", BUSINESS_ID, "onboardingSessions", sessionId);
    return onSnapshot(sessionRef, (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data();
      if (data.draft) {
        syncDraft(data.draft);
      }
      if (data.status) {
        setStatus(data.status);
        if (data.status === "approved" && lastSessionStatusRef.current !== "approved") {
          setMessages((prev) => prev.concat([{ role: "assistant", text: "Approved. Your customer profile is ready." }]));
        }
        if (data.status === "rejected" && lastSessionStatusRef.current !== "rejected") {
          const note = data.managerNote ? ` Note: ${data.managerNote}` : "";
          setMessages((prev) => prev.concat([{ role: "assistant", text: `The manager rejected this request.${note}` }]));
        }
        lastSessionStatusRef.current = data.status;
      }
    }, (err) => {
      setError(err?.message || "Could not watch onboarding status.");
    });
  }, [sessionId]);

  function syncDraft(nextDraft) {
    setDraft((prev) => Object.assign({}, prev, nextDraft));
  }

  function summarize(nextDraft) {
    return [
      nextDraft.name ? `Name: ${nextDraft.name}` : null,
      nextDraft.phone ? `Phone: ${nextDraft.phone}` : null,
      nextDraft.address ? `Address: ${nextDraft.address}` : null,
      nextDraft.group ? `Group: ${nextDraft.group}` : null,
      nextDraft.plan ? `Plan: ${nextDraft.plan}` : null,
      nextDraft.food ? `Food: ${nextDraft.food}` : null,
      nextDraft.rate ? `Rate: ₹${nextDraft.rate}` : null,
      nextDraft.notes ? `Notes: ${nextDraft.notes}` : null,
    ].filter(Boolean).join("\n");
  }

  async function runExtraction(text) {
    if (!text.trim()) return;
    setBusy(true);
    setError("");
    setMessages((prev) => prev.concat([{ role: "user", text }]))
    try {
      const result = await startOnboardingCallable({
        text,
        sessionId: sessionId || undefined,
        source: voiceSupported && recognitionRef.current ? "voice" : "chat",
      });
      const data = result.data || {};
      if (data.sessionId) {
        setSessionId(data.sessionId);
        sessionStorage.setItem("tiffin_onboard_session", data.sessionId);
      }
      if (data.draft) {
        syncDraft(data.draft);
      }
      setStatus(data.status || "collecting");
      const nextMissing = Array.isArray(data.missingFields) ? data.missingFields : [];
      setMessages((prev) => prev.concat([{ role: "assistant", text: nextMissing.length > 0 ? `I still need: ${nextMissing.join(", ")}.` : "Everything looks ready. Review the summary and confirm to submit for approval." }]));
    } catch (err) {
      setError(err?.message || "Could not process onboarding message.");
      setMessages((prev) => prev.concat([{ role: "assistant", text: "I could not process that. Please try again or fill the fields manually." }]));
    } finally {
      setBusy(false);
      setInput("");
    }
  }

  async function ensureSession() {
    if (sessionId) {
      return sessionId;
    }
    const seedText = summarize(draft) || `Customer onboarding for ${initialPhone || draft.phone || "unknown phone"}`;
    const result = await startOnboardingCallable({
      text: seedText,
      source: "chat",
    });
    const data = result.data || {};
    if (data.sessionId) {
      setSessionId(data.sessionId);
      sessionStorage.setItem("tiffin_onboard_session", data.sessionId);
    }
    if (data.draft) {
      syncDraft(data.draft);
    }
    setStatus(data.status || "collecting");
    return data.sessionId || sessionId;
  }

  async function saveDraft() {
    setBusy(true);
    try {
      const currentSessionId = await ensureSession();
      const result = await saveOnboardingDraftCallable({ sessionId: currentSessionId, draft });
      const data = result.data || {};
      if (data.draft) syncDraft(data.draft);
      setStatus(data.status || "collecting");
      setMessages((prev) => prev.concat([{ role: "assistant", text: data.missingFields && data.missingFields.length > 0 ? `Saved. Still needed: ${data.missingFields.join(", ")}.` : "Draft saved and ready for confirmation." }]));
    } catch (err) {
      setError(err?.message || "Could not save draft.");
    } finally {
      setBusy(false);
    }
  }

  async function submitForApproval() {
    setBusy(true);
    setError("");
    try {
      const currentSessionId = await ensureSession();
      const result = await confirmOnboardingCallable({ sessionId: currentSessionId, draft });
      const data = result.data || {};
      const nextStatus = data.status || "pending_manager_approval";
      setStatus(nextStatus);
      lastSessionStatusRef.current = nextStatus;
      setMessages((prev) => prev.concat([{ role: "assistant", text: `Submitted for manager approval. ${data.summary ? "\n" + data.summary : ""}` }]));
    } catch (err) {
      setError(err?.message || "Could not submit onboarding.");
    } finally {
      setBusy(false);
    }
  }

  function toggleVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = function(event) {
      const text = event.results[0][0].transcript;
      setInput(text);
      recognitionRef.current = null;
    };
    recognition.onend = function() { recognitionRef.current = null; };
    recognitionRef.current = recognition;
    recognition.start();
  }

  const ready = draft.name && draft.phone && draft.address && draft.plan && draft.food && Number(draft.rate) > 0;
  const waitingApproval = status === "pending_manager_approval";
  const approved = status === "approved";
  const rejected = status === "rejected";
  const locked = waitingApproval || approved;
  const statusLabel = approved ? "Approved" : rejected ? "Rejected" : waitingApproval ? "Waiting" : ready ? "Ready" : status;

  function resetOnboarding() {
    sessionStorage.removeItem("tiffin_onboard_session");
    sessionStorage.removeItem("tiffin_onboard_draft");
    setSessionId("");
    setStatus("collecting");
    lastSessionStatusRef.current = "";
    setDraft({ name: "", phone: initialPhone, address: "", group: "", plan: "daily", food: "", rate: "", notes: "" });
    setMessages([{ role: "assistant", text: "Tell me your name, phone, address, meal plan, food order, and monthly rate. You can type naturally or use voice." }]);
  }

  function continueToPortal() {
    sessionStorage.removeItem("tiffin_onboard_session");
    sessionStorage.removeItem("tiffin_onboard_draft");
    if (onApproved) {
      onApproved(normalizePhone(draft.phone || initialPhone));
      return;
    }
    onClose();
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col mx-auto max-w-md w-full relative shadow-2xl border-x border-border" style={{ fontFamily: "var(--font-sans)" }}>
      <div className="bg-primary text-primary-foreground px-5 py-4 border-b border-border shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] opacity-80">Customer onboarding</p>
          <h2 className="font-serif text-lg font-semibold leading-tight mt-0.5">Tell us your details</h2>
        </div>
        <button onClick={onClose} className="text-xs border border-primary-foreground/30 px-3 py-1 rounded-full hover:bg-primary-foreground/10 transition-colors">Exit</button>
      </div>
      
      <div className="flex-1 p-5 space-y-5 overflow-y-auto pb-10">
        <div className="rounded-3xl border border-border bg-card p-4 space-y-3 shadow-sm">
          <div className="space-y-3 overflow-y-auto max-h-60 pr-1">
            {messages.map((message, index) => (
              <div key={index} className={"flex " + (message.role === "user" ? "justify-end" : "justify-start")}>
                <div className={"max-w-[85%] rounded-3xl px-4 py-2.5 text-xs shadow-sm " + (message.role === "user" ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm border border-border bg-background text-foreground")}>
                  <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2 pt-2 border-t border-border/60">
            <input
              className="flex-1 min-h-[40px] px-3.5 rounded-full border border-border bg-background text-xs text-foreground outline-none focus:ring-1 focus:ring-primary/40 placeholder:text-muted-foreground"
              placeholder="Type your reply here..."
              value={input}
              onChange={function(e){setInput(e.target.value);}}
              onKeyDown={function(e){if(e.key==="Enter"){runExtraction(input);}}}
            />
            <button onClick={toggleVoice} disabled={!voiceSupported} className="px-3 rounded-full border border-border bg-secondary text-xs hover:bg-secondary/80 disabled:opacity-40" aria-label="Use voice input">🎙</button>
            <button onClick={function(){runExtraction(input);}} disabled={busy || !input.trim()} className="px-4.5 rounded-full bg-primary text-primary-foreground font-semibold text-xs shadow-sm hover:bg-primary/95 disabled:opacity-40">Send</button>
          </div>
          {error && <p className="text-xs text-destructive font-semibold text-center">{error}</p>}
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Draft profile</p>
              <p className="text-[11px] text-muted-foreground">Updated live during conversation</p>
            </div>
            <span className={"text-[10px] font-bold px-3 py-1 rounded-full border border-border/40 " + (approved || ready ? "bg-success/12 text-success" : rejected ? "bg-destructive/12 text-destructive" : "bg-primary/10 text-primary")}>
              {statusLabel}
            </span>
          </div>
          
          <div className="space-y-3.5">
            {[
              ["name", "Name"],
              ["phone", "Phone"],
              ["address", "Address"],
              ["group", "Group / Building"],
              ["plan", "Plan"],
              ["food", "Food"],
              ["rate", "Monthly rate"],
              ["notes", "Notes"],
            ].map(function(field) {
              var key = field[0];
              var label = field[1];
              return (
                <div key={key} className="flex flex-col">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{label}</label>
                  <input
                    className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 disabled:opacity-60"
                    value={draft[key] || ""}
                    disabled={locked}
                    onChange={function(e){syncDraft({ [key]: e.target.value });}}
                  />
                </div>
              );
            })}
          </div>
          
          <div className="flex gap-2 pt-2">
            <button onClick={saveDraft} disabled={busy || locked} className="flex-1 py-2.5 rounded-full border border-border bg-secondary hover:bg-secondary/80 text-xs font-semibold text-foreground transition-colors disabled:opacity-50">Save draft</button>
            <button onClick={submitForApproval} disabled={busy || !ready || locked} className="flex-1 py-2.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow-sm transition-colors hover:bg-primary/95 disabled:opacity-50">Confirm & send</button>
          </div>
          
          {waitingApproval && <div className="rounded-2xl bg-success/10 border border-success/20 p-3 text-xs text-success font-medium">Submitted. A manager will review this profile next.</div>}
          {approved && (
            <div className="rounded-2xl bg-success/10 border border-success/20 p-3 text-xs text-success font-medium space-y-2">
              <p>Your profile has been approved.</p>
              <button onClick={continueToPortal} className="w-full py-2 rounded-full bg-success text-success-foreground font-semibold text-xs transition-colors hover:bg-success/90">Open customer portal</button>
            </div>
          )}
          {rejected && (
            <div className="rounded-2xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive font-medium space-y-2">
              <p>This request was rejected.</p>
              <button onClick={resetOnboarding} className="w-full py-2 rounded-full bg-card border border-destructive/20 text-destructive font-semibold text-xs transition-colors hover:bg-destructive/5">Start again</button>
            </div>
          )}
          <pre className="text-[10px] text-muted-foreground bg-background rounded-xl p-3 border border-border/60 whitespace-pre-wrap overflow-x-auto">{summarize(draft) || "No draft yet."}</pre>
        </div>
      </div>
    </div>
  );
}
