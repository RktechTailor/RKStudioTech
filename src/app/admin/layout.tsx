import { ReactNode } from "react";
import AdminGuard from "@/components/common/AdminGuard";
import AuthGuard from "@/components/common/AuthGuard";

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AuthGuard>
      <AdminGuard>{children}</AdminGuard>
    </AuthGuard>
  );
}
