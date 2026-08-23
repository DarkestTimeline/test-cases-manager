import Link from "next/link";

const VARIANT_STYLES = {
  primary: "bg-blue-600 text-white hover:bg-blue-700",
  secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
  danger: "bg-red-600 text-white hover:bg-red-700",
  success: "bg-green-600 text-white hover:bg-green-700",
  ghost: "text-blue-600 hover:underline p-0",
};

export default function Button({
  variant = "primary",
  href,
  className = "",
  children,
  ...rest
}) {
  const base =
    variant === "ghost"
      ? "text-xs font-medium"
      : "px-4 py-2 rounded text-sm font-medium";
  const classes = `${base} ${VARIANT_STYLES[variant]} ${rest.disabled ? "opacity-40 cursor-not-allowed" : ""} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
