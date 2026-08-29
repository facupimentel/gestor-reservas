import { useEffect, useState } from 'react';
import api from '../api/axios';

const DAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function AdminSettings() {
  const [config, setConfig] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newClosedDate, setNewClosedDate] = useState('');

  useEffect(() => {
    api.get('/config').then((res) => setConfig(res.data));
  }, []);

  if (!config) return <p className="text-ink/40 text-sm">Cargando…</p>;

  const updateDay = (day, changes) => {
    setConfig({
      ...config,
      weeklySchedule: config.weeklySchedule.map((d) => (d.day === day ? { ...d, ...changes } : d)),
    });
  };

  const addClosedDate = () => {
    if (!newClosedDate || config.closedDates.includes(newClosedDate)) return;
    setConfig({ ...config, closedDates: [...config.closedDates, newClosedDate].sort() });
    setNewClosedDate('');
  };

  const removeClosedDate = (d) => {
    setConfig({ ...config, closedDates: config.closedDates.filter((x) => x !== d) });
  };

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await api.put('/config', config);
      setConfig(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h2 className="font-display text-2xl text-ink mb-6">Horarios y configuración</h2>

      <div className="bg-paper-light border border-ink/10 rounded-lg p-5 mb-6">
        <label className="block text-xs uppercase tracking-wide text-ink/50 mb-1 font-mono">
          Nombre del negocio
        </label>
        <input
          value={config.businessName}
          onChange={(e) => setConfig({ ...config, businessName: e.target.value })}
          className="w-full border border-ink/20 rounded-md px-3 py-2 bg-white mb-4"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs uppercase tracking-wide text-ink/50 mb-1 font-mono">
              Duración de grilla (min)
            </label>
            <input
              type="number"
              min={5}
              value={config.slotDuration}
              onChange={(e) => setConfig({ ...config, slotDuration: Number(e.target.value) })}
              className="w-full border border-ink/20 rounded-md px-3 py-2 bg-white"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-ink/50 mb-1 font-mono">
              Colchón entre turnos (min)
            </label>
            <input
              type="number"
              min={0}
              value={config.bufferBetweenAppointments}
              onChange={(e) => setConfig({ ...config, bufferBetweenAppointments: Number(e.target.value) })}
              className="w-full border border-ink/20 rounded-md px-3 py-2 bg-white"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-ink/50 mb-1 font-mono">
              Reserva con anticipación máx. (días)
            </label>
            <input
              type="number"
              min={1}
              value={config.advanceBookingDays}
              onChange={(e) => setConfig({ ...config, advanceBookingDays: Number(e.target.value) })}
              className="w-full border border-ink/20 rounded-md px-3 py-2 bg-white"
            />
          </div>
        </div>
      </div>

      <div className="bg-paper-light border border-ink/10 rounded-lg p-5 mb-6">
        <h3 className="font-display text-ink mb-4">Días y horarios de atención</h3>
        <div className="space-y-3">
          {config.weeklySchedule
            .slice()
            .sort((a, b) => a.day - b.day)
            .map((d) => (
              <div key={d.day} className="flex flex-wrap items-center gap-3 sm:gap-4">
                <label className="flex items-center gap-2 w-28 sm:w-32 shrink-0">
                  <input
                    type="checkbox"
                    checked={d.isOpen}
                    onChange={(e) => updateDay(d.day, { isOpen: e.target.checked })}
                  />
                  <span className="text-sm text-ink">{DAY_LABELS[d.day]}</span>
                </label>
                <input
                  type="time"
                  disabled={!d.isOpen}
                  value={d.startTime}
                  onChange={(e) => updateDay(d.day, { startTime: e.target.value })}
                  className="border border-ink/20 rounded-md px-2 py-1 bg-white disabled:opacity-30 text-sm"
                />
                <span className="text-ink/40 text-sm">a</span>
                <input
                  type="time"
                  disabled={!d.isOpen}
                  value={d.endTime}
                  onChange={(e) => updateDay(d.day, { endTime: e.target.value })}
                  className="border border-ink/20 rounded-md px-2 py-1 bg-white disabled:opacity-30 text-sm"
                />
              </div>
            ))}
        </div>
      </div>

      <div className="bg-paper-light border border-ink/10 rounded-lg p-5 mb-6">
        <h3 className="font-display text-ink mb-4">Fechas cerradas (feriados, vacaciones)</h3>
        <div className="flex gap-2 mb-4">
          <input
            type="date"
            value={newClosedDate}
            onChange={(e) => setNewClosedDate(e.target.value)}
            className="border border-ink/20 rounded-md px-3 py-2 bg-white text-sm"
          />
          <button
            onClick={addClosedDate}
            className="px-3 py-2 rounded-md border border-ink/20 text-sm text-ink/70 hover:bg-ink/5"
          >
            Agregar
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {config.closedDates.map((d) => (
            <span
              key={d}
              className="inline-flex items-center gap-2 bg-brick/10 text-brick text-xs px-2.5 py-1.5 rounded-full font-mono"
            >
              {d}
              <button onClick={() => removeClosedDate(d)} className="hover:text-brick-dark">
                ×
              </button>
            </span>
          ))}
          {config.closedDates.length === 0 && (
            <p className="text-ink/40 text-sm">No hay fechas cerradas cargadas.</p>
          )}
        </div>
      </div>

      <div className="bg-paper-light border border-ink/10 rounded-lg p-5 mb-6">
        <h3 className="font-display text-ink mb-1">Notificaciones por WhatsApp</h3>
        <p className="text-sm text-ink/50 mb-4">
          Requiere tener configuradas las credenciales de Twilio en el servidor (ver README).
        </p>

        <label className="block text-xs uppercase tracking-wide text-ink/50 mb-1 font-mono">
          WhatsApp del negocio (recibe avisos de nuevas reservas y el cronograma del día)
        </label>
        <input
          placeholder="+549 381 000 0000"
          value={config.adminWhatsapp}
          onChange={(e) => setConfig({ ...config, adminWhatsapp: e.target.value })}
          className="w-full border border-ink/20 rounded-md px-3 py-2 bg-white mb-4"
        />

        <label className="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            checked={config.sendClientWhatsapp}
            onChange={(e) => setConfig({ ...config, sendClientWhatsapp: e.target.checked })}
          />
          <span className="text-sm text-ink">Enviar confirmación por WhatsApp al cliente</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.sendAdminWhatsapp}
            onChange={(e) => setConfig({ ...config, sendAdminWhatsapp: e.target.checked })}
          />
          <span className="text-sm text-ink">Avisarme por WhatsApp cada nueva reserva</span>
        </label>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="bg-brick text-paper-light px-5 py-2.5 rounded-md font-medium hover:bg-brick-dark transition-colors disabled:opacity-50"
      >
        {saving ? 'Guardando…' : saved ? 'Guardado ✓' : 'Guardar cambios'}
      </button>
    </div>
  );
}
