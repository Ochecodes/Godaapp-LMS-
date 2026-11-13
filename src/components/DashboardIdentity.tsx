"use client";

import { createContext, useContext } from "react";

export type DashboardProfileMetadata = {
  public_email?: unknown;
  about?: unknown;
  avatar_url?: unknown;
  location?: unknown;
  phone?: unknown;
  team?: unknown;
  company?: unknown;
  pronouns?: unknown;
  website?: unknown;
};

export type DashboardIdentity = {
  fullName: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
  emailVerified: boolean;
  profileMetadata: DashboardProfileMetadata;
};

export const DashboardIdentityContext = createContext<DashboardIdentity>({
  fullName: "Student",
  email: "",
  createdAt: "",
  emailVerified: false,
  profileMetadata: {},
});

export function useDashboardIdentity() {
  return useContext(DashboardIdentityContext);
}
