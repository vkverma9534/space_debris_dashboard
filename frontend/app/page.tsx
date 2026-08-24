"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import MetricCards from "../components/MetricCards";

const OrbitalAltitude = dynamic(
  () => import("../components/OrbitalAltitude"),
  { ssr: false }
);

const DensityHeatmap = dynamic(
  () => import("../components/DensityHeatmap"),
  { ssr: false }
);

const CollisionRisk = dynamic(
  () => import("../components/CollisionRisk"),
  { ssr: false }
);

const Orbital3D = dynamic(
  () => import("../components/Orbital3D"),
  { ssr: false }
);

const OrbitalAnalytics = dynamic(
  () => import("../components/OrbitalAnalytics"),
  { ssr: false }
);

const RiskFactors = dynamic(
  () => import("../components/RiskFactors"),
  { ssr: false }
);

const DebrisEnvironment = dynamic(
  () => import("../components/DebrisEnvironment"),
  { ssr: false }
);

const CatalogExplorer = dynamic(
  () => import("../components/CatalogExplorer"),
  { ssr: false }
);


const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000";


type Metrics = {
  total: number;
  visible: number;
  active: number;
  debris: number;
  leo: number;
};

type AltitudePoint = {
  "Altitude Band": number;
  Objects: number;
};

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

type OrbitalObject = {
  OBJECT_NAME: string;
  CATEGORY: string;
  NORAD_CAT_ID: string | number;
  APPROX_ALTITUDE: number;
  MEAN_MOTION: number;
  ECCENTRICITY: number;
  INCLINATION: number;
  MEAN_ANOMALY?: number;
};

type PositionObject = {
  OBJECT_NAME: string;
  CATEGORY: string;
  NORAD_CAT_ID: string | number;
  X: number;
  Y: number;
  Z: number;
  ALTITUDE: number;
};

type DashboardData = {
  metrics: Metrics;

  altitude_distribution: AltitudePoint[];

  risk_summary: RiskSummary;

  closest_approaches: Approach[];

  orbital_objects: OrbitalObject[];

  density_points: {
    altitude: number;
    inclination: number;
  }[];

  debris_altitude: {
    altitude: number;
    objects: number;
  }[];

  debris_sources: {
    source: string;
    objects: number;
  }[];
};


export default function Home() {
  const [data, setData] =
    useState<DashboardData | null>(null);

  const [positions, setPositions] =
    useState<PositionObject[]>([]);

  const [categories, setCategories] =
    useState<string[]>([]);

  const [selectedCategories, setSelectedCategories] =
    useState<string[]>([]);

  const [hoursAhead, setHoursAhead] =
    useState(2);

  const [thresholdKm, setThresholdKm] =
    useState(10);

  const [objects3d, setObjects3d] =
    useState(700);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);


  useEffect(() => {
    loadCategories();
  }, []);


  useEffect(() => {
    if (selectedCategories.length === 0) {
      return;
    }

    loadDashboard();
    loadPositions();

  }, [
    selectedCategories,
    hoursAhead,
    thresholdKm,
    objects3d,
  ]);


  async function loadCategories() {
    try {
      setError(null);

      const response = await fetch(
        `${API_URL}/api/categories`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load categories"
        );
      }

      const result =
        await response.json();

      const loadedCategories =
        Array.isArray(result.categories)
          ? result.categories
          : [];

      setCategories(
        loadedCategories
      );

      setSelectedCategories(
        loadedCategories
      );

      if (
        loadedCategories.length === 0
      ) {
        setLoading(false);
      }

    } catch (error) {
      console.error(
        "Unable to load categories:",
        error
      );

      setError(
        "Unable to connect to the backend."
      );

      setLoading(false);
    }
  }


  async function loadDashboard() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_URL}/api/dashboard`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            categories:
              selectedCategories,

            hours_ahead:
              hoursAhead,

            threshold_km:
              thresholdKm,

            objects_3d:
              objects3d,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Dashboard request failed"
        );
      }

      const result =
        await response.json();

      setData(result);

    } catch (error) {
      console.error(
        "Unable to load dashboard:",
        error
      );

      setError(
        "Unable to load dashboard data."
      );

    } finally {
      setLoading(false);
    }
  }


  async function loadPositions() {
    try {
      const response = await fetch(
        `${API_URL}/api/orbital-positions`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            categories:
              selectedCategories,

            hours_ahead:
              hoursAhead,

            threshold_km:
              thresholdKm,

            objects_3d:
              objects3d,
          }),
        }
      );

      if (!response.ok) {
        console.error(
          "Orbital position request failed."
        );

        return;
      }

      const result =
        await response.json();

      setPositions(
        Array.isArray(result.objects)
          ? result.objects
          : []
      );

    } catch (error) {
      console.error(
        "Unable to load orbital positions:",
        error
      );
    }
  }


  function toggleCategory(
    category: string
  ) {
    setSelectedCategories(
      (current) => {
        if (
          current.includes(category)
        ) {
          return current.filter(
            (item) =>
              item !== category
          );
        }

        return [
          ...current,
          category,
        ];
      }
    );
  }


  function selectAllCategories() {
    setSelectedCategories(
      categories
    );
  }


  function clearCategories() {
    setSelectedCategories([]);
  }


  return (
    <main className="min-h-screen bg-[#07111f] text-white">


      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#07111f]/95 backdrop-blur-xl">

        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-5 py-4 lg:px-6">

          <div>

            <div className="flex items-center gap-3">


              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-400/20 bg-cyan-400/10 text-cyan-400">
                ◎
              </div>


              <div>

                <h1 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
                  Space Debris & Collision
                  Risk Dashboard
                </h1>

                <p className="mt-0.5 hidden text-xs text-slate-500 sm:block">
                  Visual Space Situational Awareness
                  • Orbital population • Debris
                  environment • Conjunction screening
                </p>


                <div className="mt-2 flex flex-wrap items-center gap-2">

                  <span className="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/[0.06] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-cyan-300">
                    Smart India Hackathon 2026
                  </span>

                  <span className="text-[10px] text-slate-700">
                    •
                  </span>

                  <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-300">
                    Hands Of Hope
                  </span>

                </div>

              </div>

            </div>

          </div>


          <div className="hidden items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-1.5 text-xs text-emerald-400 sm:flex">

            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />

            System Online

          </div>

        </div>

      </header>


      <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 sm:py-6">


        <section className="mb-6 overflow-hidden rounded-xl border border-white/10 bg-[#0c1928]">

          <div className="border-b border-white/10 px-5 py-4">

            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">

              <div>

                <div className="flex items-center gap-3">

                  <div className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.5)]" />

                  <h2 className="text-base font-semibold text-white">
                    Dashboard Controls
                  </h2>

                </div>

                <p className="mt-1.5 text-xs text-slate-500">
                  Configure the orbital population
                  and conjunction screening.
                </p>

              </div>


              <div className="flex gap-2">

                <button
                  type="button"
                  onClick={
                    selectAllCategories
                  }
                  className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/5"
                >
                  Select All
                </button>

                <button
                  type="button"
                  onClick={
                    clearCategories
                  }
                  className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/5"
                >
                  Clear
                </button>

              </div>

            </div>

          </div>


          <div className="grid gap-5 p-5 lg:grid-cols-3">


            <div>

              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Object Categories
              </label>

              <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-white/10 bg-[#07111f] p-2">

                {categories.length === 0 ? (

                  <div className="p-3 text-xs text-slate-600">
                    Loading categories...
                  </div>

                ) : (

                  categories.map(
                    (category) => (
                      <label
                        key={category}
                        className="flex cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 text-xs text-slate-300 transition hover:bg-white/[0.04]"
                      >

                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(
                            category
                          )}
                          onChange={() =>
                            toggleCategory(
                              category
                            )
                          }
                          className="h-3.5 w-3.5 accent-cyan-400"
                        />

                        <span>
                          {category}
                        </span>

                      </label>
                    )
                  )

                )}

              </div>

              <div className="mt-2 text-[10px] text-slate-600">
                {selectedCategories.length.toLocaleString()}{" "}
                of{" "}
                {categories.length.toLocaleString()}{" "}
                categories selected
              </div>

            </div>


            <div>

              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Propagation Window
              </label>

              <div className="rounded-lg border border-white/10 bg-[#07111f] p-4">

                <div className="mb-4 flex items-center justify-between">

                  <span className="text-sm text-slate-400">
                    Hours ahead
                  </span>

                  <span className="rounded-md bg-cyan-400/10 px-2 py-1 font-mono text-sm font-semibold text-cyan-300">
                    {hoursAhead} h
                  </span>

                </div>

                <input
                  type="range"
                  min="1"
                  max="12"
                  value={hoursAhead}
                  onChange={(event) =>
                    setHoursAhead(
                      Number(
                        event.target.value
                      )
                    )
                  }
                  className="h-1.5 w-full cursor-pointer accent-cyan-400"
                />

                <div className="mt-2 flex justify-between text-[10px] text-slate-600">
                  <span>1 h</span>
                  <span>12 h</span>
                </div>

              </div>

            </div>


            <div>

              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Conjunction Screening
              </label>

              <div className="space-y-3">


                <div className="rounded-lg border border-white/10 bg-[#07111f] p-4">

                  <div className="mb-3 flex items-center justify-between">

                    <span className="text-sm text-slate-400">
                      Alert distance
                    </span>

                    <span className="rounded-md bg-orange-400/10 px-2 py-1 font-mono text-sm font-semibold text-orange-300">
                      {thresholdKm} km
                    </span>

                  </div>

                  <input
                    type="range"
                    min="1"
                    max="50"
                    step="1"
                    value={thresholdKm}
                    onChange={(event) =>
                      setThresholdKm(
                        Number(
                          event.target.value
                        )
                      )
                    }
                    className="h-1.5 w-full cursor-pointer accent-orange-400"
                  />

                  <div className="mt-2 flex justify-between text-[10px] text-slate-600">
                    <span>1 km</span>
                    <span>50 km</span>
                  </div>

                </div>


                <div className="rounded-lg border border-white/10 bg-[#07111f] p-4">

                  <div className="mb-3 flex items-center justify-between">

                    <span className="text-sm text-slate-400">
                      Objects in 3D
                    </span>

                    <span className="rounded-md bg-violet-400/10 px-2 py-1 font-mono text-sm font-semibold text-violet-300">
                      {objects3d.toLocaleString()}
                    </span>

                  </div>

                  <input
                    type="range"
                    min="100"
                    max="1500"
                    step="100"
                    value={objects3d}
                    onChange={(event) =>
                      setObjects3d(
                        Number(
                          event.target.value
                        )
                      )
                    }
                    className="h-1.5 w-full cursor-pointer accent-violet-400"
                  />

                  <div className="mt-2 flex justify-between text-[10px] text-slate-600">
                    <span>100</span>
                    <span>1,500</span>
                  </div>

                </div>

              </div>

            </div>

          </div>


          <div className="border-t border-white/10 bg-[#091321] px-5 py-3">

            <p className="text-[10px] leading-5 text-slate-600">
              Risk values are simulated screening
              results and are not operational
              collision predictions.
            </p>

          </div>

        </section>


        {error && (

          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.06] p-4">

            <div className="mt-0.5 text-red-400">
              ⚠
            </div>

            <div>

              <div className="text-sm font-medium text-red-300">
                Dashboard Error
              </div>

              <div className="mt-1 text-xs text-red-400/80">
                {error}
              </div>

            </div>

          </div>

        )}


        {loading && (
          <DashboardSkeleton />
        )}


        {data && !loading && (

          <div className="space-y-10">


            <section>

              <SectionHeading
                eyebrow="Overview"
                title="Orbital Population"
                description="Current catalog population and filtered object counts."
              />

              <MetricCards
                metrics={data.metrics}
              />

            </section>


            <section>

              <SectionHeading
                eyebrow="Environment"
                title="Orbital Environment"
                description="Where the tracked population is concentrated."
              />

              <div className="grid gap-6 xl:grid-cols-2">

                <OrbitalAltitude
                  data={
                    data.altitude_distribution
                  }
                />

                <DensityHeatmap
                  data={
                    data.density_points
                  }
                />

              </div>

            </section>


            <section>

              <SectionHeading
                eyebrow="Safety"
                title="Collision Risk"
                description="Simulated conjunction screening and collision-risk indicators."
              />

              <div className="space-y-6">

                <CollisionRisk
                  summary={
                    data.risk_summary
                  }
                  approaches={
                    data.closest_approaches
                  }
                  thresholdKm={
                    thresholdKm
                  }
                />

                <RiskFactors />

              </div>

            </section>


            <section>

              <SectionHeading
                eyebrow="Visualization"
                title="Orbital Environment — 3D"
                description="Interactive three-dimensional view of the tracked orbital population."
              />

              <Orbital3D
                objects={positions}
              />

            </section>


            <section>

              <SectionHeading
                eyebrow="Analysis"
                title="Advanced Orbital Analytics"
                description="Detailed orbital characteristics and population distributions."
              />

              <OrbitalAnalytics
                objects={
                  data.orbital_objects
                }
              />

            </section>


            <section>

              <SectionHeading
                eyebrow="Debris"
                title="Debris Environment"
                description="Distribution and tracked sources of orbital debris."
              />

              <DebrisEnvironment
                altitudeData={
                  data.debris_altitude
                }
                sourceData={
                  data.debris_sources
                }
              />

            </section>


            <section>

              <SectionHeading
                eyebrow="Catalog"
                title="Catalog Explorer"
                description="Search and explore tracked orbital objects."
              />

              <CatalogExplorer
                objects={
                  data.orbital_objects
                }
              />

            </section>


            <footer className="border-t border-white/10 pb-10 pt-7">

              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">


                <div className="max-w-3xl">

                  <div className="flex flex-wrap items-center gap-2">

                    <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-600">
                      Smart India Hackathon 2026
                    </span>

                    <span className="text-slate-700">
                      •
                    </span>

                    <span className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">
                      Hands Of Hope
                    </span>

                  </div>


                  <div className="mt-3 text-xs font-medium text-slate-500">
                    Space Debris & Collision Risk Dashboard
                  </div>


                  <p className="mt-2 text-[11px] leading-6 text-slate-600">
                    The conjunction engine uses
                    simplified propagation and
                    geometric screening. Operational
                    collision assessment requires
                    validated orbit determination,
                    covariance, relative velocity,
                    encounter geometry, hard-body
                    radius and probability-of-collision
                    methods.
                  </p>

                </div>


                <div className="flex flex-col items-start gap-2 lg:items-end">

                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-slate-700">

                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/70" />

                    Space Situational Awareness

                  </div>

                  <div className="text-[10px] uppercase tracking-[0.12em] text-slate-700">
                    SIH 2026
                  </div>

                </div>

              </div>

            </footer>

          </div>

        )}

      </div>

    </main>
  );
}


function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-4">

      <div className="mb-1.5 flex items-center gap-2">

        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />

        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-500/70">
          {eyebrow}
        </span>

      </div>

      <h2 className="text-xl font-semibold tracking-tight text-white">
        {title}
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        {description}
      </p>

    </div>
  );
}


function DashboardSkeleton() {
  return (
    <div className="space-y-8">

      <section>

        <div className="mb-4">

          <div className="h-3 w-20 animate-pulse rounded bg-white/5" />

          <div className="mt-2 h-6 w-44 animate-pulse rounded bg-white/5" />

          <div className="mt-2 h-3 w-72 animate-pulse rounded bg-white/5" />

        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">

          {Array.from({
            length: 5,
          }).map((_, index) => (

            <div
              key={index}
              className="h-36 animate-pulse rounded-xl border border-white/10 bg-[#0c1928]"
            />

          ))}

        </div>

      </section>


      <section>

        <div className="mb-4">

          <div className="h-3 w-24 animate-pulse rounded bg-white/5" />

          <div className="mt-2 h-6 w-48 animate-pulse rounded bg-white/5" />

        </div>

        <div className="grid gap-6 xl:grid-cols-2">

          <div className="h-[460px] animate-pulse rounded-xl border border-white/10 bg-[#0c1928]" />

          <div className="h-[460px] animate-pulse rounded-xl border border-white/10 bg-[#0c1928]" />

        </div>

      </section>


      <div className="h-[500px] animate-pulse rounded-xl border border-white/10 bg-[#0c1928]" />

    </div>
  );
}