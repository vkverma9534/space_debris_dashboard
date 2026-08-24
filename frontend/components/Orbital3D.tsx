"use client";

import Plot from "react-plotly.js";

type OrbitalObject = {
  OBJECT_NAME: string;
  CATEGORY: string;
  NORAD_CAT_ID: string | number;
  X: number;
  Y: number;
  Z: number;
  ALTITUDE: number;
};

type Orbital3DProps = {
  objects: OrbitalObject[];
};

export default function Orbital3D({
  objects,
}: Orbital3DProps) {
  const earthRadius = 6378.137;

  const theta = Array.from(
    { length: 64 },
    (_, i) =>
      (i / 63) * 2 * Math.PI
  );

  const phi = Array.from(
    { length: 36 },
    (_, i) =>
      (i / 35) * Math.PI
  );

  const earthX: number[][] = [];
  const earthY: number[][] = [];
  const earthZ: number[][] = [];

  for (const t of theta) {
    const rowX: number[] = [];
    const rowY: number[] = [];
    const rowZ: number[] = [];

    for (const p of phi) {
      rowX.push(
        earthRadius *
          Math.cos(t) *
          Math.sin(p)
      );

      rowY.push(
        earthRadius *
          Math.sin(t) *
          Math.sin(p)
      );

      rowZ.push(
        earthRadius *
          Math.cos(p)
      );
    }

    earthX.push(rowX);
    earthY.push(rowY);
    earthZ.push(rowZ);
  }

  const debris = objects.filter(
    (object) =>
      object.CATEGORY
        ?.toLowerCase()
        .includes("debris")
  );

  const spacecraft = objects.filter(
    (object) =>
      !object.CATEGORY
        ?.toLowerCase()
        .includes("debris")
  );

  const makeCustomData = (
    collection: OrbitalObject[]
  ) =>
    collection.map((object) => [
      object.CATEGORY,
      object.NORAD_CAT_ID,
      object.ALTITUDE,
    ]);

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1625]">

      {

}

      <div className="border-b border-white/10 px-6 py-5">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-400/20 bg-cyan-400/10 text-cyan-400">
                ◎
              </div>

              <div>
                <h2 className="text-xl font-semibold tracking-tight text-white">
                  3D Orbital Environment
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Interactive view of the Earth and
                  tracked orbital objects.
                </p>
              </div>

            </div>

          </div>

          <div className="flex flex-wrap gap-2">

            <Legend
              label="Spacecraft"
              className="bg-cyan-400"
            />

            <Legend
              label="Debris"
              className="bg-red-400"
            />

            <div className="rounded-full border border-white/10 bg-white/[0.025] px-3 py-1.5 text-xs text-slate-400">
              {objects.length.toLocaleString()} objects
            </div>

          </div>

        </div>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600">

          <span>
            Drag to rotate
          </span>

          <span>
            Scroll to zoom
          </span>

          <span>
            Hover for object details
          </span>

        </div>

      </div>

      {

}

      <div className="relative">

        <Plot

          data={[

            {
              type: "surface",

              x: earthX,
              y: earthY,
              z: earthZ,

              surfacecolor:
                earthZ.map((row) =>
                  row.map(
                    (_, index) =>
                      index
                  )
                ),

              colorscale: [
                [0, "#071a2e"],
                [0.35, "#0b3b5a"],
                [0.65, "#126e82"],
                [1, "#38bdf8"],
              ],

              opacity: 0.82,

              showscale: false,

              lighting: {
                ambient: 0.45,
                diffuse: 0.75,
                specular: 0.25,
                roughness: 0.75,
              },

              lightposition: {
                x: 10000,
                y: 5000,
                z: 10000,
              },

              name: "Earth",

              hoverinfo: "skip",
            },

            

            {
              type: "scatter3d",

              mode: "markers",

              x: spacecraft.map(
                (object) => object.X
              ),

              y: spacecraft.map(
                (object) => object.Y
              ),

              z: spacecraft.map(
                (object) => object.Z
              ),

              text: spacecraft.map(
                (object) =>
                  object.OBJECT_NAME
              ),

              customdata:
                makeCustomData(
                  spacecraft
                ),

              marker: {
                size: 3.2,

                color: "#38bdf8",

                opacity: 0.82,

                line: {
                  color:
                    "rgba(255,255,255,0.18)",
                  width: 0.5,
                },
              },

              hovertemplate:
                "<b>%{text}</b>" +
                "<br>Category: %{customdata[0]}" +
                "<br>NORAD: %{customdata[1]}" +
                "<br>Altitude: %{customdata[2]:.1f} km" +
                "<br>X: %{x:.0f} km" +
                "<br>Y: %{y:.0f} km" +
                "<br>Z: %{z:.0f} km" +
                "<extra></extra>",

              name: "Spacecraft",
            },

            

            {
              type: "scatter3d",

              mode: "markers",

              x: debris.map(
                (object) => object.X
              ),

              y: debris.map(
                (object) => object.Y
              ),

              z: debris.map(
                (object) => object.Z
              ),

              text: debris.map(
                (object) =>
                  object.OBJECT_NAME
              ),

              customdata:
                makeCustomData(
                  debris
                ),

              marker: {
                size: 2.6,

                color: "#fb7185",

                opacity: 0.75,

                line: {
                  color:
                    "rgba(255,255,255,0.12)",
                  width: 0.4,
                },
              },

              hovertemplate:
                "<b>%{text}</b>" +
                "<br>Category: %{customdata[0]}" +
                "<br>NORAD: %{customdata[1]}" +
                "<br>Altitude: %{customdata[2]:.1f} km" +
                "<br>X: %{x:.0f} km" +
                "<br>Y: %{y:.0f} km" +
                "<br>Z: %{z:.0f} km" +
                "<extra></extra>",

              name: "Debris",
            },
          ]}

          layout={{
            paper_bgcolor:
              "#07111f",

            plot_bgcolor:
              "#07111f",

            margin: {
              l: 0,
              r: 0,
              b: 0,
              t: 0,
            },

            height: 650,

            showlegend: false,

            scene: {
              bgcolor: "#07111f",

              aspectmode: "data",

              camera: {
                eye: {
                  x: 1.65,
                  y: 1.65,
                  z: 1.15,
                },
              },

              xaxis: {
                title: {
                  text: "X (km)",
                  font: {
                    size: 11,
                    color: "#64748b",
                  },
                },

                gridcolor:
                  "rgba(255,255,255,0.045)",

                zerolinecolor:
                  "rgba(255,255,255,0.08)",

                tickfont: {
                  color: "#475569",
                  size: 9,
                },

                showbackground: false,
              },

              yaxis: {
                title: {
                  text: "Y (km)",
                  font: {
                    size: 11,
                    color: "#64748b",
                  },
                },

                gridcolor:
                  "rgba(255,255,255,0.045)",

                zerolinecolor:
                  "rgba(255,255,255,0.08)",

                tickfont: {
                  color: "#475569",
                  size: 9,
                },

                showbackground: false,
              },

              zaxis: {
                title: {
                  text: "Z (km)",
                  font: {
                    size: 11,
                    color: "#64748b",
                  },
                },

                gridcolor:
                  "rgba(255,255,255,0.045)",

                zerolinecolor:
                  "rgba(255,255,255,0.08)",

                tickfont: {
                  color: "#475569",
                  size: 9,
                },

                showbackground: false,
              },

              camera_projection: {
                type: "perspective",
              },
            },

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

            displayModeBar: true,

            displaylogo: false,

            modeBarButtonsToRemove: [
              "lasso3d",
              "select3d",
            ],
          }}

          style={{
            width: "100%",
          }}
        />

        {}
        <div className="pointer-events-none absolute bottom-5 left-5 rounded-lg border border-white/10 bg-[#07111f]/80 px-3 py-2 backdrop-blur">
          <div className="text-[10px] uppercase tracking-wider text-slate-600">
            Objects rendered
          </div>

          <div className="mt-0.5 font-mono text-sm text-slate-300">
            {objects.length.toLocaleString()}
          </div>
        </div>

      </div>

    </section>
  );
}

function Legend({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.025] px-3 py-1.5 text-xs text-slate-400">

      <span
        className={`h-2 w-2 rounded-full ${className}`}
      />

      {label}

    </div>
  );
}