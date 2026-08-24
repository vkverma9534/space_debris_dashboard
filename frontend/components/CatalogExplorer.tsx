"use client";

import { useMemo, useState } from "react";

type CatalogObject = {
  OBJECT_NAME: string;
  CATEGORY: string;
  NORAD_CAT_ID: string | number;
  APPROX_ALTITUDE: number;
  MEAN_MOTION: number;
  ECCENTRICITY: number;
  INCLINATION: number;
};

type CatalogExplorerProps = {
  objects: CatalogObject[];
};

const PAGE_SIZE = 50;

export default function CatalogExplorer({
  objects,
}: CatalogExplorerProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(1);

  const categories = useMemo(() => {
    return [
      "All",
      ...Array.from(
        new Set(
          objects
            .map((object) => object.CATEGORY)
            .filter(Boolean)
        )
      ).sort(),
    ];
  }, [objects]);

  const filteredObjects = useMemo(() => {
    const query = search.toLowerCase().trim();

    return objects.filter((object) => {
      const matchesSearch =
        !query ||
        object.OBJECT_NAME
          .toLowerCase()
          .includes(query) ||
        String(object.NORAD_CAT_ID)
          .toLowerCase()
          .includes(query);

      const matchesCategory =
        category === "All" ||
        object.CATEGORY === category;

      return matchesSearch && matchesCategory;
    });
  }, [objects, search, category]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredObjects.length / PAGE_SIZE
    )
  );

  const safePage = Math.min(
    page,
    totalPages
  );

  const paginatedObjects = useMemo(() => {
    const start =
      (safePage - 1) * PAGE_SIZE;

    return filteredObjects.slice(
      start,
      start + PAGE_SIZE
    );
  }, [filteredObjects, safePage]);

  function handleSearch(
    value: string
  ) {
    setSearch(value);
    setPage(1);
  }

  function handleCategory(
    value: string
  ) {
    setCategory(value);
    setPage(1);
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1625] shadow-2xl shadow-black/10">

      {}
      <div className="border-b border-white/10 px-6 py-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                ◉
              </div>

              <h2 className="text-xl font-semibold tracking-tight text-white">
                Catalog Explorer
              </h2>
            </div>

            <p className="mt-2 text-sm text-slate-400">
              Explore tracked orbital objects
              and their orbital parameters.
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-slate-400">
              Total{" "}
              <strong className="ml-1 text-slate-200">
                {objects.length.toLocaleString()}
              </strong>
            </span>

            <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1.5 text-blue-300">
              Showing{" "}
              <strong className="ml-1">
                {filteredObjects.length.toLocaleString()}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {}
      <div className="border-b border-white/10 bg-[#091321] px-6 py-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">

          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
              ⌕
            </span>

            <input
              type="text"
              value={search}
              onChange={(event) =>
                handleSearch(
                  event.target.value
                )
              }
              placeholder="Search object name or NORAD ID..."
              className="h-11 w-full rounded-lg border border-white/10 bg-[#07101d] pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/10"
            />
          </div>

          <select
            value={category}
            onChange={(event) =>
              handleCategory(
                event.target.value
              )
            }
            className="h-11 rounded-lg border border-white/10 bg-[#07101d] px-4 text-sm text-slate-200 outline-none transition focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/10"
          >
            {categories.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item === "All"
                  ? "All categories"
                  : item}
              </option>
            ))}
          </select>
        </div>
      </div>

      {}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1050px] text-left">

          <thead className="sticky top-0 z-10 bg-[#0d1a2b]">
            <tr className="border-b border-white/10 text-[11px] font-medium uppercase tracking-wider text-slate-500">

              <th className="px-6 py-3.5">
                Object
              </th>

              <th className="px-4 py-3.5">
                Category
              </th>

              <th className="px-4 py-3.5">
                NORAD ID
              </th>

              <th className="px-4 py-3.5 text-right">
                Altitude
              </th>

              <th className="px-4 py-3.5 text-right">
                Mean Motion
              </th>

              <th className="px-4 py-3.5 text-right">
                Eccentricity
              </th>

              <th className="px-6 py-3.5 text-right">
                Inclination
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/[0.045]">

            {paginatedObjects.map(
              (object, index) => (
                <tr
                  key={`${object.NORAD_CAT_ID}-${index}`}
                  className="group transition hover:bg-white/[0.025]"
                >

                  {}
                  <td className="max-w-[300px] px-6 py-3.5">

                    <div
                      className="truncate font-medium text-slate-200"
                      title={object.OBJECT_NAME}
                    >
                      {object.OBJECT_NAME}
                    </div>

                    <div className="mt-0.5 text-[11px] text-slate-600">
                      Object {(
                        (safePage - 1) *
                          PAGE_SIZE +
                        index +
                        1
                      ).toLocaleString()}
                    </div>

                  </td>

                  {}
                  <td className="px-4 py-3.5">
                    <CategoryBadge
                      category={
                        object.CATEGORY
                      }
                    />
                  </td>

                  {}
                  <td className="px-4 py-3.5 font-mono text-xs text-slate-400">
                    {object.NORAD_CAT_ID}
                  </td>

                  {}
                  <td className="px-4 py-3.5 text-right font-mono text-sm text-slate-300">
                    {formatNumber(
                      object.APPROX_ALTITUDE,
                      1
                    )}
                    <span className="ml-1 text-xs text-slate-600">
                      km
                    </span>
                  </td>

                  {}
                  <td className="px-4 py-3.5 text-right font-mono text-sm text-slate-300">
                    {formatNumber(
                      object.MEAN_MOTION,
                      4
                    )}
                  </td>

                  {}
                  <td className="px-4 py-3.5 text-right font-mono text-sm text-slate-300">
                    {formatNumber(
                      object.ECCENTRICITY,
                      6
                    )}
                  </td>

                  {}
                  <td className="px-6 py-3.5 text-right font-mono text-sm text-slate-300">
                    {formatNumber(
                      object.INCLINATION,
                      2
                    )}
                    <span className="ml-1 text-xs text-slate-600">
                      °
                    </span>
                  </td>

                </tr>
              )
            )}

            {paginatedObjects.length ===
              0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-20 text-center"
                >
                  <div className="text-3xl text-slate-700">
                    ◌
                  </div>

                  <div className="mt-3 text-sm font-medium text-slate-300">
                    No matching objects
                  </div>

                  <div className="mt-1 text-xs text-slate-600">
                    Try changing the search
                    or category filter.
                  </div>
                </td>
              </tr>
            )}

          </tbody>
        </table>
      </div>

      {}
      <div className="flex flex-col gap-3 border-t border-white/10 bg-[#091321] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">

        <div className="text-xs text-slate-500">
          Page{" "}
          <span className="font-medium text-slate-300">
            {safePage}
          </span>{" "}
          of{" "}
          <span className="font-medium text-slate-300">
            {totalPages}
          </span>
        </div>

        <div className="flex items-center gap-2">

          <button
            type="button"
            disabled={safePage === 1}
            onClick={() =>
              setPage(
                Math.max(
                  1,
                  safePage - 1
                )
              )
            }
            className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            Previous
          </button>

          <button
            type="button"
            disabled={
              safePage === totalPages
            }
            onClick={() =>
              setPage(
                Math.min(
                  totalPages,
                  safePage + 1
                )
              )
            }
            className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            Next
          </button>

        </div>
      </div>
    </section>
  );
}

function CategoryBadge({
  category,
}: {
  category: string;
}) {
  const isDebris =
    category
      .toLowerCase()
      .includes("debris");

  const isStarlink =
    category
      .toLowerCase()
      .includes("starlink");

  const isStation =
    category
      .toLowerCase()
      .includes("station");

  let classes =
    "border-slate-400/10 bg-slate-400/5 text-slate-400";

  if (isDebris) {
    classes =
      "border-red-400/20 bg-red-400/10 text-red-300";
  } else if (isStarlink) {
    classes =
      "border-violet-400/20 bg-violet-400/10 text-violet-300";
  } else if (isStation) {
    classes =
      "border-cyan-400/20 bg-cyan-400/10 text-cyan-300";
  }

  return (
    <span
      className={`inline-flex max-w-[190px] truncate rounded-full border px-2.5 py-1 text-[11px] font-medium ${classes}`}
      title={category}
    >
      {category}
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
    Number.isNaN(value)
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