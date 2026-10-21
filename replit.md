# Running ReceiptIQ on Replit

This project uses Bun, Vite, React, TypeScript, TanStack Start, and Supabase.

- Install the locked dependencies with `bun install --frozen-lockfile`.
- Start the app with `bun run dev -- --host 0.0.0.0 --port 5000`.
- Run the automated tests with `bun run test`.
- Create a production build with `bun run build`.

Receipt extraction runs on the server through the Lovable AI Gateway. Supabase and AI provider configuration must be available through the Replit environment; never put private keys in client-side variables.
