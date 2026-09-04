import { Link, useLocation } from 'react-router-dom';

const LINKS = [
  { to: '/admin-requests', label: 'New Requests' },
  { to: '/volunteer', label: 'Volunteer' },
  { to: '/admin-verify', label: 'Verify Profiles' },
  { to: '/admin', label: 'Lab Dashboard' },
];

// Third-party tool (acconix.in) - no source/API access, so this links out rather
// than embedding or reimplementing it. Opens in a new tab since it's a separate site.
const EXTERNAL_LINKS = [
  { href: 'https://acconix.in/tools/invoice-generator', label: 'Invoice Generator' },
];

const pillClasses = (active: boolean) =>
  `px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors border ${active
    ? 'bg-[#1A1A19] text-white border-[#1A1A19]'
    : 'bg-white/60 text-[#5A5A55] border-[#E8E8E5] hover:bg-white'
  }`;

export default function AdminNav() {
  const { pathname } = useLocation();
  return (
    <div className="flex flex-wrap gap-2 mb-6 relative z-10">
      {LINKS.map((link) => (
        <Link key={link.to} to={link.to} className={pillClasses(pathname === link.to)}>
          {link.label}
        </Link>
      ))}
      {EXTERNAL_LINKS.map((link) => (
        <a
          key={link.href}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className={pillClasses(false) + ' inline-flex items-center gap-1'}
        >
          {link.label}
          <span className="material-symbols-rounded text-[13px]" aria-hidden="true">open_in_new</span>
        </a>
      ))}
    </div>
  );
}
