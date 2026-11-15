import type {
  CollectionAfterChangeHook,
  CollectionBeforeChangeHook,
  CollectionConfig,
} from "payload";
import { isActivePayloadAdmin } from "../lib/payload-access.ts";

function relationId(value: unknown): number | null {
  if (typeof value === "number") return value;
  if (typeof value !== "object" || value === null || !("id" in value)) return null;
  return typeof value.id === "number" ? value.id : null;
}

const validateAdjustment: CollectionBeforeChangeHook = async ({
  data,
  operation,
  req,
}) => {
  if (!data || operation !== "create") return data;

  const affiliateId = relationId(data.affiliate);
  const referralId = relationId(data.referral);
  if (!affiliateId || !referralId || typeof data.amount !== "number") {
    throw new Error("An affiliate, referral, and adjustment amount are required.");
  }

  const referral = await req.payload.findByID({
    collection: "referrals",
    id: referralId,
    req,
    overrideAccess: true,
  });
  if (relationId(referral.affiliate) !== affiliateId) {
    throw new Error("The adjustment affiliate must own the selected referral.");
  }
  if (referral.isReversed) {
    throw new Error("This referral has already been reversed.");
  }
  if (referral.payoutStatus === "pending") {
    throw new Error("Reject the pending payout request before adjusting this referral.");
  }
  if (data.amount > referral.commissionAmount) {
    throw new Error("An adjustment cannot exceed the referral commission.");
  }
  if (
    referral.payoutStatus === "unpaid" &&
    Math.round(data.amount * 100) !== Math.round(referral.commissionAmount * 100)
  ) {
    throw new Error("An unpaid referral must be fully reversed rather than partially adjusted.");
  }
  if (referral.payoutStatus === "paid") {
    const existingAdjustments = await req.payload.find({
      collection: "affiliate-ledger-adjustments",
      where: { referral: { equals: referralId } },
      pagination: false,
      req,
      overrideAccess: true,
    });
    const alreadyAdjusted = existingAdjustments.docs.reduce(
      (total, adjustment) => total + adjustment.amount,
      0,
    );
    if (
      Math.round((alreadyAdjusted + data.amount) * 100) >
      Math.round(referral.commissionAmount * 100)
    ) {
      throw new Error("Total adjustments cannot exceed the referral commission.");
    }
  }

  return data;
};

const reverseUnpaidReferral: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
}) => {
  if (operation !== "create") return doc;

  const referralId = relationId(doc.referral);
  if (!referralId) return doc;

  const referral = await req.payload.findByID({
    collection: "referrals",
    id: referralId,
    req,
    overrideAccess: true,
  });
  if (referral.payoutStatus !== "unpaid") return doc;

  await req.payload.update({
    collection: "referrals",
    id: referralId,
    data: { isReversed: true },
    req,
    overrideAccess: true,
  });
  await req.payload.update({
    collection: "affiliate-ledger-adjustments",
    id: doc.id,
    data: { status: "applied" },
    req,
    overrideAccess: true,
  });

  return doc;
};

export const AffiliateLedgerAdjustments: CollectionConfig = {
  hooks: {
    beforeChange: [validateAdjustment],
    afterChange: [reverseUnpaidReferral],
  },
  slug: "affiliate-ledger-adjustments",
  access: {
    admin: ({ req }) => isActivePayloadAdmin(req.user),
    create: ({ req }) => isActivePayloadAdmin(req.user),
    read: ({ req }) => isActivePayloadAdmin(req.user),
    update: () => false,
    delete: () => false,
  },
  admin: {
    group: "Affiliate Program",
    useAsTitle: "reason",
    defaultColumns: ["affiliate", "referral", "amount", "reason", "status", "createdAt"],
    description: "Admin-entered refund, chargeback, and correction offsets against future affiliate commissions.",
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
      name: "referral",
      type: "relationship",
      relationTo: "referrals",
      required: true,
      index: true,
    },
    {
      name: "amount",
      type: "number",
      required: true,
      min: 0.01,
      admin: {
        description: "USD commission amount to offset from a future offline payout.",
      },
    },
    {
      name: "reason",
      type: "select",
      required: true,
      options: [
        { label: "Refund", value: "refund" },
        { label: "Chargeback", value: "chargeback" },
        { label: "Manual correction", value: "manual_correction" },
      ],
    },
    {
      name: "reference",
      type: "text",
      maxLength: 160,
      admin: {
        description: "Optional provider case or internal audit reference; do not enter credentials.",
      },
    },
    {
      name: "providerEventId",
      type: "text",
      unique: true,
      index: true,
      admin: {
        description: "Optional unique refund or chargeback event ID for audit and duplicate prevention.",
      },
    },
    {
      name: "status",
      type: "select",
      defaultValue: "unapplied",
      required: true,
      index: true,
      options: [
        { label: "Unapplied", value: "unapplied" },
        { label: "Reserved", value: "reserved" },
        { label: "Applied", value: "applied" },
      ],
    },
    {
      name: "payoutRequest",
      type: "relationship",
      relationTo: "payout-requests",
      index: true,
    },
  ],
};
