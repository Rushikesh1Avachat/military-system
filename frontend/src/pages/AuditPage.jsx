import { useEffect, useState } from 'react';
import { DataTable } from '../components/DataTable';
import { formatDate } from '../utils/formatters';
import { api } from '../utils/api';

export function AuditPage() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getAuditLogs()
      .then((result) => setRows(result.data || []))
      .catch((loadError) => setError(loadError.message));
  }, []);

  const columns = [
    { key: 'created_at', label: 'Time', render: (row) => formatDate(row.created_at) },
    { key: 'table_name', label: 'Table' },
    { key: 'action', label: 'Action' },
    { key: 'actor_role', label: 'Role' },
    { key: 'details', label: 'Details', render: (row) => JSON.stringify(row.details || {}) },
  ];

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow muted">Accountability</p>
          <h2>Audit Logs</h2>
        </div>
      </header>
      {error && <div className="login-error">{error}</div>}
      <DataTable title="Transaction Audit Trail" rows={rows} columns={columns} />
    </>
  );
}
