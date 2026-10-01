import { CollectionConfig } from 'payload'

export const Affiliates: CollectionConfig = {
  slug: 'affiliates',
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
