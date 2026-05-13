import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { TourForm } from "../tour-form";

export default function NewTourPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/tours"
          className="rounded-lg p-2 text-warm-400 transition-colors hover:bg-warm-100 hover:text-warm-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-warm-900">Nuevo Tour</h1>
          <p className="mt-0.5 text-sm text-warm-500">
            Completa los datos para crear un nuevo tour
          </p>
        </div>
      </div>
      <TourForm />
    </div>
  );
}
