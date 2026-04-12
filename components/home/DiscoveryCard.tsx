"use client";

import { useRouter } from "next/navigation";

type DiscoveryCardProps = {
  title: string;
  subtitle: string;
  meta: string;
  joined: number;
};

export default function DiscoveryCard({ title, subtitle, meta, joined }: DiscoveryCardProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/activities")}
      className="min-w-[290px] rounded-3xl border border-orange-100 bg-gradient-to-b from-white to-orange-50/45 p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2"
    >
      <h4 className="text-2xl font-bold text-slate-900">{title}</h4>
      <p className="mt-1 text-base text-slate-500">{subtitle}</p>
      <div className="mt-4 flex items-center justify-between text-sm text-slate-600 sm:text-base">
        <span className="font-medium text-[#f97316]">{meta}</span>
        <span>👥 {joined}</span>
      </div>
    </button>
  );
}
