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
    <footer className="mt-12 border-t px-4 py-6 text-sm text-gray-500">
      <div className="mb-4 flex flex-wrap gap-x-4 gap-y-2">
        {footerLinks.map((link) => (
          <Link key={link.href} href={link.href} className="hover:underline">
            {link.label}
          </Link>
        ))}
      </div>

      <div className="text-xs">© {new Date().getFullYear()} PerfectBench</div>
    </footer>
  );
}