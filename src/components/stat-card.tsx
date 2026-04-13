import clsx from "clsx";
import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: number | string;
  description: string;
  icon?: ReactNode;
  tone?: "default" | "success" | "warning" | "danger";
}

export function StatCard({ title, value, description, icon, tone = "default" }: StatCardProps) {
  return (
    <article className={clsx("stat-card", `stat-card-${tone}`)}>
      <div className="stat-card-header">
        <span className="stat-card-title">{title}</span>
        {icon ? <span className="icon-badge">{icon}</span> : null}
      </div>
      <strong className="stat-card-value">{value}</strong>
      <p className="muted small">{description}</p>
    </article>
  );
}
