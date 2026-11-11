import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminToastListener } from "@/components/admin/admin-inbox-pulse";
import { isStaff } from "@/lib/roles";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  if (!session?.user?.id || !isStaff(session.user.role)) {
    redirect("/");
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-6 sm:px-6 lg:flex-row lg:gap-6 lg:py-8">
      <div className="lg:hidden">
        <AdminNav variant="mobile" role={session.user.role} />
      </div>
      <AdminNav variant="sidebar" role={session.user.role} />
      <section className="min-w-0 flex-1">
        <AdminToastListener />
        {children}
      </section>
    </div>
  );
}
