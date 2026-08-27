import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import StatusBadge from '../components/StatusBadge';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatMoney(n) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);
}

export default function AdminDashboard() {
  const [date, setDate] = useState(todayStr());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    setLoading(true);
    api
      .get('/appointments', { params: { from: date, to: date } })
      .then((res) => setAppointments(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(load, [date]);

  const changeStatus = async (id, status) => {
    setBusyId(id);
    try {
      await api.patch(`/appointments/${id}/status`, { status });
      load();
    } finally {
      setBusyId(null);
    }
  };

  const totalDelDia = appointments
    .filter((a) => a.status !== 'cancelled')
    .reduce((sum, a) => sum + a.price, 0);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl text-ink">Turnos</h2>
          <p className="text-ink/50 text-sm mt-1">
            {appointments.length} turno{appointments.length !== 1 ? 's' : ''} · {formatMoney(totalDelDia)} estimado
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-ink/20 rounded-md px-3 py-2 bg-paper-light focus:outline-none focus:ring-2 focus:ring-brick/40"
          />
          <Link
            to={`/admin/cronograma?date=${date}`}
            className="whitespace-nowrap text-sm border border-ink/20 rounded-md px-3 py-2 text-ink/70 hover:bg-ink/5 transition-colors"
          >
            Cronograma / PDF / WhatsApp
          </Link>
        </div>
      </div>

      {loading && <p className="text-ink/40 text-sm">Cargando…</p>}

      {!loading && appointments.length === 0 && (
        <div className="border border-dashed border-ink/20 rounded-lg py-16 text-center text-ink/40">
          No hay turnos para este día.
        </div>
      )}

      <div className="space-y-3">
        {appointments.map((a) => (
          <div
            key={a._id}
            className="bg-paper-light border border-ink/10 rounded-lg p-4 flex flex-wrap items-center gap-4 justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="font-mono text-ink text-lg w-20">{a.startTime}</div>
              <div>
                <p className="font-display text-ink">{a.serviceName}</p>
                <p className="text-sm text-ink/50">
                  {a.clientName} · {a.clientPhone}
                </p>
                {a.notes && <p className="text-xs text-ink/40 mt-0.5">"{a.notes}"</p>}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-mono text-sm text-ink/60">{formatMoney(a.price)}</span>
              <StatusBadge status={a.status} />
              {a.status === 'pending' && (
                <button
                  disabled={busyId === a._id}
                  onClick={() => changeStatus(a._id, 'confirmed')}
                  className="text-xs px-2.5 py-1.5 rounded-md border border-forest/40 text-forest hover:bg-forest/10 transition-colors"
                >
                  Confirmar
                </button>
              )}
              {(a.status === 'confirmed' || a.status === 'pending') && (
                <button
                  disabled={busyId === a._id}
                  onClick={() => changeStatus(a._id, 'completed')}
                  className="text-xs px-2.5 py-1.5 rounded-md border border-ink/20 text-ink/60 hover:bg-ink/5 transition-colors"
                >
                  Completado
                </button>
              )}
              {a.status !== 'cancelled' && a.status !== 'completed' && (
                <button
                  disabled={busyId === a._id}
                  onClick={() => changeStatus(a._id, 'cancelled')}
                  className="text-xs px-2.5 py-1.5 rounded-md border border-brick/40 text-brick hover:bg-brick/10 transition-colors"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
