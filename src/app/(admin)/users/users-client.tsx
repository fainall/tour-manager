"use client";

import { useState, useMemo } from "react";
import { Plus, Search, Pencil, Trash2, Shield, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import { USER_ROLE_LABELS } from "@/lib/constants";
import { UserForm } from "./user-form";
import type { UserRole, CommissionType } from "@/generated/prisma/client";

type CommissionConfig = {
  commissionType: CommissionType;
  percentage: string | number | null;
  fixedAmount: string | number | null;
  goalTarget: string | number | null;
  goalBonus: string | number | null;
};

type UserData = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  documentId: string | null;
  role: UserRole;
  isActive: boolean;
  avatarUrl: string | null;
  commissionConfigs: CommissionConfig[];
};

type UsersClientProps = {
  initialUsers: UserData[];
  currentUserId: string;
};

const ROLE_BADGE_VARIANTS: Record<string, "info" | "primary" | "success" | "warning" | "danger" | "secondary"> = {
  ADMIN: "danger",
  SALES_SUPERVISOR: "primary",
  SELLER: "info",
  GUIDE: "success",
  DRIVER: "warning",
  LOGISTICS: "secondary",
};

export function UsersClient({ initialUsers, currentUserId }: UsersClientProps) {
  const [users, setUsers] = useState<UserData[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserData | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<UserData | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        USER_ROLE_LABELS[u.role].toLowerCase().includes(q)
    );
  }, [users, search]);

  async function refreshUsers() {
    const res = await fetch("/api/users");
    if (res.ok) {
      setUsers(await res.json());
    }
  }

  function handleCreateSuccess() {
    setFormOpen(false);
    setEditUser(null);
    refreshUsers();
  }

  function openEdit(user: UserData) {
    setEditUser(user);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditUser(null);
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/users/${deleteConfirm.id}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteConfirm(null);
        refreshUsers();
      }
    } finally {
      setDeleting(false);
    }
  }

  function formatCommission(config: CommissionConfig) {
    switch (config.commissionType) {
      case "PERCENTAGE_PER_SALE":
        return `${config.percentage}%`;
      case "FIXED_PER_SALE":
        return `$${Number(config.fixedAmount).toLocaleString("es-CL")} / venta`;
      case "GOAL_BASED":
        return `Meta: $${Number(config.goalTarget).toLocaleString("es-CL")}`;
      default:
        return "";
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-warm-900">Usuarios</h1>
            <p className="mt-1 text-sm text-warm-500">
              {users.length} usuarios registrados
            </p>
          </div>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            Nuevo Usuario
          </Button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-400" />
          <input
            type="text"
            placeholder="Buscar usuarios..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-lg border border-warm-300 bg-white pl-10 pr-4 text-sm placeholder:text-warm-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((user) => (
            <Card key={user.id} className="group relative transition-all hover:shadow-card-hover">
              <CardContent className="flex items-start gap-4">
                <Avatar
                  firstName={user.firstName}
                  lastName={user.lastName}
                  src={user.avatarUrl}
                  size="lg"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-warm-900 truncate">
                      {user.firstName} {user.lastName}
                    </h3>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(user)}
                        className="rounded-md p-1.5 text-warm-400 hover:bg-warm-100 hover:text-warm-600"
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      {user.id !== currentUserId && (
                        <button
                          onClick={() => setDeleteConfirm(user)}
                          className="rounded-md p-1.5 text-warm-400 hover:bg-red-50 hover:text-red-500"
                          title="Eliminar"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-warm-500 truncate">{user.email}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant={ROLE_BADGE_VARIANTS[user.role] ?? "info"}>
                      <Shield className="h-3 w-3" />
                      {USER_ROLE_LABELS[user.role]}
                    </Badge>
                    <Badge variant={user.isActive ? "success" : "neutral"} dot>
                      {user.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  {user.commissionConfigs?.[0] && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-warm-500">
                      <DollarSign className="h-3 w-3" />
                      <span>Comisión: {formatCommission(user.commissionConfigs[0])}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-warm-400">No se encontraron usuarios</p>
          </div>
        )}
      </div>

      <UserForm
        open={formOpen}
        onClose={closeForm}
        onSuccess={handleCreateSuccess}
        user={editUser}
        key={editUser?.id ?? "new"}
      />

      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Eliminar Usuario"
        size="sm"
      >
        <p className="text-sm text-warm-600">
          ¿Estás seguro que deseas eliminar a{" "}
          <span className="font-semibold">
            {deleteConfirm?.firstName} {deleteConfirm?.lastName}
          </span>
          ? Esta acción desactivará su cuenta.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting}>
            Eliminar
          </Button>
        </div>
      </Modal>
    </>
  );
}
