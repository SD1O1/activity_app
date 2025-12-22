import DiscoveryCard from "./DiscoveryCard";

export default function TrySomethingNew() {
  return (
    <section className="mt-8">
      <h3 className="px-4 text-lg font-semibold">
        Try Something New
      </h3>

      <div className="mt-4 flex gap-4 overflow-x-auto px-4 pb-2">
        <DiscoveryCard
          title="Photography Walk"
          subtitle="Brooklyn Bridge · Sat 3 PM"
        />
        <DiscoveryCard
          title="Board Game Night"
          subtitle="The Boardroom · Fri 7 PM"
        />
        <DiscoveryCard
          title="Sunset Cycling"
          subtitle="Marine Drive · Sun 6 PM"
        />
      </div>
    </section>
  );
}