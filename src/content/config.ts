import { defineCollection, z } from "astro:content";

const showcase = defineCollection({
  type: "data",
  schema: z.object({
    title: z.string().min(1),
    image: z.string().optional(),
    url: z.string(),
    featured: z.number().min(1).optional(),
    section: z.enum(["proyectos", "conceptos", "vibecoding"]).optional(),
    specialPage: z.boolean().optional(),
    description: z.array(z.string()).optional(),
    technologies: z.array(z.string()).optional(),
    images: z.array(z.string()).optional(),
    demoUrl: z.string().optional(),
    demoLabel: z.string().optional(),
    thumbsCount: z.number().optional(),
  }),
});

const skills = defineCollection({
  type: "data",
  schema: z.object({
    items: z.array(
      z.object({
        title: z.string(),
        icon: z.string(),
        url: z.string(),
      })
    ),
  }),
});

const timeline = defineCollection({
  type: "data",
  schema: z.object({
    entries: z.array(
      z.object({
        title: z.string(),
        subtitle: z.string(),
        period: z.string(),
      })
    ),
  }),
});

export const collections = {
  showcase,
  skills,
  timeline,
};
