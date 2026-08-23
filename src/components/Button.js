import Link from "next/link";

const VARIANT_STYLES = {
  primary: "bg-blue-600 text-white hover:bg-blue-700",
  secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
  success: "bg-green-600 text-white hover:bg-green-700",
  danger: "bg-red-600 text-white hover:bg-red-700",
  dark: "bg-gray-800 text-white hover:bg-gray-900",
  ghost: "text-blue-600 hover:underline",
  ghostDanger: "text-red-600 hover:underline",
};

const SIZE_STYLES = {
  md: "px-4 py-2 text-sm",
  sm: "px-3 py-1 text-xs",
};

export default function Button({
  variant = "primary",
  size = "md",
  href,
  className = "",
  children,
  ...rest
}) {
  const isGhost = variant === "ghost" || variant === "ghostDanger";
  const shape = isGhost
    ? "inline-flex items-center font-medium"
    : "inline-flex items-center justify-center rounded font-medium";
  const sizing = isGhost ? "text-xs" : SIZE_STYLES[size];
  const classes =
    `${shape} ${sizing} ${VARIANT_STYLES[variant]} ${rest.disabled ? "opacity-40 cursor-not-allowed" : ""} ${className}`.trim();

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
