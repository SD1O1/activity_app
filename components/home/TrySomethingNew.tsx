import DiscoveryCard from "./DiscoveryCard";

export default function TrySomethingNew() {
  return (
    <section className="mt-8 pb-8">
      <h3 className="px-5 text-[38px] font-semibold text-[#111827]">Try Something New</h3>

      <div className="mt-4 flex gap-4 overflow-x-auto px-5 pb-2">
        <DiscoveryCard title="Photography Walk" subtitle="Brooklyn Bridge" time="Sat, 3:00 PM" people="4" />
        <DiscoveryCard title="Board Game Night" subtitle="The Boardroom" time="Fri, 7:00 PM" people="6" />
        <DiscoveryCard title="Sunset Cycling" subtitle="Marine Drive" time="Sun, 6:00 PM" people="5" />
      </div>
    </section>
  );
}