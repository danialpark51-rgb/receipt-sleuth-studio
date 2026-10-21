# Running ReceiptIQ on Replit

This project uses Bun, Vite, React, TypeScript, TanStack Start, and Supabase.

- Install the locked dependencies with `bun install --frozen-lockfile`.
- Start the app with `bun run dev -- --host 0.0.0.0 --port 5000`.
- Build the production app with `npm run build`.
- Start the production server with `npm run start`.
- Run the automated tests with `bun run test`.
- Create a production build with `bun run build`.

The Replit Publishing configuration uses an Autoscale Node.js deployment with `npm run build` and `npm run start`. The production server reads the existing `.env` file; never put private keys in client-side variables. Receipt extraction runs on the server through the Lovable AI Gateway and still requires `LOVABLE_API_KEY` to be configured as a Replit Secret.
