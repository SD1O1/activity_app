import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Activity App",
  description:
    "Review Activity App terms covering user responsibilities, hosting standards, and account enforcement.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-12">
      <div className="mx-auto max-w-3xl space-y-8 text-slate-700">
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Terms of Service</h1>
          <p className="leading-7">
            By using Activity App, you agree to follow these terms. They help keep the platform
            respectful, reliable, and safe for everyone.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">User responsibilities</h2>
          <p className="leading-7">
            Provide accurate profile information, communicate respectfully, and only participate in
            activities you can attend. Users are responsible for their conduct both on the app and
            during in-person activities.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Activity hosting rules</h2>
          <p className="leading-7">
            Hosts must describe activities honestly, share key details in advance, and avoid
            misleading participants. Hosts are expected to notify participants promptly about
            cancellations, location changes, or safety requirements.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Account suspension rights</h2>
          <p className="leading-7">
            We may suspend or remove accounts that violate community standards, misuse the service,
            or create safety risks for other members. Serious or repeated violations may result in
            permanent account removal.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Liability disclaimer</h2>
          <p className="leading-7">
            Activity App provides tools to coordinate activities but does not supervise in-person
            events. Participation is at your own risk, and users are responsible for taking
            reasonable precautions based on their circumstances.
          </p>
        </section>
      </div>
    </main>
  );
}