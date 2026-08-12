const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.PORT || '8080', 10);
const DB_PATH = process.env.DATABASE_PATH ? path.resolve(process.env.DATABASE_PATH) : path.join(__dirname, 'safecook.db');

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.apk': 'application/vnd.android.package-archive'
};

const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync(DB_PATH);

// Initialize SQLite schema
db.exec(`
  CREATE TABLE IF NOT EXISTS sensor_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gas_ppm REAL NOT NULL,
    temp_c REAL,
    recorded_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    severity TEXT NOT NULL,
    title TEXT NOT NULL,
    desc TEXT,
    action TEXT,
    icon TEXT,
    acknowledged INTEGER DEFAULT 0,
    timestamp INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS family_members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT,
    avatar TEXT,
    status TEXT,
    invited_phone TEXT,
    invited_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS testers (
    invite_code TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT,
    sensor_json TEXT
  );

  CREATE TABLE IF NOT EXISTS emergency_contacts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    relation TEXT,
    notify INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS sensor_state (
    id INTEGER PRIMARY KEY DEFAULT 1,
    data_json TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY,
    type TEXT NOT NULL,
    category TEXT,
    name TEXT NOT NULL,
    emoji TEXT,
    tagline TEXT,
    time TEXT,
    servings TEXT,
    difficulty TEXT,
    flame_level TEXT,
    safety_tip TEXT,
    ingredients_json TEXT,
    steps_json TEXT,
    nutrition_json TEXT,
    chef_tip TEXT
  );

  CREATE TABLE IF NOT EXISTS analytics_data (
    id INTEGER PRIMARY KEY DEFAULT 1,
    safety_score INTEGER NOT NULL,
    weekly_data_json TEXT NOT NULL,
    gas_consumption_json TEXT NOT NULL,
    monthly_report_json TEXT NOT NULL,
    leak_dates_json TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS db_info (
    key TEXT PRIMARY KEY,
    val TEXT
  );
`);

function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        resolve({});
      }
    });
    req.on('error', err => reject(err));
  });
}

const server = http.createServer(async (req, res) => {
  console.log(`${req.method} ${req.url}`);

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // API router
  if (req.url.startsWith('/api/')) {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY'
    });
    
    if (req.url === '/api/data' && req.method === 'GET') {
      try {
        const initCheck = db.prepare("SELECT val FROM db_info WHERE key = 'initialized'").get();
        if (!initCheck || initCheck.val !== 'true') {
          res.end(JSON.stringify({ initialized: false }));
          return;
        }

        // Fetch alerts
        const alertsRows = db.prepare("SELECT * FROM alerts ORDER BY timestamp DESC").all();
        const alerts = alertsRows.map(a => ({
          id: a.id,
          type: a.type,
          severity: a.severity,
          title: a.title,
          desc: a.desc,
          action: a.action,
          icon: a.icon,
          acknowledged: a.acknowledged === 1,
          timestamp: a.timestamp
        }));

        // Fetch family members
        const familyRows = db.prepare("SELECT * FROM family_members").all();
        const familyMembers = familyRows.map(m => ({
          id: m.id,
          name: m.name,
          role: m.role,
          avatar: m.avatar,
          status: m.status,
          invitedPhone: m.invited_phone,
          invitedAt: m.invited_at
        }));

        // Fetch testers
        const testerRows = db.prepare("SELECT * FROM testers").all();
        const testerIds = testerRows.map(t => ({
          inviteCode: t.invite_code,
          email: t.email,
          name: t.name,
          role: t.role,
          sensor: JSON.parse(t.sensor_json)
        }));

        // Fetch emergency contacts
        const contactRows = db.prepare("SELECT * FROM emergency_contacts").all();
        const emergencyContacts = contactRows.map(c => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          relation: c.relation,
          notify: c.notify === 1
        }));

        // Fetch recipes
        const recipeRows = db.prepare("SELECT * FROM recipes").all();
        const recipes = recipeRows.map(r => ({
          id: r.id,
          type: r.type,
          category: r.category,
          name: r.name,
          emoji: r.emoji,
          tagline: r.tagline,
          time: r.time,
          servings: r.servings,
          difficulty: r.difficulty,
          flameLevel: r.flame_level,
          safetyTip: r.safety_tip,
          ingredients: JSON.parse(r.ingredients_json),
          steps: JSON.parse(r.steps_json),
          nutrition: JSON.parse(r.nutrition_json),
          chefTip: r.chef_tip
        }));

        // Fetch analytics
        const analyticsRow = db.prepare("SELECT * FROM analytics_data WHERE id = 1").get();
        let analyticsData = {};
        if (analyticsRow) {
          analyticsData = {
            safetyScore: analyticsRow.safety_score,
            weeklyData: JSON.parse(analyticsRow.weekly_data_json),
            gasConsumption: JSON.parse(analyticsRow.gas_consumption_json),
            monthlyReport: JSON.parse(analyticsRow.monthly_report_json),
            leakDates: JSON.parse(analyticsRow.leak_dates_json)
          };
        }

        // Fetch current sensor state
        const sensorRow = db.prepare("SELECT * FROM sensor_state WHERE id = 1").get();
        const sensorState = sensorRow ? JSON.parse(sensorRow.data_json) : null;

        // Fetch gas & temp history (last 60 entries)
        const historyRows = db.prepare(`
          SELECT gas_ppm, temp_c FROM (
            SELECT id, gas_ppm, temp_c FROM sensor_history ORDER BY id DESC LIMIT 60
          ) ORDER BY id ASC
        `).all();
        const gasHistory = historyRows.map(h => h.gas_ppm);
        const tempHistory = historyRows.map(h => h.temp_c);

        res.end(JSON.stringify({
          initialized: true,
          alerts,
          familyMembers,
          testerIds,
          emergencyContacts,
          recipes,
          analyticsData,
          sensorState,
          gasHistory,
          tempHistory
        }));
      } catch (err) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    if (req.url === '/api/initialize' && req.method === 'POST') {
      try {
        const body = await getRequestBody(req);
        
        const insertAlert = db.prepare(`
          INSERT OR REPLACE INTO alerts (id, type, severity, title, desc, action, icon, acknowledged, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const insertFamily = db.prepare(`
          INSERT OR REPLACE INTO family_members (id, name, role, avatar, status, invited_phone, invited_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        const insertTester = db.prepare(`
          INSERT OR REPLACE INTO testers (invite_code, email, name, role, sensor_json)
          VALUES (?, ?, ?, ?, ?)
        `);
        const insertContact = db.prepare(`
          INSERT OR REPLACE INTO emergency_contacts (id, name, phone, relation, notify)
          VALUES (?, ?, ?, ?, ?)
        `);
        const insertRecipe = db.prepare(`
          INSERT OR REPLACE INTO recipes (id, type, category, name, emoji, tagline, time, servings, difficulty, flame_level, safety_tip, ingredients_json, steps_json, nutrition_json, chef_tip)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const insertHistory = db.prepare(`
          INSERT INTO sensor_history (gas_ppm, temp_c, recorded_at)
          VALUES (?, ?, ?)
        `);

        db.exec('BEGIN TRANSACTION');
        try {
          // Clear any existing tables
          db.prepare('DELETE FROM alerts').run();
          db.prepare('DELETE FROM family_members').run();
          db.prepare('DELETE FROM testers').run();
          db.prepare('DELETE FROM emergency_contacts').run();
          db.prepare('DELETE FROM recipes').run();
          db.prepare('DELETE FROM sensor_history').run();
          db.prepare('DELETE FROM sensor_state').run();
          db.prepare('DELETE FROM analytics_data').run();

          // 1. Alerts
          if (body.alerts) {
            for (const a of body.alerts) {
              insertAlert.run(a.id, a.type, a.severity, a.title, a.desc, a.action, a.icon, a.acknowledged ? 1 : 0, a.timestamp);
            }
          }

          // 2. Family Members
          if (body.familyMembers) {
            for (const m of body.familyMembers) {
              insertFamily.run(m.id, m.name, m.role, m.avatar, m.status, m.invitedPhone || null, m.invitedAt || null);
            }
          }

          // 3. Testers
          if (body.testerIds) {
            for (const t of body.testerIds) {
              insertTester.run(t.inviteCode, t.email, t.name, t.role, JSON.stringify(t.sensor));
            }
          }

          // 4. Emergency Contacts
          if (body.emergencyContacts) {
            for (const c of body.emergencyContacts) {
              insertContact.run(c.id, c.name, c.phone, c.relation, c.notify ? 1 : 0);
            }
          }

          // 5. Recipes
          if (body.recipes) {
            for (const r of body.recipes) {
              insertRecipe.run(
                r.id, r.type, r.category || '', r.name, r.emoji || '', r.tagline || '', r.time || '', 
                r.servings || '', r.difficulty || '', r.flameLevel || '', r.safetyTip || '', 
                JSON.stringify(r.ingredients || []), JSON.stringify(r.steps || []), 
                JSON.stringify(r.nutrition || {}), r.chefTip || ''
              );
            }
          }

          // 6. Analytics Data
          if (body.analyticsData) {
            const ad = body.analyticsData;
            db.prepare(`
              INSERT OR REPLACE INTO analytics_data (id, safety_score, weekly_data_json, gas_consumption_json, monthly_report_json, leak_dates_json)
              VALUES (1, ?, ?, ?, ?, ?)
            `).run(
              ad.safetyScore,
              JSON.stringify(ad.weeklyData || []),
              JSON.stringify(ad.gasConsumption || []),
              JSON.stringify(ad.monthlyReport || {}),
              JSON.stringify(ad.leakDates || [])
            );
          }

          // 7. Sensor State
          if (body.sensorState) {
            db.prepare(`
              INSERT OR REPLACE INTO sensor_state (id, data_json, updated_at)
              VALUES (1, ?, ?)
            `).run(JSON.stringify(body.sensorState), Date.now());
          }

          // 8. History Seed (gasHistory & tempHistory)
          const gasLen = body.gasHistory ? body.gasHistory.length : 0;
          const tempLen = body.tempHistory ? body.tempHistory.length : 0;
          const maxLen = Math.max(gasLen, tempLen);
          const startMs = Date.now() - (maxLen * 2000);
          for (let i = 0; i < maxLen; i++) {
            const gas = body.gasHistory ? (body.gasHistory[i] || 40) : 40;
            const temp = body.tempHistory ? (body.tempHistory[i] || 28) : 28;
            insertHistory.run(gas, temp, startMs + (i * 2000));
          }

          // Mark initialized
          db.prepare("INSERT OR REPLACE INTO db_info (key, val) VALUES ('initialized', 'true')").run();
          
          db.exec('COMMIT');
          res.end(JSON.stringify({ status: 'success' }));
        } catch (txErr) {
          db.exec('ROLLBACK');
          throw txErr;
        }
      } catch (err) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    if (req.url === '/api/sensor-data' && req.method === 'POST') {
      try {
        const sensorState = await getRequestBody(req);
        const initCheck = db.prepare("SELECT val FROM db_info WHERE key = 'initialized'").get();
        if (!initCheck || initCheck.val !== 'true') {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Database not initialized' }));
          return;
        }

        // 1. Upsert sensor state
        db.prepare(`
          INSERT OR REPLACE INTO sensor_state (id, data_json, updated_at)
          VALUES (1, ?, ?)
        `).run(JSON.stringify(sensorState), Date.now());

        // 2. Insert into history
        db.prepare(`
          INSERT INTO sensor_history (gas_ppm, temp_c, recorded_at)
          VALUES (?, ?, ?)
        `).run(sensorState.gasLevel, sensorState.temperature, Date.now());

        // 3. Maintain sliding window of 60 points
        const countRow = db.prepare("SELECT COUNT(*) as count FROM sensor_history").get();
        if (countRow.count > 65) {
          db.prepare(`
            DELETE FROM sensor_history WHERE id IN (
              SELECT id FROM sensor_history ORDER BY id DESC LIMIT -1 OFFSET 60
            )
          `).run();
        }

        // 4. Retrieve latest 60 history points to send back
        const historyRows = db.prepare(`
          SELECT gas_ppm, temp_c FROM (
            SELECT id, gas_ppm, temp_c FROM sensor_history ORDER BY id DESC LIMIT 60
          ) ORDER BY id ASC
        `).all();
        const gasHistory = historyRows.map(h => h.gas_ppm);
        const tempHistory = historyRows.map(h => h.temp_c);

        res.end(JSON.stringify({
          status: 'success',
          gasHistory,
          tempHistory
        }));
      } catch (err) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    if (req.url === '/api/alerts' && req.method === 'POST') {
      try {
        const a = await getRequestBody(req);
        db.prepare(`
          INSERT OR REPLACE INTO alerts (id, type, severity, title, desc, action, icon, acknowledged, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(a.id, a.type, a.severity, a.title, a.desc, a.action, a.icon, a.acknowledged ? 1 : 0, a.timestamp);
        res.end(JSON.stringify({ status: 'success' }));
      } catch (err) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    if (req.url === '/api/alerts/ack' && req.method === 'POST') {
      try {
        const payload = await getRequestBody(req);
        db.prepare("UPDATE alerts SET acknowledged = 1 WHERE id = ?").run(payload.id);
        res.end(JSON.stringify({ status: 'success' }));
      } catch (err) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    if (req.url === '/api/family' && req.method === 'POST') {
      try {
        const m = await getRequestBody(req);
        db.prepare(`
          INSERT OR REPLACE INTO family_members (id, name, role, avatar, status, invited_phone, invited_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(m.id, m.name, m.role, m.avatar, m.status, m.invitedPhone || null, m.invitedAt || null);
        res.end(JSON.stringify({ status: 'success' }));
      } catch (err) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    // Unhandled API
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not Found' }));
    return;
  }

  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);

  // Prevent directory traversal
  if (!filePath.startsWith(__dirname)) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.statusCode = 404;
        res.end('File Not Found');
      } else {
        res.statusCode = 500;
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-cache' });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`SafeCook Pro Preview Server running at http://localhost:${PORT}`);
});
