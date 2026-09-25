import { useEffect, useMemo, useState } from 'react';
import { ArrowRightLeft, Boxes, FileText, Gauge, PackageCheck, RefreshCw, ShieldCheck, Swords, UserCog, X } from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { FilterBar } from '../components/FilterBar';
import { DataTable } from '../components/DataTable';
import { formatCurrency, formatDate, formatNumber } from '../utils/formatters';
import { api } from '../utils/api';

function defaultRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 30);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    baseId: '',
    equipmentTypeId: '',
  };
}

export function DashboardPage() {
  const [filters, setFilters] = useState(defaultRange);
  const [meta, setMeta] = useState({ bases: [], equipmentTypes: [] });
  const [dashboard, setDashboard] = useState(null);
  const [showNetMovement, setShowNetMovement] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.baseId) params.baseId = filters.baseId;
      if (filters.equipmentTypeId) params.equipmentTypeId = filters.equipmentTypeId;
      const [metaResult, data] = await Promise.all([api.getMeta(), api.getDashboard(params)]);
      setMeta(metaResult);
      setDashboard(data);
      setError('');
    } catch (loadError) {
      setError(loadError.message);
    }
  };

  useEffect(() => {
    load();
  }, [filters.startDate, filters.endDate, filters.baseId, filters.equipmentTypeId]);

  const metrics = dashboard?.metrics || {};
  const maxBar = Math.max(metrics.openingBalance || 0, Math.abs(metrics.netMovement || 0), metrics.closingBalance || 0, 1);

  const summaryCards = useMemo(() => ([
    { label: 'Opening Balance', value: formatNumber(metrics.openingBalance), icon: ShieldCheck, tone: 'blue' },
    { label: 'Current Balance', value: formatNumber(metrics.currentBalance), icon: PackageCheck, tone: 'green' },
    { label: 'Net Movement', value: formatNumber(metrics.netMovement), icon: ArrowRightLeft, tone: 'amber', onClick: () => setShowNetMovement(true), hint: 'Purchases + In − Out' },
    { label: 'Assigned', value: formatNumber(metrics.assigned), icon: UserCog, tone: 'purple' },
    { label: 'Expended', value: formatNumber(metrics.expended), icon: FileText, tone: 'rose' },
    { label: 'Closing Balance', value: formatNumber(metrics.closingBalance), icon: Boxes, tone: 'blue' },
  ]), [metrics]);

  const purchaseColumns = [
    { key: 'purchase_date', label: 'Date', render: (row) => formatDate(row.purchase_date) },
    { key: 'base', label: 'Base' },
    { key: 'equipment_type', label: 'Type' },
    { key: 'quantity', label: 'Qty' },
    { key: 'unit_cost', label: 'Amount', render: (row) => formatCurrency(row.unit_cost || 0) },
  ];

  const transferColumns = [
    { key: 'transfer_date', label: 'Date', render: (row) => formatDate(row.transfer_date) },
    { key: 'from_base', label: 'From' },
    { key: 'to_base', label: 'To' },
    { key: 'equipment_type', label: 'Type' },
    { key: 'quantity', label: 'Qty' },
  ];

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow muted">Command Overview</p>
          <h2>Dashboard</h2>
          <p className="page-copy">Real-time balances, deployments, and logistics movements oversight.</p>
        </div>
        <button type="button" className="ghost-button" onClick={load}>
          <RefreshCw size={16} /> Refresh Feed
        </button>
      </header>

      <section className="mission-banner">
        <div className="mission-copy">
          <span className="eyebrow">Operations Center</span>
          <h3>Mission Readiness & Weapon Logistics</h3>
          <p>Tracking arsenal readiness, equipment movement, and field deployment across active bases.</p>
        </div>
        <div className="mission-status">
          <div className="mission-pill"><Gauge size={16} /> Readiness 94%</div>
          <div className="mission-pill gold"><Swords size={16} /> Active deployment</div>
        </div>
      </section>

      <FilterBar
        filters={filters}
        onChange={(key, value) => setFilters((current) => ({ ...current, [key]: value }))}
        bases={meta.bases}
        equipmentTypes={meta.equipmentTypes}
      />

      {error && <div className="login-error">{error}</div>}

      <section className="cards-grid six">
        {summaryCards.map(({ label, value, icon, tone, onClick, hint }) => (
          <MetricCard key={label} label={label} value={value} icon={icon} tone={tone} onClick={onClick} hint={hint} />
        ))}
      </section>

      <section className="panel chart-panel">
        <div className="panel-header">
          <div>
            <h3>Tactical Movement Chart</h3>
            <p className="page-copy">Visual snapshot of balances and net movement for the selected filter window.</p>
          </div>
        </div>
        <div className="chart-bars">
          <div className="chart-col">
            <div className="bar opening" style={{ height: `${Math.max((metrics.openingBalance || 0) / maxBar * 160, 8)}px` }} />
            <span>Opening</span>
          </div>
          <div className="chart-col">
            <div className={`bar net ${(metrics.netMovement || 0) >= 0 ? 'up' : 'down'}`} style={{ height: `${Math.max(Math.abs(metrics.netMovement || 0) / maxBar * 160, 8)}px` }} />
            <span>Net {metrics.netMovement >= 0 ? '+' : ''}{formatNumber(metrics.netMovement)}</span>
          </div>
          <div className="chart-col">
            <div className="bar closing" style={{ height: `${Math.max((metrics.closingBalance || 0) / maxBar * 160, 8)}px` }} />
            <span>Closing</span>
          </div>
        </div>
        <p className="chart-note">Net Movement is computed server-side as Purchases + Transfers In − Transfers Out.</p>
      </section>

      <section className="content-grid">
        <DataTable title="Recent Purchases" rows={dashboard?.recentPurchases || []} columns={purchaseColumns} />
        <DataTable title="Recent Transfers" rows={dashboard?.recentTransfers || []} columns={transferColumns} />
      </section>

      {showNetMovement && (
        <div className="modal-backdrop" onClick={() => setShowNetMovement(false)}>
          <div className="modal wide" onClick={(event) => event.stopPropagation()}>
            <div className="panel-header">
              <div>
                <h3>Net Movement Breakdown</h3>
                <p className="page-copy">Purchases {formatNumber(metrics.purchases)} + Transfer In {formatNumber(metrics.transferIn)} − Transfer Out {formatNumber(metrics.transferOut)}</p>
              </div>
              <button type="button" className="close-btn" onClick={() => setShowNetMovement(false)}><X size={16} /></button>
            </div>
            <div className="net-grid">
              <DataTable title="Purchases" rows={dashboard?.netMovementDetails?.purchases || []} columns={purchaseColumns} />
              <DataTable title="Transfer In" rows={dashboard?.netMovementDetails?.transferIn || []} columns={transferColumns} />
              <DataTable title="Transfer Out" rows={dashboard?.netMovementDetails?.transferOut || []} columns={transferColumns} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
