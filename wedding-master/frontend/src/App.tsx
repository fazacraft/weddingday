import { ReactNode, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { LandingPage } from "./pages/LandingPage";
import { AuthPage } from "./pages/AuthPage";
import { BuilderPage } from "./pages/builder/BuilderPage";
import { DashboardPage } from "./pages/dashboard/DashboardPage";
import { ManagePage } from "./pages/dashboard/ManagePage";
import { AdminPage } from "./pages/admin/AdminPage";
import {
  NotFoundPage,
  PreviewPage,
  PublicInvitationPage,
  TemplateDemoPage,
} from "./pages/InvitationPages";
import { FullPageLoader } from "./templates/InvitationRenderer";
import { SITE_NAME } from "./lib/site";

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

/** /admin — faqat backend'dagi ADMIN_EMAILS ro'yxatidagilar uchun. */
function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to={`/kirish?next=${encodeURIComponent("/admin")}`} replace />;
  if (!user.isAdmin) return <NotFoundPage message="Bu bo'lim faqat adminlar uchun" />;
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
        <Route path="/admin" element={<RequireAdmin><AdminPage /></RequireAdmin>} />
        <Route path="/:slug/*" element={<PublicInvitationPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
