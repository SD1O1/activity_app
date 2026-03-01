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
    <footer className="mt-8 border-t border-[rgba(0,0,0,0.06)] px-0 pt-8 pb-6 text-[13px] text-gray-500">
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-2">
        {footerLinks.map((link) => (
          <Link key={link.href} href={link.href} className="text-[13px] text-gray-500 transition hover:text-gray-700">
            {link.label}
          </Link>
        ))}
      </div>
      <div className="text-[12px]">© {new Date().getFullYear()} PerfectBench</div>
    </footer>
  );
}
