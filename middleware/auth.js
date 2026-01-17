const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "kds_dashboard_secret_key_2025";

// Token doğrulama middleware'i
const authenticateToken = (req, res, next) => {
  // Cookie'den token'ı al
  const token = req.cookies.token;

  if (!token) {
    return res.redirect("/login");
  }

  try {
    // Token'ı doğrula
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Kullanıcı bilgilerini request'e ekle
    next();
  } catch (error) {
    console.error("Token doğrulama hatası:", error.message);
    res.clearCookie("token");
    return res.redirect("/login");
  }
};

// API endpoint'leri için JSON response dönen middleware
const authenticateTokenAPI = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: "Yetkilendirme gerekli" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Token doğrulama hatası:", error.message);
    return res.status(403).json({ error: "Geçersiz token" });
  }
};

module.exports = {
  authenticateToken,
  authenticateTokenAPI,
  JWT_SECRET,
};
