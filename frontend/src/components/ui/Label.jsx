export default function Label({ children, className = "" }) {
  return (
    <label
      className={`block mb-2 text-sm font-medium text-ink ${className}`}
    >
      {children}
    </label>
  );
}
