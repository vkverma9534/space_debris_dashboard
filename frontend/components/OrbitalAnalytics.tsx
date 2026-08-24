"use client";

import Plot from "react-plotly.js";

type OrbitalObject = {
  OBJECT_NAME: string;
  CATEGORY: string;
  MEAN_MOTION: number;
  ECCENTRICITY: number;
  INCLINATION: number;
};

type OrbitalAnalyticsProps = {
  objects: OrbitalObject[];
};

const CATEGORY_COLORS: Record<string, string> = {
  "Active Satellite": "#4C9AFF",
  "Space Station": "#00B8D9",
  Starlink: "#7C4DFF",
  OneWeb: "#FF5252",
  Kuiper: "#00C853",
  "Debris - Chinese ASAT": "#FF1744",
  "Debris - Iridium 33": "#FFC400",
  "Debris - Cosmos 2251": "#FF9100",
};

const FALLBACK_COLOR = "#64748b";

export default function OrbitalAnalytics({
  objects,
}: OrbitalAnalyticsProps) {
  const eccentricityObjects =
    objects.filter(
      (object) =>
        Number.isFinite(object.ECCENTRICITY) &&
        object.ECCENTRICITY >= 0 &&
        object.ECCENTRICITY <= 0.1
    );

  const motionObjects =
    objects.filter(
      (object) =>
        Number.isFinite(object.MEAN_MOTION) &&
        object.MEAN_MOTION >= 10 &&
        object.MEAN_MOTION <= 18
    );

  return (
    <section className="space-y-6">

      {}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

        <div>

          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-violet-400/20 bg-violet-400/10 text-violet-400">
              ◇
            </div>

            <div>
              <h2 className="text-xl font-semibold tracking-tight text-white">
                Advanced Orbital Analytics
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Detailed orbital characteristics and
                population distributions.
              </p>
            </div>

          </div>

        </div>

        <div className="rounded-full border border-white/10 bg-white/[0.025] px-3 py-1.5 text-xs text-slate-500">
          {objects.length.toLocaleString()} objects analyzed
        </div>

      </div>


      {}

      <div className="grid gap-5 xl:grid-cols-2">

        <InclinationChart
          objects={objects}
        />

        <EccentricityChart
          objects={eccentricityObjects}
        />

      </div>


      {}

      <MeanMotionChart
        objects={motionObjects}
      />


      {}

      <MeanMotionScatter
        objects={objects}
      />

    </section>
  );
}


function InclinationChart({
  objects,
}: {
  objects: OrbitalObject[];
}) {
  const categories =
    getCategories(objects);

  const traces = categories
    .map((category) => {
      const values = objects
        .filter(
          (object) =>
            object.CATEGORY === category
        )
        .map(
          (object) =>
            object.INCLINATION
        )
        .filter(Number.isFinite);

      if (!values.length) {
        return null;
      }

      return {
        type: "box" as const,

        name: category,

        y: values,

        boxpoints: false,

        fillcolor: "rgba(0,0,0,0)",

        line: {
          color:
            getCategoryColor(
              category
            ),
          width: 2,
        },

        marker: {
          color:
            getCategoryColor(
              category
            ),
        },

        hovertemplate:
          `<b>${escapeHtml(category)}</b>` +
          "<br>Inclination: %{y:.2f}°" +
          "<extra></extra>",
      };
    })
    .filter(Boolean);

  return (
    <ChartCard
      title="Orbital Inclination"
      description="Inclination distribution by object category."
    >
      <Plot
        data={traces}
        layout={baseLayout({
          height: 390,

          margin: {
            l: 55,
            r: 25,
            t: 15,
            b: 95,
          },

          yaxis: {
            title: {
              text: "Inclination (°)",
              font: axisTitleFont(),
            },

            gridcolor:
              GRID_COLOR,

            zerolinecolor:
              ZERO_COLOR,

            tickfont:
              AXIS_FONT,
          },

          xaxis: {
            tickangle: -32,

            tickfont: {
              color: "#64748b",
              size: 9,
            },

            automargin: true,
          },

          showlegend: false,
        })}
        config={plotConfig()}
        style={plotStyle()}
      />
    </ChartCard>
  );
}


function EccentricityChart({
  objects,
}: {
  objects: OrbitalObject[];
}) {
  const categories =
    getCategories(objects);

  const traces = categories
    .map((category) => {
      const values = objects
        .filter(
          (object) =>
            object.CATEGORY === category
        )
        .map(
          (object) =>
            object.ECCENTRICITY
        )
        .filter(
          (value) =>
            Number.isFinite(value) &&
            value >= 0 &&
            value <= 0.1
        );

      if (!values.length) {
        return null;
      }

      return {
        type: "box" as const,

        name: category,

        y: values,

        boxpoints: false,

        fillcolor: "rgba(0,0,0,0)",

        line: {
          color:
            getCategoryColor(
              category
            ),
          width: 2,
        },

        marker: {
          color:
            getCategoryColor(
              category
            ),
        },

        hovertemplate:
          `<b>${escapeHtml(category)}</b>` +
          "<br>Eccentricity: %{y:.6f}" +
          "<extra></extra>",
      };
    })
    .filter(Boolean);

  return (
    <ChartCard
      title="Eccentricity — 0 to 0.1"
      description="Low-eccentricity orbital distribution by category."
    >
      <Plot
        data={traces}
        layout={baseLayout({
          height: 390,

          margin: {
            l: 60,
            r: 25,
            t: 15,
            b: 95,
          },

          yaxis: {
            title: {
              text: "Eccentricity",
              font: axisTitleFont(),
            },

            range: [0, 0.1],

            gridcolor:
              GRID_COLOR,

            zerolinecolor:
              ZERO_COLOR,

            tickfont:
              AXIS_FONT,

            tickformat:
              ".3f",
          },

          xaxis: {
            tickangle: -32,

            tickfont: {
              color: "#64748b",
              size: 9,
            },

            automargin: true,
          },

          showlegend: false,
        })}
        config={plotConfig()}
        style={plotStyle()}
      />
    </ChartCard>
  );
}


function MeanMotionChart({
  objects,
}: {
  objects: OrbitalObject[];
}) {
  if (!objects.length) {
    return (
      <EmptyChart
        title="Mean Motion Distribution"
        message="No objects fall inside the 10–18 revolutions/day analysis range."
      />
    );
  }

  return (
    <ChartCard
      title="Mean Motion Distribution"
      description="Distribution of orbital revolutions per day."
    >
      <Plot
        data={[
          {
            type: "histogram",

            x: objects.map(
              (object) =>
                object.MEAN_MOTION
            ),

            nbinsx: 32,

            marker: {
              color:
                "rgba(99,102,241,0.65)",

              line: {
                color:
                  "rgba(129,140,248,0.95)",

                width: 1,
              },
            },

            hovertemplate:
              "Mean Motion: %{x:.2f}" +
              "<br>Objects: %{y:,}" +
              "<extra></extra>",
          },
        ]}
        layout={baseLayout({
          height: 390,

          margin: {
            l: 60,
            r: 25,
            t: 15,
            b: 60,
          },

          xaxis: {
            title: {
              text:
                "Revolutions per Day",
              font: axisTitleFont(),
            },

            dtick: 1,

            gridcolor:
              GRID_COLOR,

            zerolinecolor:
              ZERO_COLOR,

            tickfont:
              AXIS_FONT,
          },

          yaxis: {
            title: {
              text: "Objects",
              font: axisTitleFont(),
            },

            rangemode:
              "tozero",

            gridcolor:
              GRID_COLOR,

            zerolinecolor:
              ZERO_COLOR,

            tickfont:
              AXIS_FONT,
          },

          showlegend: false,
        })}
        config={plotConfig()}
        style={plotStyle()}
      />
    </ChartCard>
  );
}


function MeanMotionScatter({
  objects,
}: {
  objects: OrbitalObject[];
}) {
  const sample =
    objects.length > 3500
      ? objects.slice(0, 3500)
      : objects;

  if (!sample.length) {
    return (
      <EmptyChart
        title="Mean Motion vs Eccentricity"
        message="No orbital objects are available for correlation analysis."
      />
    );
  }

  const categories =
    getCategories(sample);

  const traces = categories
    .map((category) => {
      const categoryObjects =
        sample.filter(
          (object) =>
            object.CATEGORY === category
        );

      if (!categoryObjects.length) {
        return null;
      }

      return {
        type: "scattergl" as const,

        mode: "markers" as const,

        name: category,

        x: categoryObjects.map(
          (object) =>
            object.MEAN_MOTION
        ),

        y: categoryObjects.map(
          (object) =>
            object.ECCENTRICITY
        ),

        text: categoryObjects.map(
          (object) =>
            object.OBJECT_NAME
        ),

        customdata:
          categoryObjects.map(
            (object) => [
              object.CATEGORY,
            ]
          ),

        marker: {
          size: 6,

          color:
            getCategoryColor(
              category
            ),

          opacity: 0.58,

          line: {
            width: 0,
          },
        },

        hovertemplate:
          "<b>%{text}</b>" +
          "<br>Category: %{customdata[0]}" +
          "<br>Mean Motion: %{x:.4f}" +
          "<br>Eccentricity: %{y:.6f}" +
          "<extra></extra>",
      };
    })
    .filter(Boolean);

  return (
    <ChartCard
      title="Mean Motion vs Eccentricity"
      description={`Orbital parameter correlation · showing ${sample.length.toLocaleString()} objects`}
    >
      <Plot
        data={traces}
        layout={baseLayout({
          height: 480,

          margin: {
            l: 60,
            r: 25,
            t: 15,
            b: 60,
          },

          xaxis: {
            title: {
              text:
                "Revolutions per Day",
              font: axisTitleFont(),
            },

            gridcolor:
              GRID_COLOR,

            zerolinecolor:
              ZERO_COLOR,

            tickfont:
              AXIS_FONT,
          },

          yaxis: {
            title: {
              text:
                "Eccentricity",
              font: axisTitleFont(),
            },

            gridcolor:
              GRID_COLOR,

            zerolinecolor:
              ZERO_COLOR,

            tickfont:
              AXIS_FONT,
          },

          legend: {
            orientation: "h",

            y: -0.18,

            x: 0,

            font: {
              color: "#64748b",
              size: 10,
            },

            bgcolor:
              "rgba(0,0,0,0)",
          },
        })}
        config={plotConfig()}
        style={plotStyle()}
      />
    </ChartCard>
  );
}


function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0c1928]">

      <div className="border-b border-white/10 px-5 py-4">

        <div className="flex items-center gap-3">

          <span className="h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_12px_rgba(167,139,250,0.45)]" />

          <h3 className="text-base font-semibold text-white">
            {title}
          </h3>

        </div>

        <p className="mt-1.5 text-xs text-slate-500">
          {description}
        </p>

      </div>

      <div className="px-2 pb-2 pt-1">
        {children}
      </div>

    </div>
  );
}


function EmptyChart({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0c1928]">

      <div className="border-b border-white/10 px-5 py-4">

        <h3 className="text-base font-semibold text-white">
          {title}
        </h3>

      </div>

      <div className="flex h-[390px] items-center justify-center px-6 text-center">

        <div>
          <div className="text-3xl text-slate-700">
            ◌
          </div>

          <p className="mt-3 text-sm text-slate-400">
            {message}
          </p>
        </div>

      </div>

    </div>
  );
}


const GRID_COLOR =
  "rgba(255,255,255,0.055)";

const ZERO_COLOR =
  "rgba(255,255,255,0.10)";

const AXIS_FONT = {
  color: "#64748b",
  size: 10,
};

function axisTitleFont() {
  return {
    color: "#64748b",
    size: 11,
  };
}

function plotConfig() {
  return {
    responsive: true,
    displayModeBar: false,
    scrollZoom: false,
  };
}

function plotStyle() {
  return {
    width: "100%",
  };
}

function baseLayout(
  overrides: Record<string, unknown>
) {
  return {
    paper_bgcolor:
      "rgba(0,0,0,0)",

    plot_bgcolor:
      "rgba(0,0,0,0)",

    font: {
      color: "#cbd5e1",
    },

    hoverlabel: {
      bgcolor: "#101d2d",

      bordercolor:
        "#334155",

      font: {
        color: "#ffffff",
        size: 11,
      },
    },

    ...overrides,
  };
}

function getCategories(
  objects: OrbitalObject[]
) {
  return Array.from(
    new Set(
      objects
        .map(
          (object) =>
            object.CATEGORY
        )
        .filter(Boolean)
    )
  );
}

function getCategoryColor(
  category: string
) {
  return (
    CATEGORY_COLORS[category] ??
    FALLBACK_COLOR
  );
}

function escapeHtml(
  value: string
) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}