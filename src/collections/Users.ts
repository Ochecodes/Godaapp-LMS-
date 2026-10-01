import { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true, // Configures native Payload Admin panel authentication fields
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'fullName', 'role'],
  },
  fields: [
    {
      name: 'supabase_uid',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'The corresponding secure account UUID linked from Supabase Auth.',
      },
    },
    {
      name: 'fullName',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      defaultValue: 'student',
      required: true,
      options: [
        { label: 'Student Enrollee', value: 'student' },
        { label: 'Registered Affiliate', value: 'affiliate' },
        { label: 'Course Instructor', value: 'instructor' },
        { label: 'System Admin', value: 'admin' },
      ],
    },
    {
      name: 'avatarUrl',
      type: 'text',
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
    },
  ],
}
