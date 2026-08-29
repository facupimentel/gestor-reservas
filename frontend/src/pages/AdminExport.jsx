import { useState } from 'react';
import api from '../api/axios';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function firstOfMonthStr() {
  const d = new Date();
  d.setDate(1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function AdminExport() {
  const [from, setFrom] = useState(firstOfMonthStr());
  const [to, setTo] = useState(todayStr());
  const [status, setStatus] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  const download = async () => {
    setDownloading(true);
    setError('');
    try {
      const res = await api.get('/appointments/export', {
        params: { from, to, status: status || undefined },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `turnos_${from}_a_${to}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('No se pudo generar el archivo. Probá de nuevo.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-lg">
      <h2 className="font-display text-2xl text-ink mb-1">Exportar historial</h2>
      <p className="text-ink/50 text-sm mb-6">
        Descargá un CSV con todos los turnos del rango que elijas. Se abre directo en Excel o Google Sheets.
      </p>

      <div className="bg-paper-light border border-ink/10 rounded-lg p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs uppercase tracking-wide text-ink/50 mb-1 font-mono">Desde</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full border border-ink/20 rounded-md px-3 py-2 bg-white"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-ink/50 mb-1 font-mono">Hasta</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full border border-ink/20 rounded-md px-3 py-2 bg-white"
            />
          </div>
        </div>

        <label className="block text-xs uppercase tracking-wide text-ink/50 mb-1 font-mono">Estado (opcional)</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full border border-ink/20 rounded-md px-3 py-2 bg-white mb-4"
        >
          <option value="">Todos</option>
          <option value="pending">Pendiente</option>
          <option value="confirmed">Confirmado</option>
          <option value="completed">Completado</option>
          <option value="cancelled">Cancelado</option>
        </select>

        {error && <p className="text-sm text-brick mb-3">{error}</p>}

        <button
          onClick={download}
          disabled={downloading}
          className="w-full sm:w-auto bg-brick text-paper-light px-4 py-2.5 rounded-md text-sm font-medium hover:bg-brick-dark transition-colors disabled:opacity-50"
        >
          {downloading ? 'Generando…' : 'Descargar CSV'}
        </button>
      </div>
    </div>
  );
}
