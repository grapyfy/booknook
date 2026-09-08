import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";

const VARIANT_STYLES: Record<Variant, string> = {
  primary: "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:active:scale-100",
  secondary:
    "bg-white text-neutral-900 border border-neutral-300 hover:bg-neutral-50 disabled:opacity-50 disabled:active:scale-100",
  danger: "bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:active:scale-100",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all active:scale-[0.98] ${VARIANT_STYLES[variant]} ${className}`}
      {...props}
    />
  );
}
