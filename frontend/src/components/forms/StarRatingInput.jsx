import React from "react";
import { Star } from "lucide-react";

export default function StarRatingInput({
  value = 0,
  onChange,
  max = 5,
  disabled = false,
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: max }).map((_, i) => {
        const v = i + 1;
        const active = v <= value;

        return (
          <button
            key={v}
            type="button"
            disabled={disabled}
            onClick={() => onChange(v)}
            className={`p-1 rounded-lg transition-transform ${
              disabled ? "opacity-50" : "hover:scale-110"
            }`}
            aria-label={`${v} star`}
          >
            <Star
              className={`w-10 h-10 ${
                active
                  ? "text-yellow-500 fill-yellow-500"
                  : "text-slate-300"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}