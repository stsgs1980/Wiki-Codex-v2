import { z } from 'zod'

export const createDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  content: z.string().min(1, 'Content is required'),
  fileName: z.string().max(500).optional(),
  fileType: z.enum(['md', 'txt', 'html', 'pdf', 'json', 'js', 'ts', 'py', 'yaml', 'yml', 'toml', 'xml', 'css']).default('md'),
  fileSize: z.number().int().min(0).default(0),
  categoryId: z.string().nullable().optional(),
  tagIds: z.array(z.string()).optional(),
})

export const updateDocumentSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  content: z.string().optional(),
  summary: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  tagIds: z.array(z.string()).optional(),
  isStarred: z.boolean().optional(),
})

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color').default('#78716c'),
  sortOrder: z.number().int().min(0).optional(),
})

export const createTagSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color').default('#78716c'),
})

export const createNoteSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(500),
  content: z.string().default(''),
})

export const updateNoteSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  content: z.string().optional(),
})

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(20),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  tagId: z.string().optional(),
  starred: z.enum(['true', 'false']).optional(),
})

export const semanticSearchSchema = z.object({
  query: z.string().min(1).max(1000),
  limit: z.number().int().min(1).max(50).default(10),
})

export const relatedDocumentsSchema = z.object({
  documentId: z.string().min(1),
  limit: z.number().int().min(1).max(20).default(5),
})

export const parseTermsSchema = z.object({
  content: z.string().min(1),
  documentId: z.string().min(1),
})

export const deleteByIdSchema = z.object({
  id: z.string().min(1),
})
