import { Link, useLocation } from 'react-router-dom';

const LINKS = [
  { to: '/admin-requests', label: 'New Requests' },
  { to: '/volunteer', label: 'Volunteer' },
  { to: '/admin-verify', label: 'Verify Profiles' },
  { to: '/admin', label: 'Lab Dashboard' },
];

export default function AdminNav() {
  const { pathname } = useLocation();
  return (
    <div className="flex flex-wrap gap-2 mb-6 relative z-10">
      {LINKS.map((link) => {
        const active = pathname === link.to;
        return (
          <Link
            key={link.to}
            to={link.to}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors border ${active
              ? 'bg-[#1A1A19] text-white border-[#1A1A19]'
              : 'bg-white/60 text-[#5A5A55] border-[#E8E8E5] hover:bg-white'
              }`}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
