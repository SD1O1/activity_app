"use client";

import Header from "@/components/layout/Header";
import ActivityCard from "@/components/cards/ActivityCard";
import CategoriesRow from "@/components/home/CategoriesRow";
import HomeActions from "./HomeActions";
import TrySomethingNew from "./TrySomethingNew";
import { useState } from "react";
import SearchModal from "@/components/modals/SearchModal";

export default function HomePage() {

  const [openSearch, setOpenSearch] = useState(false);


  return (
    <main className="min-h-screen bg-white">
      <Header />

      <section className="px-4 py-6">
        <h1 className="text-2xl font-bold">
          Find your next adventure
        </h1>

        <div
          onClick={() => setOpenSearch(true)}
          className="mt-4 rounded-xl border px-4 py-3 text-gray-400 cursor-pointer"
        >
          What do you want to do?
        </div>

      </section>

      <CategoriesRow />

      <section className="px-4">
        <h2 className="mb-3 text-lg font-semibold">
          Activities Near You
        </h2>

        <div className="space-y-4">
          <ActivityCard
            title="Walk"
            subtitle="Near Central Park"
            time="Today, 6:00 PM"
            distance="0.8 km"
            type="group"
          />

          <ActivityCard
            title="Coffee & Co-working"
            subtitle="Around Bandra"
            time="Tomorrow, 10:00 AM"
            distance="1.2 km"
            type="one-on-one"
          />

          <ActivityCard
            title="Morning Yoga"
            subtitle="Nearby Park"
            time="Tomorrow, 7:00 AM"
            distance="0.5 km"
            type="group"
          />
        </div>
      </section>

      <SearchModal
        open={openSearch}
        onClose={() => setOpenSearch(false)}
       />
       
      <HomeActions onOpenSearch={() => setOpenSearch(true)} />

      <TrySomethingNew />

    </main>
  );
}