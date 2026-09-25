import { useEffect, useState } from 'react';
import { DataTable } from '../components/DataTable';
import { formatDate } from '../utils/formatters';
import { api } from '../utils/api';

const emptyForm = {
  fromBaseId: '',
  toBaseId: '',
  equipmentTypeId: '',
  quantity: '',
  transferDate: new Date().toISOString().slice(0, 10),
  notes: '',
};

export function TransfersPage() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ bases: [], equipmentTypes: [] });
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    const [transfers, lookup] = await Promise.all([api.getTransfers(), api.getMeta()]);
    setRows(transfers.data || []);
    setMeta(lookup);
  };

  useEffect(() => {
    load().catch((loadError) => setError(loadError.message));
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    try {
      await api.createTransfer({ ...form, quantity: Number(form.quantity) });
      setForm(emptyForm);
      setMessage('Transfer recorded.');
      setError('');
      await load();
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  const columns = [
    { key: 'transfer_date', label: 'Date', render: (row) => formatDate(row.transfer_date) },
    { key: 'from_base', label: 'From' },
    { key: 'to_base', label: 'To' },
    { key: 'equipment_type', label: 'Type' },
    { key: 'quantity', label: 'Qty' },
    { key: 'notes', label: 'Notes' },
  ];

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow muted">Movement Register</p>
          <h2>Transfers</h2>
        </div>
      </header>

      <form className="entry-form" onSubmit={submit}>
        <select required value={form.fromBaseId} onChange={(event) => setForm((current) => ({ ...current, fromBaseId: event.target.value }))}>
          <option value="">From base</option>
          {meta.bases.map((base) => <option key={base.id} value={base.id}>{base.name}</option>)}
        </select>
        <select required value={form.toBaseId} onChange={(event) => setForm((current) => ({ ...current, toBaseId: event.target.value }))}>
          <option value="">To base</option>
          {meta.bases.map((base) => <option key={base.id} value={base.id}>{base.name}</option>)}
        </select>
        <select required value={form.equipmentTypeId} onChange={(event) => setForm((current) => ({ ...current, equipmentTypeId: event.target.value }))}>
          <option value="">Equipment type</option>
          {meta.equipmentTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
        </select>
        <input required type="number" min="1" placeholder="Quantity" value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))} />
        <input required type="date" value={form.transferDate} onChange={(event) => setForm((current) => ({ ...current, transferDate: event.target.value }))} />
        <input placeholder="Notes" value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
        <button type="submit">Record Transfer</button>
      </form>

      {message && <div className="success-banner">{message}</div>}
      {error && <div className="login-error">{error}</div>}
      <DataTable title="Transfer History" rows={rows} columns={columns} />
    </>
  );
}
