"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Tag = { id: string; name: string };

const categories = [
  { name: "Walk", icon: "🚶" },
  { name: "Gym", icon: "🏋️" },
  { name: "Coffee", icon: "☕" },
  { name: "Work", icon: "💼" },
  { name: "Sports", icon: "🏀" },
  { name: "Music", icon: "🎵" },
  { name: "Yoga", icon: "🧘" },
  { name: "Food", icon: "🍽️" },
];

export default function CategoriesRow() {
  const router = useRouter();
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    const fetchTags = async () => {
      const { data, error } = await supabase.from("activity_tags").select("id, name");
      if (!error && data) setTags(data);
    };
    fetchTags();
  }, []);

  const handleCategoryClick = (categoryName: string) => {
    const tag = tags.find((t) => t.name.toLowerCase() === categoryName.toLowerCase());
    if (!tag) return;
    router.push(`/activities?tag=${tag.id}`);
  };

  return (
    <section className="pt-6">
      <h2 className="mb-3 text-[16px] font-semibold text-[#111827]">Browse Categories</h2>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {categories.map((category, index) => {
          const isActive = index === 0;
          return (
            <button key={category.name} onClick={() => handleCategoryClick(category.name)} className="flex min-w-[56px] flex-col items-center gap-1.5">
              <div className={`flex h-11 w-11 items-center justify-center rounded-full text-[18px] ${isActive ? "border-[2.5px] border-[#f97316] bg-[#fff7ed] ring-2 ring-[#fed7aa]" : "border border-transparent bg-[#e9edf2]"}`}>
                {category.icon}
              </div>
              <span className={`text-[12px] font-medium ${isActive ? "text-[#f97316]" : "text-[#334155]"}`}>{category.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
