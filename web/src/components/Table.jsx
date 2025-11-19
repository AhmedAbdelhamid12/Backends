import { useState, useMemo } from 'react';
import './Table.css';

const Table = ({ 
  columns = [], 
  data = [], 
  loading = false,
  emptyMessage = 'No data available',
  emptyIcon = '📋',
  onRowClick,
  sortable = true,
  pagination = true,
  pageSize = 10,
  striped = false,
  bordered = false,
  compact = false,
  variant = 'default'
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize, pagination]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (key) => {
    if (!sortable) return;
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const tableClasses = [
    'table',
    striped && 'table-striped',
    bordered && 'table-bordered',
    compact && 'table-compact',
    variant === 'large' && 'table-large'
  ].filter(Boolean).join(' ');

  if (loading) {
    return <div className="table-loading">Loading...</div>;
  }

  if (data.length === 0) {
    return (
      <div className="table-empty">
        <div className="table-empty-icon">{emptyIcon}</div>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className={tableClasses}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                onClick={() => column.sortable !== false && handleSort(column.key)}
                className={sortable && column.sortable !== false ? 'sortable' : ''}
                style={{ width: column.width }}
              >
                <div className="th-content">
                  {column.label}
                  {sortConfig.key === column.key && (
                    <span className="sort-icon">
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((row, idx) => (
            <tr
              key={row.id || row._id || idx}
              onClick={() => onRowClick && onRowClick(row)}
              className={onRowClick ? 'clickable' : ''}
            >
              {columns.map((column) => (
                <td key={column.key}>
                  {column.render
                    ? column.render(row[column.key], row)
                    : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {pagination && totalPages > 1 && (
        <div className="table-pagination">
          <div className="pagination-info">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} entries
          </div>
          
          <div className="pagination-controls">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              Previous
            </button>
            
            <div className="pagination-pages">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    disabled={page === currentPage}
                    className={`pagination-btn ${page === currentPage ? 'active' : ''}`}
                  >
                    {page}
                  </button>
                );
              })}
              {totalPages > 5 && <span>...</span>}
            </div>
            
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="pagination-btn"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Table;