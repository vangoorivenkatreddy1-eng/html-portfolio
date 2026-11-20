import Link from "next/link";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Executive dashboard" },
  { href: "/operations/stakeholders", label: "Stakeholders & invitations" },
  { href: "/operations/travel", label: "Travel" },
  { href: "/operations/hotels", label: "Hotels" },
  { href: "/operations/transport", label: "Transport" },
  { href: "/operations/venue", label: "Venue" },
  { href: "/operations/budget", label: "Budget & procurement" },
  { href: "/operations/vehicles", label: "Launch vehicles" },
  { href: "/operations/master-plan", label: "Master plan & risks" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="min-h-screen bg-[var(--lg-surface)] text-[var(--lg-navy)]">
      <header className="border-b border-[var(--lg-border)] bg-[var(--lg-navy)] text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-teal-200/80">
              LaunchGate 360
            </p>
            <h1 className="text-xl font-semibold sm:text-2xl">{title}</h1>
            {subtitle ? (
              <p className="mt-1 text-sm text-slate-300">{subtitle}</p>
            ) : null}
          </div>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-teal-200 hover:text-white"
          >
            OEM Launch Control
          </Link>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[240px_1fr] lg:px-6">
        <aside className="rounded-xl border border-[var(--lg-border)] bg-white p-3 shadow-sm">
          <nav className="flex flex-col gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-teal-50 hover:text-[var(--lg-navy)]",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
