"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { USER_ROLE_LABELS } from "@/lib/constants";
import type { UserRole, CommissionType } from "@/generated/prisma/client";

type UserWithCommission = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  documentId: string | null;
  role: UserRole;
  isActive: boolean;
  commissionConfigs?: {
    commissionType: CommissionType;
    percentage: string | number | null;
    fixedAmount: string | number | null;
    goalTarget: string | number | null;
    goalBonus: string | number | null;
  }[];
};

type UserFormProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user?: UserWithCommission | null;
};

const ROLE_OPTIONS = Object.entries(USER_ROLE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const COMMISSION_TYPE_OPTIONS = [
  { value: "PERCENTAGE_PER_SALE", label: "Porcentaje por venta" },
  { value: "FIXED_PER_SALE", label: "Monto fijo por venta" },
  { value: "GOAL_BASED", label: "Basado en meta" },
];

const ROLES_WITH_COMMISSION: UserRole[] = ["SELLER", "SALES_SUPERVISOR"];

export function UserForm({ open, onClose, onSuccess, user }: UserFormProps) {
  const isEdit = !!user;
  const activeCommission = user?.commissionConfigs?.[0];

  const [form, setForm] = useState({
    email: user?.email ?? "",
    password: "",
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    phone: user?.phone ?? "",
    documentId: user?.documentId ?? "",
    role: user?.role ?? "",
    isActive: user?.isActive ?? true,
  });

  const [commission, setCommission] = useState({
    commissionType: activeCommission?.commissionType ?? "",
    percentage: activeCommission?.percentage?.toString() ?? "",
    fixedAmount: activeCommission?.fixedAmount?.toString() ?? "",
    goalTarget: activeCommission?.goalTarget?.toString() ?? "",
    goalBonus: activeCommission?.goalBonus?.toString() ?? "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const showCommission = ROLES_WITH_COMMISSION.includes(form.role as UserRole);

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.email) errs.email = "Email es obligatorio";
    if (!isEdit && !form.password) errs.password = "Contraseña es obligatoria";
    if (form.password && form.password.length < 6) errs.password = "Mínimo 6 caracteres";
    if (!form.firstName) errs.firstName = "Nombre es obligatorio";
    if (!form.lastName) errs.lastName = "Apellido es obligatorio";
    if (!form.role) errs.role = "Rol es obligatorio";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setApiError("");

    const payload: Record<string, unknown> = { ...form };
    if (!form.password) delete payload.password;
    if (showCommission && commission.commissionType) {
      payload.commission = {
        commissionType: commission.commissionType,
        percentage: commission.percentage ? parseFloat(commission.percentage) : null,
        fixedAmount: commission.fixedAmount ? parseFloat(commission.fixedAmount) : null,
        goalTarget: commission.goalTarget ? parseFloat(commission.goalTarget) : null,
        goalBonus: commission.goalBonus ? parseFloat(commission.goalBonus) : null,
      };
    }

    try {
      const url = isEdit ? `/api/users/${user.id}` : "/api/users";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setApiError(data.error || "Error al guardar usuario");
        return;
      }

      onSuccess();
    } catch {
      setApiError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar Usuario" : "Nuevo Usuario"}
      description={isEdit ? "Modifica los datos del usuario" : "Completa los datos para crear un nuevo usuario"}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {apiError && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{apiError}</div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Nombre *"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            error={errors.firstName}
            placeholder="Ej: Carlos"
          />
          <Input
            label="Apellido *"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            error={errors.lastName}
            placeholder="Ej: Mendoza"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Email *"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            error={errors.email}
            placeholder="usuario@email.com"
          />
          <Input
            label={isEdit ? "Nueva Contraseña" : "Contraseña *"}
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            error={errors.password}
            placeholder={isEdit ? "Dejar vacío para mantener" : "Mínimo 6 caracteres"}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Teléfono"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+56912345678"
          />
          <Input
            label="RUT / Documento"
            value={form.documentId}
            onChange={(e) => setForm({ ...form, documentId: e.target.value })}
            placeholder="12.345.678-9"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Rol *"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            options={ROLE_OPTIONS}
            placeholder="Seleccionar rol"
            error={errors.role}
          />
          {isEdit && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-warm-700">Estado</label>
              <div className="flex h-11 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, isActive: !form.isActive })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${
                    form.isActive ? "bg-emerald-500" : "bg-warm-300"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 mt-0.5 ${
                      form.isActive ? "translate-x-5.5 ml-0.5" : "translate-x-0.5"
                    }`}
                  />
                </button>
                <span className="text-sm text-warm-600">
                  {form.isActive ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>
          )}
        </div>

        {showCommission && (
          <>
            <div className="border-t border-warm-200 pt-5">
              <h3 className="text-sm font-semibold text-warm-800 mb-4">Configuración de Comisión</h3>
              <div className="space-y-4">
                <Select
                  label="Tipo de Comisión"
                  value={commission.commissionType}
                  onChange={(e) => setCommission({ ...commission, commissionType: e.target.value })}
                  options={COMMISSION_TYPE_OPTIONS}
                  placeholder="Sin comisión"
                />

                {commission.commissionType === "PERCENTAGE_PER_SALE" && (
                  <Input
                    label="Porcentaje (%)"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={commission.percentage}
                    onChange={(e) => setCommission({ ...commission, percentage: e.target.value })}
                    placeholder="Ej: 10"
                  />
                )}

                {commission.commissionType === "FIXED_PER_SALE" && (
                  <Input
                    label="Monto Fijo (CLP)"
                    type="number"
                    min="0"
                    value={commission.fixedAmount}
                    onChange={(e) => setCommission({ ...commission, fixedAmount: e.target.value })}
                    placeholder="Ej: 5000"
                  />
                )}

                {commission.commissionType === "GOAL_BASED" && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                      label="Meta (CLP)"
                      type="number"
                      min="0"
                      value={commission.goalTarget}
                      onChange={(e) => setCommission({ ...commission, goalTarget: e.target.value })}
                      placeholder="Ej: 1000000"
                    />
                    <Input
                      label="Bono al cumplir (CLP)"
                      type="number"
                      min="0"
                      value={commission.goalBonus}
                      onChange={(e) => setCommission({ ...commission, goalBonus: e.target.value })}
                      placeholder="Ej: 50000"
                    />
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-warm-200 pt-5">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            {isEdit ? "Guardar Cambios" : "Crear Usuario"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
