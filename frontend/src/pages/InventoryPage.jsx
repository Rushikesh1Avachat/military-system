import { useEffect, useState } from 'react';
import { DataTable } from '../components/DataTable';
import { formatCurrency, formatDate } from '../utils/formatters';
import { api } from '../utils/api';

const emptyForm = {
  baseId: '',
  equipmentTypeId: '',
  quantity: '',
  unitCost: '',
  purchaseDate: new Date().toISOString().slice(0, 10),
  notes: '',
};

export function InventoryPage() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ bases: [], equipmentTypes: [] });
  const [form, setForm] = useState(emptyForm);
  const [filters, setFilters] = useState({ date: '', equipmentTypeId: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    const params = {};
    if (filters.date) params.date = filters.date;
    if (filters.equipmentTypeId) params.equipmentTypeId = filters.equipmentTypeId;
    const [purchases, lookup] = await Promise.all([api.getPurchases(params), api.getMeta()]);
    setRows(purchases.data || []);
    setMeta(lookup);
  };

  useEffect(() => {
    load().catch((loadError) => setError(loadError.message));
  }, [filters.date, filters.equipmentTypeId]);

  const submit = async (event) => {
    event.preventDefault();
    try {
      await api.createPurchase({
        ...form,
        quantity: Number(form.quantity),
        unitCost: Number(form.unitCost || 0),
      });
      setForm(emptyForm);
      setMessage('Purchase recorded.');
      setError('');
      await load();
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  const columns = [
    { key: 'purchase_date', label: 'Date', render: (row) => formatDate(row.purchase_date) },
    { key: 'base', label: 'Base' },
    { key: 'equipment_type', label: 'Type' },
    { key: 'quantity', label: 'Qty' },
    { key: 'unit_cost', label: 'Amount', render: (row) => formatCurrency(row.unit_cost || 0) },
    { key: 'notes', label: 'Notes' },
  ];

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow muted">Logistics Ledger</p>
          <h2>Purchases</h2>
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
        <input required type="number" min="1" placeholder="Quantity" value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))} />
        <input type="number" min="0" placeholder="Unit cost" value={form.unitCost} onChange={(event) => setForm((current) => ({ ...current, unitCost: event.target.value }))} />
        <input required type="date" value={form.purchaseDate} onChange={(event) => setForm((current) => ({ ...current, purchaseDate: event.target.value }))} />
        <input placeholder="Notes" value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
        <button type="submit">Record Purchase</button>
      </form>

      <div className="filter-panel compact">
        <div className="field">
          <label>Date</label>
          <input type="date" value={filters.date} onChange={(event) => setFilters((current) => ({ ...current, date: event.target.value }))} />
        </div>
        <div className="field">
          <label>Equipment Type</label>
          <select value={filters.equipmentTypeId} onChange={(event) => setFilters((current) => ({ ...current, equipmentTypeId: event.target.value }))}>
            <option value="">All Types</option>
            {meta.equipmentTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
          </select>
        </div>
      </div>

      {message && <div className="success-banner">{message}</div>}
      {error && <div className="login-error">{error}</div>}
      <DataTable title="Purchase Register" rows={rows} columns={columns} />
    </>
  );
}
