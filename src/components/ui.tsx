import type { ReactNode } from "react";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--accent)]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] shadow-[var(--shadow-sm)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function PanelHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="border-b border-[var(--border)] px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          {description ? (
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{description}</p>
          ) : null}
        </div>
        {children}
      </div>
    </div>
  );
}

export function MetricCard({
  label,
  value,
  detail,
  tone = "neutral",
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: "neutral" | "primary" | "accent" | "warning" | "danger";
}) {
  const toneClass = {
    neutral: "bg-[var(--surface-elevated)]",
    primary: "bg-[color-mix(in_srgb,var(--primary)_10%,var(--surface-elevated))]",
    accent: "bg-[color-mix(in_srgb,var(--accent)_10%,var(--surface-elevated))]",
    warning: "bg-[color-mix(in_srgb,var(--warning)_10%,var(--surface-elevated))]",
    danger: "bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface-elevated))]",
  }[tone];

  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--border)] p-4 shadow-[var(--shadow-sm)]",
        toneClass,
      )}
    >
      <p className="text-sm font-medium text-[var(--muted)]">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-normal">{value}</p>
      {detail ? <p className="mt-2 text-xs text-[var(--muted)]">{detail}</p> : null}
    </div>
  );
}

export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "accent";
}) {
  const toneClass = {
    neutral: "border-[var(--border)] bg-[var(--surface-muted)] text-[var(--foreground)]",
    success: "border-green-200 bg-[color-mix(in_srgb,var(--success)_10%,var(--surface-elevated))] text-[var(--success)]",
    warning: "border-yellow-200 bg-[color-mix(in_srgb,var(--warning)_10%,var(--surface-elevated))] text-[var(--warning)]",
    danger: "border-red-200 bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface-elevated))] text-[var(--danger)]",
    accent: "border-blue-200 bg-[color-mix(in_srgb,var(--accent)_10%,var(--surface-elevated))] text-[var(--accent)]",
  }[tone];

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", toneClass)}>
      {children}
    </span>
  );
}
