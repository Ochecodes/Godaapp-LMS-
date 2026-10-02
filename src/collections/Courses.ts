import type { CollectionConfig } from 'payload'
import { isActiveCourseEditor } from '../lib/payload-access.ts'

export const Courses: CollectionConfig = {
  slug: 'courses',
  access: {
    admin: ({ req }) => isActiveCourseEditor(req.user),
    create: ({ req }) => isActiveCourseEditor(req.user),
    read: ({ req }) => isActiveCourseEditor(req.user),
    update: ({ req }) => isActiveCourseEditor(req.user),
    delete: ({ req }) => isActiveCourseEditor(req.user),
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'priceUSD', 'status'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
    },
    {
      name: 'thumbnailUrl',
      type: 'text',
      required: true,
      admin: {
        description: 'URL of the course banner image hosted on Supabase Storage.',
      },
    },
    {
      name: 'priceUSD',
      type: 'number',
      required: true,
      admin: {
        description: 'The flat rate cost of the course in USD (e.g. 90).',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      required: true,
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published / Active', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
    },
  ],
}
