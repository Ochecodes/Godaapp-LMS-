import type { CollectionAfterChangeHook, CollectionConfig } from "payload";
import { isActivePayloadAdmin } from "../lib/payload-access.ts";

const recordKycReview: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
}) => {
  if (
    doc.status !== previousDoc?.status &&
    doc.status !== "submitted"
  ) {
    await req.payload.update({
      collection: "affiliate-kyc",
      id: doc.id,
      data: { reviewedAt: new Date().toISOString() },
      req,
      overrideAccess: true,
    });
  }
  return doc;
};

export const AffiliateKyc: CollectionConfig = {
  hooks: {
    afterChange: [recordKycReview],
  },
  slug: "affiliate-kyc",
  access: {
    admin: ({ req }) => isActivePayloadAdmin(req.user),
    create: () => false,
    read: ({ req }) => isActivePayloadAdmin(req.user),
    update: ({ req }) => isActivePayloadAdmin(req.user),
    delete: () => false,
  },
  admin: {
    group: "Affiliate Program",
    useAsTitle: "legalName",
    defaultColumns: ["legalName", "affiliate", "country", "status", "submittedAt"],
    description: "Restricted identity verification records for affiliate payout eligibility.",
  },
  fields: [
    {
      name: "affiliate",
      type: "relationship",
      relationTo: "affiliates",
      required: true,
      unique: true,
      index: true,
    },
    {
      name: "legalName",
      type: "text",
      required: true,
      maxLength: 120,
    },
    {
      name: "dateOfBirth",
      type: "date",
      required: true,
      admin: {
        date: { pickerAppearance: "dayOnly" },
      },
    },
    {
      name: "country",
      type: "text",
      required: true,
      maxLength: 100,
    },
    {
      name: "residentialAddress",
      type: "textarea",
      required: true,
      maxLength: 500,
    },
    {
      name: "identityType",
      type: "select",
      required: true,
      options: [
        { label: "Passport", value: "passport" },
        { label: "National identity card", value: "national_id" },
        { label: "Driver's license", value: "drivers_license" },
      ],
    },
    {
      name: "identityLastFour",
      type: "text",
      required: true,
      minLength: 4,
      maxLength: 4,
      validate: (value: unknown) =>
        typeof value === "string" && /^\d{4}$/.test(value)
          ? true
          : "Enter only the final four digits of the identity number.",
      admin: {
        description: "Only the last four digits are collected; do not enter a full ID number.",
      },
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
        { label: "Verified", value: "verified" },
        { label: "Needs information", value: "needs_information" },
        { label: "Rejected", value: "rejected" },
      ],
    },
    {
      name: "reviewNotes",
      type: "textarea",
      admin: {
        description: "Instructions for the affiliate if additional information is needed.",
      },
    },
    {
      name: "submittedAt",
      type: "date",
      admin: {
        readOnly: true,
        date: { pickerAppearance: "dayAndTime" },
      },
    },
    {
      name: "reviewedAt",
      type: "date",
      admin: {
        readOnly: true,
        date: { pickerAppearance: "dayAndTime" },
      },
    },
  ],
};
