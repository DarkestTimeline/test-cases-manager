export default function Field({
  label,
  required = false,
  hint,
  error,
  children,
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1">
        {label}
        {required && (
          <span aria-hidden="true" className="text-danger ml-0.5">
            *
          </span>
        )}
      </span>
      {children}
      {error && (
        <span role="alert" className="block text-xs text-danger mt-1">
          {error}
        </span>
      )}
      {hint && !error && (
        <span className="block text-xs text-slate-400 mt-1">{hint}</span>
      )}
    </label>
  );
}

export function RequiredNote({ allRequired = false }) {
  return (
    <p className="text-xs text-slate-500">
      {allRequired ? (
        "All fields are required."
      ) : (
        <>
          <span aria-hidden="true" className="text-danger">
            *
          </span>{" "}
          Required
        </>
      )}
    </p>
  );
}
