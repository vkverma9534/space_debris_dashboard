"use client";

import Plot from "react-plotly.js";

type RiskSummary = {
  high: number;
  elevated: number;
  moderate: number;
  total: number;
};

type Approach = {
  "Object A": string;
  "Object B": string;
  Separation: number;
  Risk: string;
};

type CollisionRiskProps = {
  summary: RiskSummary;
  approaches: Approach[];
  thresholdKm: number;
};

export default function CollisionRisk({
  summary,
  approaches,
  thresholdKm,
}: CollisionRiskProps) {
  const riskData = [
    {
      risk: "HIGH",
      value: summary.high,
    },
    {
      risk: "ELEVATED",
      value: summary.elevated,
    },
    {
      risk: "MODERATE",
      value: summary.moderate,
    },
  ];

  const separationValues = approaches
    .map(
      (approach) =>
        Number(approach.Separation)
    )
    .filter(
      (value) =>
        Number.isFinite(value)
    );

  return (
    <section className="space-y-6">

      {}

      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-400/20 bg-red-400/10 text-red-400">
            ⚠
          </div>

          <div>
            <h2 className="text-xl font-semibold tracking-tight text-white">
              Collision Risk
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Approximate conjunction screening
              over the next monitoring window.
            </p>
          </div>
        </div>

        <div className="mt-4 inline-flex rounded-full border border-white/10 bg-white/[0.025] px-3 py-1.5 text-xs text-slate-400">
          Alert threshold:
          <span className="ml-1.5 font-semibold text-slate-200">
            {thresholdKm.toFixed(0)} km
          </span>
        </div>
      </div>

      {}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">

        <RiskCard
          label="HIGH"
          value={summary.high}
          accent="red"
        />

        <RiskCard
          label="ELEVATED"
          value={summary.elevated}
          accent="orange"
        />

        <RiskCard
          label="MODERATE"
          value={summary.moderate}
          accent="yellow"
        />

        <RiskCard
          label="TOTAL ALERTS"
          value={summary.total}
          accent="blue"
        />

      </div>

      {}

      <div className="grid gap-5 xl:grid-cols-[1.25fr_1fr]">

        {}

        <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0c1928]">

          <div className="border-b border-white/10 px-5 py-4">
            <h3 className="text-base font-semibold text-white">
              Closest Predicted Approaches
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Objects that crossed the current
              screening threshold.
            </p>
          </div>

          {approaches.length === 0 ? (
            <div className="flex min-h-[320px] items-center justify-center px-6 text-center">
              <div>
                <div className="text-3xl text-emerald-400/70">
                  ✓
                </div>

                <p className="mt-3 text-sm font-medium text-slate-300">
                  No simulated approaches
                  crossed the threshold.
                </p>

                <p className="mt-1 text-xs text-slate-600">
                  No alerts were generated for
                  the current screening settings.
                </p>
              </div>
            </div>
          ) : (
            <div className="max-h-[430px] overflow-auto">

              <table className="w-full min-w-[650px] text-left text-sm">

                <thead className="sticky top-0 z-10 bg-[#0d1a2b]">
                  <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-slate-500">

                    <th className="px-4 py-3">
                      Object A
                    </th>

                    <th className="px-4 py-3">
                      Object B
                    </th>

                    <th className="px-4 py-3 text-right">
                      Separation
                    </th>

                    <th className="px-4 py-3">
                      Risk
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-white/[0.045]">

                  {approaches.map(
                    (approach, index) => (
                      <tr
                        key={`${approach["Object A"]}-${approach["Object B"]}-${index}`}
                        className="transition hover:bg-white/[0.025]"
                      >

                        <td
                          className="max-w-[180px] truncate px-4 py-3 font-medium text-slate-300"
                          title={
                            approach["Object A"]
                          }
                        >
                          {approach["Object A"]}
                        </td>

                        <td
                          className="max-w-[180px] truncate px-4 py-3 text-slate-400"
                          title={
                            approach["Object B"]
                          }
                        >
                          {approach["Object B"]}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-sm text-slate-300">
                          {formatNumber(
                            approach.Separation,
                            3
                          )}
                          <span className="ml-1 text-xs text-slate-600">
                            km
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <RiskBadge
                            risk={
                              approach.Risk
                            }
                          />
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}

        </div>

        {}

        <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0c1928]">

          <Plot
            data={[
              {
                type: "bar",
                x: riskData.map(
                  (item) => item.value
                ),
                y: riskData.map(
                  (item) => item.risk
                ),
                orientation: "h",

                text: riskData.map(
                  (item) =>
                    item.value.toLocaleString()
                ),

                textposition: "outside",

                marker: {
                  color: [
                    "#ef4444",
                    "#f97316",
                    "#eab308",
                  ],
                },

                hovertemplate:
                  "<b>%{y}</b><br>" +
                  "Alerts: %{x:,}" +
                  "<extra></extra>",
              },
            ]}
            layout={{
              title: {
                text:
                  "<b>Alert Severity</b>",
                font: {
                  color: "#ffffff",
                  size: 17,
                },
                x: 0.05,
                xanchor: "left",
              },

              paper_bgcolor:
                "#0c1928",

              plot_bgcolor:
                "#0c1928",

              font: {
                color: "#cbd5e1",
              },

              margin: {
                l: 85,
                r: 45,
                t: 65,
                b: 55,
              },

              height: 430,

              xaxis: {
                title: "Alerts",
                rangemode: "tozero",
                gridcolor:
                  "rgba(255,255,255,0.07)",
                zerolinecolor:
                  "rgba(255,255,255,0.12)",
              },

              yaxis: {
                title: "",
                categoryorder: "array",
                categoryarray: [
                  "MODERATE",
                  "ELEVATED",
                  "HIGH",
                ],
              },

              showlegend: false,

              hoverlabel: {
                bgcolor:
                  "#101d2d",
              },
            }}

            config={{
              responsive: true,
              displayModeBar: false,
            }}

            style={{
              width: "100%",
            }}
          />

        </div>

      </div>

      {}

      {!approaches.length ? null : (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0c1928]">

          <div className="border-b border-white/10 px-5 py-4">
            <h3 className="text-base font-semibold text-white">
              Separation of Simulated Conjunctions
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Distribution of predicted object
              separations with the alert threshold
              shown for reference.
            </p>
          </div>

          <Plot
            data={[
              {
                type: "histogram",

                x: separationValues,

                nbinsx: 20,

                marker: {
                  color:
                    "rgba(59,130,246,0.65)",
                  line: {
                    color:
                      "rgba(96,165,250,0.9)",
                    width: 1,
                  },
                },

                hovertemplate:
                  "Separation: %{x:.3f} km" +
                  "<br>Conjunctions: %{y}" +
                  "<extra></extra>",
              },
            ]}

            layout={{
              paper_bgcolor:
                "#0c1928",

              plot_bgcolor:
                "#0c1928",

              font: {
                color: "#cbd5e1",
              },

              height: 380,

              margin: {
                l: 55,
                r: 30,
                t: 25,
                b: 60,
              },

              xaxis: {
                title:
                  "Separation (km)",
                rangemode: "tozero",
                gridcolor:
                  "rgba(255,255,255,0.07)",
              },

              yaxis: {
                title:
                  "Conjunctions",
                rangemode: "tozero",
                gridcolor:
                  "rgba(255,255,255,0.07)",
              },

              shapes: [
                {
                  type: "line",

                  x0: thresholdKm,
                  x1: thresholdKm,

                  y0: 0,
                  y1: 1,

                  yref: "paper",

                  line: {
                    color:
                      "#ef4444",
                    width: 2,
                    dash: "dash",
                  },
                },
              ],

              annotations: [
                {
                  x: thresholdKm,
                  y: 1,
                  yref: "paper",

                  text:
                    `Alert threshold: ${thresholdKm.toFixed(
                      0
                    )} km`,

                  showarrow: false,

                  xanchor: "left",
                  yanchor: "bottom",

                  font: {
                    color:
                      "#f87171",
                    size: 11,
                  },
                },
              ],
            }}

            config={{
              responsive: true,
              displayModeBar: false,
            }}

            style={{
              width: "100%",
            }}
          />

        </div>
      )}

      {}

      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0c1928]">

        <div className="border-b border-white/10 px-5 py-4">

          <h3 className="text-base font-semibold text-white">
            What Makes a Conjunction More Dangerous?
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Relative importance used for the
            demonstration screening model.
          </p>

        </div>

        <Plot
          data={[
            {
              type: "bar",

              x: [5, 5, 5, 4, 4],

              y: [
                "Small separation",
                "Trajectory overlap",
                "High relative velocity",
                "High uncertainty",
                "Short warning time",
              ],

              orientation: "h",

              text: [
                "5",
                "5",
                "5",
                "4",
                "4",
              ],

              textposition: "outside",

              marker: {
                color:
                  "rgba(99,102,241,0.75)",
              },

              hovertemplate:
                "<b>%{y}</b>" +
                "<br>Importance: %{x}" +
                "<extra></extra>",
            },
          ]}

          layout={{
            paper_bgcolor:
              "#0c1928",

            plot_bgcolor:
              "#0c1928",

            font: {
              color: "#cbd5e1",
            },

            height: 370,

            margin: {
              l: 175,
              r: 45,
              t: 25,
              b: 55,
            },

            xaxis: {
              title:
                "Relative importance",

              range: [0, 5.5],

              dtick: 1,

              gridcolor:
                "rgba(255,255,255,0.07)",
            },

            yaxis: {
              title: "",
            },

            showlegend: false,
          }}

          config={{
            responsive: true,
            displayModeBar: false,
          }}

          style={{
            width: "100%",
          }}
        />

      </div>

    </section>
  );
}

function RiskCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent:
    | "red"
    | "orange"
    | "yellow"
    | "blue";
}) {
  const styles = {
    red: {
      text: "text-red-400",
      bg: "bg-red-400/10",
      border:
        "border-red-400/15",
    },

    orange: {
      text: "text-orange-400",
      bg: "bg-orange-400/10",
      border:
        "border-orange-400/15",
    },

    yellow: {
      text: "text-yellow-400",
      bg: "bg-yellow-400/10",
      border:
        "border-yellow-400/15",
    },

    blue: {
      text: "text-blue-400",
      bg: "bg-blue-400/10",
      border:
        "border-blue-400/15",
    },
  }[accent];

  return (
    <div
      className={`rounded-xl border ${styles.border} bg-[#0c1928] p-5`}
    >

      <div className="flex items-center justify-between">

        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
          {label}
        </span>

        <span
          className={`h-2 w-2 rounded-full ${styles.bg}`}
        />

      </div>

      <div
        className={`mt-3 text-3xl font-bold tracking-tight ${styles.text}`}
      >
        {value.toLocaleString()}
      </div>

    </div>
  );
}

function RiskBadge({
  risk,
}: {
  risk: string;
}) {
  const styles = {
    HIGH:
      "border-red-400/20 bg-red-400/10 text-red-300",

    ELEVATED:
      "border-orange-400/20 bg-orange-400/10 text-orange-300",

    MODERATE:
      "border-yellow-400/20 bg-yellow-400/10 text-yellow-300",

    LOW:
      "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  };

  const className =
    styles[
      risk as keyof typeof styles
    ] ??
    "border-slate-400/10 bg-slate-400/5 text-slate-400";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wide ${className}`}
    >
      {risk}
    </span>
  );
}

function formatNumber(
  value: number,
  decimals: number
) {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return "—";
  }

  return value.toLocaleString(
    undefined,
    {
      minimumFractionDigits:
        decimals,

      maximumFractionDigits:
        decimals,
    }
  );
}