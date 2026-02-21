import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | Activity App",
  description:
    "Get in touch with Activity App support for account, activity, or platform questions.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-12">
      <div className="mx-auto max-w-3xl space-y-8 text-slate-700">
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Contact Us</h1>
          <p className="leading-7">
            Need help with your account or an activity? Our support team is here to assist.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Support</h2>
          <p className="leading-7">
            Email us at
            <a className="ml-1 font-medium text-slate-900" href="mailto:support@activityapp.example">
              support@activityapp.example
            </a>
            .
          </p>
          <p className="leading-7">We typically respond within 1–2 business days.</p>
        </section>
      </div>
    </main>
  );
}