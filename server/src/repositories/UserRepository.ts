import { BaseRepository } from './BaseRepository';
import { UserModel, type IUser } from '../models/User';

export class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(UserModel);
  }

  findByGoogleId(googleId: string) {
    return this.model.findOne({ googleId });
  }

  findByEmail(email: string) {
    return this.model.findOne({ email: email.toLowerCase() });
  }

  findOwners() {
    return this.model.find({ role: 'owner' });
  }
}
