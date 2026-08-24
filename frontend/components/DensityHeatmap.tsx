"use client";

import Plot from "react-plotly.js";

type DensityPoint = {
  altitude: number;
  inclination: number;
};

type DensityHeatmapProps = {
  data: DensityPoint[];
};

export default function DensityHeatmap({
  data,
}: DensityHeatmapProps) {
  if (!data.length) {
    return (
      <section className="overflow-hidden rounded-xl border border-white/10 bg-[#0c1928]">
        <ChartHeader
          title="Orbital Population Density"
          description="Altitude and inclination distribution of tracked objects."
        />

        <div className="flex h-[430px] items-center justify-center">
          <div className="text-center">
            <div className="text-3xl text-slate-700">
              ◌
            </div>

            <p className="mt-3 text-sm font-medium text-slate-400">
              No orbital population data
              available.
            </p>

            <p className="mt-1 text-xs text-slate-600">
              Try changing the current category
              filters.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const altitudeValues = data
    .map((item) => Number(item.altitude))
    .filter(Number.isFinite);

  const inclinationValues = data
    .map((item) => Number(item.inclination))
    .filter(Number.isFinite);

  const minAltitude =
    Math.min(...altitudeValues);

  const maxAltitude =
    Math.max(...altitudeValues);

  const minInclination =
    Math.min(...inclinationValues);

  const maxInclination =
    Math.max(...inclinationValues);

  return (
    <section className="overflow-hidden rounded-xl border border-white/10 bg-[#0c1928]">
      <ChartHeader
        title="Orbital Population Density"
        description="Where tracked objects are concentrated by altitude and inclination."
      />

      <div className="px-2 pb-2 pt-1">
        <Plot
          data={[
            {
              type: "histogram2d",
              x: altitudeValues,
              y: inclinationValues,
              nbinsx: 28,
              nbinsy: 22,
              colorscale: [
                [0, "#08111f"],
                [0.15, "#102a43"],
                [0.35, "#14532d"],
                [0.55, "#65a30d"],
                [0.75, "#facc15"],
                [1, "#ef4444"],
              ],
              colorbar: {
                title: {
                  text: "Objects",
                  side: "right",
                  font: {
                    color: "#94a3b8",
                    size: 11,
                  },
                },
                tickfont: {
                  color: "#64748b",
                  size: 10,
                },
                thickness: 12,
                len: 0.78,
                outlinewidth: 0,
              },
              hovertemplate:
                "<b>Orbital Density</b>" +
                "<br>Altitude: %{x:.0f} km" +
                "<br>Inclination: %{y:.1f}°" +
                "<br>Objects: %{z:,}" +
                "<extra></extra>",
            },
          ]}
          layout={{
            paper_bgcolor: "rgba(0,0,0,0)",
            plot_bgcolor: "rgba(0,0,0,0)",
            font: {
              color: "#cbd5e1",
            },
            height: 430,
            margin: {
              l: 65,
              r: 75,
              t: 18,
              b: 65,
            },
            xaxis: {
              title: {
                text: "Altitude (km)",
                font: {
                  color: "#64748b",
                  size: 11,
                },
              },
              range: [
                Math.max(0, minAltitude - 50),
                maxAltitude + 50,
              ],
              gridcolor:
                "rgba(255,255,255,0.055)",
              zerolinecolor:
                "rgba(255,255,255,0.08)",
              tickfont: {
                color: "#64748b",
                size: 10,
              },
              automargin: true,
            },
            yaxis: {
              title: {
                text: "Inclination (°)",
                font: {
                  color: "#64748b",
                  size: 11,
                },
              },
              range: [
                Math.max(0, minInclination - 2),
                maxInclination + 2,
              ],
              gridcolor:
                "rgba(255,255,255,0.055)",
              zerolinecolor:
                "rgba(255,255,255,0.08)",
              tickfont: {
                color: "#64748b",
                size: 10,
              },
              automargin: true,
            },
            hoverlabel: {
              bgcolor: "#101d2d",
              bordercolor: "#334155",
              font: {
                color: "#ffffff",
              },
            },
          }}
          config={{
            responsive: true,
            displayModeBar: false,
            scrollZoom: false,
          }}
          style={{
            width: "100%",
          }}
        />
      </div>
    </section>
  );
}

function ChartHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-white/10 px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.5)]" />

        <h3 className="text-base font-semibold text-white">
          {title}
        </h3>
      </div>

      <p className="mt-1.5 text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}