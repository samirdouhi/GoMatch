import { ReactNode } from "react";
import CommercantSidebar from "./CommercantSidebar";
import CommercantTopbar from "./CommercantTopbar";
 
type Props = {
  children: ReactNode;
};
 
export default function CommercantShell({ children }: Props) {
  return (
    <div className="h-screen overflow-hidden bg-[#04060b] text-white">
      <div className="flex h-full">
        <CommercantSidebar />
 
        <div className="flex min-w-0 flex-1 flex-col">
          <CommercantTopbar />
 
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}