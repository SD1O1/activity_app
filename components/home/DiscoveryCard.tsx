"use client";
import { useRouter } from "next/navigation";

type DiscoveryCardProps = {
  title: string;
  subtitle: string;
  time: string;
  people: string;
};

export default function DiscoveryCard({ title, subtitle, time, people }: DiscoveryCardProps) {
  const router = useRouter();

  return (
    <div onClick={() => router.push("/activity")} className="min-w-[220px] rounded-2xl border border-[#e4e7ec] bg-white p-4 shadow-sm">
      <h4 className="text-2xl font-semibold text-[#111827]">{title}</h4>
      <p className="mt-1 text-xl text-[#667085]">{subtitle}</p>
      <div className="mt-4 flex items-center justify-between text-sm text-[#334155]">
        <span>{time}</span>
        <span>👥 {people}</span>
      </div>
    </div>
  );
}