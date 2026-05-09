# KnowBetter

A mobile-first birthday party social discovery game built with Next.js.

## What the game is about

KnowBetter helps guests get to know each other and the birthday person through conversation.

Players uncover answers by talking, listening to stories, and connecting clues during the party. The goal is to open conversations, not to quiz people directly.

Players can try each answer as many times as they want.

Using a hint is permanent and lowers the maximum score for that question from `1` point to `0.75` point.

## Data storage

During local development, the app stores state in `data/game-state.json`.

On Vercel, the app requires durable Redis REST storage. Recommended setup:

1. Add Upstash Redis from the Vercel Marketplace.
2. Configure:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
3. Deploy the app.

With Redis configured, player data is stored under keys like `knowbetter:player:<normalized-name>` and survives function restarts and new releases.

`KNOWBETTER_STORAGE_PREFIX` can be used to separate environments such as production and preview.

Without Redis on Vercel, the app intentionally throws an error instead of pretending the deployment filesystem is persistent.

## Admin panel

The admin panel is available at `/admin`.

Default credentials:

- username: `admin`
- password: `admin30`

Optional environment overrides:

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`

The admin panel lets you:

- review players sorted by progress
- clear one player's progress
- delete a player
- clear the entire game state
- close the game
- draw up to 3 winners, one by one, based on their lottery tickets

When the game is closed, active player records are cleared and the lottery pool is frozen for the final draw.
