import { columnLabel, formatDuration, formatValue, statusText } from "../../utils/format.js";
import { RowActions } from "./RowActions.jsx";
import { ScrollTable } from "./ScrollTable.jsx";

const DATE_TIME_COLUMNS = new Set(["punch_in", "punch_out", "break_start", "break_end"]);
const DATE_COLUMNS = new Set(["createdAt", "created_at", "updatedAt"]);

function cellValue(row, column) {
  const value = row[column];
  if (column === "status") return statusText(value);
  if (column.endsWith("_seconds") && value !== undefined && value !== null && value !== "") return formatDuration(value);
  if (DATE_TIME_COLUMNS.has(column) && value) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
  }
  if (DATE_COLUMNS.has(column) && value) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
  }
  return formatValue(value);
}

// showActions = false hides the Action column (pages where this user has no buttons).
export function ResourceTable({ columns, records, columnLabels, fields, loading = false, activeSearch = "", startIndex = 0, showActions = true, ...actionProps }) {
  const emptyText = loading ? "Loading..." : activeSearch ? `No records match "${activeSearch}"` : "No records available";
  return (
    <ScrollTable>
      <table className="table table-scroll" data-columns={columns.length + (showActions ? 1 : 0)}>
        <thead>
          <tr><th>Sr No</th>{columns.map((column) => <th key={column}>{columnLabel(column, { columnLabels, fields })}</th>)}{showActions && <th>Action</th>}</tr>
        </thead>
        <tbody>
          {records.map((row, index) => (
            <tr key={row._id || row.id}>
              <td>{startIndex + index + 1}</td>
              {columns.map((column) => <td key={column}>{cellValue(row, column)}</td>)}
              {showActions && <td><RowActions row={row} {...actionProps} /></td>}
            </tr>
          ))}
          {records.length === 0 && <tr><td colSpan={columns.length + (showActions ? 2 : 1)} className="text-center py-4">{emptyText}</td></tr>}
        </tbody>
      </table>
    </ScrollTable>
  );
}
