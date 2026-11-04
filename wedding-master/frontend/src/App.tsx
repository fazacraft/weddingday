import { lazy, ReactNode, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import {
  NotFoundPage,
  PreviewPage,
  PublicInvitationPage,
  TemplateDemoPage,
} from "./pages/InvitationPages";
import { FullPageLoader } from "./templates/InvitationRenderer";
import { SITE_NAME } from "./lib/site";

/*
 * Mehmonlar faqat taklifnoma sahifasini ochadi — platforma sahifalari (landing,
 * wizard, kabinet, admin) alohida yuklanadi, shunda taklifnoma uchun asosiy JS
 * kichik bo'ladi.
 */
const LandingPage = lazy(() => import("./pages/LandingPage").then((m) => ({ default: m.LandingPage })));
const AuthPage = lazy(() => import("./pages/AuthPage").then((m) => ({ default: m.AuthPage })));
const BuilderPage = lazy(() => import("./pages/builder/BuilderPage").then((m) => ({ default: m.BuilderPage })));
const DashboardPage = lazy(() => import("./pages/dashboard/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const ManagePage = lazy(() => import("./pages/dashboard/ManagePage").then((m) => ({ default: m.ManagePage })));
const AdminGate = lazy(() => import("./pages/admin/AdminGate").then((m) => ({ default: m.AdminGate })));
const ShowcasePage = lazy(() => import("./pages/ShowcasePage").then((m) => ({ default: m.ShowcasePage })));

/** Kabinet sahifalari — kirmagan foydalanuvchi kirish sahifasiga yo'naltiriladi. */
function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageLoader />;
  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/kirish?next=${next}`} replace />;
  }
  return <>{children}</>;
}

/** Admin foydalanuvchi hisobiga kirganda — kimning hisobida ekanini eslatib turadi. */
function ImpersonationBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user?.impersonated) return null;
  return (
    <div className="fixed bottom-3 left-3 z-[10001] flex max-w-[calc(100vw-1.5rem)] items-center gap-3 rounded-full bg-amber-400 py-1.5 pl-4 pr-1.5 text-xs font-semibold text-ink shadow-xl">
      <span className="truncate">Admin rejimi: {user.name} ({user.email})</span>
      <button
        type="button"
        onClick={() => {
          logout();
          navigate("/admin");
        }}
        className="h-7 shrink-0 rounded-full bg-ink px-3 text-ivory hover:bg-ink/85"
      >
        Panelga qaytish
      </button>
    </div>
  );
}

/** Platforma sahifalarida sarlavhani tiklaydi (taklifnoma sahifasi o'zinikini qo'yadi). */
function TitleReset() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = `${SITE_NAME} — onlayn to'y taklifnomasi`;
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <TitleReset />
      <ImpersonationBar />
      <Suspense fallback={<FullPageLoader />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/kirish" element={<AuthPage mode="login" />} />
        <Route path="/royxatdan-otish" element={<AuthPage mode="register" />} />
        <Route path="/yaratish" element={<BuilderPage mode="create" />} />
        <Route path="/shablonlar/:key/*" element={<TemplateDemoPage />} />
        <Route path="/korinish/*" element={<PreviewPage />} />
        <Route path="/kabinet" element={<RequireAuth><DashboardPage /></RequireAuth>} />
        <Route path="/kabinet/:id" element={<RequireAuth><ManagePage /></RequireAuth>} />
        <Route
          path="/kabinet/:id/tahrirlash"
          element={<RequireAuth><BuilderPage key="edit" mode="edit" /></RequireAuth>}
        />
        <Route path="/admin" element={<AdminGate />} />
        <Route path="/namunalar" element={<ShowcasePage />} />
        <Route path="/:slug/*" element={<PublicInvitationPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </Suspense>
    </>
  );
}
