/* app.js - FreshFruit Final Edition dengan Struk Checkout & Print */

const API = {
  base: "http://localhost:3000/api",
  async getProducts() {
    return fetch(`${this.base}/products`).then((r) => r.json());
  },
  async register({ name, email, password }) {
    return fetch(`${this.base}/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    }).then((r) => r.json());
  },
  async login({ email, password }) {
    return fetch(`${this.base}/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    }).then((r) => r.json());
  },
  async me(token) {
    return fetch(`${this.base}/me`, {
      headers: token ? { Authorization: "Bearer " + token } : {},
    }).then((r) => r.json());
  },
  async createOrder(token, payload) {
    return fetch(`${this.base}/orders`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(token ? { Authorization: "Bearer " + token } : {}),
      },
      body: JSON.stringify(payload),
    }).then((r) => r.json());
  },
  async getOrders(token) {
    return fetch(`${this.base}/orders`, {
      headers: { Authorization: "Bearer " + token },
    }).then((r) => r.json());
  },
  async logout(token) {
    return fetch(`${this.base}/logout`, {
      method: "POST",
      headers: { Authorization: "Bearer " + token },
    }).then((r) => r.json());
  },
};

// ===== Helper =====
const $ = (s) => document.querySelector(s);
const $all = (s) => Array.from(document.querySelectorAll(s));

// ===== SweetAlert Helper =====
function showAlert(icon, title, text = "") {
  Swal.fire({
    icon,
    title,
    text,
    showConfirmButton: false,
    timer: 1800,
    background: "#fff",
    color: "#333",
    timerProgressBar: true,
  });
}
function showConfirm(text, cb) {
  Swal.fire({
    title: "Konfirmasi",
    text,
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#4CAF50",
    cancelButtonColor: "#aaa",
    confirmButtonText: "Ya",
    cancelButtonText: "Batal",
  }).then((r) => r.isConfirmed && cb());
}

// ===== Cart =====
const CART_KEY = "ff_cart_v1";
const loadCart = () => JSON.parse(localStorage.getItem(CART_KEY) || "[]");
const saveCart = (items) =>
  localStorage.setItem(CART_KEY, JSON.stringify(items));
const cart = {
  items: () => loadCart(),
  add(p) {
    const items = loadCart();
    items.push({ ...p, quantity: 1 });
    saveCart(items);
    updateCartCount();
    showAlert("success", "Ditambahkan!", "Produk masuk ke keranjang");
  },
  remove(i) {
    const items = loadCart();
    items.splice(i, 1);
    saveCart(items);
    updateCartCount();
    showAlert("info", "Produk dihapus");
  },
  clear() {
    saveCart([]);
    updateCartCount();
  },
};
function updateCartCount() {
  const c = cart.items().length;
  $("#cart-count") && ($("#cart-count").innerText = c);
}

// ===== Auth =====
const AuthClient = {
  TOKEN_KEY: "ff_token",
  USER_KEY: "ff_user",
  set(t, u) {
    localStorage.setItem(this.TOKEN_KEY, t);
    localStorage.setItem(this.USER_KEY, JSON.stringify(u));
  },
  clear() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  },
  token() {
    return localStorage.getItem(this.TOKEN_KEY);
  },
  user() {
    try {
      return JSON.parse(localStorage.getItem(this.USER_KEY));
    } catch {
      return null;
    }
  },
};

// ===== Router =====
const router = {
  routes: {},
  init() {
    window.addEventListener("hashchange", () =>
      this.render(window.location.hash || "#/")
    );
    $("#year").innerText = new Date().getFullYear();
    this.register("/", renderHome);
    this.register("/shop", renderShop);
    this.register("/cart", renderCart);
    this.register("/checkout", renderCheckout);
    this.register("/login", renderAuth);
    this.register("/orders", renderOrders);
    this.register("/about", renderAbout);
    if (!window.location.hash) {
      const token = AuthClient.token();
      window.location.hash = token ? "#/" : "#/login";
    }
    this.render(window.location.hash);
    updateCartCount();
    updateLoginButton();
  },
  register(p, f) {
    this.routes[p] = f;
  },
  navigate(h) {
    window.location.hash = h;
  },
  render(hash) {
    const path = hash.replace("#", "").split("?")[0] || "/";
    const fn = this.routes[path];
    const view = $("#view");
    const token = AuthClient.token();
    const publicPages = ["/login", "/about"];
    if (!token && !publicPages.includes(path)) {
      window.location.hash = "#/login";
      return;
    }
    view.innerHTML = "";
    fn ? fn(view) : (view.innerHTML = "<h2>Not Found</h2>");
  },
};

// ===== Login Button =====
function updateLoginButton() {
  const btn = $("#btn-login");
  if (!btn) return;
  const user = AuthClient.user();
  btn.style.pointerEvents = "auto";
  btn.style.cursor = "pointer";
  if (user) {
    btn.innerText = `Logout (${user.name?.split(" ")[0] || user.email})`;
    btn.onclick = () =>
      showConfirm("Yakin ingin logout?", () => {
        API.logout(AuthClient.token()).catch(() => {});
        AuthClient.clear();
        updateLoginButton();
        router.navigate("#/login");
        showAlert("success", "Berhasil logout!");
      });
  } else {
    btn.innerText = "Login";
    btn.onclick = () => router.navigate("#/login");
  }
}

// ===== Render Pages =====
function renderHome(c) {
  renderShop(c);
}

function renderShop(c) {
  const tpl = $("#tpl-shop").content.cloneNode(true);
  c.appendChild(tpl);
  const prodNode = c.querySelector("#products");
  API.getProducts().then((products) => {
    prodNode.innerHTML = "";
    products.forEach((p) => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <img src="${p.image}" />
        <h3>${p.name}</h3>
        <div class="small-muted">${p.desc}</div>
        <div class="price">Rp ${p.price}</div>
        <div style="margin-top:0.6rem"><button class="btn green" data-id="${p.id}">Tambah ke Keranjang</button></div>`;
      prodNode.appendChild(card);
    });
  });
  prodNode.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-id]");
    if (!b) return;
    const id = Number(b.dataset.id);
    fetch(`${API.base}/products/${id}`)
      .then((r) => r.json())
      .then((p) => cart.add(p));
  });
  c.querySelector("#open-cart").addEventListener("click", () =>
    router.navigate("#/cart")
  );
}

function renderCart(c) {
  const tpl = $("#tpl-cart").content.cloneNode(true);
  c.appendChild(tpl);
  const list = c.querySelector("#cart-list");
  const items = cart.items();
  if (!items.length) {
    list.innerHTML = '<div class="small-muted">Keranjang kosong</div>';
    c.querySelector("#to-checkout").style.display = "none";
    return;
  }
  list.innerHTML = "";
  items.forEach((it, i) => {
    const n = document.createElement("div");
    n.className = "order-card";
    n.innerHTML = `
      <div style="display:flex;gap:1rem;align-items:center">
        <img src="${it.image}" style="width:72px;height:72px;border-radius:8px;object-fit:cover"/>
        <div><div style="font-weight:600">${it.name}</div><div class="small-muted">Rp ${it.price}</div></div>
      </div>
      <button class="btn" data-remove="${i}">Hapus</button>`;
    list.appendChild(n);
  });
  list.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-remove]");
    if (!b) return;
    cart.remove(Number(b.dataset.remove));
    renderCart(c);
  });
  const total = items.reduce((s, it) => s + Number(it.price || 0), 0);
  $("#cart-total").innerText = "Rp " + total;
  $("#to-checkout").addEventListener("click", () =>
    router.navigate("#/checkout")
  );
}

function renderCheckout(container) {
  const tpl = document.createElement("div");
  tpl.className = "checkout-page fade-in";
  tpl.innerHTML = `
    <div class="checkout-container">
      <h2 class="checkout-title">🧾 Checkout Pesanan</h2>
      <div class="checkout-content">
        <form id="checkout-form" class="checkout-form">
          <div class="form-group">
            <label>Nama Lengkap</label>
            <input type="text" name="name" placeholder="Masukkan nama lengkap" required />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" name="email" placeholder="Masukkan email aktif" required />
          </div>
          <div class="form-group">
            <label>Alamat Pengiriman</label>
            <textarea name="address" placeholder="Masukkan alamat lengkap" rows="3" required></textarea>
          </div>
          <button type="submit" class="btn green btn-submit">💚 Buat Pesanan</button>
        </form>

        <div class="checkout-summary">
          <h3>Ringkasan Pesanan</h3>
          <div id="summary-items"></div>
          <div class="summary-total"><strong>Total:</strong> <span id="summary-total">Rp 0</span></div>
        </div>
      </div>
    </div>`;
  container.appendChild(tpl);

  const form = tpl.querySelector("#checkout-form");
  const user = AuthClient.user();
  if (user) {
    form.querySelector("input[name=name]").value = user.name;
    form.querySelector("input[name=email]").value = user.email;
  }

  const items = cart.items();
  const summaryNode = tpl.querySelector("#summary-items");
  const totalNode = tpl.querySelector("#summary-total");
  if (!items.length) {
    summaryNode.innerHTML = '<div class="small-muted">Keranjang kosong</div>';
    form.querySelector(".btn-submit").disabled = true;
    return;
  }

  summaryNode.innerHTML = items
    .map(
      (it) => `
    <div class="summary-item">
      <img src="${it.image}" alt="${it.name}" />
      <div class="summary-info">
        <div>${it.name}</div>
        <div class="small-muted">Rp ${it.price}</div>
      </div>
    </div>`
    )
    .join("");
  const total = items.reduce((s, it) => s + Number(it.price || 0), 0);
  totalNode.innerText = "Rp " + total.toLocaleString("id-ID");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const payload = {
      customer: {
        name: fd.get("name"),
        email: fd.get("email"),
        address: fd.get("address"),
      },
      items,
      total,
    };
    const token = AuthClient.token();
    Swal.fire({
      title: "Memproses pesanan...",
      text: "Mohon tunggu sebentar",
      allowOutsideClick: false,
      didOpen: Swal.showLoading,
    });

    API.createOrder(token, payload)
      .then((resp) => {
        Swal.close();
        if (resp && resp.ok) {
          cart.clear();
          const date = new Date().toLocaleString("id-ID");
          const productsList = items
            .map((it) => `• ${it.name} - Rp ${it.price}`)
            .join("<br>");
          const receiptHTML = `
            <div id="receipt-content" style="text-align:left;font-size:0.95rem;line-height:1.6;">
              <b>Nama:</b> ${payload.customer.name}<br>
              <b>Email:</b> ${payload.customer.email}<br>
              <b>Alamat:</b> ${payload.customer.address}<br><hr>
              <b>Produk:</b><br>${productsList}<hr>
              <b>Total:</b> Rp ${payload.total.toLocaleString("id-ID")}<br>
              <b>Tanggal:</b> ${date}
            </div>`;
          Swal.fire({
            title: "🧾 Struk Pesanan Anda",
            html: `${receiptHTML}<br><button id="printReceipt" class="swal2-confirm swal2-styled" style="background:#4CAF50;">🖨️ Cetak Struk</button>`,
            icon: "success",
            showConfirmButton: true,
            confirmButtonText: "Selesai",
            confirmButtonColor: "#4CAF50",
            width: 420,
            didRender: () => {
              document
                .getElementById("printReceipt")
                .addEventListener("click", () => {
                  const printWindow = window.open("", "_blank");
                  printWindow.document.write(`
                  <html><head><title>Struk Pesanan</title>
                  <style>
                    body{font-family:Arial;padding:20px;}
                    h2{text-align:center;color:#4CAF50;}
                    hr{margin:10px 0;}
                    .footer{margin-top:20px;text-align:center;font-size:12px;color:gray;}
                  </style></head><body>
                    <h2>🧾 Struk Pembelian FreshFruit</h2>
                    ${receiptHTML}
                    <div class="footer">Terima Kasih Telah Berbelanja Di FreshFruit Riyan Store Mohon Ditunggu Pesanannya</div>
                  </body></html>`);
                  printWindow.document.close();
                  printWindow.print();
                });
            },
          }).then(() => router.navigate("#/orders"));
        } else showAlert("error", "Gagal membuat pesanan", resp.error || "");
      })
      .catch(() => {
        Swal.close();
        showAlert("error", "Tidak dapat terhubung ke server");
      });
  });
}

// ===== Auth & Orders =====
function renderAuth(c) {
  const tpl = $("#tpl-login").content.cloneNode(true);
  c.appendChild(tpl);
  let mode = "login";
  const t = $("#auth-title"),
    f = $("#auth-form"),
    toggle = $("#toggle-auth");
  const updateUI = () => {
    t.innerText = mode === "login" ? "Masuk ke Akun" : "Buat Akun Baru";
    toggle.innerText =
      mode === "login" ? "Belum punya akun? Daftar" : "Sudah punya akun? Masuk";
    f.querySelector("button[type=submit]").innerText =
      mode === "login" ? "Masuk" : "Daftar";
  };
  updateUI();
  toggle.onclick = () => {
    mode = mode === "login" ? "register" : "login";
    updateUI();
  };
  f.onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(f);
    const email = fd.get("email"),
      password = fd.get("password");
    if (mode === "register") {
      const name = prompt("Nama lengkap untuk pendaftaran:") || "Pembeli";
      const res = await API.register({ name, email, password });
      res.user
        ? (showAlert("success", "Akun berhasil dibuat!"),
          (mode = "login"),
          updateUI(),
          f.reset())
        : showAlert("error", res.error || "Gagal daftar");
    } else {
      const res = await API.login({ email, password });
      res.token
        ? (AuthClient.set(res.token, res.user),
          showAlert("success", "Berhasil login!"),
          updateLoginButton(),
          router.navigate("#/"))
        : showAlert("error", res.error || "Email atau password salah");
    }
  };
}

function renderOrders(c) {
  const tpl = $("#tpl-orders").content.cloneNode(true);
  c.appendChild(tpl);
  const list = c.querySelector("#orders-list");
  API.getOrders(AuthClient.token()).then((o) => {
    if (!o.length) {
      list.innerHTML = '<div class="small-muted">Belum ada pesanan</div>';
      return;
    }
    list.innerHTML = "";
    o.forEach((x) => {
      const n = document.createElement("div");
      n.className = "order-card glow";
      n.innerHTML = `
        <div class="order-header"><b>${x.name}</b><span>Selesai</span></div>
        <div class="order-body">
          <div>Email: ${x.email}</div>
          <div>Tanggal: ${new Date(x.created_at).toLocaleString()}</div>
          <div class="order-total">Total: Rp ${x.total}</div>
        </div>`;
      list.appendChild(n);
    });
  });
}

function renderAbout(c) {
  const tpl = $("#tpl-about").content.cloneNode(true);
  c.appendChild(tpl);
}

window.addEventListener("load", () => {
  router.init();
  updateLoginButton();
});
