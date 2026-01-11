"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type SearchModalProps = {
  open: boolean;
  onClose: () => void;
};

type Tag = {
  id: string;
  name: string;
};

export default function SearchModal({
  open,
  onClose,
}: SearchModalProps) {
  const router = useRouter();

  // tag search
  const [query, setQuery] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [loadingTags, setLoadingTags] = useState(false);

  // filters
  const [distance, setDistance] = useState(10);
  const [time, setTime] = useState("anytime");

  // fetch tags on typing
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
        .limit(10);

      setTags(data || []);
      setLoadingTags(false);
    };

    fetchTags();
  }, [query]);

  if (!open) return null;

  const handleSearch = () => {
    if (!selectedTag) return;

    onClose();

    router.push(
      `/activities?tag=${selectedTag.id}&distance=${distance}&time=${time}`
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-white">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-4 border-b">
        <input
          autoFocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedTag(null);
          }}
          placeholder="What do you want to do?"
          className="flex-1 mr-3 rounded-xl border px-4 py-2 outline-none"
        />

        <button onClick={onClose} className="text-xl">
          ✕
        </button>
      </div>

      {/* Tag suggestions */}
      <div className="px-4 py-4">
        {loadingTags && (
          <p className="text-sm text-gray-400">Searching…</p>
        )}

        {!loadingTags && query && tags.length === 0 && (
          <p className="text-sm text-gray-400">
            No matching tags found
          </p>
        )}

        <div className="space-y-2">
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => {
                setSelectedTag(tag);
                setQuery(tag.name);
                setTags([]);
              }}
              className={`block w-full text-left rounded-lg px-3 py-2 ${
                selectedTag?.id === tag.id
                  ? "bg-black text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 mt-6">
        <h3 className="text-sm font-semibold mb-3">
          Filters
        </h3>

        {/* Time */}
        <div className="mb-4">
          <label className="text-xs text-gray-500">
            Time
          </label>
          <select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="mt-1 w-full rounded-xl border px-4 py-2"
          >
            <option value="anytime">Anytime</option>
            <option value="today">Today</option>
            <option value="tomorrow">Tomorrow</option>
            <option value="weekend">Weekend</option>
          </select>
        </div>

        {/* Distance */}
        <div>
          <label className="text-xs text-gray-500">
            Distance (km)
          </label>
          <input
            type="range"
            min={1}
            max={50}
            value={distance}
            onChange={(e) => setDistance(Number(e.target.value))}
            className="w-full mt-2"
          />
          <p className="text-xs text-gray-500 mt-1">
            Up to {distance} km
          </p>
        </div>
      </div>

      {/* Bottom action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 border-t bg-white">
        <button
          disabled={!selectedTag}
          onClick={handleSearch}
          className="w-full rounded-xl bg-black py-3 text-white font-medium disabled:opacity-40"
        >
          Search
        </button>
      </div>
    </div>
  );
}