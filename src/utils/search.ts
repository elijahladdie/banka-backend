import type { Prisma } from "@prisma/client";

type SearchMode = "contains" | "startsWith" | "endsWith";

type SearchOptions = {
  query?: string;
  fields: string[];
  mode?: SearchMode;
};

export function generateSearchConditions({
  query,
  fields,
  mode = "contains"
}: SearchOptions): Prisma.UserWhereInput {
  if (!query) {
    return {};
  }

  return {
    OR: fields.map((field) => ({
      [field]: {
        [mode]: query,
        mode: "insensitive"
      }
    })) as Prisma.UserWhereInput[]
  };
}
