"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Tag = {
  id: string;
  name: string;
};

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

  useEffect(() => {
    if (!query.trim()) {
      setTags([]);
      return;
    }

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
    `px-3 py-2 rounded-full text-sm border ${
      active ? "bg-black text-white" : "bg-white"
    }`;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center px-4 py-4 border-b">
        <input
          autoFocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedTag(null);
          }}
          placeholder="What do you want to do?"
          className="flex-1 rounded-xl border px-4 py-2"
        />
        <button onClick={onClose} className="ml-3 text-xl">
          ✕
        </button>
      </div>

      {/* Tag results */}
      <div className="px-4 py-3 space-y-2">
        {loadingTags && (
          <p className="text-sm text-gray-400">Searching…</p>
        )}

        {tags.map((tag) => (
          <button
            key={tag.id}
            onClick={() => {
              setSelectedTag(tag);
              setQuery(tag.name);
              setTags([]);
            }}
            className={`block w-full text-left px-4 py-2 rounded-lg ${
              selectedTag?.id === tag.id
                ? "bg-black text-white"
                : "hover:bg-gray-100"
            }`}
          >
            {tag.name}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="px-4 py-4 space-y-6">
        {/* Time */}
        <div>
          <p className="text-xs text-gray-500 mb-2">Time</p>
          <div className="flex gap-2 flex-wrap">
            {["anytime", "today", "tomorrow", "weekend"].map((t) => (
              <button
                key={t}
                onClick={() => setTime(t as any)}
                className={pill(time === t)}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Distance */}
        <div>
          <p className="text-xs text-gray-500 mb-2">
            Distance (up to {distance} km)
          </p>
          <input
            type="range"
            min={1}
            max={50}
            value={distance}
            onChange={(e) => setDistance(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Sort */}
        <div>
          <p className="text-xs text-gray-500 mb-2">Sort by</p>
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

      {/* CTA */}
      <div className="mt-auto p-4 border-t">
        <button
          onClick={handleSearch}
          className="w-full rounded-xl bg-black py-3 text-white font-medium disabled:opacity-40"
        >
          Search
        </button>
      </div>
    </div>
  );
}