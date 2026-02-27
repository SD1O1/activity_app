"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Tag = {
  id: string;
  name: string;
};

const SUGGESTED = [
  { label: "Nearby", icon: "📍" },
  { label: "Walk", icon: "🚶" },
  { label: "Gym", icon: "🏋️" },
  { label: "Coffee", icon: "☕" },
  { label: "Yoga", icon: "🍃" },
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

  const [time, setTime] = useState<"anytime" | "today" | "tomorrow" | "weekend">("anytime");
  const [distance, setDistance] = useState(25);
  const [sort, setSort] = useState<"soonest" | "distance">("soonest");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const normalized = query.trim();
    if (!normalized) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      setLoadingTags(true);
      const { data } = await supabase
        .from("activity_tags")
        .select("id, name")
        .ilike("name", `${normalized}%`)
        .limit(8);

      setTags(data || []);
      setLoadingTags(false);
    }, 180);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [query]);

  if (!open) return null;

  const handleSearch = () => {
    const params = new URLSearchParams();

    if (selectedTag) params.set("tag", selectedTag.id);
    else if (query.trim()) params.set("q", query.trim());

    if (time !== "anytime") params.set("time", time);
    params.set("distance", String(distance));
    params.set("sort", sort);

    onClose();
    router.push(`/activities?${params.toString()}`);
  };

  const handleClearAll = () => {
    setQuery("");
    setTags([]);
    setSelectedTag(null);
    setTime("anytime");
    setDistance(25);
    setSort("soonest");
  };

  const showSuggested = !query.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/45 sm:items-center sm:justify-center sm:p-4">
      <div className="h-[94vh] w-full overflow-hidden rounded-t-[20px] border border-[#dfe3ea] bg-[#f3f3f3] sm:h-auto sm:max-h-[94vh] sm:max-w-2xl sm:rounded-[20px]">
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex justify-end border-b border-[#d9d9d9] px-8 py-6">
            <button onClick={onClose} className="text-5xl leading-none text-[#555]" aria-label="Close search">
              ×
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="px-8 py-7">
              <div className="flex items-center rounded-[18px] border border-[#c8c8c8] bg-[#f7f7f7] px-7 py-5">
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => {
                    const value = e.target.value;
                    setQuery(value);
                    setSelectedTag(null);
                    if (!value.trim()) {
                      setTags([]);
                      setLoadingTags(false);
                    }
                  }}
                  placeholder="What do you want to do?"
                  className="flex-1 bg-transparent text-[30px] text-[#31343a] placeholder:text-[#a5a8b5] outline-none"
                />
                <span className="ml-3 text-[48px] leading-none text-[#9b9b9b]">⌕</span>
              </div>
            </div>

            <div className="px-8 pb-7">
              {loadingTags && <p className="pb-3 text-lg text-[#848484]">Searching…</p>}

              {query.trim() && tags.length > 0 && (
                <div className="pb-5">
                  <p className="pb-3 text-[22px] text-[#575757]">Matching tags</p>
                  <div className="space-y-3">
                    {tags.map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => {
                          setSelectedTag(tag);
                          setQuery(tag.name);
                          setTags([]);
                        }}
                        className={`w-full rounded-[18px] border px-5 py-4 text-left text-[26px] ${
                          selectedTag?.id === tag.id
                            ? "border-black bg-black text-white"
                            : "border-[#d0d0d0] bg-[#f5f5f5] text-[#111]"
                        }`}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {showSuggested && (
                <>
                  <p className="pb-4 text-[22px] text-[#575757]">Suggested</p>
                  <div className="space-y-3">
                    {SUGGESTED.map((item) => (
                      <button
                        key={item.label}
                        onClick={() => setQuery(item.label)}
                        className="flex w-full items-center gap-4 rounded-[18px] border border-[#d0d0d0] bg-[#f5f5f5] px-5 py-4 text-left text-[24px] text-[#111]"
                      >
                        <span className="text-[30px] text-[#777]">{item.icon}</span>
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="border-y border-[#dcdcdc] bg-[#f1f1f1] px-8 py-7">
              <p className="text-[22px] text-[#575757]">Filters</p>

              <div className="mt-6">
                <p className="text-[22px] text-[#444]">Time</p>
                <button
                  onClick={() => {
                    const next: Record<typeof time, typeof time> = {
                      anytime: "today",
                      today: "tomorrow",
                      tomorrow: "weekend",
                      weekend: "anytime",
                    };
                    setTime(next[time]);
                  }}
                  className="mt-3 flex w-full items-center justify-between rounded-[18px] border border-[#c8c8c8] bg-[#f7f7f7] px-6 py-5 text-[22px] text-[#111]"
                >
                  <span>{time.charAt(0).toUpperCase() + time.slice(1)}</span>
                  <span className="text-[28px]">✓</span>
                </button>
              </div>

              <div className="mt-6">
                <p className="text-[22px] text-[#444]">Distance</p>
                <p className="mt-2 text-[20px] text-[#767676]">How far are you willing to go?</p>
                <input
                  type="range"
                  min={0}
                  max={50}
                  value={distance}
                  onChange={(e) => setDistance(Number(e.target.value))}
                  className="mt-5 w-full"
                />
                <div className="mt-2 flex justify-between text-[18px] text-[#6f6f6f]">
                  <span>0 km</span>
                  <span>{distance} km</span>
                  <span>50 km</span>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-[20px] text-[#666]">Sort (extra from current code)</p>
                <div className="mt-2 flex gap-3">
                  <button
                    onClick={() => setSort("soonest")}
                    className={`rounded-full border px-4 py-2 text-sm ${sort === "soonest" ? "bg-black text-white" : "bg-white"}`}
                  >
                    Soonest
                  </button>
                  <button
                    onClick={() => setSort("distance")}
                    className={`rounded-full border px-4 py-2 text-sm ${sort === "distance" ? "bg-black text-white" : "bg-white"}`}
                  >
                    Nearest
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-[#d8d8d8] px-8 py-7">
            <button
              onClick={handleClearAll}
              className="rounded-3xl border border-[#c4c4c4] bg-[#f4f4f4] py-4 text-[22px] text-[#555]"
            >
              Clear all
            </button>
            <button onClick={handleSearch} className="rounded-3xl bg-black py-4 text-[22px] text-white">
              Search
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}