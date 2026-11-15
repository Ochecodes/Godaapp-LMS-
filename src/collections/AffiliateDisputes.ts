import type { CollectionAfterChangeHook, CollectionConfig } from "payload";
import { isActivePayloadAdmin } from "../lib/payload-access.ts";

const recordDisputeResolution: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
}) => {
  if (
    (doc.status === "resolved" || doc.status === "closed") &&
    doc.status !== previousDoc?.status
  ) {
    await req.payload.update({
      collection: "affiliate-disputes",
      id: doc.id,
      data: { resolvedAt: new Date().toISOString() },
      req,
      overrideAccess: true,
    });
  }
  return doc;
};

export const AffiliateDisputes: CollectionConfig = {
  hooks: {
    afterChange: [recordDisputeResolution],
  },
  slug: "affiliate-disputes",
  access: {
    admin: ({ req }) => isActivePayloadAdmin(req.user),
    create: () => false,
    read: ({ req }) => isActivePayloadAdmin(req.user),
    update: ({ req }) => isActivePayloadAdmin(req.user),
    delete: () => false,
  },
  admin: {
    group: "Affiliate Program",
    useAsTitle: "subject",
    defaultColumns: ["subject", "affiliate", "category", "status", "createdAt"],
    description: "Affiliate support and payout disputes submitted from the portal.",
  },
  fields: [
    {
      name: "affiliate",
      type: "relationship",
      relationTo: "affiliates",
      required: true,
      index: true,
    },
    {
      name: "subject",
      type: "text",
      required: true,
      maxLength: 160,
    },
    {
      name: "category",
      type: "select",
      required: true,
      options: [
        { label: "Referral or commission", value: "referral" },
        { label: "Payout request", value: "payout" },
        { label: "Account access", value: "account" },
        { label: "Other", value: "other" },
      ],
    },
    {
      name: "details",
      type: "textarea",
      required: true,
      maxLength: 4000,
    },
    {
      name: "status",
      type: "select",
      defaultValue: "submitted",
      required: true,
      index: true,
      options: [
        { label: "Submitted", value: "submitted" },
        { label: "Under review", value: "under_review" },
        { label: "Resolved", value: "resolved" },
        { label: "Closed", value: "closed" },
      ],
    },
    {
      name: "adminResponse",
      type: "textarea",
      admin: {
        description: "This response is visible to the affiliate. Do not include sensitive payout credentials.",
      },
    },
    {
      name: "resolvedAt",
      type: "date",
      admin: {
        readOnly: true,
        date: { pickerAppearance: "dayAndTime" },
      },
    },
  ],
};
