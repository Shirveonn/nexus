import type { ReactNode } from "react";

/** Reusable form controls for settings screens. */

export function Panel({ title, description, icon, actions, children, className = "" }: {
  title: string; description?: string; icon?: ReactNode; actions?: ReactNode; children?: ReactNode; className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <div><h3>{title}</h3>{description && <p>{description}</p>}</div>
        {actions ?? (icon && <span className="muted-icon">{icon}</span>)}
      </div>
      {children}
    </section>
  );
}

export function SettingRow({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="setting-row">
      <div className="setting-row__text"><strong>{label}</strong>{hint && <small>{hint}</small>}</div>
      <div className="setting-row__control">{children}</div>
    </div>
  );
}

export function Segmented<T extends string>({ value, options, onChange, label }: {
  value: T; options: { value: T; label: string }[]; onChange: (value: T) => void; label: string;
}) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map(o => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          className={value === o.value ? "active" : ""}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={checked} aria-label={label} className={`toggle ${checked ? "on" : ""}`} onClick={() => onChange(!checked)}>
      <span />
    </button>
  );
}

export function Slider({ value, min, max, step = 1, onChange, label, format }: {
  value: number; min: number; max: number; step?: number; onChange: (value: number) => void; label: string; format?: (v: number) => string;
}) {
  return (
    <div className="slider">
      <input type="range" aria-label={label} min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} />
      <output>{format ? format(value) : value}</output>
    </div>
  );
}
