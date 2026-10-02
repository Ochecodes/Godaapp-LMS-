import type { CollectionConfig } from 'payload'

type InstructorIdentity = {
  id: string | number
  role?: 'admin' | 'instructor'
  isActive?: boolean
}

function getInstructor(user: unknown): InstructorIdentity | null {
  if (!user || typeof user !== 'object' || !('id' in user)) return null
  return user as InstructorIdentity
}

function isAdmin(user: unknown) {
  const instructor = getInstructor(user)
  return instructor?.isActive === true && instructor.role === 'admin'
}

function isActiveInstructor(user: unknown) {
  return getInstructor(user)?.isActive === true
}

async function canCreateInstructor(req: Parameters<NonNullable<CollectionConfig['access']>['create']>[0]['req']) {
  if (isAdmin(req.user)) return true

  const existingInstructors = await req.payload.find({
    collection: 'instructors',
    limit: 1,
    overrideAccess: true,
    depth: 0,
  })

  return existingInstructors.totalDocs === 0
}

export const Instructors: CollectionConfig = {
  slug: 'instructors',
  auth: {
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'fullName', 'role', 'isActive'],
    group: 'Access',
  },
  access: {
    admin: ({ req }) => isActiveInstructor(req.user),
    create: ({ req }) => canCreateInstructor(req),
    read: ({ req }) => {
      const instructor = getInstructor(req.user)
      if (!instructor?.isActive) return false
      if (instructor.role === 'admin') return true
      return { id: { equals: instructor.id } }
    },
    update: ({ req }) => {
      const instructor = getInstructor(req.user)
      if (!instructor?.isActive) return false
      if (instructor.role === 'admin') return true
      return { id: { equals: instructor.id } }
    },
    delete: ({ req }) => isAdmin(req.user),
  },
  hooks: {
    beforeValidate: [
      async ({ data, operation, req }) => {
        if (operation !== 'create' || !data) return data

        const fullName = typeof data.fullName === 'string' ? data.fullName.trim() : '';
        const normalizedData = {
          ...data,
          fullName: fullName || (typeof data.email === 'string' ? data.email.split('@')[0] : 'Instructor'),
        };

        const existingInstructors = await req.payload.find({
          collection: 'instructors',
          limit: 1,
          overrideAccess: true,
          depth: 0,
        })

        if (existingInstructors.totalDocs === 0) {
          return { ...normalizedData, role: 'admin', isActive: true };
        }

        return normalizedData;
      },
    ],
  },
  fields: [
    {
      name: 'fullName',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'instructor',
      options: [
        { label: 'Instructor', value: 'instructor' },
        { label: 'Administrator', value: 'admin' },
      ],
      access: {
        create: ({ req }) => canCreateInstructor(req),
        update: ({ req }) => isAdmin(req.user),
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      access: {
        create: ({ req }) => canCreateInstructor(req),
        update: ({ req }) => isAdmin(req.user),
      },
    },
    {
      name: 'avatarUrl',
      type: 'text',
    },
  ],
}
