import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PAYMENT_CONTACT, SITE_NAME } from "../lib/site";
import { buttonClass, PLink } from "./ui";
import { withBase } from "../lib/base";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2.5 ${className}`}>
      <img
        src={withBase("/brand/beluga-cat.jpg")}
        alt=""
        className="h-9 w-9 rounded-full object-cover ring-2 ring-rose/15"
      />
      <span className="font-display text-2xl font-semibold tracking-tight text-ink">{SITE_NAME}</span>
    </Link>
  );
}

/** "Buyurtma berish" — taklifnomani biz tayyorlab beramiz: Telegram'da bizga yoziladi. */
const ORDER_URL = `https://t.me/${PAYMENT_CONTACT}`;

export function SiteHeader() {
  const { user, logout } = useAuth();
  const { pathname, search, hash } = useLocation();
  const [open, setOpen] = useState(false);
  const onLanding = pathname === "/";
  // Kirgandan keyin shu sahifaga qaytadi (kirish sahifasining o'zi kabinetga yuboradi)
  const loginTo = `/kirish?next=${encodeURIComponent(pathname + search + hash)}`;

  const nav = [
    { href: withBase("/#shablonlar"), label: "Shablonlar" },
    { href: withBase("/#qanday"), label: "Qanday ishlaydi" },
    { href: withBase("/#tolov"), label: "To'lov" },
    { href: withBase("/#savollar"), label: "Savollar" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-ink/5 bg-ivory/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />

        {onLanding && (
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-ink/60">
            {nav.map((n) => (
              <a key={n.href} href={n.href} className="hover:text-ink transition-colors">
                {n.label}
              </a>
            ))}
          </nav>
        )}

        <div className="hidden sm:flex items-center gap-2">
          {user ? (
            <>
              {user.isAdmin && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `px-3 text-sm font-semibold ${isActive ? "text-rose" : "text-rose/70 hover:text-rose"}`
                  }
                >
                  Admin
                </NavLink>
              )}
              <NavLink
                to="/kabinet"
                className={({ isActive }) =>
                  `px-3 text-sm font-semibold ${isActive ? "text-ink" : "text-ink/60 hover:text-ink"}`
                }
              >
                Kabinet
              </NavLink>
              <button onClick={logout} className="px-3 text-sm text-ink/50 hover:text-ink">
                Chiqish
              </button>
            </>
          ) : (
            <Link to={loginTo} className="px-3 text-sm font-semibold text-ink/70 hover:text-ink">
              Kirish
            </Link>
          )}
          {/* Admin o'ziga buyurtma bermaydi — tor ekranda sarlavha sig'masin */}
          {!user?.isAdmin && (
            <a href={ORDER_URL} target="_blank" rel="noreferrer" className={buttonClass("secondary", "sm", "whitespace-nowrap")}>
              Buyurtma berish
            </a>
          )}
          <PLink to="/yaratish" size="sm" className="whitespace-nowrap">
            Taklifnoma yaratish
          </PLink>
        </div>

        <button
          className="sm:hidden grid h-10 w-10 place-items-center rounded-full hover:bg-ink/5"
          onClick={() => setOpen((o) => !o)}
          aria-label="Menyu"
          aria-expanded={open}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {open && (
        <div className="sm:hidden border-t border-ink/5 bg-ivory px-4 pb-5 pt-3 flex flex-col gap-1" onClick={() => setOpen(false)}>
          {onLanding &&
            nav.map((n) => (
              <a key={n.href} href={n.href} className="py-2.5 text-[15px] text-ink/70">
                {n.label}
              </a>
            ))}
          {user ? (
            <>
              {user.isAdmin && <Link to="/admin" className="py-2.5 text-[15px] font-semibold text-rose">Admin</Link>}
              <Link to="/kabinet" className="py-2.5 text-[15px] font-semibold text-ink">Kabinet</Link>
              <button onClick={logout} className="py-2.5 text-left text-[15px] text-ink/50">Chiqish</button>
            </>
          ) : (
            <Link to={loginTo} className="py-2.5 text-[15px] font-semibold text-ink">Kirish</Link>
          )}
          <PLink to="/yaratish" className="mt-2 w-full">Taklifnoma yaratish</PLink>
          <a href={ORDER_URL} target="_blank" rel="noreferrer" className={buttonClass("secondary", "md", "w-full")}>
            Buyurtma berish
          </a>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-ink/10 bg-ivory">
      <p className="mx-auto max-w-6xl px-4 py-8 text-center text-sm text-ink/45 sm:px-6">
        {SITE_NAME} · Toshkent
      </p>
    </footer>
  );
}
