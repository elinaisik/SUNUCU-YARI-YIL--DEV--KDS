// EXPRESS SETUP
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const app = express();

// MIDDLEWARE
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// AUTH MIDDLEWARE
const { authenticateToken, authenticateTokenAPI } = require("./middleware/auth");

// ROUTES
const { getHome } = require("./routes/homeRoutes");
const { getComplaints } = require("./routes/complaintRoutes");
const { getProductAnalysis } = require("./routes/productRoutes");
const { getDepartmentAnalysis } = require("./routes/departmentRoutes");
const { getSimulationPage, getSimulationData } = require("./routes/simulationRoutes");
const { getLoginPage, register, login, logout, getCurrentUser } = require("./routes/authRoutes");

// EJS AYARLARI
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// STATIC DOSYALAR
app.use(express.static(path.join(__dirname, "public")));

// ----------------------------------------------------------------------
// 📌 ROUTE TANIMLARI
// ----------------------------------------------------------------------

// AUTH ROUTES (Korumasız)
app.get("/login", getLoginPage);
app.post("/api/register", register);
app.post("/api/login", login);
app.get("/logout", logout);
app.get("/api/current-user", authenticateTokenAPI, getCurrentUser);

// PROTECTED ROUTES (Giriş gerekli)
// Anasayfa
app.get("/", authenticateToken, getHome);

// Şikayetler Sayfası
app.get("/sikayetler", authenticateToken, getComplaints);

// Ürün Analiz API
app.get("/urun-analiz", authenticateTokenAPI, getProductAnalysis);

// Departman Analiz API
app.get("/departman-analiz", authenticateTokenAPI, getDepartmentAnalysis);

// Simülasyon Sayfası
app.get("/simulasyon", authenticateToken, getSimulationPage);

// Simülasyon Verisi API
app.get("/simulasyon-isletme", authenticateTokenAPI, getSimulationData);


// ----------------------------------------------------------------------
// 📌 SUNUCUYU BAŞLAT
// ----------------------------------------------------------------------
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Sunucu http://localhost:${PORT} adresinde çalışıyor`);
});


