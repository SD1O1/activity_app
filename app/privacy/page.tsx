import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Activity App",
  description:
    "Understand what personal information Activity App collects, how it is used, and how to contact us about privacy concerns.",
};

export default function PrivacyPage() {
  return (
    <main className="mobile-app-container py-6">
      <div className="mx-auto max-w-2xl space-y-6 text-slate-700">
        <header className="space-y-3">
          <h1 className="text-[20px] font-semibold tracking-tight text-slate-900">Privacy Policy</h1>
          <p className="leading-6">
            We value your trust. This page explains what data we collect, how we protect it, and
            how you can contact us with privacy questions.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-[16px] font-semibold text-slate-900">Data we collect</h2>
          <ul className="list-disc space-y-2 pl-6 leading-6">
            <li>Account details such as your email and phone number.</li>
            <li>Profile information, including your name, city, and activity preferences.</li>
            <li>Activity participation details needed to manage joins and hosting.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-[16px] font-semibold text-slate-900">What we do not share</h2>
          <p className="leading-6">
            We do not sell your personal information to advertisers. We also do not share private
            contact details with other users unless you choose to provide them directly.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-[16px] font-semibold text-slate-900">How data is stored</h2>
          <p className="leading-6">
            Personal data is stored on secured infrastructure with access controls limited to
            authorized systems and personnel. We use industry-standard safeguards to protect data in
            transit and at rest.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-[16px] font-semibold text-slate-900">Privacy concerns</h2>
          <p className="leading-6">
            If you have questions about this policy or need help with your data, contact us at
            <a className="ml-1 font-medium text-slate-900" href="mailto:privacy@activityapp.example">
              privacy@activityapp.example
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}