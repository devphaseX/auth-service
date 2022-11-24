import {
  BaseEntity,
  JoinColumn,
  ObjectID,
  ObjectIdColumn,
  OneToOne,
} from 'typeorm';
import User from './user';

class Student extends BaseEntity {
  @ObjectIdColumn()
  _id!: ObjectID;

  @OneToOne(() => User)
  @JoinColumn()
  user!: User;
}

export default Student;
