import type { CollectionConfig } from 'payload'
import { isActiveCourseEditor } from '../lib/payload-access.ts'

export const Modules: CollectionConfig = {
  slug: 'modules',
  access: {
    admin: ({ req }) => isActiveCourseEditor(req.user),
    create: ({ req }) => isActiveCourseEditor(req.user),
    read: ({ req }) => isActiveCourseEditor(req.user),
    update: ({ req }) => isActiveCourseEditor(req.user),
    delete: ({ req }) => isActiveCourseEditor(req.user),
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'course', 'sortOrder'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'course',
      type: 'relationship',
      relationTo: 'courses',
      required: true,
      index: true,
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 1,
      required: true,
      admin: {
        description: 'Controls the display order of modules within the course.',
      },
    },
  ],
}
