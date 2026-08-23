export default function Badge({ className = "", children }) {
  return (
    <span
      className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${className}`}
    >
      {children}
    </span>
  );
}
