export default function Page() {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">Find an Activity</h1>
      <p className="text-gray-500 mt-2">
        Meet people nearby to do things together
      </p>

      <div className="mt-6 grid gap-4">
        {[
          {
            title: "Morning Walk",
            desc: "Start your day with a refreshing walk",
          },
          {
            title: "Gym Workout",
            desc: "Train together and stay motivated",
          },
          {
            title: "Coffee & Work",
            desc: "Work quietly with good company",
          },
        ].map((activity) => (
          <div
            key={activity.title}
            className="border rounded-lg p-4 flex justify-between items-center"
          >
            <div>
              <h2 className="font-semibold">{activity.title}</h2>
              <p className="text-sm text-gray-500">{activity.desc}</p>
            </div>
            <button className="px-4 py-2 bg-black text-white rounded">
              Join
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}