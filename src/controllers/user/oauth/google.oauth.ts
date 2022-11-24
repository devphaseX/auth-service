import type { PassportStatic, Profile } from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { env } from '../../../config/env';
import User, { Role } from '../../../models/entity/user/user';
import { getGoogleOAuthRepo } from '../../../models/repos';
import getUserRespository from '../../../models/repos/user.repo';
import { addCreationType, noop } from '../../../util';

export default function setGoogleStrategy(passport: PassportStatic) {
  passport.serializeUser(function (user, done) {
    done(null, (user as any).id);
  });

  passport.deserializeUser(async function (id: string, done) {
    const [GoogleOAuthRepo, UserRepo] = await Promise.all([
      getGoogleOAuthRepo(),
      getUserRespository(),
    ]);
    const oauth = await GoogleOAuthRepo.findOneBy({ googleId: id });

    if (oauth) {
      const user = await UserRepo.findOneBy({ _id: oauth.userId });
      if (user) done(null, user);
    }
    return done(new Error('Cannot find user'), null);
  });

  function deduceUserFullname(
    displayName: string
  ): Pick<User, 'first_name' | 'last_name'> | null {
    const name = displayName.split(/\s+/);
    if (name.length < 2) return null;
    return { first_name: name[1], last_name: name[0] };
  }

  type GoogleVerifiedProfile = NonNullable<Profile['emails']>[number] & {
    verified?: boolean;
  };

  function getGoogleAuthRegRequirements(profile: Profile) {
    if (!profile.emails?.length) {
      throw new TypeError('No email was attached to the google profile');
    }
    const { value: email, verified: emailStatus } = profile
      .emails[0] as GoogleVerifiedProfile;
    return {
      email,
      email_verified: emailStatus ?? false,
      username: profile.displayName,
      role: Role.USER,
      ...deduceUserFullname(profile.displayName),
    };
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: 'http://localhost:5050/auth/google/callback',
        passReqToCallback: true,
      },
      async function (req, _query, __, profile, done) {
        const [GoogleOAuthRepo, UserRepo] = await Promise.all([
          getGoogleOAuthRepo(),
          getUserRespository(),
        ]);
        const googleProfile = await GoogleOAuthRepo.findOneBy({
          googleId: profile.id,
        });

        if (googleProfile)
          return done(
            null,
            (req.user = (await UserRepo.findOneBy({
              _id: googleProfile.userId,
            }))!)
          );

        const minimalProfileData = getGoogleAuthRegRequirements(profile);
        async function recoverFailedAccountCreation() {
          await Promise.allSettled(
            [UserRepo, GoogleOAuthRepo].map(async (Repo) => {
              const user = await Repo.findOneBy({
                email: minimalProfileData.email,
              });
              return user && user.remove();
            })
          ).catch(noop);
        }
        try {
          const newUser = (req.user = await UserRepo.create(
            addCreationType(minimalProfileData, 'google')
          ).save());
          await GoogleOAuthRepo.create({
            email: minimalProfileData.email,
            userId: newUser._id,
            googleId: profile.id,
          }).save();
          return done(null, newUser);
        } catch (e) {
          await recoverFailedAccountCreation();
          return done(e as unknown as Error);
        }
      }
    )
  );
}
