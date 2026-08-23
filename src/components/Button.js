import Link from "next/link";

const VARIANT_STYLES = {
  primary: "bg-primary text-white hover:bg-primary-hover",
  secondary: "bg-neutral text-neutral-text hover:bg-neutral-hover",
  success: "bg-success text-white hover:bg-success-hover",
  danger: "bg-danger text-white hover:bg-danger-hover",
  dark: "bg-dark text-white hover:bg-dark-hover",
  warning: "bg-warning text-white hover:bg-warning-hover",
  skip: "bg-skip text-white hover:bg-skip-hover",
  ghost: "text-primary hover:underline",
  ghostDanger: "text-danger hover:underline",
  dangerOutline:
    "border border-danger text-danger bg-white hover:bg-danger hover:text-white",
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
