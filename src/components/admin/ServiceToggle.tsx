"use client";

import { useEffect, useState } from "react";
import { Power } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { getSettings, updateSettings } from "@/lib/firebase/settings";
import { cn } from "@/lib/utils";

const DEFAULT_CLOSED_MSG =
  "Semana de parciales — el horno descansa unos días. Los esperamos pronto con la masa lista.";

export function ServiceToggle() {
  const [open, setOpen] = useState(true);
  const [message, setMessage] = useState(DEFAULT_CLOSED_MSG);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await getSettings();
        if (!cancelled) {
          setOpen(s?.serviceOpen !== false);
          if (s?.closedMessage) setMessage(s.closedMessage);
        }
      } catch {
        console.error("[service-toggle] load failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleToggle = async (checked: boolean) => {
    setToggling(true);
    try {
      await updateSettings({ serviceOpen: checked, closedMessage: message });
      setOpen(checked);
      toast.success(
        checked
          ? "Horno abierto — los clientes ya pueden pedir"
          : "Servicio pausado — la web muestra el cartel",
      );
    } catch {
      toast.error("No pudimos cambiar el estado");
    } finally {
      setToggling(false);
    }
  };

  const handleMessageBlur = async () => {
    try {
      await updateSettings({ closedMessage: message });
      toast.success("Mensaje actualizado");
    } catch {
      toast.error("No pudimos guardar el mensaje");
    }
  };

  if (loading) {
    return <div className="h-20 animate-pulse rounded-2xl bg-card/70" />;
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl border p-5 shadow-sm transition-colors",
        open ? "border-success/30 bg-success/5" : "border-warning/30 bg-warning/5",
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
              open ? "bg-success/15 text-success" : "bg-warning/15 text-warning",
            )}
          >
            <Power className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-brown-900">
              {open ? "El horno está abierto" : "El horno está pausado"}
            </p>
            <p className="text-xs text-brown-500">
              {open
                ? "Los clientes pueden hacer pedidos"
                : "La web muestra que estás de pausa"}
            </p>
          </div>
        </div>
        <Switch checked={open} onCheckedChange={handleToggle} disabled={toggling} />
      </div>

      {!open && (
        <div className="flex flex-col gap-2 border-t border-border/60 pt-4">
          <label htmlFor="closed-msg" className="text-xs font-medium text-brown-700">
            Mensaje que ven los clientes
          </label>
          <Textarea
            id="closed-msg"
            rows={2}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onBlur={handleMessageBlur}
            className="text-sm"
          />
        </div>
      )}
    </div>
  );
}
