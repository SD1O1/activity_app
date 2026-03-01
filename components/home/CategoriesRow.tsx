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
    <section className="pt-6 lg:mt-12">
      <h2 className="mb-3 text-lg font-semibold text-gray-800">Browse Categories</h2>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 md:gap-4 lg:gap-5">
        {categories.map((category, index) => {
          const isActive = index === 0;
          return (
            <button key={category.name} onClick={() => handleCategoryClick(category.name)} className="flex min-w-[56px] flex-col items-center gap-1.5 md:min-w-[68px]">
              <div className={`flex h-11 w-11 items-center justify-center rounded-full border text-[18px] md:h-[52px] md:w-[52px] md:text-[22px] ${"border-transparent bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                {category.icon}
              </div>
              <span className={`text-[12px] font-medium md:text-sm lg:text-base ${"text-gray-600"}`}>{category.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}