"use client";

import { useEffect } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { CatalogStoreProvider } from "@/lib/catalog-store";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import FeaturedCourses from "@/components/ui/featured-courses";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useCatalogStore } from "@/lib/catalog-store";

export function CatalogWorkspace() {
  return (
    <CatalogStoreProvider>
      <CatalogWorkspaceContent />
    </CatalogStoreProvider>
  );
}

function CatalogWorkspaceContent() {
  const selectedCourse = useCatalogStore((state) => state.selectedCourse);

  useEffect(() => {
    if (!selectedCourse) return;

    const courseSlug = selectedCourse.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    document.getElementById(`course-${courseSlug}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [selectedCourse]);

  return (
    <section className="relative isolate w-full overflow-hidden bg-white px-4 py-10 text-zinc-950 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="h-full w-full bg-cover bg-center"
          style={{ backgroundImage: "url('/Zincbg.svg')" }}
        />
        <div
          className="absolute inset-0 opacity-[0.025] mix-blend-overlay"
          style={{
              backgroundImage:
                'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")',
          }}
        />
      </div>
      <div className="relative mx-auto w-full max-w-7xl">
        <SidebarProvider className="min-h-[42rem] w-full overflow-hidden rounded-xl border border-zinc-300/70 bg-white/95 shadow-2xl shadow-zinc-950/10 backdrop-blur-sm">
          <AppSidebar />
          <SidebarInset className="min-w-0 flex-1 bg-transparent">
            <header className="flex h-14 shrink-0 items-center gap-2 border-b border-zinc-200 bg-white/90 px-4 backdrop-blur-sm">
              <SidebarTrigger className="-ml-1 text-zinc-700" aria-label="Toggle course menu" />
              <Separator orientation="vertical" className="mr-2 h-4 bg-zinc-300" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage>Catalog</BreadcrumbPage>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Courses</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </header>
            <main className="min-w-0 flex-1">
              <FeaturedCourses
                compact
              />
            </main>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </section>
  );
}
