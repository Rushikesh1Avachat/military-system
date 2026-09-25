
import { useEffect, useMemo, useState } from 'react';
import {
  NavLink,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom';
import {
  ArrowRightLeft,
  Boxes,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Mail,
  KeyRound,
  ScrollText,
  ShieldCheck,
  UserCog,
} from 'lucide-react';

import { DashboardPage } from './pages/DashboardPage';
import { InventoryPage } from './pages/InventoryPage';
import { TransfersPage } from './pages/TransfersPage';
import { AssignmentsPage } from './pages/AssignmentsPage';
import { ExpendituresPage } from './pages/ExpendituresPage';
import { AuditPage } from './pages/AuditPage';

import {
  api,
  clearSession,
  getStoredUser,
  persistSession,
} from './utils/api';

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const DEMO_ACCOUNTS = [
  {
    label: 'Owner (Admin)',
    email: 'avachatrushikesh45@gmail.com',
    password: 'Rushi123',
  },
  {
    label: 'Admin',
    email: 'admin@military.com',
    password: 'Admin@123',
  },
  {
    label: 'Commander',
    email: 'commander@military.com',
    password: 'Commander@123',
  },
  {
    label: 'Logistics',
    email: 'logistics@military.com',
    password: 'Logistics@123',
  },
];

const NAV_ITEMS = [
  {
    id: 'dashboard',
    to: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: [
      'admin',
      'base_commander',
      'logistics_officer',
    ],
  },
  {
    id: 'purchases',
    to: '/purchases',
    label: 'Purchases',
    icon: Boxes,
    roles: ['admin', 'logistics_officer'],
  },
  {
    id: 'transfers',
    to: '/transfers',
    label: 'Transfers',
    icon: ArrowRightLeft,
    roles: [
      'admin',
      'base_commander',
      'logistics_officer',
    ],
  },
  {
    id: 'assignments',
    to: '/assignments',
    label: 'Assignments',
    icon: UserCog,
    roles: ['admin', 'base_commander'],
  },
  {
    id: 'expenditures',
    to: '/expenditures',
    label: 'Expenditures',
    icon: ClipboardList,
    roles: ['admin', 'base_commander'],
  },
  {
    id: 'audit',
    to: '/audit',
    label: 'Audit Logs',
    icon: ScrollText,
    roles: ['admin'],
  },
];

const ROLE_LABELS = {
  admin: 'Admin',
  base_commander: 'Base Commander',
  logistics_officer: 'Logistics Officer',
};

function GoogleMark() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 48 48"
      aria-hidden="true"
    >
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.5 5.7-6.7 7.2l6.3 5.3C37.4 38.3 44 33 44 24c0-1.2-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}

function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const existing = document.getElementById('google-gsi');

    if (existing) {
      existing.addEventListener('load', resolve, {
        once: true,
      });

      existing.addEventListener('error', reject, {
        once: true,
      });

      return;
    }

    const script = document.createElement('script');

    script.id = 'google-gsi';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;

    script.onload = resolve;
    script.onerror = reject;

    document.head.appendChild(script);
  });
}

function LoginPage({ onAuthenticated }) {
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });

  const [loginError, setLoginError] = useState('');
  const [busy, setBusy] = useState(false);

  const completeLogin = (payload) => {
    if (!payload?.token || !payload?.user) {
      throw new Error(
        'Invalid login response from server.'
      );
    }

    persistSession(payload.token, payload.user);
    onAuthenticated(payload.user);
  };

  // Normal email/password login
  const handleLogin = async (event) => {
    event.preventDefault();

    setBusy(true);
    setLoginError('');

    try {
      const payload = await api.login(
        loginForm.email,
        loginForm.password
      );

      completeLogin(payload);
    } catch (error) {
      setLoginError(
        error?.message ||
          'Login failed. Please check your credentials.'
      );
    } finally {
      setBusy(false);
    }
  };

  // Demo account login
  const handleDemoLogin = async (account) => {
    setLoginForm({
      email: account.email,
      password: account.password,
    });

    setBusy(true);
    setLoginError('');

    try {
      const payload = await api.login(
        account.email,
        account.password
      );

      completeLogin(payload);
    } catch (error) {
      setLoginError(
        error?.message ||
          'Demo login failed.'
      );
    } finally {
      setBusy(false);
    }
  };

  // Google ID token received from Google
  const handleGoogleCredential = async (credential) => {
    if (!credential) {
      setLoginError(
        'Google ID token was not received.'
      );
      return;
    }

    setBusy(true);
    setLoginError('');

    try {
      /*
       * IMPORTANT:
       * Backend expects:
       *
       * {
       *   credential: GOOGLE_ID_TOKEN
       * }
       */
      const payload = await api.googleLogin({
        credential: credential,
      });

      completeLogin(payload);
    } catch (error) {
      console.error(
        'Google login failed:',
        error
      );

      setLoginError(
        error?.message ||
          'Google sign-in failed. Please try again.'
      );
    } finally {
      setBusy(false);
    }
  };

  // Start Google Identity Services
  const startGoogleLogin = async () => {
    setLoginError('');

    if (!GOOGLE_CLIENT_ID) {
      setLoginError(
        'Google login is not configured. Please contact the administrator.'
      );
      return;
    }

    try {
      setBusy(true);

      await loadGoogleScript();

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,

        callback: (response) => {
          if (!response?.credential) {
            setBusy(false);

            setLoginError(
              'Google did not return an ID token.'
            );

            return;
          }

          handleGoogleCredential(
            response.credential
          );
        },

        auto_select: false,

        cancel_on_tap_outside: true,
      });

      /*
       * Try Google One Tap first.
       */
      window.google.accounts.id.prompt(
        (notification) => {
          /*
           * If One Tap is not available,
           * render the official Google button.
           */
          if (
            notification.isNotDisplayed() ||
            notification.isSkippedMoment()
          ) {
            const container =
              document.getElementById(
                'google-button-host'
              );

            if (!container) {
              setBusy(false);

              setLoginError(
                'Google login button could not be displayed.'
              );

              return;
            }

            container.innerHTML = '';

            window.google.accounts.id.renderButton(
              container,
              {
                theme: 'outline',
                size: 'large',
                width: 320,
                text: 'continue_with',
                shape: 'rectangular',
              }
            );

            setBusy(false);
          }
        }
      );
    } catch (error) {
      console.error(
        'Google sign-in could not start:',
        error
      );

      setBusy(false);

      setLoginError(
        'Google sign-in could not start. Please try again.'
      );
    }
  };

  return (
    <div className="login-shell">
      <div className="login-panel compact">
        <h1>
          Military Asset Management System
        </h1>

        <form
          className="login-form"
          onSubmit={handleLogin}
        >
          <label className="login-field">
            <span>Email</span>

            <div className="input-wrap">
              <Mail size={16} />

              <input
                type="email"
                required
                value={loginForm.email}
                onChange={(event) =>
                  setLoginForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                placeholder="Enter your email"
              />
            </div>
          </label>

          <label className="login-field">
            <span>Password</span>

            <div className="input-wrap">
              <KeyRound size={16} />

              <input
                type="password"
                required
                value={loginForm.password}
                onChange={(event) =>
                  setLoginForm((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                placeholder="Enter your password"
              />
            </div>
          </label>

          {loginError && (
            <div className="login-error">
              {loginError}
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={busy}
          >
            {busy
              ? 'Loading...'
              : 'Login'}
          </button>
        </form>

        <div className="login-divider">
          <span>or</span>
        </div>

        {/* Google Login */}
        <button
          type="button"
          className="google-button"
          onClick={startGoogleLogin}
          disabled={busy}
        >
          <GoogleMark />

          {busy
            ? 'Connecting to Google...'
            : 'Continue with Google'}
        </button>

        {/* Google renders its official button here if One Tap is unavailable */}
        <div
          id="google-button-host"
          className="google-host"
        />

        {/* Normal demo credentials */}
        <div className="credential-box">
          <h3>
            Authorized Login Credentials:
          </h3>

          <div className="credential-stack">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                className="credential-item"
                onClick={() =>
                  handleDemoLogin(account)
                }
                disabled={busy}
              >
                <strong>
                  {account.label}:
                </strong>

                <span>
                  {account.email}
                </span>

                <em>
                  {account.password}
                </em>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AppShell({ user, onLogout }) {
  const navigate = useNavigate();

  const visibleNav = useMemo(
    () =>
      NAV_ITEMS.filter((item) =>
        item.roles.includes(user.role)
      ),
    [user.role]
  );

  return (
    <div className="app-shell">
      <aside
        className="sidebar"
        aria-label="Military asset navigation"
      >
        <div className="brand">
          <div className="brand-mark">
            <ShieldCheck size={22} />
          </div>

          <div className="brand-copy">
            <h1>Military Asset</h1>
          </div>
        </div>

        <nav className="nav-section">
          {visibleNav.map(
            ({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `nav-item ${
                    isActive ? 'active' : ''
                  }`
                }
              >
                <span className="nav-icon">
                  <Icon size={18} />
                </span>

                <span className="nav-item-label">
                  {label}
                </span>
              </NavLink>
            )
          )}
        </nav>

        <div className="role-card">
          <span>User</span>

          <strong>{user.name}</strong>

          <small>
            {ROLE_LABELS[user.role] ||
              user.role}
          </small>
        </div>

        <button
          type="button"
          className="logout-button"
          onClick={() => {
            clearSession();
            onLogout();
            navigate('/login');
          }}
        >
          <LogOut size={16} />
          Logout
        </button>
      </aside>

      <main className="content-area">
        <Routes>
          <Route
            path="/dashboard"
            element={<DashboardPage />}
          />

          {user.role !== 'base_commander' && (
            <Route
              path="/purchases"
              element={<InventoryPage />}
            />
          )}

          <Route
            path="/transfers"
            element={<TransfersPage />}
          />

          {user.role !== 'logistics_officer' && (
            <Route
              path="/assignments"
              element={<AssignmentsPage />}
            />
          )}

          {user.role !== 'logistics_officer' && (
            <Route
              path="/expenditures"
              element={<ExpendituresPage />}
            />
          )}

          {user.role === 'admin' && (
            <Route
              path="/audit"
              element={<AuditPage />}
            />
          )}

          <Route
            path="*"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(
    () => getStoredUser()
  );

  useEffect(() => {
    const stored = getStoredUser();

    if (stored) {
      setUser(stored);
    }
  }, []);

  if (!user) {
    return (
      <Routes>
        <Route
          path="/login"
          element={
            <LoginPage
              onAuthenticated={setUser}
            />
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />
      </Routes>
    );
  }

  return (
    <AppShell
      user={user}
      onLogout={() => setUser(null)}
    />
  );
}

