import type { CollectionConfig } from 'payload'
import { isActivePayloadAdmin } from '../lib/payload-access.ts'

export const PayoutRequests: CollectionConfig = {
  slug: 'payout-requests',
  access: {
    admin: ({ req }) => isActivePayloadAdmin(req.user),
    create: () => false,
    read: ({ req }) => isActivePayloadAdmin(req.user),
    update: ({ req }) => isActivePayloadAdmin(req.user),
    delete: () => false,
  },
  admin: {
    defaultColumns: ['affiliate', 'amountRequested', 'status', 'updatedAt'],
  },
  fields: [
    {
      name: 'affiliate',
      type: 'relationship',
      relationTo: 'affiliates',
      required: true,
      index: true,
    },
    {
      name: 'amountRequested',
      type: 'number',
      required: true,
      admin: {
        description: 'The total value in USD requested for processing (e.g. 180).',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      required: true,
      options: [
        { label: 'Pending Offline Transfer', value: 'pending' },
        { label: 'Approved & Settled', value: 'approved' },
        { label: 'Rejected / Canceled', value: 'rejected' },
      ],
      hooks: {
        beforeChange: [
          async ({ value, originalDoc }) => {
            // Once an entry is marked as approved, make it completely read-only
            if (originalDoc?.status === 'approved') {
              throw new Error('Settled payout adjustments are locked down permanently for compliance audit tracking.')
            }
            return value
          }
        ]
      }
    },
    {
      name: 'adminNotes',
      type: 'textarea',
      admin: {
        description: 'Optional internal transaction audit logs or reference IDs from corporate bank transfers.',
      },
    },
  ],
}
