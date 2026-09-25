import { useEffect, useState } from 'react';
import { DataTable } from '../components/DataTable';
import { formatDate } from '../utils/formatters';
import { api } from '../utils/api';

const emptyForm = {
  baseId: '',
  equipmentTypeId: '',
  assetName: '',
  assignedTo: '',
  quantity: '',
};

export function AssignmentsPage() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ bases: [], equipmentTypes: [] });
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    const [assignments, lookup] = await Promise.all([api.getAssignments(), api.getMeta()]);
    setRows(assignments.data || []);
    setMeta(lookup);
  };

  useEffect(() => {
    load().catch((loadError) => setError(loadError.message));
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    try {
      await api.createAssignment({ ...form, quantity: Number(form.quantity) });
      setForm(emptyForm);
      setMessage('Assignment recorded.');
      setError('');
      await load();
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  const columns = [
    { key: 'asset_name', label: 'Asset' },
    { key: 'assigned_to', label: 'Assigned To' },
    { key: 'base', label: 'Base' },
    { key: 'equipment_type', label: 'Equipment' },
    { key: 'quantity', label: 'Qty' },
    { key: 'status', label: 'Status' },
    { key: 'assigned_at', label: 'Date', render: (row) => formatDate(row.assigned_at) },
  ];

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow muted">Personnel Allocation</p>
          <h2>Assignments</h2>
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
        <input required placeholder="Assigned to" value={form.assignedTo} onChange={(event) => setForm((current) => ({ ...current, assignedTo: event.target.value }))} />
        <input required type="number" min="1" placeholder="Quantity" value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))} />
        <button type="submit">Assign Asset</button>
      </form>

      {message && <div className="success-banner">{message}</div>}
      {error && <div className="login-error">{error}</div>}
      <DataTable title="Assignments" rows={rows} columns={columns} />
    </>
  );
}
