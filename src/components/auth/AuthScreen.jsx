import { BrandLogo } from "../../Views.jsx";

export function AuthScreen(props) {
  var icon=props.icon, title=props.title, subtitle=props.subtitle;
  var value=props.value, onChange=props.onChange, error=props.error;
  var onBack=props.onBack, onSubmit=props.onSubmit, hint=props.hint, isPhone=props.isPhone;
  var pinInputMode = props.pinInputMode || "text";
  var disabled = props.disabled || false;
  var disabledText = props.disabledText || "Connecting...";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center px-4 py-8" style={{ fontFamily: "var(--font-sans)" }}>
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card shadow-sm p-6 sm:p-8 flex flex-col items-center">
        <BrandLogo className="w-20 h-20 mb-3" />
        <h1 className="font-serif text-3xl font-semibold leading-tight text-foreground text-center">Maa Sharda</h1>
        <div className="bg-secondary text-primary rounded-full px-4 py-0.5 text-[11px] font-bold mt-1 mb-6">अब पेट भरेगा, मन नहीं</div>
        
        <div className="flex items-center gap-2 mb-1 justify-center">
          <span className="text-xl" aria-hidden="true">{icon}</span>
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
        </div>
        <p className="text-xs text-muted-foreground text-center mb-6 leading-relaxed">{subtitle}</p>

        <div className="w-full space-y-4">
          <input
            className={"w-full border rounded-2xl px-4 py-3.5 text-xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary/20 " + (error ? "border-destructive bg-destructive/5 text-destructive" : "border-border bg-background text-foreground")}
            type={isPhone ? "tel" : "password"}
            inputMode={isPhone ? "numeric" : pinInputMode}
            placeholder={isPhone ? "10-digit phone" : "Enter PIN"}
            value={value}
            onChange={function(e){onChange(e.target.value);}}
            onKeyDown={function(e){if(e.key==="Enter")onSubmit();}}
            maxLength={isPhone ? 10 : 12}
            autoFocus
            disabled={disabled}
          />
          {error && <p className="text-destructive text-xs text-center font-semibold leading-relaxed">{error}</p>}
          {hint  && <p className="text-muted-foreground text-[11px] text-center leading-relaxed">{hint}</p>}
          
          <button
            onClick={onSubmit}
            disabled={disabled}
            className="w-full py-3.5 bg-primary text-primary-foreground rounded-2xl font-bold text-sm shadow-sm transition-colors hover:bg-primary/95 disabled:opacity-40"
          >
            {disabled ? disabledText : "Continue →"}
          </button>
          
          <button
            onClick={onBack}
            className="w-full py-2.5 text-xs text-muted-foreground font-semibold transition-colors hover:text-foreground"
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
}
