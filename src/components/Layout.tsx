import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

export const AppShell = ({ children }: { children: ReactNode }) => (
  <>
    <Navbar />
    <main className="mx-auto grid max-w-7xl gap-5 px-4 py-6 lg:grid-cols-[250px_1fr]">
      <Sidebar />
      <section className="min-w-0">{children}</section>
    </main>
  </>
);
