// app/admin/dashboard/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/api"; // Ajusta la ruta según tu estructura

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/admin/login");
    }
  }, [router]);

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Bienvenido al panel de administración</p>
    </div>
  );
}
