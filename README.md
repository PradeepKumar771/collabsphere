# CollabSphere

CollabSphere is an advanced-specialized remote creator collaboration and portfolio network.

## Project Structure

This monorepo adheres to the following layout:

```
advanced-specialized-app/
├── client/ (React + TypeScript + PWA)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── graphql/ (GraphQL queries)
│   │   ├── serviceWorker.ts (PWA)
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── public/
│   │   └── manifest.json (PWA manifest)
│   ├── package.json
│   └── tsconfig.json
├── server/ (Node.js + GraphQL + TypeScript)
│   ├── src/
│   │   ├── graphql/
│   │   │   ├── schema/
│   │   │   ├── resolvers/
│   │   │   └── typeDefs.ts
│   │   ├── serverless/ (Serverless functions)
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── functions/ (Cloud Functions - optional)
├── mobile/ (React Native - optional)
├── docs/
├── .github/workflows/
└── README.md
```

## Running the Application

In the root directory, you can run:

- `npm run dev` to start both the server and client in development mode.
- `npm run dev:client` to run only the frontend.
- `npm run dev:server` to run only the backend.
