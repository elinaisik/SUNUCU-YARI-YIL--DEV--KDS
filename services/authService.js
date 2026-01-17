const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/database");
const { JWT_SECRET } = require("../middleware/auth");

// Kullanıcı kaydı
async function registerUser(username, email, password) {
  try {
    // Şifreyi hashle
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Kullanıcıyı veritabanına ekle
    const [result] = await pool.query(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, hashedPassword]
    );

    return {
      success: true,
      userId: result.insertId,
      message: "Kullanıcı başarıyla kaydedildi",
    };
  } catch (error) {
    console.error("Kayıt hatası:", error);

    // Duplicate entry hatası kontrolü
    if (error.code === "ER_DUP_ENTRY") {
      if (error.message.includes("username")) {
        return { success: false, message: "Bu kullanıcı adı zaten kullanılıyor" };
      }
      if (error.message.includes("email")) {
        return { success: false, message: "Bu e-posta adresi zaten kullanılıyor" };
      }
    }

    return { success: false, message: "Kayıt sırasında bir hata oluştu" };
  }
}

// Kullanıcı girişi
async function loginUser(username, password) {
  try {
    // Kullanıcıyı veritabanından bul
    const [users] = await pool.query(
      "SELECT id, username, email, password FROM users WHERE username = ?",
      [username]
    );

    if (users.length === 0) {
      return { success: false, message: "Kullanıcı adı veya şifre hatalı" };
    }

    const user = users[0];

    // Şifreyi doğrula
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return { success: false, message: "Kullanıcı adı veya şifre hatalı" };
    }

    // JWT token oluştur
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: "7d" } // Token 7 gün geçerli
    );

    return {
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    };
  } catch (error) {
    console.error("Giriş hatası:", error);
    return { success: false, message: "Giriş sırasında bir hata oluştu" };
  }
}

// Kullanıcıyı ID'den bul
async function getUserById(userId) {
  try {
    const [users] = await pool.query(
      "SELECT id, username, email, created_at FROM users WHERE id = ?",
      [userId]
    );

    if (users.length === 0) {
      return null;
    }

    return users[0];
  } catch (error) {
    console.error("Kullanıcı bulma hatası:", error);
    return null;
  }
}

module.exports = {
  registerUser,
  loginUser,
  getUserById,
};
