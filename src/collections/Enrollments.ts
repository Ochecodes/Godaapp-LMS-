import type { CollectionConfig } from 'payload'
import { isActivePayloadAdmin } from '../lib/payload-access.ts'

export const Enrollments: CollectionConfig = {
  slug: 'enrollments',
  access: {
    admin: ({ req }) => isActivePayloadAdmin(req.user),
    create: () => false,
    read: ({ req }) => isActivePayloadAdmin(req.user),
    update: () => false,
    delete: () => false,
  },
  admin: {
    defaultColumns: ['email', 'course', 'createdAt'],
  },
  fields: [
    {
      name: 'email',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'The email address used during purchase or login.',
      },
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      admin: {
        description: 'Optional link to a verified user profile once they log in via Google.',
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
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      required: true,
    },
  ],
}
