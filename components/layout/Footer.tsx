import Link from "next/link";

const footerLinks = [
  { href: "/about", label: "About" },
  { href: "/help", label: "Help" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/contact", label: "Contact" },
];

export default function Footer() {
  return (
    <footer className="rounded-[1.75rem] border border-orange-100/80 bg-white/95 px-5 py-5 text-sm text-slate-600 shadow-[0_18px_35px_-30px_rgba(15,23,42,0.45)] sm:px-6">
      <div className="mb-3 flex flex-wrap gap-2.5">
        {footerLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-full border border-orange-100 bg-orange-50/45 px-3 py-1 text-sm font-medium text-slate-600 transition-colors hover:border-orange-200 hover:bg-orange-100/70 hover:text-[#f97316]"
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="text-xs font-medium text-slate-500">© {new Date().getFullYear()} PerfectBench</div>
    </footer>
  );
}