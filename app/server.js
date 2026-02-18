const http = require('http');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const PORT = process.env.PORT || 3000;
const siteDir = path.join(process.cwd(), 'site');
const dataDir = path.join(__dirname, 'data');
const dataFile = path.join(dataDir, 'store.json');

function ensureStore() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify({ users: [], campaigns: [], sessions: [] }, null, 2), 'utf-8');
  }
}

function readStore() {
  ensureStore();
  return JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
}

function writeStore(store) {
  fs.writeFileSync(dataFile, JSON.stringify(store, null, 2), 'utf-8');
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function sendFile(res, targetPath) {
  if (!fs.existsSync(targetPath) || fs.statSync(targetPath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
    return;
  }

  const ext = path.extname(targetPath).toLowerCase();
  const map = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };

  res.writeHead(200, { 'Content-Type': map[ext] || 'application/octet-stream' });
  fs.createReadStream(targetPath).pipe(res);
}

function collectJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error('Payload demasiado grande'));
      }
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error('JSON inválido'));
      }
    });
    req.on('error', reject);
  });
}

function validateCampaign(payload) {
  const errors = [];
  if (!payload.dmName || payload.dmName.trim().length < 2) errors.push('dmName es obligatorio.');
  if (!payload.dmEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.dmEmail)) errors.push('dmEmail no es válido.');
  if (!payload.title || payload.title.trim().length < 3) errors.push('title es obligatorio.');
  if (!payload.description || payload.description.trim().length < 10) errors.push('description debe tener al menos 10 caracteres.');
  if (!['online', 'presencial'].includes(payload.mode)) errors.push('mode debe ser online o presencial.');
  if (payload.mode === 'online' && (!payload.onlineUrl || !/^https?:\/\//.test(payload.onlineUrl))) errors.push('onlineUrl debe ser una URL válida para partidas online.');
  if (payload.mode === 'presencial' && (!payload.locationText || payload.locationText.trim().length < 3)) errors.push('locationText es obligatorio para partidas presenciales.');
  return errors;
}

function validateSession(payload) {
  const errors = [];
  if (!payload.startAt || Number.isNaN(Date.parse(payload.startAt))) errors.push('startAt debe ser una fecha válida.');
  if (!Number.isInteger(payload.durationMinutes) || payload.durationMinutes <= 0) errors.push('durationMinutes debe ser un entero mayor que 0.');
  if (!Number.isInteger(payload.slotsTotal) || payload.slotsTotal <= 0) errors.push('slotsTotal debe ser un entero mayor que 0.');
  if (typeof payload.pricePerPlayer !== 'number' || payload.pricePerPlayer < 0.5 || payload.pricePerPlayer > 50) errors.push('pricePerPlayer debe estar entre 0.5 y 50.');
  return errors;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === 'GET' && url.pathname === '/api/health') {
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === 'GET' && url.pathname === '/api/campaigns') {
      const store = readStore();
      const campaigns = store.campaigns.map((campaign) => ({
        ...campaign,
        sessions: store.sessions.filter((s) => s.campaignId === campaign.id)
      }));
      return sendJson(res, 200, campaigns);
    }

    if (req.method === 'POST' && url.pathname === '/api/campaigns') {
      const payload = await collectJsonBody(req);
      const errors = validateCampaign(payload);
      if (errors.length) return sendJson(res, 400, { errors });

      const store = readStore();
      let dm = store.users.find((u) => u.email.toLowerCase() === payload.dmEmail.toLowerCase());
      if (!dm) {
        dm = {
          id: randomUUID(),
          role: 'dm',
          displayName: payload.dmName.trim(),
          email: payload.dmEmail.trim().toLowerCase(),
          createdAt: new Date().toISOString()
        };
        store.users.push(dm);
      }

      const campaign = {
        id: randomUUID(),
        dmId: dm.id,
        title: payload.title.trim(),
        description: payload.description.trim(),
        mode: payload.mode,
        locationText: payload.mode === 'presencial' ? payload.locationText.trim() : null,
        onlineUrl: payload.mode === 'online' ? payload.onlineUrl.trim() : null,
        createdAt: new Date().toISOString()
      };

      store.campaigns.push(campaign);
      writeStore(store);
      return sendJson(res, 201, campaign);
    }

    const sessionRoute = url.pathname.match(/^\/api\/campaigns\/([^/]+)\/sessions$/);
    if (req.method === 'POST' && sessionRoute) {
      const campaignId = sessionRoute[1];
      const payload = await collectJsonBody(req);
      const errors = validateSession(payload);
      if (errors.length) return sendJson(res, 400, { errors });

      const store = readStore();
      const campaign = store.campaigns.find((c) => c.id === campaignId);
      if (!campaign) return sendJson(res, 404, { error: 'Campaña no encontrada.' });

      const session = {
        id: randomUUID(),
        campaignId,
        startAt: payload.startAt,
        durationMinutes: payload.durationMinutes,
        slotsTotal: payload.slotsTotal,
        pricePerPlayer: Number(payload.pricePerPlayer.toFixed(2)),
        status: 'scheduled',
        createdAt: new Date().toISOString()
      };

      store.sessions.push(session);
      writeStore(store);
      return sendJson(res, 201, session);
    }

    if (req.method === 'GET') {
      let reqPath = url.pathname === '/' ? '/index.html' : url.pathname;
      const normalized = path.normalize(reqPath).replace(/^([.][.][/\\])+/, '');
      return sendFile(res, path.join(siteDir, normalized));
    }

    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  } catch (err) {
    sendJson(res, 500, { error: err.message || 'Error interno' });
  }
});

ensureStore();
server.listen(PORT, () => {
  console.log(`Nimue mini app running on http://localhost:${PORT}`);
});
