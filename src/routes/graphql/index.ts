import { ApolloServer, ExpressContext } from 'apollo-server-express';
import {
  ApolloServerPluginLandingPageGraphQLPlayground,
  Config,
} from 'apollo-server-core';

type TypeSource = Config<ExpressContext>['typeDefs'];
type Resolver = Config<ExpressContext>['resolvers'];

const typeDefs = `
    type Query {
        totalPosts: Int!
    }
`;

//resolvers
const resolvers = {
  Query: {
    totalPosts: () => 42,
  },
};

const apolloServer = new ApolloServer({
  csrfPrevention: true,
  cache: 'bounded',
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
});

export type { TypeSource, Resolver };
export default apolloServer;
