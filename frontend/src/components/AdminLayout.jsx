import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/admin', label: 'Turnos', end: true },
  { to: '/admin/cronograma', label: 'Cronograma' },
  { to: '/admin/servicios', label: 'Servicios' },
  { to: '/admin/horarios', label: 'Horarios' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-paper font-body">
      <header className="bg-ink text-paper-light print:hidden">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-brass font-mono">Panel admin</p>
            <h1 className="font-display text-lg">Hola, {user?.name}</h1>
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/admin/login');
            }}
            className="text-sm text-paper-light/60 hover:text-paper-light transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
        <nav className="max-w-6xl mx-auto px-6 flex gap-6 border-t border-paper-light/10">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `py-3 text-sm border-b-2 transition-colors ${
                  isActive
                    ? 'border-brick text-paper-light'
                    : 'border-transparent text-paper-light/50 hover:text-paper-light'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
