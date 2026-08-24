"use client";

type Metrics = {
  total: number;
  visible: number;
  active: number;
  debris: number;
  leo: number;
};

type MetricCardsProps = {
  metrics: Metrics;
};

export default function MetricCards({
  metrics,
}: MetricCardsProps) {
  const cards = [
    {
      label: "Total Objects",
      value: metrics.total,
      description: "Tracked catalog objects",
      accent: "blue",
      icon: "◎",
    },
    {
      label: "In View",
      value: metrics.visible,
      description: "Objects matching filters",
      accent: "cyan",
      icon: "◉",
    },
    {
      label: "Active / Other",
      value: metrics.active,
      description: "Non-debris objects",
      accent: "violet",
      icon: "◇",
    },
    {
      label: "Debris",
      value: metrics.debris,
      description: "Tracked debris objects",
      accent: "orange",
      icon: "◆",
    },
    {
      label: "LEO Objects",
      value: metrics.leo,
      description: "Objects between 160–2,000 km",
      accent: "emerald",
      icon: "◌",
    },
  ] as const;

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => (
        <MetricCard
          key={card.label}
          {...card}
        />
      ))}
    </section>
  );
}

function MetricCard({
  label,
  value,
  description,
  accent,
  icon,
}: {
  label: string;
  value: number;
  description: string;
  accent:
    | "blue"
    | "cyan"
    | "violet"
    | "orange"
    | "emerald";
  icon: string;
}) {
  const styles = {
    blue: {
      icon:
        "border-blue-400/20 bg-blue-400/10 text-blue-400",
      glow:
        "group-hover:border-blue-400/30",
      value:
        "text-blue-50",
      dot:
        "bg-blue-400",
    },

    cyan: {
      icon:
        "border-cyan-400/20 bg-cyan-400/10 text-cyan-400",
      glow:
        "group-hover:border-cyan-400/30",
      value:
        "text-cyan-50",
      dot:
        "bg-cyan-400",
    },

    violet: {
      icon:
        "border-violet-400/20 bg-violet-400/10 text-violet-400",
      glow:
        "group-hover:border-violet-400/30",
      value:
        "text-violet-50",
      dot:
        "bg-violet-400",
    },

    orange: {
      icon:
        "border-orange-400/20 bg-orange-400/10 text-orange-400",
      glow:
        "group-hover:border-orange-400/30",
      value:
        "text-orange-50",
      dot:
        "bg-orange-400",
    },

    emerald: {
      icon:
        "border-emerald-400/20 bg-emerald-400/10 text-emerald-400",
      glow:
        "group-hover:border-emerald-400/30",
      value:
        "text-emerald-50",
      dot:
        "bg-emerald-400",
    },
  }[accent];

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border border-white/10 bg-[#0c1928] p-4 transition duration-200 hover:-translate-y-0.5 ${styles.glow}`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-px opacity-40 ${styles.dot}`}
      />

      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          {label}
        </span>

        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm ${styles.icon}`}
        >
          {icon}
        </div>
      </div>

      <div
        className={`mt-4 text-3xl font-bold tracking-tight ${styles.value}`}
      >
        {value.toLocaleString()}
      </div>

      <div className="mt-2 truncate text-xs text-slate-600">
        {description}
      </div>

      <div className="mt-4 flex items-center gap-1.5">
        <span
          className={`h-1.5 w-1.5 rounded-full ${styles.dot}`}
        />

        <span className="text-[10px] uppercase tracking-wide text-slate-600">
          Live dataset
        </span>
      </div>
    </div>
  );
}