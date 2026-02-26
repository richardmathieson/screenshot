# SnapBlob 📸

Screenshot capture & upload to [Vercel Blob Storage](https://vercel.com/docs/storage/vercel-blob) — in one click.

## What it does

1. Click **Take Screenshot** → browser prompts you to pick a screen, window, or tab
2. Preview the capture
3. Click **Upload to Vercel Blob** → image is uploaded directly to your Blob store
4. Copy the public URL and share it

No server-side upload routes needed — uploads go straight from the browser to Vercel's Blob API using your read/write token.

## Setup

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/snapblob.git
cd snapblob
npm install
```

### 2. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Note:** Screen capture requires HTTPS in most browsers. `localhost` is an exception, so it works in dev. For any other domain, deploy with HTTPS.

### 3. Deploy to Vercel

Push to GitHub, then import the repo on [vercel.com/new](https://vercel.com/new). That's it — zero config needed.

Or use the CLI:

```bash
npx vercel
```

## Getting your Blob token

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Storage** → **Create** → **Blob**
3. Open your Blob store → **Tokens**
4. Generate a **read/write token**
5. Paste it into SnapBlob's **Settings** tab

The token is kept in browser memory only — it's never persisted or stored anywhere. Each user brings their own token.

## For other users

Just share the deployed URL. Each person pastes their own `BLOB_READ_WRITE_TOKEN` in Settings and uploads to their own Blob store. No environment variables or backend config needed.

## Tech stack

- [Next.js 14](https://nextjs.org/) (App Router)
- [Screen Capture API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Capture_API)
- [Vercel Blob REST API](https://vercel.com/docs/storage/vercel-blob/using-blob-sdk#client-uploads) (direct client PUT)

## License

MIT
