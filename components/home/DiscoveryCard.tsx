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
      className="min-w-[280px] rounded-3xl border border-neutral-200 bg-white p-4 text-left shadow-sm"
    >
      <h4 className="text-3xl font-semibold text-neutral-900">{title}</h4>
      <p className="mt-1 text-xl text-neutral-500">{subtitle}</p>
      <div className="mt-4 flex items-center justify-between text-lg text-neutral-600">
        <span>{meta}</span>
        <span>👥 {joined}</span>
      </div>
    </button>
  );
}
