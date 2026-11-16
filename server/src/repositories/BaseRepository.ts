import { isValidObjectId, type Model, type QueryFilter, type UpdateQuery } from 'mongoose';

type SortSpec = Record<string, 1 | -1>;

// Repository pattern: services talk to these classes instead of to Mongoose,
// so the data layer can change without touching business logic.
// The generic base covers plain CRUD, subclasses add the specific queries.
export class BaseRepository<T> {
  constructor(protected readonly model: Model<T>) {}

  async findById(id: string) {
    // a malformed id can never match, so skip the round trip
    if (!isValidObjectId(id)) return null;
    return this.model.findById(id);
  }

  async findOne(filter: QueryFilter<T>) {
    return this.model.findOne(filter);
  }

  async find(filter: QueryFilter<T> = {}, sort: SortSpec = { createdAt: -1 }) {
    return this.model.find(filter).sort(sort);
  }

  async create(data: Partial<T>) {
    return this.model.create(data);
  }

  async updateById(id: string, update: UpdateQuery<T>) {
    if (!isValidObjectId(id)) return null;
    // runValidators so updates follow the same schema rules as creates
    return this.model.findByIdAndUpdate(id, update, {
      returnDocument: 'after',
      runValidators: true,
    });
  }

  async deleteById(id: string) {
    if (!isValidObjectId(id)) return null;
    return this.model.findByIdAndDelete(id);
  }

  async count(filter: QueryFilter<T> = {}) {
    return this.model.countDocuments(filter);
  }
}
