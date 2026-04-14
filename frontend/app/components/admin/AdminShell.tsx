import { ReactNode } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

type AdminShellProps = {
  children: ReactNode;
};

export default function AdminShell({ children }: AdminShellProps) {
  return (
    <div className="h-screen overflow-hidden bg-[#06080d] text-white">
      <div className="flex h-full">
        <AdminSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopbar />

          <main className="flex-1 overflow-y-auto">
            <div className="px-4 py-6 pb-24 lg:px-10 lg:pb-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
