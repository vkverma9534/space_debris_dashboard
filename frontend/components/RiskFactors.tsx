"use client";

import Plot from "react-plotly.js";

const factors = [
  {
    name: "Small separation",
    importance: 5,
    description:
      "Less distance between objects increases conjunction severity.",
  },
  {
    name: "Trajectory overlap",
    importance: 5,
    description:
      "Intersecting orbital paths increase the likelihood of a close approach.",
  },
  {
    name: "High relative velocity",
    importance: 5,
    description:
      "Higher encounter velocity increases potential collision energy.",
  },
  {
    name: "High uncertainty",
    importance: 4,
    description:
      "Greater positional uncertainty reduces confidence in the predicted separation.",
  },
  {
    name: "Short warning time",
    importance: 4,
    description:
      "Less time to respond makes an identified conjunction more difficult to manage.",
  },
];

export default function RiskFactors() {
  return (
    <section className="overflow-hidden rounded-xl border border-white/10 bg-[#0c1928]">

      {}

      <div className="border-b border-white/10 px-5 py-4">

        <div className="flex items-center gap-3">

          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-400/20 bg-red-400/10 text-red-400">
            ⚠
          </div>

          <div>
            <h2 className="text-base font-semibold text-white">
              What Makes a Conjunction More Dangerous?
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Relative importance of the main
              collision-risk factors.
            </p>
          </div>

        </div>

      </div>


      {}

      <div className="px-2 pb-2 pt-2">

        <Plot
          data={[
            {
              type: "bar",

              orientation: "h",

              x: factors.map(
                (factor) =>
                  factor.importance
              ),

              y: factors.map(
                (factor) =>
                  factor.name
              ),

              text: factors.map(
                (factor) =>
                  `${factor.importance}/5`
              ),

              textposition: "outside",

              cliponaxis: false,

              marker: {
                color: factors.map(
                  (factor) =>
                    factor.importance ===
                    5
                      ? "rgba(239,68,68,0.72)"
                      : "rgba(245,158,11,0.72)"
                ),

                line: {
                  color:
                    "rgba(255,255,255,0.18)",
                  width: 1,
                },
              },

              customdata:
                factors.map(
                  (factor) =>
                    factor.description
                ),

              hovertemplate:
                "<b>%{y}</b>" +
                "<br>Importance: %{x}/5" +
                "<br>%{customdata}" +
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

            height: 330,

            margin: {
              l: 165,
              r: 60,
              t: 15,
              b: 55,
            },

            xaxis: {
              title: {
                text:
                  "Relative importance",

                font: {
                  color: "#64748b",
                  size: 11,
                },
              },

              range: [0, 5.7],

              dtick: 1,

              gridcolor:
                "rgba(255,255,255,0.055)",

              zerolinecolor:
                "rgba(255,255,255,0.10)",

              tickfont: {
                color: "#64748b",
                size: 10,
              },
            },

            yaxis: {
              title: "",

              autorange: "reversed",

              tickfont: {
                color: "#94a3b8",
                size: 10,
              },

              automargin: true,
            },

            showlegend: false,

            hoverlabel: {
              bgcolor: "#101d2d",

              bordercolor:
                "#334155",

              font: {
                color: "#ffffff",
                size: 11,
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

      </div>


      {}

      <div className="grid grid-cols-5 border-t border-white/10 bg-[#091321]">

        {[1, 2, 3, 4, 5].map(
          (value) => (
            <div
              key={value}
              className="border-r border-white/[0.04] px-3 py-2 text-center last:border-r-0"
            >
              <div className="font-mono text-xs text-slate-500">
                {value}
              </div>

              <div className="mt-0.5 text-[9px] uppercase tracking-wide text-slate-700">
                {value === 1
                  ? "Low"
                  : value === 5
                  ? "Highest"
                  : ""}
              </div>
            </div>
          )
        )}

      </div>

    </section>
  );
}