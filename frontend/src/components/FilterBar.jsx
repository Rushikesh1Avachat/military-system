export function FilterBar({ filters, onChange, bases = [], equipmentTypes = [] }) {
  return (
    <section className="filter-panel">
      <div className="field">
        <label>Start Date</label>
        <input type="date" value={filters.startDate} onChange={(event) => onChange('startDate', event.target.value)} />
      </div>
      <div className="field">
        <label>End Date</label>
        <input type="date" value={filters.endDate} onChange={(event) => onChange('endDate', event.target.value)} />
      </div>
      <div className="field">
        <label>Base</label>
        <select value={filters.baseId} onChange={(event) => onChange('baseId', event.target.value)}>
          <option value="">All Bases</option>
          {bases.map((base) => (
            <option key={base.id} value={base.id}>{base.name}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Type</label>
        <select value={filters.equipmentTypeId} onChange={(event) => onChange('equipmentTypeId', event.target.value)}>
          <option value="">All Types</option>
          {equipmentTypes.map((type) => (
            <option key={type.id} value={type.id}>{type.name}</option>
          ))}
        </select>
      </div>
    </section>
  );
}
