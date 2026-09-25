import { useEffect, useState } from 'react';
import { DataTable } from '../components/DataTable';
import { formatDate } from '../utils/formatters';
import { api } from '../utils/api';

const emptyForm = {
  baseId: '',
  equipmentTypeId: '',
  assetName: '',
  quantity: '',
  expenditureDate: new Date().toISOString().slice(0, 10),
  notes: '',
};

export function ExpendituresPage() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ bases: [], equipmentTypes: [] });
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    const [expenditures, lookup] = await Promise.all([api.getExpenditures(), api.getMeta()]);
    setRows(expenditures.data || []);
    setMeta(lookup);
  };

  useEffect(() => {
    load().catch((loadError) => setError(loadError.message));
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    try {
      await api.createExpenditure({ ...form, quantity: Number(form.quantity) });
      setForm(emptyForm);
      setMessage('Expenditure recorded.');
      setError('');
      await load();
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  const columns = [
    { key: 'asset_name', label: 'Asset' },
    { key: 'quantity', label: 'Qty' },
    { key: 'base', label: 'Base' },
    { key: 'equipment_type', label: 'Type' },
    { key: 'expenditure_date', label: 'Date', render: (row) => formatDate(row.expenditure_date) },
    { key: 'notes', label: 'Notes' },
  ];

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow muted">Consumption Register</p>
          <h2>Expenditures</h2>
        </div>
      </header>

      <form className="entry-form" onSubmit={submit}>
        <select required value={form.baseId} onChange={(event) => setForm((current) => ({ ...current, baseId: event.target.value }))}>
          <option value="">Select base</option>
          {meta.bases.map((base) => <option key={base.id} value={base.id}>{base.name}</option>)}
        </select>
        <select required value={form.equipmentTypeId} onChange={(event) => setForm((current) => ({ ...current, equipmentTypeId: event.target.value }))}>
          <option value="">Equipment type</option>
          {meta.equipmentTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
        </select>
        <input required placeholder="Asset name" value={form.assetName} onChange={(event) => setForm((current) => ({ ...current, assetName: event.target.value }))} />
        <input required type="number" min="1" placeholder="Quantity" value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))} />
        <input required type="date" value={form.expenditureDate} onChange={(event) => setForm((current) => ({ ...current, expenditureDate: event.target.value }))} />
        <input placeholder="Notes" value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
        <button type="submit">Record Expenditure</button>
      </form>

      {message && <div className="success-banner">{message}</div>}
      {error && <div className="login-error">{error}</div>}
      <DataTable title="Expenditures" rows={rows} columns={columns} />
    </>
  );
}
