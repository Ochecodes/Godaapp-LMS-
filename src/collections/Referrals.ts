import type { CollectionConfig } from 'payload'
import { isActivePayloadAdmin } from '../lib/payload-access.ts'

export const Referrals: CollectionConfig = {
  slug: 'referrals',
  admin: {
    defaultColumns: ['affiliate', 'referredEmail', 'commissionAmount', 'payoutStatus'],
  },
  // Security Guard: Prevent external manipulation or data modification after creation
  access: {
    admin: ({ req }) => isActivePayloadAdmin(req.user),
    create: () => false,
    read: ({ req }) => isActivePayloadAdmin(req.user),
    update: () => false,
    delete: () => false,
  },
  fields: [
    {
      name: 'affiliate',
      type: 'relationship',
      relationTo: 'affiliates',
      required: true,
      index: true,
      admin: {
        description: 'The affiliate marketer credited for generating this conversion.',
      },
    },
    {
      name: 'course',
      type: 'relationship',
      relationTo: 'courses',
      required: true,
      index: true,
    },
    {
      name: 'referredEmail',
      type: 'text',
      required: true,
      admin: {
        description: 'The email address of the customer who completed the purchase.',
      },
    },
    {
      name: 'commissionAmount',
      type: 'number',
      required: true,
      admin: {
        description: 'The actual dollar commission value calculated at 25% of the total checkout purchase price.',
      },
    },
    {
      name: 'saleAmount',
      type: 'number',
      min: 0,
      admin: {
        description: 'The USD course sale amount used to calculate this commission.',
      },
    },
    {
      name: 'commissionRate',
      type: 'number',
      min: 0,
      max: 1,
      admin: {
        description: 'The commission rate applied to the sale.',
      },
    },
    {
      name: 'providerCheckoutId',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        description: 'Unique paid checkout identifier used to prevent duplicate credits.',
      },
    },
    {
      name: 'isReversed',
      type: 'checkbox',
      defaultValue: false,
      required: true,
      admin: {
        description: 'Marks a refunded or charged-back sale as ineligible for future payout.',
      },
    },
    {
      name: 'payoutRequest',
      type: 'relationship',
      relationTo: 'payout-requests',
      index: true,
      admin: {
        description: 'The payout request reserving or settling this commission credit.',
      },
    },
    {
      name: 'payoutHistory',
      type: 'json',
      admin: {
        readOnly: true,
        description: 'Append-only record of payout reservations, releases, and settlements.',
      },
    },
    {
      name: 'payoutStatus',
      type: 'select',
      defaultValue: 'unpaid',
      required: true,
      options: [
        { label: 'Unpaid Earnings', value: 'unpaid' },
        { label: 'Pending Processing', value: 'pending' },
        { label: 'Paid & Settled', value: 'paid' },
      ],
    },
  ],
}
