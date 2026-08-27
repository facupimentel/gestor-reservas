import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="bg-paper-light rounded-lg p-8 w-full max-w-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-brick font-medium">Panel admin</p>
        <h1 className="font-display text-2xl text-ink mt-1 mb-6">Iniciar sesión</h1>

        <label className="block text-xs uppercase tracking-wide text-ink/50 mb-1 font-mono">Email</label>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-ink/20 rounded-md px-3 py-2 mb-4 bg-white focus:outline-none focus:ring-2 focus:ring-brick/40"
        />

        <label className="block text-xs uppercase tracking-wide text-ink/50 mb-1 font-mono">Contraseña</label>
        <input
          required
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-ink/20 rounded-md px-3 py-2 mb-4 bg-white focus:outline-none focus:ring-2 focus:ring-brick/40"
        />

        {error && <p className="text-sm text-brick mb-4">{error}</p>}

        <button
          disabled={loading}
          className="w-full bg-ink text-paper-light py-2.5 rounded-md font-medium hover:bg-ink-soft transition-colors disabled:opacity-50"
        >
          {loading ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}
