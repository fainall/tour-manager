"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet, Plus, Fuel, Car, Wrench, CircleDollarSign,
  UtensilsCrossed, ParkingCircle, HelpCircle, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { EXPENSE_CATEGORY_LABELS } from "@/lib/constants";
import type { ExpenseCategory, UserRole } from "@/generated/prisma/client";

type ExpenseData = {
  id: string;
  tourName: string;
  departureDate: string;
  departureTime: string;
  category: ExpenseCategory;
  description: string | null;
  amount: string;
  paidToName: string | null;
  createdAt: string;
};

type TourOption = { id: string; name: string };
type StaffOption = { id: string; firstName: string; lastName: string; role: string };

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  FUEL: Fuel,
  TOLLS: Car,
  MAINTENANCE: Wrench,
  DRIVER_PAY: CircleDollarSign,
  GUIDE_PAY: CircleDollarSign,
  MEALS: UtensilsCrossed,
  PARKING: ParkingCircle,
  OTHER: HelpCircle,
};

const CATEGORY_COLORS: Record<string, string> = {
  FUEL: "text-amber-500",
  TOLLS: "text-blue-500",
  MAINTENANCE: "text-red-500",
  DRIVER_PAY: "text-emerald-500",
  GUIDE_PAY: "text-emerald-500",
  MEALS: "text-orange-500",
  PARKING: "text-indigo-500",
  OTHER: "text-warm-400",
};

export function ExpensesClient({
  initialExpenses,
  tours,
  staff,
  userRole,
}: {
  initialExpenses: ExpenseData[];
  tours: TourOption[];
  staff: StaffOption[];
  userRole: UserRole;
}) {
  const router = useRouter();
  const [expenses] = useState(initialExpenses);
  const [createModal, setCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    tourId: "",
    departureDate: "",
    departureTime: "07:00",
    category: "" as string,
    description: "",
    amount: "",
    paidToId: "",
  });

  const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  const byCategory: Record<string, number> = {};
  for (const e of expenses) {
    byCategory[e.category] = (byCategory[e.category] || 0) + parseFloat(e.amount);
  }

  async function createExpense() {
    if (!formData.tourId || !formData.departureDate || !formData.category || !formData.amount) {
      setError("Completa los campos obligatorios");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/finance/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          paidToId: formData.paidToId || undefined,
        }),
      });
      if (res.ok) {
        setCreateModal(false);
        setFormData({
          tourId: "",
          departureDate: "",
          departureTime: "07:00",
          category: "",
          description: "",
          amount: "",
          paidToId: "",
        });
        window.location.reload();
      } else {
        const err = await res.json();
        setError(err.error || "Error al registrar gasto");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-warm-900">Gastos</h1>
          <p className="mt-1 text-sm text-warm-500">
            Registro de gastos operativos del mes actual
          </p>
        </div>
        <Button onClick={() => setCreateModal(true)}>
          <Plus className="h-4 w-4" />
          Registrar Gasto
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold text-warm-900">
              ${totalExpenses.toLocaleString("es-CL")}
            </p>
            <p className="text-xs text-warm-500">Total del Mes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold text-warm-900">{expenses.length}</p>
            <p className="text-xs text-warm-500">Registros</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold text-amber-600">
              ${(byCategory["FUEL"] || 0).toLocaleString("es-CL")}
            </p>
            <p className="text-xs text-warm-500">Combustible</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold text-emerald-600">
              ${((byCategory["GUIDE_PAY"] || 0) + (byCategory["DRIVER_PAY"] || 0)).toLocaleString("es-CL")}
            </p>
            <p className="text-xs text-warm-500">Pagos Personal</p>
          </CardContent>
        </Card>
      </div>

      {/* Expenses List */}
      <div className="space-y-2">
        {expenses.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Wallet className="mx-auto mb-3 h-10 w-10 text-warm-300" />
              <p className="text-warm-400">No hay gastos registrados este mes</p>
            </CardContent>
          </Card>
        ) : (
          expenses.map((e) => {
            const Icon = CATEGORY_ICONS[e.category] || HelpCircle;
            const color = CATEGORY_COLORS[e.category] || "text-warm-400";

            return (
              <Card key={e.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg bg-warm-50 p-2 ${color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-warm-900">
                          {EXPENSE_CATEGORY_LABELS[e.category]}
                        </p>
                        <Badge variant="neutral" className="text-[10px]">
                          {e.tourName}
                        </Badge>
                      </div>
                      <p className="text-xs text-warm-500">
                        {e.departureDate} · {e.departureTime}
                        {e.description ? ` · ${e.description}` : ""}
                        {e.paidToName ? ` · Pagado a: ${e.paidToName}` : ""}
                      </p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-warm-900">
                    ${parseFloat(e.amount).toLocaleString("es-CL")}
                  </p>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Create Expense Modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Registrar Gasto" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-sm font-medium text-warm-700">Tour *</label>
              <select
                value={formData.tourId}
                onChange={(e) => setFormData({ ...formData, tourId: e.target.value })}
                className="mt-1 w-full rounded-lg border border-warm-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="">Seleccionar tour...</option>
                {tours.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-warm-700">Fecha Salida *</label>
              <input
                type="date"
                value={formData.departureDate}
                onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                className="mt-1 w-full rounded-lg border border-warm-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-warm-700">Hora Salida</label>
              <input
                type="time"
                value={formData.departureTime}
                onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                className="mt-1 w-full rounded-lg border border-warm-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-warm-700">Categoría *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="mt-1 w-full rounded-lg border border-warm-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="">Seleccionar...</option>
                {Object.entries(EXPENSE_CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-warm-700">Monto *</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0"
                min="0"
                className="mt-1 w-full rounded-lg border border-warm-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-warm-700">Pagado a</label>
            <select
              value={formData.paidToId}
              onChange={(e) => setFormData({ ...formData, paidToId: e.target.value })}
              className="mt-1 w-full rounded-lg border border-warm-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="">Sin asignar</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName} ({s.role === "GUIDE" ? "Guía" : "Conductor"})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-warm-700">Descripción</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción opcional..."
              className="mt-1 w-full rounded-lg border border-warm-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setCreateModal(false)}>Cancelar</Button>
            <Button onClick={createExpense} loading={loading}>
              Registrar Gasto
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
