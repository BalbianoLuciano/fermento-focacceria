"use client";

import { useCallback, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const DAY_LABELS = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

interface CalendarProps {
  value?: string;
  onChange: (iso: string) => void;
  isDayDisabled?: (date: Date) => boolean;
  minDate?: Date;
  className?: string;
}

export function Calendar({
  value,
  onChange,
  isDayDisabled,
  minDate,
  className,
}: CalendarProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [viewYear, setViewYear] = useState(() => {
    if (value) {
      const y = Number(value.slice(0, 4));
      if (y) return y;
    }
    return today.getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    if (value) {
      const m = Number(value.slice(5, 7));
      if (m) return m - 1;
    }
    return today.getMonth();
  });

  const totalDays = daysInMonth(viewYear, viewMonth);
  const firstDow = new Date(viewYear, viewMonth, 1).getDay();

  const effectiveMin = useMemo(() => {
    if (minDate) return minDate;
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return d;
  }, [minDate, today]);

  const canGoPrev =
    viewYear > effectiveMin.getFullYear() ||
    (viewYear === effectiveMin.getFullYear() &&
      viewMonth > effectiveMin.getMonth());

  const prevMonth = useCallback(() => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }, [viewMonth]);

  const nextMonth = useCallback(() => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }, [viewMonth]);

  const cells = useMemo(() => {
    const result: Array<{
      day: number;
      iso: string;
      disabled: boolean;
      selected: boolean;
      isToday: boolean;
    } | null> = [];

    for (let i = 0; i < firstDow; i++) result.push(null);

    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(viewYear, viewMonth, d);
      const iso = toISO(date);
      const isPast = date < effectiveMin;
      const isExternal = isDayDisabled ? isDayDisabled(date) : false;
      result.push({
        day: d,
        iso,
        disabled: isPast || isExternal,
        selected: value === iso,
        isToday: iso === toISO(today),
      });
    }

    return result;
  }, [viewYear, viewMonth, totalDays, firstDow, effectiveMin, isDayDisabled, value, today]);

  const monthLabel = new Date(viewYear, viewMonth).toLocaleString("es-AR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={prevMonth}
          disabled={!canGoPrev}
          className="flex h-8 w-8 items-center justify-center rounded-full text-brown-600 transition-colors hover:bg-muted disabled:opacity-30"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium capitalize text-brown-900">
          {monthLabel}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="flex h-8 w-8 items-center justify-center rounded-full text-brown-600 transition-colors hover:bg-muted"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 justify-items-center gap-y-1 text-center text-xs">
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            className="flex h-9 w-9 items-center justify-center font-medium text-brown-500"
          >
            {label}
          </div>
        ))}
        {cells.map((cell, i) =>
          cell === null ? (
            <div key={`blank-${i}`} className="h-9 w-9" />
          ) : (
            <button
              key={cell.day}
              type="button"
              disabled={cell.disabled}
              onClick={() => onChange(cell.selected ? "" : cell.iso)}
              className={cn(
                "relative flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors",
                cell.selected
                  ? "bg-brown-900 font-semibold text-background"
                  : cell.disabled
                    ? "cursor-not-allowed text-brown-300"
                    : "text-brown-700 hover:bg-brown-100",
                cell.isToday && !cell.selected && "font-bold",
              )}
            >
              {cell.day}
              {cell.isToday && !cell.selected && (
                <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-brown-500" />
              )}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
