import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const WEEKDAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function formatMoney(n) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);
}

function toDateInputValue(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Calcula el día de la semana directamente de los componentes de la fecha (YYYY-MM-DD),
// sin pasar por conversión de zona horaria, para que sea consistente sin importar dónde
// esté el navegador del cliente.
function weekdayFromDateString(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

export default function BookingPage() {
  const [config, setConfig] = useState(null);
  const [services, setServices] = useState([]);
  const [step, setStep] = useState(1);

  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [form, setForm] = useState({ clientName: '', clientEmail: '', clientPhone: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(null);

  const today = useMemo(() => new Date(), []);
  const minDate = toDateInputValue(today);
  const maxDate = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + (config?.advanceBookingDays ?? 30));
    return toDateInputValue(d);
  }, [config, today]);

  useEffect(() => {
    api.get('/config').then((res) => setConfig(res.data));
    api.get('/services').then((res) => setServices(res.data));
  }, []);

  useEffect(() => {
    if (!selectedService || !selectedDate) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    setSelectedSlot(null);
    api
      .get('/appointments/availability', {
        params: { serviceId: selectedService._id, date: selectedDate },
      })
      .then((res) => setSlots(res.data.slots))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [selectedService, selectedDate]);

  const handleConfirm = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await api.post('/appointments', {
        serviceId: selectedService._id,
        date: selectedDate,
        startTime: selectedSlot.startTime,
        ...form,
      });
      setConfirmed(res.data);
      setStep(4);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo completar la reserva. Intentá de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const restart = () => {
    setStep(1);
    setSelectedService(null);
    setSelectedDate('');
    setSelectedSlot(null);
    setSlots([]);
    setForm({ clientName: '', clientEmail: '', clientPhone: '', notes: '' });
    setConfirmed(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-paper font-body">
      <header className="border-b border-ink/10">
        <div className="max-w-3xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-paper-light font-medium">Reservá tu turno</p>
            <h1 className="font-display text-2xl font-semibold text-ink mt-1">
              {config?.businessName || 'Mi Negocio'}
            </h1>
          </div>
          <Link
            to="/admin/login"
            className="text-xs text-ink/40 hover:text-ink/70 transition-colors font-body"
          >
            Panel admin
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {step < 4 && (
          <ol className="flex items-center gap-3 mb-10 font-mono text-xs">
            {['Servicio', 'Fecha y hora', 'Tus datos'].map((label, i) => {
              const n = i + 1;
              const active = step === n;
              const done = step > n;
              return (
                <li key={label} className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                      done
                        ? 'bg-paper-light text-paper'
                        : active
                        ? 'border-brick text-brick'
                        : 'border-ink/20 text-ink/30'
                    }`}
                  >
                    {done ? '✓' : n}
                  </span>
                  <span className={active ? 'text-ink' : 'text-ink/40'}>{label}</span>
                  {n < 3 && <span className="w-6 h-px bg-ink/15 ml-1" />}
                </li>
              );
            })}
          </ol>
        )}

        {step === 1 && (
          <section>
            <h2 className="font-display text-xl text-ink mb-1">Elegí un servicio</h2>
            <p className="text-ink/50 text-sm mb-6">Seleccioná lo que querés reservar.</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {services.map((s) => (
                <button
                  key={s._id}
                  onClick={() => {
                    setSelectedService(s);
                    setStep(2);
                  }}
                  className="text-left bg-paper-light border border-ink/10 hover:border-brick/50 rounded-lg p-5 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-lg text-paper group-hover:text-brick transition-colors">
                      {s.name}
                    </h3>
                    <span className="font-mono text-sm text-ink/50 whitespace-nowrap">{s.duration}′</span>
                  </div>
                  {s.description && <p className="text-sm text-ink/50 mt-1">{s.description}</p>}
                  <p className="font-mono text-paper mt-3">{formatMoney(s.price)}</p>
                </button>
              ))}
              {services.length === 0 && (
                <p className="text-ink/40 text-sm col-span-2">Todavía no hay servicios cargados.</p>
              )}
            </div>
          </section>
        )}

        {step === 2 && selectedService && (
          <section>
            <button onClick={() => setStep(1)} className="flex text-xs text-ink/40 hover:text-ink mb-4 font-mono">
              ← Cambiar servicio
            </button>
            <h2 className="font-display text-xl text-ink mb-1">Elegí día y horario</h2>
            <p className="text-ink/50 text-sm mb-6">
              {selectedService.name} · {selectedService.duration} min · {formatMoney(selectedService.price)}
            </p>

            <label className="block text-xs uppercase tracking-wide text-ink/50 mb-2 font-mono">Fecha</label>
            <input
              type="date"
              min={minDate}
              max={maxDate}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-ink/20 rounded-md px-3 py-2 bg-paper-light font-body text-ink focus:outline-none focus:ring-2 focus:ring-brick/40"
            />

            {selectedDate && (
              <div className="mt-6">
                <label className="block text-xs uppercase tracking-wide text-ink/50 mb-2 font-mono">
                  Horarios disponibles
                </label>
                {loadingSlots && <p className="text-sm text-ink/40">Buscando horarios…</p>}
                {!loadingSlots && slots.length === 0 && (
                  <p className="text-sm text-ink/40">No hay horarios disponibles ese día. Probá otra fecha.</p>
                )}
                <div className="flex flex-wrap gap-5 ">
                  {slots.map((s) => (
                    <button
                      key={s.startTime}
                      onClick={() => setSelectedSlot(s)}
                      className={`font-mono text-sm px-3 py-2 rounded-md border transition-colors ${
                        selectedSlot?.startTime === s.startTime
                          ? 'bg-paper-light text-ink border-paper-light'
                          : 'border-ink/20 text-ink/70 hover:border-brick/50'
                      }`}
                    >
                      {s.startTime}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              disabled={!selectedSlot}
              onClick={() => setStep(3)}
              className="mt-8 bg-paper-light text-paper px-5 py-2.5 rounded-md font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-brick-rose transition-colors"
            >
              Continuar
            </button>
          </section>
        )}

        {step === 3 && selectedService && selectedSlot && (
          <section>
            <button onClick={() => setStep(2)} className="text-xs text-ink/40 hover:text-ink mb-4 font-mono">
              ← Cambiar horario
            </button>
            <h2 className="font-display text-xl text-ink mb-1">Tus datos</h2>
            <p className="text-ink/50 text-sm mb-6">
              {selectedService.name} · {selectedDate} · {selectedSlot.startTime} hs
            </p>

            <form onSubmit={handleConfirm} className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs uppercase tracking-wide text-ink/50 mb-1 font-mono">Nombre</label>
                <input
                  required
                  value={form.clientName}
                  onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                  className="w-full border border-paper-light/80 rounded-md px-3 py-2 bg-paper focus:outline-none focus:ring-2 focus:ring-brick/40"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-ink/50 mb-1 font-mono">Email</label>
                <input
                  required
                  type="email"
                  value={form.clientEmail}
                  onChange={(e) => setForm({ ...form, clientEmail: e.target.value })}
                  className="w-full border border-paper-light/80 rounded-md px-3 py-2 bg-paper focus:outline-none focus:ring-2 focus:ring-brick/40"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-ink/50 mb-1 font-mono">Teléfono</label>
                <input
                  required
                  value={form.clientPhone}
                  onChange={(e) => setForm({ ...form, clientPhone: e.target.value })}
                  className="w-full border border-paper-light/80 rounded-md px-3 py-2 bg-paper focus:outline-none focus:ring-2 focus:ring-brick/40"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-ink/50 mb-1 font-mono">
                  Notas (opcional)
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className="w-full border border-paper-light/80 rounded-md px-3 py-2 bg-paper focus:outline-none focus:ring-2 focus:ring-brick/40"
                />
              </div>

              {error && <p className="text-sm text-brick">{error}</p>}

              <button
                disabled={submitting}
                className="bg-paper-light text-paper px-5 py-2.5 rounded-md font-medium disabled:opacity-50 hover:bg-brick-rose transition-colors"
              >
                {submitting ? 'Confirmando…' : 'Confirmar reserva'}
              </button>
            </form>
          </section>
        )}

        {step === 4 && confirmed && (
          <section className="flex flex-col items-center py-6">
            <div className="ticket-stub bg-ink-soft text-paper rounded-lg w-full max-w-sm overflow-hidden">
              <div className="p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-paper font-mono">Turno confirmado</p>
                <h2 className="font-display text-2xl mt-2">{confirmed.serviceName}</h2>
                <div className="mt-4 space-y-1 font-mono text-sm text-paper">
                  <p>
                    {WEEKDAY_LABELS[weekdayFromDateString(confirmed.date)]} {confirmed.date}
                  </p>
                  <p>{confirmed.startTime} – {confirmed.endTime} hs</p>
                  <p>{formatMoney(confirmed.price)}</p>
                </div>
              </div>
              <div className="border-t border-dashed border-paper-light/30 px-6 py-3 flex items-center justify-between text-xs font-mono text-paper">
                <span>Reserva #{confirmed._id.slice(-6).toUpperCase()}</span>
                <span>{confirmed.clientName}</span>
              </div>
            </div>
            <p className="text-ink/70 text-sm mt-6 text-center max-w-sm">
              Te enviamos los detalles a {confirmed.clientEmail}. Si necesitás cancelar o cambiar el turno, contactá
              al negocio directamente.
            </p>
            <button onClick={restart} className="mt-6 text-brick text-sm font-medium hover:underline">
              Reservar otro turno
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
