import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  hint?: ReactNode;
  /** Shown at the right edge of the label, e.g. a character counter. */
  aside?: ReactNode;
  multiline?: boolean;
}

export function Field({ label, value, onChange, error, hint, aside, multiline, type = "text", ...rest }: FieldProps) {
  const id = useId();
  const [reveal, setReveal] = useState(false);
  const isPassword = type === "password";
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={`field ${error ? "field--error" : ""}`}>
      <div className="field__label"><label htmlFor={id}>{label}</label>{aside}</div>
      <div className="field__control">
        {multiline ? (
          <textarea
            id={id}
            className="text-input text-area"
            value={value}
            onChange={e => onChange(e.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            maxLength={rest.maxLength}
            placeholder={rest.placeholder}
            disabled={rest.disabled}
          />
        ) : (
          <input
            id={id}
            className="text-input"
            type={isPassword && reveal ? "text" : type}
            value={value}
            onChange={e => onChange(e.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            {...rest}
          />
        )}
        {isPassword && (
          <button type="button" className="icon-button field__reveal" onClick={() => setReveal(r => !r)} aria-label={reveal ? "Hide password" : "Show password"}>
            {reveal ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
      {error ? <small id={`${id}-error`} className="field__error" role="alert">{error}</small>
        : hint ? <small id={`${id}-hint`} className="field__hint">{hint}</small> : null}
    </div>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return <div className="form-error" role="alert">{message}</div>;
}

export function SubmitButton({ busy, children, disabled }: { busy: boolean; children: ReactNode; disabled?: boolean }) {
  return (
    <button type="submit" className="solid-button" disabled={busy || disabled}>
      {busy ? <span className="spinner" aria-label="Working" /> : children}
    </button>
  );
}
