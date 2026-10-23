import { lazy, ReactNode, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
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
        <Route path="/:slug/*" element={<PublicInvitationPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </Suspense>
    </>
  );
}
