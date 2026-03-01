import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | Activity App",
  description:
    "Learn what Activity App does, why we built it, and how it helps people connect through local activities.",
};

export default function AboutPage() {
  return (
    <main className="mobile-app-container py-6">
      <div className="mx-auto max-w-2xl space-y-6 text-slate-700">
        <header className="space-y-3">
          <h1 className="text-[20px] font-semibold tracking-tight text-slate-900">About Activity App</h1>
          <p className="text-base leading-6">
            Activity App helps people discover and organize meaningful in-person activities in their
            community. Whether you want to join a weekend run, host a study session, or find a
            local pickup game, the platform is designed to make getting together simple.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-[16px] font-semibold text-slate-900">Our mission</h2>
          <p className="leading-6">
            Our mission is to make it easier for people to build real connections through shared
            interests. We believe local activities can strengthen communities, reduce isolation, and
            create lasting friendships.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-[16px] font-semibold text-slate-900">How it works</h2>
          <ol className="list-decimal space-y-2 pl-6 leading-6">
            <li>Create your profile and add a few details about what you enjoy.</li>
            <li>Browse activities by time, category, and location.</li>
            <li>Request to join activities or host your own with clear expectations.</li>
            <li>Connect with participants and meet up safely in person.</li>
          </ol>
        </section>
      </div>
    </main>
  );
}