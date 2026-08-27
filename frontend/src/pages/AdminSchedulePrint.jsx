import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import StatusBadge from '../components/StatusBadge';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatMoney(n) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);
}

export default function AdminSchedulePrint() {
  const [searchParams, setSearchParams] = useSearchParams();
  const date = searchParams.get('date') || todayStr();

  const [config, setConfig] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    api.get('/config').then((res) => setConfig(res.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    setFeedback('');
    api
      .get('/appointments', { params: { from: date, to: date } })
      .then((res) => setAppointments(res.data))
      .finally(() => setLoading(false));
  }, [date]);

  const activos = appointments.filter((a) => a.status !== 'cancelled');
  const total = activos.reduce((sum, a) => sum + a.price, 0);

  const sendWhatsapp = async () => {
    setSending(true);
    setFeedback('');
    try {
      await api.post('/appointments/schedule/whatsapp', { date });
      setFeedback('✓ Cronograma enviado por WhatsApp');
    } catch (err) {
      setFeedback(err.response?.data?.message || 'No se pudo enviar el WhatsApp');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto print:max-w-none">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6 print:hidden">
        <div>
          <h2 className="font-display text-2xl text-ink">Cronograma del día</h2>
          <p className="text-ink/50 text-sm mt-1">Imprimí, guardá como PDF o enviala por WhatsApp.</p>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setSearchParams({ date: e.target.value })}
          className="border border-ink/20 rounded-md px-3 py-2 bg-paper-light focus:outline-none focus:ring-2 focus:ring-brick/40"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6 print:hidden">
        <button
          onClick={() => window.print()}
          className="bg-ink text-paper-light px-4 py-2 rounded-md text-sm font-medium hover:bg-ink-soft transition-colors"
        >
          Imprimir / Guardar como PDF
        </button>
        <button
          onClick={sendWhatsapp}
          disabled={sending}
          className="bg-forest text-paper-light px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {sending ? 'Enviando…' : 'Enviar por WhatsApp'}
        </button>
        {feedback && <span className="text-sm text-ink/60">{feedback}</span>}
      </div>

      {/* Este encabezado solo se ve al imprimir */}
      <div className="hidden print:block mb-6">
        <h1 className="font-display text-2xl text-black">{config?.businessName}</h1>
        <p className="text-sm text-black/60">Cronograma — {date}</p>
      </div>

      {loading && <p className="text-ink/40 text-sm print:hidden">Cargando…</p>}

      {!loading && appointments.length === 0 && (
        <p className="text-ink/40 border border-dashed border-ink/20 rounded-lg py-12 text-center print:border-black/20 print:text-black/50">
          No hay turnos agendados para este día.
        </p>
      )}

      <div className="divide-y divide-ink/10 print:divide-black/15">
        {appointments.map((a) => (
          <div key={a._id} className="flex items-center justify-between py-3">
            <div className="flex items-center gap-4">
              <span className="font-mono w-16 text-ink print:text-black">{a.startTime}</span>
              <div>
                <p className="font-medium text-ink print:text-black">{a.clientName}</p>
                <p className="text-sm text-ink/50 print:text-black/60">
                  {a.serviceName} · {a.clientPhone}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm text-ink/60 print:text-black/70">{formatMoney(a.price)}</span>
              <span className="print:hidden">
                <StatusBadge status={a.status} />
              </span>
              <span className="hidden print:inline text-xs text-black/50">
                {a.status === 'cancelled' ? '(cancelado)' : ''}
              </span>
            </div>
          </div>
        ))}
      </div>

      {appointments.length > 0 && (
        <div className="flex justify-end mt-4 pt-4 border-t border-ink/20 print:border-black/30 font-mono text-ink print:text-black">
          Total estimado: {formatMoney(total)}
        </div>
      )}
    </div>
  );
}
