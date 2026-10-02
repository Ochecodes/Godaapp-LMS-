"use client"

import Link from "next/link"
import { BookOpen, ChevronRight, LockKeyhole, Search } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const COURSES = [
  "Capital Preservation",
  "Forex Trading",
  "Trading Psychology",
  "Crypto Markets",
]

interface AppSidebarProps {
  searchQuery: string
  selectedCourse: string | null
  onSearchChange: (query: string) => void
  onSelectCourse: (course: string) => void
}

export function AppSidebar({ searchQuery, selectedCourse, onSearchChange, onSelectCourse }: AppSidebarProps) {
  return (
    <Sidebar position="relative" collapsible="icon" className="border-zinc-700">
      <SidebarHeader className="border-b border-zinc-700 p-4 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-1">
        <Link href="/catalog" className="flex items-center gap-2 text-sm font-semibold text-white">
          <BookOpen className="size-4 shrink-0 text-[#F57C00]" aria-hidden="true" />
          <span className="group-data-[collapsible=icon]:hidden">Course Library</span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="bg-zinc-900">
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel className="text-zinc-400">Search</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
              <Input
                type="search"
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search courses"
                aria-label="Search courses"
                className="h-9 border-zinc-700 bg-zinc-800 pl-8 text-sm text-white placeholder:text-zinc-400 focus-visible:border-[#068365] focus-visible:ring-[#068365]/40"
              />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="text-zinc-400 group-data-[collapsible=icon]:hidden">Courses</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {COURSES.map((course) => (
                <SidebarMenuItem key={course}>
                  <Collapsible className="group/course" defaultOpen={course === COURSES[0]}>
                    <SidebarMenuButton
                      render={<CollapsibleTrigger />}
                      className={`text-zinc-200 hover:bg-zinc-800 hover:text-white data-[open]:bg-zinc-800 ${selectedCourse === course ? "bg-zinc-800 text-white" : ""}`}
                      aria-label={`${course} lessons`}
                    >
                      <ChevronRight className="size-4 transition-transform group-data-[open]/course:rotate-90" aria-hidden="true" />
                      <span className="truncate">{course}</span>
                    </SidebarMenuButton>
                    <CollapsibleContent>
                      <SidebarMenuSub className="border-zinc-700">
                        {[1, 2, 3, 4].map((lesson) => {
                          const locked = lesson === 4

                          return (
                            <SidebarMenuSubItem key={lesson}>
                              <SidebarMenuSubButton
                                render={locked ? <Link href="/sign-up" /> : <button type="button" />}
                                onClick={locked ? undefined : () => onSelectCourse(course)}
                                className="text-zinc-300 hover:bg-zinc-800 hover:text-white"
                                aria-label={locked ? `Lesson ${lesson}, sign up to unlock` : `Lesson ${lesson} in ${course}`}
                              >
                                <span>Lesson {lesson}{locked ? " (Locked)" : ""}</span>
                                {locked && <LockKeyhole className="ml-auto size-3.5 text-zinc-400" aria-hidden="true" />}
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </Collapsible>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
