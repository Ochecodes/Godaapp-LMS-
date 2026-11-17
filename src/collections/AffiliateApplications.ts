import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeChangeHook,
  CollectionConfig,
} from "payload";
import { isActivePayloadAdmin } from "../lib/payload-access.ts";
import { createAdminClient } from "../lib/supabase/admin";

function affiliateIdFrom(value: unknown): number | null {
  if (typeof value === "number") return value;
  if (typeof value !== "object" || value === null || !("id" in value)) return null;
  return typeof value.id === "number" ? value.id : null;
}

const syncAffiliateStatus: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
}) => {
  const affiliateId = affiliateIdFrom(doc.affiliate);

  if (affiliateId) {
    const status = doc.status === "approved" ? "approved" : "suspended";
    await req.payload.update({
      collection: "affiliates",
      id: affiliateId,
      data: { status },
      req,
      overrideAccess: true,
    });
  }

  if (doc.status !== "approved" || previousDoc?.status === "approved") return doc;

  const configuredOrigin =
    process.env.APP_BASE_URL ?? process.env.NEXT_PUBLIC_SITE_URL;
  if (!configuredOrigin) {
    console.error("[Affiliate] Approval link was not sent: configure APP_BASE_URL.");
    await req.payload.update({
      collection: "affiliate-applications",
      id: doc.id,
      data: { approvalNotificationStatus: "failed" },
      req,
      overrideAccess: true,
    });
    return doc;
  }

  try {
    const origin = new URL(configuredOrigin);
    if (origin.protocol !== "https:" && origin.hostname !== "localhost") {
      throw new Error("The approval email origin must use HTTPS.");
    }

    const callbackUrl = new URL("/affiliate/callback", origin);
    const { error } = await createAdminClient().auth.signInWithOtp({
      email: doc.email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: callbackUrl.toString(),
        data: { full_name: doc.fullName },
      },
    });
    if (error) throw error;

    await req.payload.update({
      collection: "affiliate-applications",
      id: doc.id,
      data: {
        approvalNotificationStatus: "sent",
        lastApprovalNotificationAt: new Date().toISOString(),
      },
      req,
      overrideAccess: true,
    });
  } catch (error) {
    console.error("[Affiliate] Approval link could not be sent:", error);
    await req.payload.update({
      collection: "affiliate-applications",
      id: doc.id,
      data: { approvalNotificationStatus: "failed" },
      req,
      overrideAccess: true,
    });
  }

  return doc;
};

const recordStatusHistory: CollectionBeforeChangeHook = ({
  data,
  originalDoc,
  operation,
  req,
}) => {
  if (!data) return data;

  const nextStatus = data.status ?? originalDoc?.status ?? "pending";
  const previousStatus = originalDoc?.status ?? null;
  if (operation !== "create" && nextStatus === previousStatus) return data;

  const history = Array.isArray(originalDoc?.decisionHistory)
    ? originalDoc.decisionHistory
    : [];
  const actor =
    typeof req.user?.email === "string"
      ? req.user.email
      : operation === "create"
        ? "applicant"
        : "system";
  const note =
    typeof data.reviewNotes === "string"
      ? data.reviewNotes
      : typeof originalDoc?.reviewNotes === "string"
        ? originalDoc.reviewNotes
        : "";

  return {
    ...data,
    decisionHistory: [
      ...history,
      {
        fromStatus: previousStatus,
        toStatus: nextStatus,
        changedAt: new Date().toISOString(),
        actor,
        note,
      },
    ],
  };
};

const suspendAffiliateOnDelete: CollectionAfterDeleteHook = async ({
  doc,
  req,
}) => {
  const affiliateId = affiliateIdFrom(doc.affiliate);
  if (!affiliateId) return doc;

  await req.payload.update({
    collection: "affiliates",
    id: affiliateId,
    data: { status: "suspended" },
    req,
    overrideAccess: true,
  });

  return doc;
};

export const AffiliateApplications: CollectionConfig = {
  slug: "affiliate-applications",
  admin: {
    useAsTitle: "email",
    defaultColumns: ["fullName", "email", "status", "createdAt"],
    group: "Affiliate Program",
    description:
      "Review applications here. Current membership status controls affiliate portal access.",
  },
  access: {
    admin: ({ req }) => isActivePayloadAdmin(req.user),
    create: () => false,
    read: ({ req }) => isActivePayloadAdmin(req.user),
    update: ({ req }) => isActivePayloadAdmin(req.user),
    delete: ({ req }) => isActivePayloadAdmin(req.user),
  },
  hooks: {
    afterChange: [syncAffiliateStatus],
    afterDelete: [suspendAffiliateOnDelete],
    beforeValidate: [
      ({ data }) => {
        if (!data) return data;

        return {
          ...data,
          ...(typeof data.email === "string"
            ? { email: data.email.trim().toLowerCase() }
            : {}),
          ...(typeof data.fullName === "string"
            ? { fullName: data.fullName.trim() }
            : {}),
        };
      },
    ],
    beforeChange: [recordStatusHistory],
  },
  fields: [
    {
      name: "fullName",
      type: "text",
      required: true,
      maxLength: 120,
    },
    {
      name: "email",
      type: "email",
      required: true,
      unique: true,
      index: true,
    },
    {
      name: "phone",
      type: "text",
      required: true,
      maxLength: 40,
    },
    {
      name: "message",
      type: "textarea",
      required: true,
      maxLength: 2000,
    },
    {
      name: "termsAcceptedAt",
      type: "date",
      required: true,
      admin: {
        readOnly: true,
        description: "Recorded when the applicant accepts the program terms.",
      },
    },
    {
      name: "status",
      type: "select",
      defaultValue: "pending",
      required: true,
      index: true,
      options: [
        { label: "Pending review", value: "pending" },
        { label: "Approved", value: "approved" },
        { label: "Denied", value: "denied" },
        { label: "Revoked", value: "revoked" },
        { label: "Archived", value: "archived" },
      ],
    },
    {
      name: "reviewNotes",
      type: "textarea",
      admin: {
        description: "Internal super-admin review notes.",
      },
    },
    {
      name: "decisionHistory",
      type: "json",
      admin: {
        readOnly: true,
        description: "Append-only record of application status changes.",
      },
    },
    {
      name: "approvalNotificationStatus",
      type: "select",
      defaultValue: "not_sent",
      required: true,
      options: [
        { label: "Not sent", value: "not_sent" },
        { label: "Sent", value: "sent" },
        { label: "Failed", value: "failed" },
      ],
      admin: {
        readOnly: true,
        description: "The result of the Supabase sign-in email sent when an application is approved.",
      },
    },
    {
      name: "lastApprovalNotificationAt",
      type: "date",
      admin: {
        readOnly: true,
        date: { pickerAppearance: "dayAndTime" },
      },
    },
    {
      name: "affiliate",
      type: "relationship",
      relationTo: "affiliates",
      unique: true,
      index: true,
      admin: {
        readOnly: true,
        description: "Created after the approved applicant verifies their email.",
      },
    },
  ],
};
