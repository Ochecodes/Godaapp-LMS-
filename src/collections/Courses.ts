import type { CollectionConfig } from 'payload'
import { isActiveCourseEditor } from '../lib/payload-access.ts'

export const Courses: CollectionConfig = {
  slug: 'courses',
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if (
          operation === 'create' &&
          data &&
          typeof data.priceUSD === 'number' &&
          data.priceUSD > 0 &&
          typeof data.originalPriceUSD !== 'number'
        ) {
          return { ...data, originalPriceUSD: data.priceUSD * 2 }
        }
        return data
      },
    ],
  },
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
      min: 0,
      admin: {
        description: 'The flat rate cost of the course in USD (e.g. 90).',
      },
    },
    {
      name: 'originalPriceUSD',
      label: 'Original price (USD)',
      type: 'number',
      min: 0,
      admin: {
        description:
          'Editable original price shown crossed out. Defaults to twice the current price (50% off).',
      },
      validate: (value: unknown, { siblingData }: { siblingData: { priceUSD?: unknown } }) => {
        if (value === undefined || value === null) return true
        const priceUSD = siblingData.priceUSD
        if (typeof value !== 'number' || typeof priceUSD !== 'number' || priceUSD <= 0) {
          return 'Set an original price only for paid courses.'
        }
        return value > priceUSD
          ? true
          : 'The original price must be greater than the current price.'
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
    {
      name: 'liveClasses',
      type: 'array',
      labels: {
        singular: 'Live class',
        plural: 'Live classes',
      },
      admin: {
        description: 'Schedule Google Meet sessions for students enrolled in this course.',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          admin: {
            description: 'For example, Weekly Q&A or Module 2 review.',
          },
        },
        {
          name: 'instructorName',
          type: 'text',
          admin: {
            description: 'Instructor name displayed to enrolled students for this session.',
          },
        },
        {
          name: 'meetingUrl',
          type: 'text',
          required: true,
          validate: (value: unknown) => {
            if (typeof value !== 'string') return 'Enter a Google Meet link.'

            try {
              const url = new URL(value)
              return url.protocol === 'https:' && url.hostname === 'meet.google.com'
                ? true
                : 'Use a secure Google Meet link from meet.google.com.'
            } catch {
              return 'Enter a valid Google Meet link.'
            }
          },
          admin: {
            description: 'Only active students enrolled in this course can see this link.',
          },
        },
        {
          name: 'startsAt',
          type: 'date',
          required: true,
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
              displayFormat: 'MMM d, yyyy h:mm a',
            },
            description: 'The scheduled start time.',
          },
        },
        {
          name: 'endsAt',
          type: 'date',
          required: true,
          validate: (value: unknown, { siblingData }) => {
            if (typeof value !== 'string') return 'Enter the scheduled end time.'
            const startsAt: unknown = Reflect.get(siblingData, 'startsAt')
            if (typeof startsAt !== 'string') return true
            return Date.parse(value) > Date.parse(startsAt)
              ? true
              : 'The end time must be after the start time.'
          },
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
              displayFormat: 'MMM d, yyyy h:mm a',
            },
            description: 'The scheduled end time.',
          },
        },
      ],
    },
  ],
}
