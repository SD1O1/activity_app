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
      className="min-w-[290px] rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm"
    >
      <h4 className="text-[2rem] font-bold text-slate-900 sm:text-2xl">{title}</h4>
      <p className="mt-1 text-xl text-slate-500 sm:text-lg">{subtitle}</p>
      <div className="mt-4 flex items-center justify-between text-xl text-slate-600 sm:text-base">
        <span>{meta}</span>
        <span>👥 {joined}</span>
      </div>
    </button>
  );
}
