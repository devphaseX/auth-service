import { BaseEntity, Column, Entity, ObjectID, ObjectIdColumn } from 'typeorm';

@Entity('GoogleRegistratedAccount')
class GoogleRegistratedAccount extends BaseEntity {
  @ObjectIdColumn()
  _id!: ObjectID;

  @Column()
  googleId!: string;

  @Column()
  email!: string;

  @Column()
  userId!: ObjectID;
}

export default GoogleRegistratedAccount;
