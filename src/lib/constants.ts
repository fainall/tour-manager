import type { BookingStatus, UserRole, PaymentMethod, PaymentStatus, SettlementStatus, ExpenseCategory } from "@/generated/prisma/client";

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  RESERVED: "Reservada",
  CONFIRMED: "Confirmada",
  COMPLETED: "Completada",
  PAID: "Pagada",
  CANCELLED: "Cancelada",
  NO_SHOW: "No Show",
};

export const BOOKING_STATUS_COLORS: Record<BookingStatus, string> = {
  RESERVED: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-emerald-100 text-emerald-800",
  COMPLETED: "bg-indigo-100 text-indigo-800",
  PAID: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  NO_SHOW: "bg-neutral-200 text-neutral-600",
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrador",
  SALES_SUPERVISOR: "Supervisor de Ventas",
  SELLER: "Vendedor",
  GUIDE: "Guía",
  DRIVER: "Conductor",
  LOGISTICS: "Logística",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Efectivo",
  CREDIT_CARD: "Tarjeta de Crédito",
  DEBIT_CARD: "Tarjeta de Débito",
  BANK_TRANSFER: "Transferencia Bancaria",
  DIGITAL_WALLET: "Billetera Digital",
  PAYPAL: "PayPal",
  TRANSBANK: "Transbank",
  OTHER: "Otro",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Pendiente",
  COMPLETED: "Completado",
  REFUNDED: "Reembolsado",
  FAILED: "Fallido",
};

export const SETTLEMENT_STATUS_LABELS: Record<SettlementStatus, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobada",
  PAID: "Pagada",
  DISPUTED: "Disputada",
};

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  FUEL: "Combustible",
  TOLLS: "Peajes",
  MAINTENANCE: "Mantenimiento",
  DRIVER_PAY: "Pago Conductor",
  GUIDE_PAY: "Pago Guía",
  MEALS: "Alimentación",
  PARKING: "Estacionamiento",
  OTHER: "Otro",
};

export const VALID_STATUS_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  RESERVED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED", "NO_SHOW"],
  COMPLETED: ["PAID"],
  PAID: [],
  CANCELLED: [],
  NO_SHOW: [],
};

export type NavItem = {
  label: string;
  href: string;
  icon: string;
  roles?: UserRole[];
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const NAVIGATION: NavSection[] = [
  {
    title: "Principal",
    items: [
      { label: "Dashboard", href: "/", icon: "LayoutDashboard" },
      { label: "Calendario", href: "/calendar", icon: "Calendar" },
    ],
  },
  {
    title: "Operaciones",
    items: [
      { label: "Reservas", href: "/bookings", icon: "CalendarCheck" },
      { label: "Asignación", href: "/operations", icon: "ClipboardList", roles: ["ADMIN", "SALES_SUPERVISOR", "LOGISTICS"] },
      { label: "Tours", href: "/tours", icon: "Map", roles: ["ADMIN", "SALES_SUPERVISOR"] },
      { label: "Pasajeros", href: "/passengers", icon: "Users" },
      { label: "Vehículos", href: "/vehicles", icon: "Bus", roles: ["ADMIN", "LOGISTICS"] },
    ],
  },
  {
    title: "Finanzas",
    items: [
      { label: "Liquidaciones", href: "/finance/settlements", icon: "Receipt", roles: ["ADMIN", "SALES_SUPERVISOR"] },
      { label: "Gastos", href: "/finance/expenses", icon: "Wallet", roles: ["ADMIN", "SALES_SUPERVISOR", "GUIDE", "DRIVER"] },
    ],
  },
  {
    title: "Administración",
    items: [
      { label: "Usuarios", href: "/users", icon: "UserCog", roles: ["ADMIN"] },
      { label: "Reportes", href: "/reports", icon: "BarChart3", roles: ["ADMIN", "SALES_SUPERVISOR"] },
    ],
  },
];
