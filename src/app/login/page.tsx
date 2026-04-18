import { LoginCard } from "@/components/admin/LoginCard";

// Auth state is resolved on the client only — no static prerender benefit.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Ingresar",
  description: "Ingreso al panel de administración",
};

export default function LoginPage() {
  return (
    <section className="flex min-h-svh flex-col items-center justify-center bg-secondary/40 px-5 py-16">
      <LoginCard />
    </section>
  );
}
