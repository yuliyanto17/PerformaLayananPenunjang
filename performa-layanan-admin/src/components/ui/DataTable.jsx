import React from "react";

export default function DataTable({ columns, rows, loading }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden w-full">
      <div className="overflow-x-auto">
        {/* Tambahkan min-w-full dan table-auto */}
        <table className="w-full min-w-full text-left border-collapse table-auto">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="text-left font-bold px-4 py-3 whitespace-nowrap">
                  {c.title}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <tr key={idx} className="border-t">
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3">
                      <div className="h-4 w-full bg-slate-200 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr className="border-t">
                <td className="px-4 py-10 text-center text-slate-600" colSpan={columns.length}>
                  Tidak ada data.
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr key={idx} className="border-t hover:bg-slate-50 transition-colors">
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3 whitespace-nowrap">
                      {c.render ? c.render(row) : row[c.key]}
                    </td>
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