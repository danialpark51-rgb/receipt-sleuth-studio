# Running ReceiptIQ on Replit

This project uses Bun, Vite, React, TypeScript, TanStack Start, and Supabase.

- Install the locked dependencies with `bun install --frozen-lockfile`.
- Start the app with `bun run dev -- --host 0.0.0.0 --port 5000`.
- Build the production app with `bun run build`.
- Start the production server with `bun run start`.
- Run the automated tests with `bun run test`.

The Replit Publishing configuration uses an Autoscale Node.js deployment with `bun run build` and `bun run start`. The production server reads the existing `.env` file; never put private keys in client-side variables. Receipt extraction runs on the server through the Lovable AI Gateway and still requires `LOVABLE_API_KEY` to be configured as a Replit Secret.
