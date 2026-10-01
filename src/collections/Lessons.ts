import { CollectionConfig } from 'payload'

export const Lessons: CollectionConfig = {
  slug: 'lessons',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'module', 'isPreview', 'sortOrder'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'module',
      type: 'relationship',
      relationTo: 'modules',
      required: true,
      index: true,
    },
    {
      name: 'youtubeVideoId',
      type: 'text',
      required: true,
      admin: {
        description: 'The alphanumeric string from the YouTube URL (e.g., dQw4w9WgXcQ).',
      },
    },
    {
      name: 'contentBody',
      type: 'richText',
      admin: {
        description: 'Detailed lesson notes, code snippets, or reading materials.',
      },
    },
    {
      name: 'isPreview',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Check this box if this lesson is part of the 3 free preview lessons.',
      },
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 1,
      required: true,
      admin: {
        description: 'Controls the logical reading sequence of lessons within this chapter module.',
      },
    },
  ],
}
