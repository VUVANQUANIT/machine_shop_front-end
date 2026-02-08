/**
 * Vercel serverless entry for Angular SSR.
 * Imports the built Express app and forwards (req, res).
 */
export default async function handler(req, res) {
  const { app } = await import('../dist/machine-shop-frontend/server/server.mjs');
  const server = app();
  return new Promise((resolve, reject) => {
    res.on('finish', resolve);
    res.on('error', reject);
    server(req, res);
  });
}
