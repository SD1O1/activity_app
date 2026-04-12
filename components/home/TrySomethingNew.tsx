import DiscoveryCard from "./DiscoveryCard";

export default function TrySomethingNew() {
  return (
    <section>
      <h3 className="text-[2rem] font-bold tracking-tight text-neutral-900 sm:text-3xl">Try Something New</h3>

      <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
        <DiscoveryCard title="Photography Walk" subtitle="Brooklyn Bridge" meta="Sat, 3:00 PM" joined={4} />
        <DiscoveryCard title="Board Game Night" subtitle="The Boardroom" meta="Fri, 7:30 PM" joined={6} />
        <DiscoveryCard title="Sunset Cycling" subtitle="Marine Drive" meta="Sun, 6:00 PM" joined={5} />
      </div>
    </section>
  );
}
