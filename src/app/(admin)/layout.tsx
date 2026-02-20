import { auth } from "@/auth";
import AdminShell from "@/components/admin/AdminShell";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Protect the layout at the server level
  if (!session || !session.user) {
    redirect("/login");
  }

  return <AdminShell user={session.user}>{children}</AdminShell>;
}
