export function DataTable({ title, rows, columns, emptyMessage = 'No records available.' }) {
  return (
    <div className="panel">
      <div className="panel-header">
        <h3>{title}</h3>
        <span>{rows.length} records</span>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="empty-cell">{emptyMessage}</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id ?? `${title}-${row.base}-${row.asset}`}>
                  {columns.map((column) => (
                    <td key={`${row.id ?? title}-${column.key}`}>{column.render ? column.render(row) : row[column.key]}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
