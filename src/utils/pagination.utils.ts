import { SortOrder } from 'mongoose';

export interface PaginationResult<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export async function paginate<T>(
  model: any,
  page: number = 1,
  limit: number = 10,
  filter: object = {},
  sort:
    | string
    | { [key: string]: SortOrder | { $meta: any } }
    | [string, SortOrder][]
    | undefined
    | null = { _id: 1 },
  populate?: string | string[],
): Promise<PaginationResult<T>> {
  const skip = (page - 1) * limit;

  let query = model.find(filter).sort(sort).skip(skip).limit(limit);

  if (populate) {
    query = query.populate(populate);
  }
  const [data, total] = await Promise.all([
    query.exec(),
    model.countDocuments(filter),
  ]);
  return {
    data,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
