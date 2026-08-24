"use client";

import Plot from "react-plotly.js";

type AltitudePoint = {
  "Altitude Band": number;
  Objects: number;
};

type OrbitalAltitudeProps = {
  data: AltitudePoint[];
};

export default function OrbitalAltitude({
  data,
}: OrbitalAltitudeProps) {
  if (!data.length) {
    return (
      <section className="overflow-hidden rounded-xl border border-white/10 bg-[#0c1928]">
        <ChartHeader
          title="Objects by Orbital Altitude"
          description="Distribution of tracked objects across altitude bands."
        />

        <div className="flex h-[390px] items-center justify-center">
          <div className="text-center">
            <div className="text-3xl text-slate-700">
              ◌
            </div>

            <p className="mt-3 text-sm font-medium text-slate-400">
              No objects fall inside the
              150–2,000 km display range.
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

  const sortedData = [...data].sort(
    (a, b) =>
      a["Altitude Band"] -
      b["Altitude Band"]
  );

  const totalObjects = sortedData.reduce(
    (sum, item) =>
      sum + Number(item.Objects || 0),
    0
  );

  const peakBand = sortedData.reduce(
    (max, item) =>
      item.Objects > max.Objects
        ? item
        : max,
    sortedData[0]
  );

  return (
    <section className="overflow-hidden rounded-xl border border-white/10 bg-[#0c1928]">
      <ChartHeader
        title="Objects by Orbital Altitude"
        description="Distribution of tracked objects across the 150–2,000 km display range."
      />

      <div className="grid grid-cols-2 gap-3 border-b border-white/10 px-5 py-4">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-wider text-slate-600">
            Objects in range
          </div>

          <div className="mt-1 text-lg font-semibold text-slate-200">
            {totalObjects.toLocaleString()}
          </div>
        </div>

        <div>
          <div className="text-[10px] font-medium uppercase tracking-wider text-slate-600">
            Peak altitude band
          </div>

          <div className="mt-1 text-lg font-semibold text-cyan-300">
            {Number(
              peakBand["Altitude Band"]
            ).toLocaleString()}{" "}
            <span className="text-xs font-normal text-slate-500">
              km
            </span>
          </div>
        </div>
      </div>

      <div className="px-2 pb-2 pt-1">
        <Plot
          data={[
            {
              type: "bar",
              x: sortedData.map(
                (item) =>
                  item["Altitude Band"]
              ),
              y: sortedData.map(
                (item) => item.Objects
              ),
              marker: {
                color:
                  "rgba(34,211,238,0.62)",
                line: {
                  color:
                    "rgba(103,232,249,0.95)",
                  width: 1,
                },
              },
              hovertemplate:
                "<b>Altitude: %{x:,} km</b>" +
                "<br>Objects: %{y:,}" +
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
            height: 390,
            margin: {
              l: 60,
              r: 25,
              t: 18,
              b: 60,
            },
            bargap: 0.08,
            xaxis: {
              title: {
                text: "Altitude (km)",
                font: {
                  color: "#64748b",
                  size: 11,
                },
              },
              gridcolor:
                "rgba(255,255,255,0.045)",
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
                text: "Objects",
                font: {
                  color: "#64748b",
                  size: 11,
                },
              },
              rangemode: "tozero",
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
            showlegend: false,
            hoverlabel: {
              bgcolor: "#101d2d",
              bordercolor: "#334155",
              font: {
                color: "#ffffff",
                size: 12,
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