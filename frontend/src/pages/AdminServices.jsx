import { useEffect, useState } from 'react';
import api from '../api/axios';

const emptyForm = { name: '', description: '', duration: 30, price: 0 };

function formatMoney(n) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);
}

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    api
      .get('/services', { params: { all: true } })
      .then((res) => setServices(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openNew = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
    setError('');
  };

  const openEdit = (s) => {
    setForm({ name: s.name, description: s.description, duration: s.duration, price: s.price });
    setEditingId(s._id);
    setShowForm(true);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await api.put(`/services/${editingId}`, form);
      } else {
        await api.post('/services', form);
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo guardar el servicio');
    }
  };

  const toggleActive = async (s) => {
    if (s.isActive) {
      await api.delete(`/services/${s._id}`);
    } else {
      await api.put(`/services/${s._id}`, { isActive: true });
    }
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl text-ink">Servicios</h2>
        <button
          onClick={openNew}
          className="bg-brick text-paper-light px-4 py-2 rounded-md text-sm font-medium hover:bg-brick-dark transition-colors"
        >
          + Nuevo servicio
        </button>
      </div>

      {loading && <p className="text-ink/40 text-sm">Cargando…</p>}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((s) => (
          <div
            key={s._id}
            className={`bg-paper-light border rounded-lg p-4 ${s.isActive ? 'border-ink/10' : 'border-ink/10 opacity-50'}`}
          >
            <div className="flex items-start justify-between">
              <h3 className="font-display text-ink">{s.name}</h3>
              <span className="font-mono text-xs text-ink/40">{s.duration}′</span>
            </div>
            {s.description && <p className="text-sm text-ink/50 mt-1">{s.description}</p>}
            <p className="font-mono text-brick mt-2">{formatMoney(s.price)}</p>
            <div className="flex gap-3 mt-3 text-xs">
              <button onClick={() => openEdit(s)} className="text-ink/60 hover:text-ink underline">
                Editar
              </button>
              <button onClick={() => toggleActive(s)} className="text-ink/60 hover:text-ink underline">
                {s.isActive ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-ink/50 flex items-center justify-center px-6 z-10">
          <form
            onSubmit={handleSubmit}
            className="bg-paper-light rounded-lg p-6 w-full max-w-md"
          >
            <h3 className="font-display text-xl text-ink mb-4">
              {editingId ? 'Editar servicio' : 'Nuevo servicio'}
            </h3>

            <label className="block text-xs uppercase tracking-wide text-ink/50 mb-1 font-mono">Nombre</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-ink/20 rounded-md px-3 py-2 mb-3 bg-white"
            />

            <label className="block text-xs uppercase tracking-wide text-ink/50 mb-1 font-mono">Descripción</label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-ink/20 rounded-md px-3 py-2 mb-3 bg-white"
            />

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs uppercase tracking-wide text-ink/50 mb-1 font-mono">
                  Duración (min)
                </label>
                <input
                  required
                  type="number"
                  min={5}
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
                  className="w-full border border-ink/20 rounded-md px-3 py-2 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-ink/50 mb-1 font-mono">Precio</label>
                <input
                  required
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  className="w-full border border-ink/20 rounded-md px-3 py-2 bg-white"
                />
              </div>
            </div>

            {error && <p className="text-sm text-brick mb-3">{error}</p>}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-ink/60 hover:text-ink"
              >
                Cancelar
              </button>
              <button className="bg-ink text-paper-light px-4 py-2 rounded-md text-sm font-medium hover:bg-ink-soft transition-colors">
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
