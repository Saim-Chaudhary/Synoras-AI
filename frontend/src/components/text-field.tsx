// A label, an input and the error message that belongs to it.
type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "password";
  autoComplete?: string;
  hint?: string; // small help text under the input
  error?: string; // when set, the input turns red and the message appears below it
};

export default function TextField({
  id,
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  hint,
  error,
}: Props) {
  return (
    <div className="mt-5">
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`mt-1 block w-full rounded-lg border bg-surface px-3 py-2 text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent ${
          error ? "border-danger" : "border-line"
        }`}
      />
      {hint && !error && <p className="mt-1 text-sm text-ink-muted">{hint}</p>}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
