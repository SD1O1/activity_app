"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Tag = {
  id: string;
  name: string;
};

const timeOptions: Array<"anytime" | "today" | "tomorrow" | "weekend"> = [
  "anytime",
  "today",
  "tomorrow",
  "weekend",
];

export default function SearchModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [loadingTags, setLoadingTags] = useState(false);

  const [time, setTime] = useState<"anytime" | "today" | "tomorrow" | "weekend">(
    "anytime"
  );
  const [distance, setDistance] = useState(10);
  const [sort, setSort] = useState<"soonest" | "distance">("soonest");
  const distancePercent = ((distance - 1) / (50 - 1)) * 100;

  useEffect(() => {
    if (!query.trim()) return;

    const fetchTags = async () => {
      setLoadingTags(true);

      const { data } = await supabase
        .from("activity_tags")
        .select("id, name")
        .ilike("name", `${query}%`)
        .limit(8);

      setTags(data || []);
      setLoadingTags(false);
    };

    fetchTags();
  }, [query]);

  const visibleTags = query.trim() ? tags : [];

  if (!open) return null;

  const handleSearch = () => {
    const params = new URLSearchParams();

    if (selectedTag) params.set("tag", selectedTag.id);
    if (time !== "anytime") params.set("time", time);
    if (distance) params.set("distance", String(distance));
    params.set("sort", sort);

    onClose();
    router.push(`/activities?${params.toString()}`);
  };

  const pill = (active: boolean) =>
    `rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 ${
      active
        ? "border-[#f97316] bg-[#f97316] text-white shadow-[0_12px_24px_-16px_rgba(249,115,22,0.75)]"
        : "border-orange-200 bg-white text-slate-700 hover:border-orange-300 hover:bg-orange-50"
    }`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-[#fff8f4] via-[#fffaf7] to-[#fffefe] text-slate-900">
      {/* Header */}
      <div className="border-b border-orange-100/80 bg-white/85 px-4 py-4 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-6xl items-center">
        <input
          autoFocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedTag(null);
          }}
          placeholder="What do you want to do?"
          className="flex-1 rounded-2xl border border-orange-200 bg-orange-50/50 px-4 py-3 text-base text-slate-700 placeholder:text-slate-400 shadow-sm transition-all duration-200 focus:border-orange-300 focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
        />
        <button
          onClick={onClose}
          className="ml-3 grid h-11 w-11 place-items-center rounded-full border border-orange-200 bg-white text-xl text-slate-500 shadow-sm transition-colors hover:border-orange-300 hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
          aria-label="Close search modal"
        >
          ✕
        </button>
      </div>
      </div>

      {/* Tag results */}
      <div className="mx-auto w-full max-w-6xl px-4 py-3">
        <div className="space-y-2 rounded-2xl border border-orange-100/80 bg-white/90 p-2 shadow-[0_18px_35px_-32px_rgba(15,23,42,0.55)]">
        {loadingTags && (
          <p className="px-2 py-1 text-sm text-slate-400">Searching…</p>
        )}

        {visibleTags.map((tag) => (
          <button
            key={tag.id}
            onClick={() => {
              setSelectedTag(tag);
              setQuery(tag.name);
              setTags([]);
            }}
            className={`block w-full rounded-xl px-4 py-2 text-left text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 ${
              selectedTag?.id === tag.id
                ? "border border-[#f97316] bg-[#f97316] text-white shadow-[0_12px_24px_-16px_rgba(249,115,22,0.75)]"
                : "border border-transparent text-slate-700 hover:border-orange-200 hover:bg-orange-50"
            }`}
          >
            {tag.name}
          </button>
        ))}
        </div>
      </div>

      {/* Filters */}
      <div className="mx-auto w-full max-w-6xl px-4 py-4">
        <div className="space-y-6 rounded-[1.75rem] border border-orange-100/80 bg-white/95 p-4 shadow-[0_18px_35px_-32px_rgba(15,23,42,0.55)] sm:p-6">
        {/* Time */}
        <div>
          <p className="mb-2 text-sm font-medium text-slate-500">Time</p>
          <div className="flex flex-wrap gap-2">
            {timeOptions.map((t) => (
              <button
                key={t}
                onClick={() => setTime(t)}
                className={pill(time === t)}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Distance */}
        <div>
          <p className="mb-2 text-sm font-medium text-slate-500">
            Distance (up to {distance} km)
          </p>
          <input
            type="range"
            min={1}
            max={50}
            value={distance}
            onChange={(e) => setDistance(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full"
            style={{
              background: `linear-gradient(to right, #f97316 0%, #f97316 ${distancePercent}%, #fed7aa ${distancePercent}%, #fed7aa 100%)`,
            }}
          />
        </div>

        {/* Sort */}
        <div>
          <p className="mb-2 text-sm font-medium text-slate-500">Sort by</p>
          <div className="flex gap-2">
            <button
              onClick={() => setSort("soonest")}
              className={pill(sort === "soonest")}
            >
              Soonest
            </button>
            <button
              onClick={() => setSort("distance")}
              className={pill(sort === "distance")}
            >
              Nearest
            </button>
          </div>
        </div>
      </div>
      </div>

      {/* CTA */}
      <div className="mt-auto border-t border-orange-100/80 bg-white/90 p-4 backdrop-blur-sm">
        <div className="mx-auto w-full max-w-6xl">
        <button
          onClick={handleSearch}
          className="w-full rounded-2xl border border-[#f97316] bg-[#f97316] py-3 text-base font-semibold text-white shadow-[0_18px_30px_-20px_rgba(249,115,22,0.8)] transition-all duration-200 hover:bg-[#ea6a11] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 disabled:opacity-40"
        >
          Search
        </button>
      </div>
      </div>
    </div>
  );
}