"use client";

import { createContext, useContext } from "react";

export type DashboardIdentity = {
  fullName: string;
  email: string;
  avatarUrl?: string;
};

export const DashboardIdentityContext = createContext<DashboardIdentity>({
  fullName: "Student",
  email: "",
});

export function useDashboardIdentity() {
  return useContext(DashboardIdentityContext);
}
