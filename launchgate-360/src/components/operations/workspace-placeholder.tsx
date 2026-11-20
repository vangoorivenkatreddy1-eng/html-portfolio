import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function WorkspacePlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <AppShell title={title} subtitle={description}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Coming next in this increment</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600">
          Domain editors, evidence attachments, and approval workflows connect to the
          Supabase models already defined in migrations. Executive KPIs on the dashboard
          are derived from these transactional tables.
        </CardContent>
      </Card>
    </AppShell>
  );
}
