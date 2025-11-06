// ENV
require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// --- DB (Postgres) ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === 'disable' ? false : { rejectUnauthorized: false }
});


async function initDb() {
 
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users(
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE,
      email TEXT,
      password TEXT
    );
  `);

  
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'password'
      ) THEN
        ALTER TABLE users ADD COLUMN password TEXT;
      END IF;
    END$$;
  `);

  
  const { rows } = await pool.query(`SELECT COUNT(*)::int AS c FROM users;`);
  if (rows[0].c === 0) {
    await pool.query(`
      INSERT INTO users(username,email,password) VALUES
      ('admin','admin@example.com', NULL),
      ('user','user@example.com',  NULL);
    `);
  }
}
initDb().catch(e => { console.error('DB init error:', e); process.exit(1); });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { httpOnly: true }
}));

// --- flags ---
const FLAGS = {
  XSS_ENABLED: true,                 // reflektirani XSS demo
  INSECURE_STORAGE_ENABLED: true     // true = pohrana lozinke u plaintextu (NESIGURNO)
};

// --- health ---
app.get('/api/health', async (req,res)=>{
  try { await pool.query('SELECT 1'); res.json({ok:true}); }
  catch (e) { res.status(500).json({ok:false, error:String(e)}); }
});

// --- flags API ---
app.get('/api/flags', (req,res)=> res.json(FLAGS));
app.post('/api/toggle', (req,res)=>{
  const { key } = req.body || {};
  if (key in FLAGS) FLAGS[key] = !FLAGS[key];
  res.json(FLAGS);
});

// --- XSS echo (reflected) ---
app.post('/api/xss/echo', (req,res)=>{
  const { text } = req.body || {};
  res.json({ ok:true, text: String(text || '') });
});


app.post('/api/register', async (req,res)=>{
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ ok:false, error:'missing_fields' });

  try {
    let toStore = password;
    if (!FLAGS.INSECURE_STORAGE_ENABLED) {
      const saltRounds = 12;
      toStore = await bcrypt.hash(password, saltRounds);
    }
    const result = await pool.query(
  `INSERT INTO users(username,email,password)
   VALUES ($1,$2,$3) RETURNING id`,
  [username, `${username}@example.com`, toStore]
);
   
    res.json({ ok:true, id: result.rows[0].id });
  } catch (e) {
    res.status(500).json({ ok:false, error:String(e) });
  }
});


app.get('/api/storage/users', async (req,res)=>{
  try {
    const { rows } = await pool.query(
      'SELECT username, password FROM users ORDER BY id DESC LIMIT 50'
    );
    res.json(rows || []);
  } catch (e) {
    res.status(500).json({ ok:false, error:String(e) });
  }
});


const clientDist = path.join(__dirname, '..', 'vite-project-client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req,res)=> res.sendFile(path.join(clientDist, 'index.html')));
}else {
  // Dev poruka samo ako nema builda
  app.get('/', (req, res) => res.send('API radi. Frontend u devu: http://localhost:5173'));
}

app.listen(PORT, ()=> console.log('Listening on http://localhost:'+PORT));
