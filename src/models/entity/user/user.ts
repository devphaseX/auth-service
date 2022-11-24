import {
  Column,
  Entity,
  CreateDateColumn,
  ObjectIdColumn,
  ObjectID,
  BaseEntity,
  OneToMany,
} from 'typeorm';
import RefreshToken from '../Token/RefreshToken';

export enum Role {
  USER = 'student',
  CREATOR = 'creator',
  ADMIN = 'admin',
}

type ISODateString = string;
type TimeInMilliseconds = number;
type DateOfBirth = Date | ISODateString | TimeInMilliseconds;

type AccountMethodType = 'email' | 'google' | 'apple';

@Entity('user')
class User extends BaseEntity implements UserInfo {
  @ObjectIdColumn()
  _id!: ObjectID;

  @Column({ nullable: false, type: 'string' })
  first_name!: string;

  @Column({ type: 'string' })
  last_name!: string;

  @Column({ type: 'string', unique: true })
  email!: string;

  @Column({ type: 'bool', default: false })
  email_verified!: boolean;
  @Column({ type: 'date' })
  dateOfBirth!: DateOfBirth;

  @Column({ nullable: true, type: 'string' })
  username?: string;

  @CreateDateColumn({ type: 'date' })
  created_at!: Date | string;

  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role?: Role;

  @Column()
  password?: string;

  @Column()
  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshToken!: Array<RefreshToken>;

  @Column()
  registrationType!: AccountMethodType;
}

interface UserInfo {
  _id: ObjectID;
  first_name: string;
  last_name: string;
  username?: string;
  role?: Role;
  age?: number;
  email: string;
  created_at: Date | string;
  password?: string;
  registrationType: AccountMethodType;
}

interface UserFormCredential extends UserInfo {
  repeat_password?: string;
}

export type { AccountMethodType, UserFormCredential, UserInfo };

export default User;
