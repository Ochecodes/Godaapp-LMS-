import type { CollectionConfig } from 'payload'
import { isActiveCourseEditor } from '../lib/payload-access.ts'

export const Resources: CollectionConfig = {
  slug: 'resources',
  access: {
    admin: ({ req }) => isActiveCourseEditor(req.user),
    create: ({ req }) => isActiveCourseEditor(req.user),
    read: ({ req }) => isActiveCourseEditor(req.user),
    update: ({ req }) => isActiveCourseEditor(req.user),
    delete: ({ req }) => isActiveCourseEditor(req.user),
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'status', 'sortOrder'],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'category', type: 'text', required: true },
    { name: 'description', type: 'textarea', required: true },
    {
      name: 'externalUrl',
      type: 'text',
      required: true,
      validate: (value: unknown) => {
        if (typeof value !== 'string') return 'Enter a secure resource URL.'
        try {
          return new URL(value).protocol === 'https:'
            ? true
            : 'Resource URLs must use HTTPS.'
        } catch {
          return 'Enter a valid resource URL.'
        }
      },
    },
    { name: 'format', type: 'text', required: true },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'published',
      required: true,
      index: true,
      options: [
        { label: 'Published', value: 'published' },
        { label: 'Draft', value: 'draft' },
      ],
    },
    { name: 'sortOrder', type: 'number', defaultValue: 0, required: true, index: true },
  ],
}
