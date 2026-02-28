"use client";
import { useRouter } from "next/navigation";

type DiscoveryCardProps = { title: string; subtitle: string; time: string; people: string };

export default function DiscoveryCard({ title, subtitle, time, people }: DiscoveryCardProps) {
  const router = useRouter();

  return (
    <div onClick={() => router.push("/activity")} className="min-w-[200px] app-card p-4">
      <h4 className="text-[16px] font-semibold text-[#111827]">{title}</h4>
      <p className="mt-1 text-[13px] text-[#667085]">{subtitle}</p>
      <div className="mt-3 flex items-center justify-between text-[12px] text-[#334155]">
        <span>{time}</span>
        <span>👥 {people}</span>
      </div>
    </div>
  );
}
