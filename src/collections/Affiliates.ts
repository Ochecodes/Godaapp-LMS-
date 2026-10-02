import type { CollectionConfig } from 'payload'
import { isActivePayloadAdmin } from '../lib/payload-access.ts'

export const Affiliates: CollectionConfig = {
  slug: 'affiliates',
  access: {
    admin: ({ req }) => isActivePayloadAdmin(req.user),
    create: () => false,
    read: ({ req }) => isActivePayloadAdmin(req.user),
    update: ({ req }) => isActivePayloadAdmin(req.user),
    delete: ({ req }) => isActivePayloadAdmin(req.user),
  },
  admin: {
    useAsTitle: 'referralCode',
    defaultColumns: ['user', 'referralCode', 'status'],
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'The global platform profile account owning this affiliate membership record.',
      },
    },
    {
      name: 'referralCode',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'The uppercase tracking slug appended to URLs (e.g. BTC60).',
      },
      hooks: {
        beforeValidate: [
          ({ value }) => typeof value === 'string' ? value.toUpperCase().trim() : value
        ]
      }
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      required: true,
      options: [
        { label: 'Pending Verification', value: 'pending' },
        { label: 'Active/Approved', value: 'approved' },
        { label: 'Suspended/Blocked', value: 'suspended' },
      ],
    },
    {
      name: 'bankDetails',
      type: 'group',
      fields: [
        {
          name: 'bankName',
          type: 'text',
          required: true,
        },
        {
          name: 'accountNumber',
          type: 'text',
          required: true,
        },
        {
          name: 'accountName',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
}
