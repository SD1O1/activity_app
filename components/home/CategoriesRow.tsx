"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Tag = {
  id: string;
  name: string;
};

export default function CategoriesRow() {
  const router = useRouter();
  const [tags, setTags] = useState<Tag[]>([]);

  // These are display categories (must exist as tags in DB)
  const categories = [
    "Walk",
    "Gym",
    "Coffee",
    "Work",
    "Sports",
    "Music",
    "Yoga",
    "Food",
  ];

  useEffect(() => {
    const fetchTags = async () => {
      const { data, error } = await supabase
        .from("activity_tags")
        .select("id, name");

      if (!error && data) {
        setTags(data);
      }
    };

    fetchTags();
  }, []);

  const handleCategoryClick = (categoryName: string) => {
    const tag = tags.find(
      (t) => t.name.toLowerCase() === categoryName.toLowerCase()
    );

    if (!tag) {
      console.warn("Tag not found for category:", categoryName);
      return;
    }

    router.push(`/activities?tag=${tag.id}`);
  };

  return (
    <section className="px-4 mt-6">
      <h2 className="mb-3 text-lg font-semibold">
        Browse Categories
      </h2>

      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
        {categories.map((category) => (
          <div
            key={category}
            onClick={() => handleCategoryClick(category)}
            className="flex min-w-[72px] flex-col items-center cursor-pointer"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-200">
              {category[0]}
            </div>

            <span className="mt-2 text-xs text-gray-600">
              {category}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}