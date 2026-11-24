import type { CollectionConfig } from 'payload'
import { isActiveCourseEditor } from '../lib/payload-access.ts'

export const Lessons: CollectionConfig = {
  slug: 'lessons',
  access: {
    admin: ({ req }) => isActiveCourseEditor(req.user),
    create: ({ req }) => isActiveCourseEditor(req.user),
    read: ({ req }) => isActiveCourseEditor(req.user),
    update: ({ req }) => isActiveCourseEditor(req.user),
    delete: ({ req }) => isActiveCourseEditor(req.user),
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'module', 'durationSeconds', 'isPreview', 'sortOrder'],
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
      name: 'durationSeconds',
      type: 'number',
      min: 0,
      admin: {
        description: 'Optional lesson duration in seconds, used in the student course outline.',
      },
    },
    {
      name: 'contentBody',
      type: 'richText',
      admin: {
        description:
          'Lesson notes with formatting tools for fonts, size, color, alignment, links, and more.',
      },
    },
    {
      name: 'quizQuestions',
      type: 'array',
      label: 'Video check-in questions',
      labels: {
        singular: 'Question',
        plural: 'Questions',
      },
      admin: {
        description:
          'Questions are shown in order during playback, once every two minutes. Only questions that fit before the video ends will be used.',
      },
      fields: [
        {
          name: 'question',
          type: 'text',
          required: true,
        },
        {
          name: 'optionA',
          type: 'text',
          label: 'Option A',
          required: true,
        },
        {
          name: 'optionB',
          type: 'text',
          label: 'Option B',
          required: true,
        },
        {
          name: 'optionC',
          type: 'text',
          label: 'Option C',
          required: true,
        },
        {
          name: 'correctOption',
          type: 'select',
          label: 'Correct option',
          required: true,
          options: [
            { label: 'Option A', value: 'A' },
            { label: 'Option B', value: 'B' },
            { label: 'Option C', value: 'C' },
          ],
        },
      ],
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
