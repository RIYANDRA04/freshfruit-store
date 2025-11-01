// server.js - FreshFruit Final Edition (Node 24+ compatible)
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 3000;
const SECRET = "freshfruit_secret_123"; // rahasia JWT

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// ------------------------
// Fake Database (JSON file)
// ------------------------
const DB_FILE = path.join(__dirname, "db.json");

function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(
      DB_FILE,
      JSON.stringify({ users: [], products: [], orders: [] }, null, 2)
    );
  }
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// ------------------------
// Helper Middleware
// ------------------------
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "Unauthorized" });
  const token = auth.split(" ")[1];
  try {
    const user = jwt.verify(token, SECRET);
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: "Token invalid" });
  }
}

// ------------------------
// API Routes
// ------------------------

// Produk sample
app.get("/api/products", (req, res) => {
  const db = loadDB();
  if (db.products.length === 0) {
    db.products = [
      {
        id: 1,
        name: "Apel Fuji",
        desc: "Apel merah segar dari Jepang",
        price: 25000,
        image:
          "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=400",
      },
      {
        id: 2,
        name: "Pisang Cavendish",
        desc: "Pisang manis bergizi tinggi",
        price: 18000,
        image:
          "https://images.unsplash.com/photo-1574226516831-e1dff420e12a?w=400",
      },
      {
        id: 3,
        name: "Jeruk Medan",
        desc: "Jeruk segar kaya vitamin C",
        price: 22000,
        image:
          "https://images.unsplash.com/photo-1615486364646-6e6be7f5e2a2?w=400",
      },
    ];
    saveDB(db);
  }
  res.json(db.products);
});

// Ambil detail produk
app.get("/api/products/:id", (req, res) => {
  const db = loadDB();
  const product = db.products.find((p) => p.id == req.params.id);
  if (!product)
    return res.status(404).json({ error: "Produk tidak ditemukan" });
  res.json(product);
});

// Register
app.post("/api/register", (req, res) => {
  const { name, email, password } = req.body;
  const db = loadDB();
  if (db.users.find((u) => u.email === email)) {
    return res.json({ error: "Email sudah terdaftar" });
  }
  const newUser = { id: Date.now(), name, email, password };
  db.users.push(newUser);
  saveDB(db);
  res.json({ user: newUser });
});

// Login
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  const db = loadDB();
  const user = db.users.find(
    (u) => u.email === email && u.password === password
  );
  if (!user) {
    return res.json({ error: "Email atau password salah" });
  }
  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    SECRET
  );
  res.json({ token, user });
});

// Me
app.get("/api/me", authMiddleware, (req, res) => {
  const db = loadDB();
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: "User tidak ditemukan" });
  res.json({ user });
});

// Orders
app.get("/api/orders", authMiddleware, (req, res) => {
  const db = loadDB();
  const orders = db.orders.filter((o) => o.userId === req.user.id);
  res.json(orders);
});

app.post("/api/orders", authMiddleware, (req, res) => {
  const { customer, items, total } = req.body;
  const db = loadDB();
  const order = {
    id: Date.now(),
    userId: req.user.id,
    name: customer.name,
    email: customer.email,
    items,
    total,
    created_at: new Date(),
  };
  db.orders.push(order);
  saveDB(db);
  res.json({ ok: true, order });
});

// Logout (dummy)
app.post("/api/logout", (req, res) => {
  res.json({ ok: true });
});

// ------------------------
// SPA Fallback (important!)
const indexPath = path.join(__dirname, "index.html");
app.use((req, res, next) => {
  if (!req.path.startsWith("/api")) {
    res.sendFile(indexPath);
  } else {
    next();
  }
});

// ------------------------
// Jalankan server
// ------------------------
app.listen(PORT, () => {
  console.log(`✅ Server berjalan di http://localhost:${PORT}`);
});
