import { ReactNode, useEffect } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
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
import { buttonClass } from "./platform/ui";

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
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to={`/kirish?next=${encodeURIComponent("/admin")}`} replace />;
  if (!user.isAdmin) {
    // Odatda boshqa (admin bo'lmagan) hisob bilan kirilgan bo'ladi — qaysi hisobligini ko'rsatamiz
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ivory px-6 text-center">
        <p className="font-display text-4xl font-semibold text-ink">Bu bo'lim faqat adminlar uchun</p>
        <p className="max-w-md text-ink/60">
          Siz <b className="text-ink">{user.email}</b> hisobi bilan kirgansiz — u admin emas.
        </p>
        <button
          onClick={() => {
            logout();
            navigate(`/kirish?next=${encodeURIComponent("/admin")}`, { replace: true });
          }}
          className={buttonClass("primary")}
        >
          Chiqish va admin hisobi bilan kirish
        </button>
      </div>
    );
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
