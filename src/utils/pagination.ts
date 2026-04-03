export function parsePagination(query: { page?: string; limit?: string }) {
  const page = Math.max(Number(query.page ?? 1), 1);
  const limit = Math.min(Math.max(Number(query.limit ?? 10), 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function paginationMeta(page: number, limit: number, total: number) {
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
}
