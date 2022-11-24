import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ObjectID,
  ObjectIdColumn,
} from 'typeorm';

@Entity('resetToken')
class ResetToken extends BaseEntity {
  @ObjectIdColumn()
  _id!: ObjectID;

  @Column()
  userId!: ObjectID;

  @Column()
  resetToken!: string;
  @CreateDateColumn()
  createdAt!: Date;

  @Column()
  expiredAt!: Date;
}

export default ResetToken;
