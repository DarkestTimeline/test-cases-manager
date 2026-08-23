export default function Card({ className = "", children }) {
  return (
    <div
      className={`bg-white border border-slate-200 rounded-lg p-4 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}
