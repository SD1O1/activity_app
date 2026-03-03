"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Tag = {
  id: string;
  name: string;
};

const categories = [
  { name: "Walk", icon: "🚶", color: "bg-orange-100 text-orange-500" },
  { name: "Gym", icon: "🏋️", color: "bg-blue-100 text-blue-500" },
  { name: "Coffee", icon: "☕", color: "bg-emerald-100 text-emerald-600" },
  { name: "Work", icon: "💼", color: "bg-purple-100 text-purple-600" },
  { name: "Sports", icon: "⚽", color: "bg-yellow-100 text-yellow-600" },
  { name: "Music", icon: "🎵", color: "bg-pink-100 text-pink-600" },
  { name: "Yoga", icon: "🧘", color: "bg-lime-100 text-lime-600" },
  { name: "Food", icon: "🍜", color: "bg-rose-100 text-rose-600" },
];

export default function CategoriesRow() {
  const router = useRouter();
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    const fetchTags = async () => {
      const { data, error } = await supabase.from("activity_tags").select("id, name");
      if (!error && data) setTags(data);
    };

    void fetchTags();
  }, []);

  const handleCategoryClick = (categoryName: string) => {
    const tag = tags.find((t) => t.name.toLowerCase() === categoryName.toLowerCase());
    if (!tag) return;
    router.push(`/activities?tag=${tag.id}`);
  };

  return (
    <section className="mt-8 px-4 sm:px-6">
      <h2 className="mb-4 text-4xl font-semibold tracking-tight text-neutral-900">Browse Categories</h2>

      <div className="flex gap-5 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category.name}
            onClick={() => handleCategoryClick(category.name)}
            className="flex min-w-[78px] flex-col items-center"
          >
            <div className={`grid h-16 w-16 place-items-center rounded-full text-2xl ${category.color}`}>
              {category.icon}
            </div>
            <span className="mt-2 text-lg text-neutral-700">{category.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
