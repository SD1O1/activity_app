import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help Center | Activity App",
  description:
    "Find help for joining activities, hosting events, resolving account issues, and staying safe.",
};

export default function HelpPage() {
  return (
    <main className="mobile-app-container px-4 py-6">
      <div className="mx-auto max-w-[420px] space-y-6 text-slate-700">
        <header className="space-y-3">
          <h1 className="text-[20px] font-semibold tracking-tight text-slate-900">Help Center</h1>
          <p className="leading-6">
            Use this guide to get the most out of Activity App and quickly solve common issues.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-[16px] font-semibold text-slate-900">How to join an activity</h2>
          <ul className="list-disc space-y-2 pl-6 leading-6">
            <li>Browse the activities feed and open an activity that matches your interests.</li>
            <li>Review the date, location, group size, and any host requirements.</li>
            <li>Submit a join request and wait for host approval if required.</li>
            <li>Once approved, keep an eye on notifications for updates from the host.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-[16px] font-semibold text-slate-900">How to host an activity</h2>
          <ul className="list-disc space-y-2 pl-6 leading-6">
            <li>Create a clear title and description so participants know what to expect.</li>
            <li>Set an accurate start time and meeting point.</li>
            <li>Define group size limits and any equipment or experience needed.</li>
            <li>Review join requests promptly and communicate changes early.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-[16px] font-semibold text-slate-900">Account issues</h2>
          <p className="leading-6">
            If you cannot log in, start by resetting your password and checking that your email is
            verified. If your profile details are outdated, update them in your account settings.
            For ongoing access issues, contact support with your username and a short description of
            the problem.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-[16px] font-semibold text-slate-900">Safety tips</h2>
          <ul className="list-disc space-y-2 pl-6 leading-6">
            <li>Meet in public places when joining someone for the first time.</li>
            <li>Tell a friend where you are going and when you expect to return.</li>
            <li>Trust your instincts and leave if a situation feels unsafe.</li>
            <li>Use in-app reporting tools to flag harmful behavior.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}