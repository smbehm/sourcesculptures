import { timingSafeEqual, randomUUID } from 'node:crypto';

const categories = ['Eva', 'Roberto', 'Rachele', 'Daniele', 'Robert', 'Cristiana', 'Tommaso', 'Friends', 'Family', 'Locations'];
const types = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const bucket = 'eva-team-images';
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const base = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const teamKey = process.env.EVA_TEAM_UPLOAD_KEY;
  if (!base || !secret || !teamKey) return res.status(503).json({ error: 'Shared uploads are not configured on the host yet.' });
  const offered = Buffer.from(String(req.headers['x-eva-team-key'] || ''));
  const expected = Buffer.from(teamKey);
  if (offered.length !== expected.length || !timingSafeEqual(offered, expected)) return res.status(401).json({ error: 'Enter the team access key to view or upload images.' });
  const headers = { apikey: secret, Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' };
  const storage = async (path, body) => {
    const response = await fetch(`${base.replace(/\/$/, '')}/storage/v1${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!response.ok) throw new Error('Storage request failed');
    return response.json();
  };
  try {
    if (req.method === 'GET') {
      const files = [];
      for (const category of categories) {
        let offset = 0;
        while (true) {
          const batch = await storage(`/object/list/${bucket}`, { prefix: category, limit: 100, offset, sortBy: { column: 'created_at', order: 'desc' } });
          for (const file of batch) if (file.id && /\.(jpg|png|webp)$/i.test(file.name)) files.push({ path: `${category}/${file.name}`, category, name: file.name.replace(/^[0-9a-f-]+--/, ''), created_at: file.created_at });
          if (batch.length < 100) break;
          offset += 100;
        }
      }
      const signed = files.length ? await storage(`/object/sign/${bucket}`, { expiresIn: 3600, paths: files.map(f => f.path) }) : [];
      const byPath = new Map(signed.map(s => [s.path, s.signedURL]));
      return res.status(200).json({ images: files.map(f => ({ ...f, url: byPath.get(f.path) ? `${base.replace(/\/$/, '')}/storage/v1${byPath.get(f.path)}` : null })).filter(f => f.url).sort((a, b) => b.created_at.localeCompare(a.created_at)) });
    }
    if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return res.status(405).json({ error: 'Method not allowed.' }); }
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    if (!categories.includes(body.category) || !types[body.type] || !Number.isInteger(body.size) || body.size < 1 || body.size > 20 * 1024 * 1024) return res.status(400).json({ error: 'Choose a category and a JPG, PNG or WebP image up to 20 MB.' });
    const safeName = String(body.name || 'image').replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 80) || 'image';
    const path = `${body.category}/${randomUUID()}--${safeName}.${types[body.type]}`;
    const ticket = await storage(`/object/upload/sign/${bucket}/${path}`, {});
    if (!ticket.url) throw new Error('Missing upload ticket');
    const uploadUrl = ticket.url.startsWith('http') ? ticket.url : `${base.replace(/\/$/, '')}/storage/v1${ticket.url}`;
    return res.status(200).json({ uploadUrl, path });
  } catch {
    return res.status(502).json({ error: 'Shared storage is unavailable. Check the private bucket and hosting configuration.' });
  }
}
