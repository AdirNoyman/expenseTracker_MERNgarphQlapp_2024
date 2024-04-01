import express from 'express';
import http from 'http';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import mergedResolvers from './resolvers/index.js';
import mergedTypeDefs from './typeDefs/index.js';
import dotenv from 'dotenv';
import { connectDB } from './db/connectDB.js';
import passport from 'passport';
import session from 'express-session';
import connectMongo from 'connect-mongodb-session';
import { buildContext } from 'graphql-passport';

// Load environment variables
dotenv.config();

// Required logic for integrating with Express
const app = express();
// Our httpServer handles incoming requests to our Express app.
// Below, we tell Apollo Server to "drain" this httpServer,
// enabling our servers to shut down gracefully.
const httpServer = http.createServer(app);

// Create store for storing sessions data in our MongoDB
const MongoDBStore = connectMongo(session);
const store = new MongoDBStore({
  uri: process.env.MONGO_URI,
  collection: 'sessions',
});

// If an error occurs, log it
store.on('error', (err) =>
  console.log('Error in MongoDB session store: ' + err)
);

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false, // Don't save session on every request
    saveUninitialized: false, // option specifying whether to save uninitialized sesssions. meaning don't save empty sessions objects
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // one week (7 days)
      httpOnly: true, // This cookie is http only cookie
    },
    store: store,
  })
);

app.use(passport.initialize());
app.use(passport.session());

const server = new ApolloServer({
  typeDefs: mergedTypeDefs,
  resolvers: mergedResolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

// Ensure we wait for our server to start
await server.start();

// Set up our Express middleware to handle CORS, body parsing,
// and our expressMiddleware function.
app.use(
  '/',
  cors({
    // What client can call my server
    origin: 'http://localhost:3000',
    // The client is allowed to pass credentials like cookies
    credentials: true,
  }),
  express.json(),
  // expressMiddleware accepts the same arguments:
  // an Apollo Server instance and optional configuration options
  expressMiddleware(server, {
    context: async ({ req }) => buildContext({ req, res }),
  })
);

// Modified server startup
await new Promise((resolve) => httpServer.listen({ port: 4000 }, resolve));

// Start connection to MonogDB
await connectDB();

console.log(`🚀 Server ready at http://localhost:4000/`);
