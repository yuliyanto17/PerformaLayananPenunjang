import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ page, totalPages, onChange }) {
  if (!totalPages || totalPages <= 1) return null;

  const go = (p) => {
    if (p < 1 || p > totalPages) return;
    onChange(p);
  };

  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);

  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="text-xs text-slate-600">
        Page <b>{page}</b> of <b>{totalPages}</b>
      </div>

      <div className="flex items-center gap-2">
        <button className="btn btn-secondary" onClick={() => go(page - 1)} disabled={page === 1}>
          <ChevronLeft className="w-4 h-4" /> Prev
        </button>

        {start > 1 && (
          <>
            <button className="btn btn-secondary" onClick={() => go(1)}>1</button>
            <span className="text-slate-400">...</span>
          </>
        )}

        {pages.map((p) => (
          <button
            key={p}
            className={`btn ${p === page ? "btn-primary" : "btn-secondary"}`}
            onClick={() => go(p)}
          >
            {p}
          </button>
        ))}

        {end < totalPages && (
          <>
            <span className="text-slate-400">...</span>
            <button className="btn btn-secondary" onClick={() => go(totalPages)}>{totalPages}</button>
          </>
        )}

        <button className="btn btn-secondary" onClick={() => go(page + 1)} disabled={page === totalPages}>
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}