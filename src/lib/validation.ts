import { z } from "zod";
import { LOCALES } from "./i18n/messages";

const colorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color must be a hex value like #6366f1");
const nameSchema = z.string().trim().min(1, "Name is required").max(40, "Name is too long");

export const languageSchema = z.enum(LOCALES);

const translationsSchema = z
  .array(
    z.object({
      language: languageSchema,
      title: z.string().trim().max(200, "Title is too long").default(""),
      content: z.string().min(1, "Content is required").max(50_000, "Content is too long"),
    }),
  )
  .max(LOCALES.length)
  .refine(
    (list) => new Set(list.map((item) => item.language)).size === list.length,
    "Each language can only appear once",
  );

const promptFields = {
  title: z.string().trim().min(1, "Title is required").max(200, "Title is too long"),
  content: z.string().min(1, "Content is required").max(50_000, "Content is too long"),
  description: z.string().trim().max(500, "Description is too long"),
  categoryId: z.string().min(1).nullable(),
  tagIds: z.array(z.string().min(1)).max(20, "At most 20 tags per prompt"),
  isFavorite: z.boolean(),
  language: languageSchema,
  translations: translationsSchema,
};

export const createPromptSchema = z.object({
  title: promptFields.title,
  content: promptFields.content,
  description: promptFields.description.default(""),
  categoryId: promptFields.categoryId.default(null),
  tagIds: promptFields.tagIds.default([]),
  isFavorite: promptFields.isFavorite.default(false),
  language: promptFields.language.default("en"),
  translations: promptFields.translations.default([]),
});

export const updatePromptSchema = z
  .object(promptFields)
  .partial()
  .refine((value) => Object.keys(value).length > 0, "Nothing to update");

export const sortSchema = z.enum(["newest", "oldest", "most-used", "alphabetical"]);
export const viewSchema = z.enum(["all", "favorites", "recent", "trash"]);

export const listPromptsSchema = z.object({
  q: z.string().trim().max(200).optional(),
  categoryId: z.string().min(1).optional(),
  tagId: z.string().min(1).optional(),
  view: viewSchema.default("all"),
  sort: sortSchema.default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(24),
});

export const createTagSchema = z.object({
  name: nameSchema,
  color: colorSchema.default("#6366f1"),
});
export const updateTagSchema = z
  .object({ name: nameSchema, color: colorSchema })
  .partial()
  .refine((value) => Object.keys(value).length > 0, "Nothing to update");
export const createCategorySchema = z.object({ name: nameSchema });

export const exportFormatSchema = z.enum(["md", "txt"]);

export const importSchema = z.object({
  app: z.literal("promptdeck"),
  version: z.literal(1),
  categories: z.array(z.string().trim().min(1).max(40)).default([]),
  tags: z.array(z.object({ name: nameSchema, color: colorSchema.default("#6366f1") })).default([]),
  prompts: z
    .array(
      z.object({
        title: promptFields.title,
        content: promptFields.content,
        description: promptFields.description.default(""),
        category: z.string().trim().min(1).max(40).nullable().default(null),
        tags: z.array(nameSchema).max(20).default([]),
        isFavorite: z.boolean().default(false),
        language: languageSchema.default("en"),
        translations: translationsSchema.default([]),
        usageCount: z.number().int().min(0).default(0),
        createdAt: z.iso.datetime().optional(),
        updatedAt: z.iso.datetime().optional(),
      }),
    )
    .max(10_000),
});

export type CreatePromptInput = z.infer<typeof createPromptSchema>;
export type UpdatePromptInput = z.infer<typeof updatePromptSchema>;
export type ListPromptsQuery = z.infer<typeof listPromptsSchema>;
export type ImportPayload = z.infer<typeof importSchema>;
