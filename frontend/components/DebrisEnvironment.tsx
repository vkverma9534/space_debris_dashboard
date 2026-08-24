"use client";

import Plot from "react-plotly.js";

type DebrisAltitude = {
  altitude: number;
  objects: number;
};

type DebrisSource = {
  source: string;
  objects: number;
};

type DebrisEnvironmentProps = {
  altitudeData: DebrisAltitude[];
  sourceData: DebrisSource[];
};

export default function DebrisEnvironment({
  altitudeData,
  sourceData,
}: DebrisEnvironmentProps) {
  const totalDebris = altitudeData.reduce(
    (sum, item) => sum + item.objects,
    0
  );

  const sourceTotal = sourceData.reduce(
    (sum, item) => sum + item.objects,
    0
  );

  if (
    altitudeData.length === 0 &&
    sourceData.length === 0
  ) {
    return (
      <section className="rounded-2xl border border-white/10 bg-[#0b1625] p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-orange-400/20 bg-orange-400/10 text-orange-400">
            ◈
          </div>

          <div>
            <h2 className="text-xl font-semibold tracking-tight text-white">
              Debris Environment
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Distribution and tracked sources of
              orbital debris.
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-white/5 bg-[#07111f] px-6 py-14 text-center">
          <p className="text-sm font-medium text-slate-300">
            No debris objects in current filter
          </p>

          <p className="mt-1 text-xs text-slate-600">
            Change the category selection to
            include debris objects.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">

      {}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

        <div>
          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-orange-400/20 bg-orange-400/10 text-orange-400">
              ◈
            </div>

            <div>
              <h2 className="text-xl font-semibold tracking-tight text-white">
                Debris Environment
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Distribution and tracked sources of
                orbital debris.
              </p>
            </div>

          </div>
        </div>

        <div className="flex gap-2">

          <StatPill
            label="Altitude bands"
            value={altitudeData.length}
          />

          <StatPill
            label="Sources"
            value={sourceData.length}
          />

        </div>

      </div>


      {}

      <div className="grid gap-5 xl:grid-cols-2">

        {}

        <ChartCard
          title="Debris by Altitude"
          subtitle="Tracked debris population across orbital altitude bands."
        >

          <Plot
            data={[
              {
                type: "bar",

                x: altitudeData.map(
                  (item) => item.altitude
                ),

                y: altitudeData.map(
                  (item) => item.objects
                ),

                marker: {
                  color:
                    "rgba(249,115,22,0.72)",

                  line: {
                    color:
                      "rgba(251,146,60,0.95)",

                    width: 1,
                  },
                },

                hovertemplate:
                  "<b>%{x:,} km</b>" +
                  "<br>Debris: %{y:,}" +
                  "<extra></extra>",
              },
            ]}

            layout={{
              paper_bgcolor:
                "rgba(0,0,0,0)",

              plot_bgcolor:
                "rgba(0,0,0,0)",

              font: {
                color: "#cbd5e1",
              },

              margin: {
                l: 60,
                r: 25,
                t: 15,
                b: 55,
              },

              height: 390,

              bargap: 0.12,

              xaxis: {
                title: {
                  text:
                    "Altitude (km)",
                  font: {
                    size: 11,
                    color:
                      "#64748b",
                  },
                },

                gridcolor:
                  "rgba(255,255,255,0.055)",

                zerolinecolor:
                  "rgba(255,255,255,0.08)",

                tickfont: {
                  size: 10,
                  color:
                    "#64748b",
                },
              },

              yaxis: {
                title: {
                  text: "Debris",
                  font: {
                    size: 11,
                    color:
                      "#64748b",
                  },
                },

                rangemode:
                  "tozero",

                gridcolor:
                  "rgba(255,255,255,0.055)",

                zerolinecolor:
                  "rgba(255,255,255,0.08)",

                tickfont: {
                  size: 10,
                  color:
                    "#64748b",
                },
              },

              showlegend: false,

              hoverlabel: {
                bgcolor:
                  "#101d2d",
                bordercolor:
                  "#334155",
                font: {
                  color: "#fff",
                },
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

        </ChartCard>


        {}

        <ChartCard
          title="Tracked Debris Sources"
          subtitle="Distribution of debris by tracked source category."
        >

          <Plot
            data={[
              {
                type: "bar",

                x: sourceData.map(
                  (item) => item.objects
                ),

                y: sourceData.map(
                  (item) => item.source
                ),

                orientation: "h",

                marker: {
                  color:
                    "rgba(168,85,247,0.72)",

                  line: {
                    color:
                      "rgba(192,132,252,0.95)",

                    width: 1,
                  },
                },

                hovertemplate:
                  "<b>%{y}</b>" +
                  "<br>Objects: %{x:,}" +
                  "<extra></extra>",
              },
            ]}

            layout={{
              paper_bgcolor:
                "rgba(0,0,0,0)",

              plot_bgcolor:
                "rgba(0,0,0,0)",

              font: {
                color: "#cbd5e1",
              },

              margin: {
                l: 150,
                r: 45,
                t: 15,
                b: 55,
              },

              height: 390,

              bargap: 0.22,

              xaxis: {
                title: {
                  text: "Objects",
                  font: {
                    size: 11,
                    color:
                      "#64748b",
                  },
                },

                rangemode:
                  "tozero",

                gridcolor:
                  "rgba(255,255,255,0.055)",

                zerolinecolor:
                  "rgba(255,255,255,0.08)",

                tickfont: {
                  size: 10,
                  color:
                    "#64748b",
                },
              },

              yaxis: {
                title: "",

                tickfont: {
                  size: 10,
                  color:
                    "#94a3b8",
                },

                automargin: true,
              },

              showlegend: false,

              hoverlabel: {
                bgcolor:
                  "#101d2d",

                bordercolor:
                  "#334155",

                font: {
                  color: "#fff",
                },
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

        </ChartCard>

      </div>


      {}

      <div className="grid gap-3 sm:grid-cols-3">

        <SummaryCard
          label="Altitude bands"
          value={altitudeData.length}
          suffix=""
        />

        <SummaryCard
          label="Tracked sources"
          value={sourceData.length}
          suffix=""
        />

        <SummaryCard
          label="Source records"
          value={sourceTotal || totalDebris}
          suffix=""
        />

      </div>

    </section>
  );
}


function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0c1928]">

      <div className="border-b border-white/10 px-5 py-4">

        <h3 className="text-base font-semibold text-white">
          {title}
        </h3>

        <p className="mt-1 text-xs text-slate-500">
          {subtitle}
        </p>

      </div>

      <div className="px-2 pb-2 pt-2">
        {children}
      </div>

    </div>
  );
}


function StatPill({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-full border border-white/10 bg-white/[0.025] px-3 py-1.5 text-xs text-slate-500">

      {label}

      <span className="ml-1.5 font-semibold text-slate-200">
        {value.toLocaleString()}
      </span>

    </div>
  );
}


function SummaryCard({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number;
  suffix: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0c1928] px-5 py-4">

      <div className="text-[10px] font-medium uppercase tracking-wider text-slate-600">
        {label}
      </div>

      <div className="mt-2 text-xl font-semibold text-slate-200">
        {value.toLocaleString()}
        {suffix && (
          <span className="ml-1 text-sm text-slate-500">
            {suffix}
          </span>
        )}
      </div>

    </div>
  );
}