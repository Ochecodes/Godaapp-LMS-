import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getPayload } from "payload";
import config from "@/payload.config";
import { createClient } from "@/lib/supabase/server";
import { ensurePayloadStudent } from "@/lib/course-enrollment";
import { DashboardShell } from "@/components/DashboardShell";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const payload = await getPayload({ config });
  const student = await ensurePayloadStudent(payload, user);
  if (!student.isActive) redirect("/sign-in?error=account-disabled");

  return (
    <DashboardShell
      avatarUrl={student.avatarUrl ?? undefined}
      fullName={student.fullName}
      email={student.email}
    >
      {children}
    </DashboardShell>
  );
}
