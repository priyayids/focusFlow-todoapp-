import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Initialize SQLite database
const db = new sqlite3.Database(path.join(dataDir, 'focusflow.db'), (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Database connected');
    db.serialize(() => {
      // Notes table
      db.run(`CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        isPinned BOOLEAN DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
      
      // Tasks table
      db.run(`CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        priority TEXT DEFAULT 'medium',
        dueDate TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Meetings table
      db.run(`CREATE TABLE IF NOT EXISTS meetings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        date TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, () => {
         // Seed data if empty
         db.get('SELECT COUNT(*) as count FROM tasks', [], (err, row: any) => {
           if (row && row.count === 0) {
             db.run(`INSERT INTO tasks (title, status, priority, dueDate) VALUES ('Finalize Q3 Marketing Report', 'pending', 'high', '2026-08-10')`);
             db.run(`INSERT INTO tasks (title, status, priority, dueDate) VALUES ('Review Design System Updates', 'pending', 'medium', '2026-08-08')`);
             db.run(`INSERT INTO tasks (title, status, priority, dueDate) VALUES ('Daily Standup Prep', 'done', 'low', '2026-08-05')`);
             
             db.run(`INSERT INTO notes (content, isPinned) VALUES ('Project Alpha Ideas\nBrainstorming session notes for the new onboarding flow...', 1)`);
             db.run(`INSERT INTO notes (content, isPinned) VALUES ('Weekly Review\n- Finished Q2 goals.\n- Need to schedule 1:1s.', 0)`);
           }
         });
      });
    });
  }
});

// API Routes - Notes
app.get('/api/notes', (req, res) => {
  db.all('SELECT * FROM notes ORDER BY createdAt ASC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/notes', (req, res) => {
  const { content, isPinned = false } = req.body;
  db.run('INSERT INTO notes (content, isPinned) VALUES (?, ?)', [content, isPinned], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, content, isPinned });
  });
});

app.put('/api/notes/:id', (req, res) => {
  const { content, isPinned } = req.body;
  const { id } = req.params;
  db.run('UPDATE notes SET content = COALESCE(?, content), isPinned = COALESCE(?, isPinned) WHERE id = ?', [content, isPinned, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id, content, isPinned });
  });
});

app.delete('/api/notes/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM notes WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id });
  });
});

// API Routes - Tasks
app.get('/api/tasks', (req, res) => {
  db.all('SELECT * FROM tasks ORDER BY createdAt DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/tasks', (req, res) => {
  const { title, status = 'pending', priority = 'medium', dueDate = '' } = req.body;
  db.run('INSERT INTO tasks (title, status, priority, dueDate) VALUES (?, ?, ?, ?)', [title, status, priority, dueDate], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, title, status, priority, dueDate });
  });
});

app.put('/api/tasks/:id', (req, res) => {
  const { title, status, priority, dueDate } = req.body;
  const { id } = req.params;
  db.run('UPDATE tasks SET title = COALESCE(?, title), status = COALESCE(?, status), priority = COALESCE(?, priority), dueDate = COALESCE(?, dueDate) WHERE id = ?', [title, status, priority, dueDate, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id, title, status, priority, dueDate });
  });
});

app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM tasks WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id });
  });
});

// API Routes - Meetings
app.get('/api/meetings', (req, res) => {
  db.all('SELECT * FROM meetings ORDER BY date ASC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/meetings', (req, res) => {
  const { title, date } = req.body;
  db.run('INSERT INTO meetings (title, date) VALUES (?, ?)', [title, date], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, title, date });
  });
});

app.put('/api/meetings/:id', (req, res) => {
  const { title, date } = req.body;
  const { id } = req.params;
  db.run('UPDATE meetings SET title = COALESCE(?, title), date = COALESCE(?, date) WHERE id = ?', [title, date, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id, title, date });
  });
});

app.delete('/api/meetings/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM meetings WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id });
  });
});

// Serve static frontend in production
if (process.env.NODE_ENV === 'production' || fs.existsSync(path.join(__dirname, 'client/dist'))) {
  app.use(express.static(path.join(__dirname, 'client/dist')));
  app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, 'client/dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
