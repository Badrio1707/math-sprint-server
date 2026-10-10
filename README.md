# MathSprint Server

MathSprint Server is the backend API for the MathSprint mobile
application. It is built with Node.js, Express, and MongoDB using
Mongoose. The repository includes a Vercel serverless entry point.

> **Security notice:** Before sharing or deploying this project, review
> `.env.example` and `.env.local`. The provided archive contains
> environment-related values that may be sensitive. Do not publish them.
> Replace exposed credentials and tokens, rotate any secrets that may
> have been shared, and use environment variables configured through
> your hosting provider.

## Table of Contents

-   [Technology Stack](#technology-stack)
-   [Features](#features)
-   [Requirements](#requirements)
-   [Project Setup](#project-setup)
-   [Environment Variables](#environment-variables)
-   [Run Locally](#run-locally)
-   [API Reference](#api-reference)
-   [Authentication](#authentication)
-   [Vercel Deployment](#vercel-deployment)
-   [Project Structure](#project-structure)
-   [Troubleshooting](#troubleshooting)
-   [Security Checklist](#security-checklist)

## Technology Stack

-   Node.js with ES modules
-   Express 5
-   MongoDB and Mongoose
-   JSON Web Tokens (JWT)
-   Google ID token verification using `google-auth-library`
-   `dotenv` for local environment configuration
-   Vercel serverless function support

For exact package versions, see `package.json` and `package-lock.json`.

## Features

The API source code includes:

-   Google sign-in and account creation.
-   Device-based login for a previously linked device ID.
-   JWT authentication for protected endpoints.
-   User profile persistence, including coins, IQ, contribution, stage
    level, daily login, and energy.
-   Energy regeneration and daily recovery reset logic.
-   User quest retrieval and persistence.
-   MongoDB connection caching for serverless execution.

## Requirements

-   Node.js and npm.
-   A MongoDB database, such as a MongoDB Atlas cluster.
-   A Google OAuth client ID that matches the ID token issued by the
    mobile application.
-   A secure JWT secret.
-   A Vercel account if deploying to Vercel.

## Project Setup

1.  Extract the project archive and open a terminal in the project
    directory.

2.  Install dependencies:

    ``` bash
    npm ci
    ```

3.  Create a local `.env` file based on `.env.example`.

    -   **Windows PowerShell:**

        ``` powershell
        Copy-Item .env.example .env
        ```

    -   **macOS/Linux:**

        ``` bash
        cp .env.example .env
        ```

4.  Edit `.env` and enter your own values. Do not reuse credentials that
    were included in a shared archive.

5.  Start the server using the local command described below.

### Important note about the npm scripts

The current `package.json` defines `dev` and `start` scripts that run
`server.js`, but the provided project file list does not include a
root-level `server.js`. Therefore, those scripts will not work until a
local server entry point is added or the scripts are updated.

For local development, one simple option is to add a root-level
`server.js` containing:

``` javascript
import "dotenv/config";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";

const port = process.env.PORT || 5000;

try {
  await connectDB();
  app.listen(port, () => {
    console.log(`MathSprint API listening on port ${port}`);
  });
} catch (error) {
  console.error("Failed to start MathSprint API:", error);
  process.exit(1);
}
```

After creating this file, run:

``` bash
npm run dev
```

The `dev` script uses `nodemon`; `npm start` runs Node.js directly. If
you choose a different entry point, update the scripts in `package.json`
to match it.

## Environment Variables

Configure these variables in your local `.env` file and in the hosting
provider's environment settings:

  -----------------------------------------------------------------------
  Variable                            Purpose
  ----------------------------------- -----------------------------------
  `PORT`                              Local HTTP port; defaults to `5000`
                                      in the example server entry point.

  `MONGODB_URI`                       MongoDB connection string for the
                                      MathSprint database.

  `JWT_SECRET`                        Private signing secret used to
                                      create and verify JWTs. Use a long,
                                      random value.

  `GOOGLE_CLIENT_ID`                  Google OAuth client ID used to
                                      verify Google ID tokens.
  -----------------------------------------------------------------------

Example with placeholders only:

``` dotenv
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-host>/<database>?retryWrites=true&w=majority
JWT_SECRET=replace_with_a_long_random_secret
GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
```

Replace every placeholder with a real value. Do not commit `.env`,
`.env.local`, real database credentials, JWT secrets, or provider tokens
to source control.

## Run Locally

Once a working `server.js` entry point has been added and `.env` is
configured:

``` bash
npm ci
npm run dev
```

The default local URL is:

``` text
http://localhost:5000
```

The health endpoint is `GET /`. A successful response should resemble:

``` json
{
  "success": true,
  "message": "Math Sprint API is running"
}
```

To test from a physical mobile device, use a backend URL reachable from
that device. `localhost` on a phone refers to the phone itself, not your
development computer.

## API Reference

All responses are JSON. Protected endpoints require an HTTP
`Authorization` header in this format:

``` http
Authorization: Bearer <JWT>
```

### Health Check

  Method   Endpoint   Authentication
  -------- ---------- ----------------
  `GET`    `/`        No

### Authentication

  ---------------------------------------------------------------------------------
  Method            Endpoint                   Authentication    Purpose
  ----------------- -------------------------- ----------------- ------------------
  `POST`            `/api/auth/google`         No                Verify a Google ID
                                                                 token and create
                                                                 or update a user
                                                                 account.

  `POST`            `/api/auth/device-login`   No                Issue a JWT for a
                                                                 previously
                                                                 registered device
                                                                 ID.

  `GET`             `/api/auth/profile`        Not currently     A controller
                                               registered in the function exists,
                                               supplied routes   but the route is
                                                                 not mounted in
                                                                 `authRoutes.js`.
  ---------------------------------------------------------------------------------

#### Google Login Request

`POST /api/auth/google`

``` json
{
  "id_token": "<Google ID token>",
  "device_id": "<device identifier>"
}
```

The request requires both `id_token` and `device_id`. On success, the
API returns `success`, `user`, and `token`.

#### Device Login Request

`POST /api/auth/device-login`

``` json
{
  "device_id": "<previously linked device identifier>"
}
```

The device ID must already be associated with an account. Otherwise, the
API returns `404`.

> **Security consideration:** Device-ID-only authentication is not
> strong proof of identity if a device ID can be copied or spoofed.
> Review this flow carefully before production use; consider requiring a
> stronger device-bound credential or another authentication factor.

### User Quests

Both endpoints require a valid JWT.

  -----------------------------------------------------------------------
  Method                  Endpoint                Purpose
  ----------------------- ----------------------- -----------------------
  `GET`                   `/api/user/quests`      Retrieve the
                                                  authenticated user's
                                                  quests and last reset
                                                  date.

  `POST`                  `/api/user/quests`      Save the authenticated
                                                  user's quests.
  -----------------------------------------------------------------------

#### Save Quests Request

`POST /api/user/quests`

``` json
{
  "quests": [],
  "last_reset_date": "YYYY-MM-DD"
}
```

`quests` must be an array. `last_reset_date` is optional and defaults to
`null`.

### User Profile

Both endpoints require a valid JWT.

  -----------------------------------------------------------------------
  Method                  Endpoint                Purpose
  ----------------------- ----------------------- -----------------------
  `GET`                   `/api/user-profile`     Retrieve or create the
                                                  authenticated user's
                                                  profile and process
                                                  energy regeneration.

  `POST`                  `/api/user-profile`     Save profile data and
                                                  process energy
                                                  regeneration.
  -----------------------------------------------------------------------

The profile response includes fields such as `coin`, `holded_coin`,
`iq`, `contribute`, `stage_level`, `daily_login`, and `energy`.

Example request body:

``` json
{
  "coin": 0,
  "holded_coin": 0,
  "iq": 0,
  "contribute": 0,
  "stage_level": 1,
  "daily_login": {
    "streak": 0,
    "last_login": null,
    "claimed_today": false
  },
  "energy": {
    "current": 10,
    "max": 10,
    "last_recovery_at": null,
    "max_recovery": 5,
    "recover_left": 5,
    "recovery_reset_date": "YYYY-MM-DD"
  }
}
```

The controller sanitizes numeric profile values and applies defaults.
Test profile updates carefully to ensure client-submitted values cannot
be used to grant unauthorized coins, energy, or progression in a
production game. Important game rewards should be validated and
calculated on the server.

## Authentication

Protected routes use JWT authentication:

1.  The client signs in with Google or uses the device-login endpoint.
2.  The server returns a JWT.
3.  The client sends the JWT as a Bearer token for protected endpoints.
4.  The middleware verifies the token using `JWT_SECRET` and loads the
    corresponding user from MongoDB.

The token lifetime is configured as **30 days** in
`src/utils/generateToken.js`. Review whether that duration meets your
security requirements.

## Vercel Deployment

The repository contains `api/index.js` and `vercel.json` for Vercel
deployment.

1.  Import the repository into Vercel.
2.  Configure these environment variables in the Vercel project
    settings:
    -   `MONGODB_URI`
    -   `JWT_SECRET`
    -   `GOOGLE_CLIENT_ID`
3.  Do not upload `.env.local` or paste provider tokens into source
    code.
4.  Deploy the project.
5.  Test the deployment's root health endpoint and API routes.
6.  Configure the mobile application's API base URL to point to the
    deployed server.

The supplied `vercel.json` rewrites requests to `api/index.js`. Verify
the final routes and database connection behavior in the deployed
environment.

## Project Structure

``` text
.
├── api/
│   └── index.js                    # Vercel serverless entry point
├── src/
│   ├── app.js                      # Express app and route mounting
│   ├── config/
│   │   └── db.js                   # MongoDB connection and connection cache
│   ├── controllers/
│   │   ├── authController.js       # Google and device login
│   │   ├── questController.js      # Quest persistence
│   │   └── userProfileController.js# Profile persistence
│   ├── middleware/
│   │   └── authMiddleware.js       # JWT verification
│   ├── models/
│   │   ├── User.js                 # User schema
│   │   ├── UserProfile.js          # Player profile and energy
│   │   └── UserQuest.js            # Quest schema
│   ├── routes/
│   │   ├── authRoutes.js            # Authentication routes
│   │   ├── questRoutes.js           # Quest routes
│   │   └── userProfileRoutes.js     # Profile routes
│   ├── services/
│   │   └── googleService.js         # Google ID token verification
│   └── utils/
│       └── generateToken.js         # JWT creation
├── .env.example                     # Environment variable template
├── package.json                     # Dependencies and scripts
├── package-lock.json                # npm lockfile
└── vercel.json                      # Vercel routing configuration
```

## Troubleshooting

### `MONGODB_URI is missing`

Make sure `.env` exists locally and contains `MONGODB_URI`. On Vercel,
configure the variable in the project's environment settings and
redeploy.

### MongoDB Connection Fails

-   Verify the connection string and database user.
-   Ensure your MongoDB network access rules permit the deployed
    environment.
-   Check that the database user has the required permissions.
-   Review the deployment logs without exposing credentials.

### Google Login Returns an Error

-   Confirm that the ID token is valid and has not expired.
-   Ensure `GOOGLE_CLIENT_ID` matches the expected audience of the
    token.
-   Check the Google OAuth configuration and the client application's
    sign-in setup.

### Protected Endpoints Return `401`

-   Confirm that the client sends `Authorization: Bearer <JWT>`.
-   Check that the token has not expired.
-   Ensure the server uses the same `JWT_SECRET` for issuing and
    verifying tokens.

### `npm run dev` or `npm start` Cannot Find `server.js`

The provided file list does not contain a root-level `server.js`,
although the scripts reference it. Add the local entry point shown in
[Project Setup](#project-setup), or update the scripts to match your
actual entry point.

## Security Checklist

-   Rotate any database password, JWT secret, OAuth credentials, or
    provider token that may have been exposed.
-   Replace sensitive values in `.env.example` with placeholders.
-   Remove `.env.local` from shared archives and ensure it is ignored by
    Git.
-   Keep production secrets in your hosting provider's environment
    settings.
-   Restrict CORS to trusted origins where appropriate; the current
    Express app enables CORS without an origin restriction.
-   Validate request payloads and enforce authorization on every
    protected endpoint.
-   Review device-ID-only login before using it for production accounts.
-   Calculate valuable game rewards on the server instead of trusting
    client-submitted balances.
-   Add rate limiting and monitoring to public authentication endpoints
    before production use.
-   Test API endpoints, authentication failure cases, and database
    behavior before release.

## Project Status

This README documents the source files present in the supplied archive.
It does not certify that the server has been deployed or that every
endpoint has been tested. Verify local startup, database connectivity,
authentication, and deployed API routes in your own environment.
