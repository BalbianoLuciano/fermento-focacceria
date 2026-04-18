import { AdminShell } from "@/components/admin/AdminShell";

// Admin is fully gated by client-side auth — there is no reason to statically
// prerender any of it, and doing so triggers Next.js 16 segment hydration
// mismatches between the server-rendered loading skeleton and the client
// segment wrapper. Force runtime rendering for the whole admin tree.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
