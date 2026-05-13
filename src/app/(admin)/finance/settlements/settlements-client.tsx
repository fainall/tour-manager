"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Receipt, Plus, CheckCircle, DollarSign, AlertTriangle,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { SETTLEMENT_STATUS_LABELS } from "@/lib/constants";
import type { SettlementStatus, UserRole } from "@/generated/prisma/client";

type SettlementData = {
  id: string;
  userName: string;
  userRole: string;
  userId: string;
  periodStart: string;
  periodEnd: string;
  totalSales: string;
  totalCommission: string;
  status: SettlementStatus;
  approvedAt: string | null;
  paidAt: string | null;
  paymentReference: string | null;
  notes: string | null;
  createdAt: string;
  commissionCount: number;
  commissions: {
    id: string;
    bookingNumber: number;
    tourName: string;
    tourDate: string;
    baseAmount: string;
    commissionAmount: string;
  }[];
};

type Seller = { id: string; firstName: string; lastName: string; role: string };

const STATUS_BADGE: Record<string, "warning" | "success" | "primary" | "danger"> = {
  PENDING: "warning",
  APPROVED: "success",
  PAID: "primary",
  DISPUTED: "danger",
};

export function SettlementsClient({
  initialSettlements,
  sellers,
  userRole,
}: {
  initialSettlements: SettlementData[];
  sellers: Seller[];
  userRole: UserRole;
}) {
  const router = useRouter();
  const [settlements, setSettlements] = useState(initialSettlements);
  const [createModal, setCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    userId: "",
    periodStart: "",
    periodEnd: "",
  });
  const [error, setError] = useState("");

  const isAdmin = userRole === "ADMIN";

  async function createSettlement() {
    if (!formData.userId || !formData.periodStart || !formData.periodEnd) {
      setError("Completa todos los campos");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/finance/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setCreateModal(false);
        setFormData({ userId: "", periodStart: "", periodEnd: "" });
        router.refresh();
        const data = await res.json();
        window.location.reload();
      } else {
        const err = await res.json();
        setError(err.error || "Error al crear liquidación");
      }
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, action: "approve" | "pay" | "dispute") {
    setLoading(true);
    try {
      const res = await fetch(`/api/finance/settlements/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  }

  const totalPending = settlements
    .filter((s) => s.status === "PENDING")
    .reduce((sum, s) => sum + parseFloat(s.totalCommission), 0);

  const totalApproved = settlements
    .filter((s) => s.status === "APPROVED")
    .reduce((sum, s) => sum + parseFloat(s.totalCommission), 0);

  const totalPaid = settlements
    .filter((s) => s.status === "PAID")
    .reduce((sum, s) => sum + parseFloat(s.totalCommission), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-warm-900">Liquidaciones</h1>
          <p className="mt-1 text-sm text-warm-500">
            Liquidaciones de comisiones a vendedores
          </p>
        </div>
        <Button onClick={() => setCreateModal(true)}>
          <Plus className="h-4 w-4" />
          Nueva Liquidación
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold text-amber-600">
              ${totalPending.toLocaleString("es-CL")}
            </p>
            <p className="text-xs text-warm-500">Pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold text-emerald-600">
              ${totalApproved.toLocaleString("es-CL")}
            </p>
            <p className="text-xs text-warm-500">Aprobadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold text-primary-600">
              ${totalPaid.toLocaleString("es-CL")}
            </p>
            <p className="text-xs text-warm-500">Pagadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Settlements List */}
      <div className="space-y-3">
        {settlements.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Receipt className="mx-auto mb-3 h-10 w-10 text-warm-300" />
              <p className="text-warm-400">No hay liquidaciones registradas</p>
            </CardContent>
          </Card>
        ) : (
          settlements.map((s) => {
            const isExpanded = expandedId === s.id;
            return (
              <Card key={s.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : s.id)}
                        className="text-warm-400 hover:text-warm-600"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-warm-900">{s.userName}</p>
                          <Badge variant={STATUS_BADGE[s.status] || "neutral"} className="text-xs">
                            {SETTLEMENT_STATUS_LABELS[s.status]}
                          </Badge>
                        </div>
                        <p className="text-xs text-warm-500">
                          {s.periodStart} al {s.periodEnd} · {s.commissionCount} reserva(s)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-warm-400">Ventas</p>
                        <p className="text-sm font-medium">${parseFloat(s.totalSales).toLocaleString("es-CL")}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-warm-400">Comisión</p>
                        <p className="text-lg font-bold text-primary-600">
                          ${parseFloat(s.totalCommission).toLocaleString("es-CL")}
                        </p>
                      </div>

                      {isAdmin && s.status === "PENDING" && (
                        <Button
                          variant="success"
                          size="sm"
                          loading={loading}
                          onClick={() => updateStatus(s.id, "approve")}
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Aprobar
                        </Button>
                      )}
                      {isAdmin && s.status === "APPROVED" && (
                        <Button
                          variant="primary"
                          size="sm"
                          loading={loading}
                          onClick={() => updateStatus(s.id, "pay")}
                        >
                          <DollarSign className="h-3.5 w-3.5" />
                          Pagar
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && s.commissions.length > 0 && (
                    <div className="mt-4 rounded-xl border border-warm-200 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-warm-50">
                            <th className="px-4 py-2 text-left text-xs font-semibold text-warm-500">#</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-warm-500">Tour</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-warm-500">Fecha</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold text-warm-500">Venta</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold text-warm-500">Comisión</th>
                          </tr>
                        </thead>
                        <tbody>
                          {s.commissions.map((c, idx) => (
                            <tr key={c.id} className={idx % 2 === 0 ? "" : "bg-warm-50/50"}>
                              <td className="px-4 py-2 text-warm-400">#{c.bookingNumber}</td>
                              <td className="px-4 py-2 font-medium text-warm-900">{c.tourName}</td>
                              <td className="px-4 py-2 text-warm-600">{c.tourDate}</td>
                              <td className="px-4 py-2 text-right">${parseFloat(c.baseAmount).toLocaleString("es-CL")}</td>
                              <td className="px-4 py-2 text-right font-medium text-primary-600">
                                ${parseFloat(c.commissionAmount).toLocaleString("es-CL")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-warm-200 bg-warm-50">
                            <td colSpan={3} className="px-4 py-2 font-semibold">Total</td>
                            <td className="px-4 py-2 text-right font-semibold">
                              ${parseFloat(s.totalSales).toLocaleString("es-CL")}
                            </td>
                            <td className="px-4 py-2 text-right font-bold text-primary-600">
                              ${parseFloat(s.totalCommission).toLocaleString("es-CL")}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}

                  {s.paidAt && (
                    <p className="mt-2 text-xs text-warm-400">
                      Pagada el {new Date(s.paidAt).toLocaleDateString("es-CL")}
                      {s.paymentReference ? ` · Ref: ${s.paymentReference}` : ""}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Create Modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Nueva Liquidación" size="sm">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-warm-700">Vendedor</label>
            <select
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              className="mt-1 w-full rounded-lg border border-warm-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="">Seleccionar vendedor...</option>
              {sellers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-warm-700">Desde</label>
              <input
                type="date"
                value={formData.periodStart}
                onChange={(e) => setFormData({ ...formData, periodStart: e.target.value })}
                className="mt-1 w-full rounded-lg border border-warm-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-warm-700">Hasta</label>
              <input
                type="date"
                value={formData.periodEnd}
                onChange={(e) => setFormData({ ...formData, periodEnd: e.target.value })}
                className="mt-1 w-full rounded-lg border border-warm-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setCreateModal(false)}>Cancelar</Button>
            <Button onClick={createSettlement} loading={loading}>
              Generar Liquidación
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
