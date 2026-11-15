import type { CollectionConfig } from "payload";
import { isActivePayloadAdmin } from "../lib/payload-access.ts";

export const PayoutRequests: CollectionConfig = {
  slug: "payout-requests",
  access: {
    admin: ({ req }) => isActivePayloadAdmin(req.user),
    create: () => false,
    read: ({ req }) => isActivePayloadAdmin(req.user),
    update: ({ req }) => isActivePayloadAdmin(req.user),
    delete: () => false,
  },
  admin: {
    defaultColumns: ["affiliate", "amountRequested", "status", "updatedAt"],
    group: "Affiliate Program",
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
      name: "amountRequested",
      type: "number",
      required: true,
      admin: {
        description: "The USD amount requested for manual offline processing.",
      },
      hooks: {
        beforeChange: [
          ({ value, originalDoc }) => {
            if (
              originalDoc &&
              value !== undefined &&
              value !== originalDoc.amountRequested
            ) {
              throw new Error("The requested payout amount cannot be changed after submission.");
            }
            return value;
          },
        ],
      },
    },
    {
      name: "priorPayoutOffset",
      type: "number",
      min: 0,
      admin: {
        readOnly: true,
        description: "Amount of previously paid legacy balance deducted from this request.",
      },
      hooks: {
        beforeChange: [
          ({ value, originalDoc }) => {
            if (
              originalDoc &&
              value !== undefined &&
              value !== originalDoc.priorPayoutOffset
            ) {
              throw new Error("The legacy payout offset cannot be changed after submission.");
            }
            return value;
          },
        ],
      },
    },
    {
      name: "adjustmentOffset",
      type: "number",
      min: 0,
      admin: {
        readOnly: true,
        description: "Refund, chargeback, or correction amount applied to this payout.",
      },
      hooks: {
        beforeChange: [
          ({ value, originalDoc }) => {
            if (
              originalDoc &&
              value !== undefined &&
              value !== originalDoc.adjustmentOffset
            ) {
              throw new Error("The adjustment offset cannot be changed after submission.");
            }
            return value;
          },
        ],
      },
    },
    {
      name: "payoutMethod",
      type: "select",
      options: [
        { label: "Bank transfer", value: "bank_transfer" },
        { label: "USDT (TRC-20)", value: "usdt_trc20" },
      ],
    },
    {
      name: "country",
      type: "text",
      maxLength: 100,
    },
    {
      name: "accountName",
      type: "text",
      maxLength: 120,
    },
    {
      name: "bankName",
      type: "text",
      maxLength: 120,
    },
    {
      name: "accountNumber",
      type: "text",
      maxLength: 80,
      admin: {
        description: "Sensitive payout details are visible only to super admins.",
      },
    },
    {
      name: "walletAddress",
      type: "text",
      maxLength: 160,
      admin: {
        description: "USDT payout address on the TRC-20 network.",
      },
    },
    {
      name: "network",
      type: "text",
      defaultValue: "TRC-20",
    },
    {
      name: "transactionReference",
      type: "text",
      maxLength: 160,
      admin: {
        description: "Optional reference for a payment completed manually outside GodaApp.",
      },
    },
    {
      name: "paidAt",
      type: "date",
      admin: {
        date: { pickerAppearance: "dayAndTime" },
      },
    },
    {
      name: "rejectionReason",
      type: "textarea",
      admin: {
        description: "Reason provided when a payout request is rejected.",
      },
    },
    {
      name: "status",
      type: "select",
      defaultValue: "pending",
      required: true,
      options: [
        { label: "Pending offline processing", value: "pending" },
        { label: "Paid offline (settled)", value: "approved" },
        { label: "Rejected / canceled", value: "rejected" },
      ],
      hooks: {
        beforeChange: [
          ({ value, originalDoc }) => {
            if (
              (originalDoc?.status === "approved" || originalDoc?.status === "rejected") &&
              value !== undefined &&
              value !== originalDoc.status
            ) {
              throw new Error("A settled or rejected payout request cannot be reopened.");
            }
            return value;
          },
        ],
      },
    },
    {
      name: "adminNotes",
      type: "textarea",
      admin: {
        description: "Internal notes for offline payout processing.",
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, originalDoc }) => {
        if (!data || data.status !== "approved" || originalDoc?.status === "approved") {
          return data;
        }
        return { ...data, paidAt: data.paidAt ?? new Date().toISOString() };
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, req }) => {
        if (doc.status === previousDoc?.status) return doc;
        if (!previousDoc && doc.status === "pending") return doc;

        const allocated = await req.payload.find({
          collection: "referrals",
          where: { payoutRequest: { equals: doc.id } },
          pagination: false,
          req,
          overrideAccess: true,
        });
        const changedAt = new Date().toISOString();

        if (doc.status === "approved" || doc.status === "rejected") {
          for (const referral of allocated.docs) {
            const history = Array.isArray(referral.payoutHistory)
              ? referral.payoutHistory
              : [];
            await req.payload.update({
              collection: "referrals",
              id: referral.id,
              data: {
                payoutStatus: doc.status === "approved" ? "paid" : "unpaid",
                ...(doc.status === "rejected" ? { payoutRequest: null } : {}),
                payoutHistory: [
                  ...history,
                  {
                    payoutRequestId: doc.id,
                    status: doc.status === "approved" ? "paid" : "released",
                    amount: referral.commissionAmount,
                    changedAt,
                  },
                ],
              },
              req,
              overrideAccess: true,
            });
          }

          await req.payload.update({
            collection: "affiliate-ledger-adjustments",
            where: { payoutRequest: { equals: doc.id } },
            data:
              doc.status === "approved"
                ? { status: "applied" }
                : { status: "unapplied", payoutRequest: null },
            req,
            overrideAccess: true,
          });
        }

        return doc;
      },
    ],
  },
};
