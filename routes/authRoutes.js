const { registerUser, loginUser, getUserById } = require("../services/authService");

// Login sayfasını göster
function getLoginPage(req, res) {
  // Eğer kullanıcı zaten giriş yapmışsa anasayfaya yönlendir
  if (req.cookies.token) {
    return res.redirect("/");
  }
  res.render("login");
}

// Kayıt işlemi
async function register(req, res) {
  const { username, email, password, confirmPassword } = req.body;

  // Validasyon
  if (!username || !email || !password || !confirmPassword) {
    return res.status(400).json({ error: "Tüm alanları doldurun" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: "Şifreler eşleşmiyor" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Şifre en az 6 karakter olmalı" });
  }

  // Kullanıcıyı kaydet
  const result = await registerUser(username, email, password);

  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }

  res.json({ message: result.message });
}

// Giriş işlemi
async function login(req, res) {
  const { username, password } = req.body;

  // Validasyon
  if (!username || !password) {
    return res.status(400).json({ error: "Kullanıcı adı ve şifre gerekli" });
  }

  // Kullanıcıyı doğrula
  const result = await loginUser(username, password);

  if (!result.success) {
    return res.status(401).json({ error: result.message });
  }

  // Token'ı cookie'ye kaydet
  res.cookie("token", result.token, {
    httpOnly: true, // XSS koruması
    secure: process.env.NODE_ENV === "production", // HTTPS gerekli (production'da)
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 gün
    sameSite: "strict", // CSRF koruması
  });

  res.json({
    message: "Giriş başarılı",
    user: result.user,
  });
}

// Çıkış işlemi
function logout(req, res) {
  res.clearCookie("token");
  res.redirect("/login");
}

// Mevcut kullanıcı bilgilerini al
async function getCurrentUser(req, res) {
  try {
    const user = await getUserById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: "Kullanıcı bulunamadı" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Kullanıcı bilgisi alma hatası:", error);
    res.status(500).json({ error: "Sunucu hatası" });
  }
}

module.exports = {
  getLoginPage,
  register,
  login,
  logout,
  getCurrentUser,
};
