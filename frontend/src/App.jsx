import { AppLayout } from "./app/AppLayout.jsx";
import { DialogProvider } from "./components/feedback/DialogProvider.jsx";
import { useTheme } from "./hooks/useTheme.js";
import { ForgotPasswordLauncher } from "./modules/auth/ForgotPasswordLauncher.jsx";
import { LoginPage, useAuth } from "./modules/auth/index.js";

export default function App() {
  const { user, login, logout } = useAuth();
  const [, setLightMode] = useTheme(); // applied on the login screen too
  const toggleTheme = () => setLightMode((value) => !value);

  return (
    <DialogProvider>
      {user ? <AppLayout user={user} onLogout={logout} onToggleTheme={toggleTheme} /> : <LoginPage onLogin={login} />}
      {!user && <ForgotPasswordLauncher />}
    </DialogProvider>
  );
}
