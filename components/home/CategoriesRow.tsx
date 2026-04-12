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
  { name: "Gym", icon: "🏋️", color: "bg-blue-100 text-blue-600" },
  { name: "Coffee", icon: "☕", color: "bg-emerald-100 text-emerald-600" },
  { name: "Work", icon: "💼", color: "bg-purple-100 text-purple-600" },
  { name: "More", icon: "⋯", color: "bg-slate-100 text-slate-500" },
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
    if (categoryName === "More") {
      router.push("/activities");
      return;
    }
    const tag = tags.find((t) => t.name.toLowerCase() === categoryName.toLowerCase());
    if (!tag) return;
    router.push(`/activities?tag=${tag.id}`);
  };

  return (
    <section>
      <h2 className="mb-4 text-[2rem] font-bold tracking-tight text-neutral-900 sm:text-3xl">Browse Categories</h2>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category.name}
            onClick={() => handleCategoryClick(category.name)}
            className="flex min-w-[82px] flex-col items-center rounded-2xl border border-transparent px-1 py-2 transition-all hover:border-orange-100 hover:bg-orange-50/40"
          >
            <div className={`grid h-16 w-16 place-items-center rounded-full text-2xl shadow-sm ${category.color}`}>{category.icon}</div>
            <span className="mt-2 text-base font-medium text-slate-700">{category.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
