export default function CategoriesRow() {
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

  return (
    <section className="px-4 mt-6">
      <h2 className="mb-3 text-lg font-semibold">Browse Categories</h2>

      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
        {categories.map((category) => (
          <div
            key={category}
            className="flex min-w-[72px] flex-col items-center"
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