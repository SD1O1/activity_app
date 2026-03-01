import DiscoveryCard from "./DiscoveryCard";

export default function TrySomethingNew() {
  return (
    <section className="pt-6 pb-4 lg:mt-12">
      <h3 className="text-lg font-semibold text-gray-800">Try Something New</h3>
      <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
        <DiscoveryCard title="Photography Walk" subtitle="Brooklyn Bridge" time="Sat, 3:00 PM" people="4" />
        <DiscoveryCard title="Board Game Night" subtitle="The Boardroom" time="Fri, 7:00 PM" people="6" />
        <DiscoveryCard title="Sunset Cycling" subtitle="Marine Drive" time="Sun, 6:00 PM" people="5" />
      </div>
    </section>
  );
}
