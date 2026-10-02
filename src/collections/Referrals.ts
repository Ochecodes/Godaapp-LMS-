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
