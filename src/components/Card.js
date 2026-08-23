export default function Card({ className = "", children }) {
  return <div className={`border rounded-lg p-4 ${className}`}>{children}</div>;
}
