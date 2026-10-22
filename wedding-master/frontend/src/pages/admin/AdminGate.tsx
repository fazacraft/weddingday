import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { ApiError } from "../../lib/api";
import { adminApi, adminLogin, getAdminToken, setAdminToken } from "../../lib/adminAuth";
import { FullPageLoader } from "../../templates/InvitationRenderer";
import { Logo } from "../../platform/SiteChrome";
import { Field, Notice, PButton } from "../../platform/ui";
import { AdminPage } from "./AdminPage";

/**
 * /admin — ikki yo'l bilan kiriladi: ADMIN_EMAILS'dagi hisob bilan saytga
 * kirgan bo'lsa darhol, aks holda panelning o'z login/paroli bilan.
 */
export function AdminGate() {
  const { user, loading } = useAuth();
  const [state, setState] = useState<"checking" | "in" | "out">(() => (getAdminToken() ? "checking" : "out"));

  // Saqlangan admin tokeni hali amaldami (12 soat) — tekshirib olamiz
  useEffect(() => {
    if (state !== "checking") return;
    adminApi("/admin/stats")
      .then(() => setState("in"))
      .catch(() => {
        setAdminToken(null);
        setState("out");
      });
  }, [state]);

  if (loading || state === "checking") return <FullPageLoader />;
  if (state === "in") {
    return (
      <AdminPage
        onLogout={() => {
          setAdminToken(null);
          setState("out");
        }}
      />
    );
  }
  if (user?.isAdmin) return <AdminPage />;
  return <AdminLoginForm onSuccess={() => setState("in")} />;
}

function AdminLoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await adminLogin(username.trim(), password);
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Xatolik yuz berdi");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-ivory px-5 py-6 sm:px-10">
      <Logo />
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
        <h1 className="font-display text-4xl font-semibold text-ink">Admin panel</h1>
        <p className="mt-2 text-sm text-ink/55">Boshqaruv paneliga kirish uchun admin login va parolini kiriting.</p>
        <form onSubmit={(e) => void submit(e)} className="mt-8 flex flex-col gap-4">
          <Field label="Login" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
          <Field
            label="Parol"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          {error && <Notice>{error}</Notice>}
          <PButton type="submit" size="lg" loading={busy} className="mt-2 w-full">
            Kirish
          </PButton>
        </form>
      </div>
    </div>
  );
}
