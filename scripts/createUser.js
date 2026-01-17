/**
 * Kullanıcı Oluşturma Script'i
 * 
 * Bu script ile komut satırından kolayca kullanıcı oluşturabilirsiniz.
 * 
 * Kullanım:
 * node scripts/createUser.js <username> <email> <password>
 * 
 * Örnek:
 * node scripts/createUser.js admin admin@kds.com admin123
 */

const bcrypt = require("bcryptjs");
const pool = require("../config/database");

async function createUser(username, email, password) {
  try {
    console.log("🔄 Kullanıcı oluşturuluyor...\n");

    // Şifreyi hashle
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Kullanıcıyı veritabanına ekle
    const [result] = await pool.query(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, hashedPassword]
    );

    console.log("✅ Kullanıcı başarıyla oluşturuldu!");
    console.log("\n📋 Kullanıcı Bilgileri:");
    console.log(`   ID: ${result.insertId}`);
    console.log(`   Kullanıcı Adı: ${username}`);
    console.log(`   Email: ${email}`);
    console.log(`   Şifre: ${password}`);
    console.log("\n🔐 Giriş yapmak için http://localhost:3000/login adresine gidin\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Hata:", error.message);

    if (error.code === "ER_DUP_ENTRY") {
      if (error.message.includes("username")) {
        console.error("   Bu kullanıcı adı zaten kullanılıyor.");
      } else if (error.message.includes("email")) {
        console.error("   Bu e-posta adresi zaten kullanılıyor.");
      }
    } else if (error.code === "ER_NO_SUCH_TABLE") {
      console.error("   'users' tablosu bulunamadı.");
      console.error("   Lütfen önce database/create_users_table.sql dosyasını çalıştırın.");
    }

    console.log("\n");
    process.exit(1);
  }
}

// Komut satırı argümanları
const args = process.argv.slice(2);

if (args.length !== 3) {
  console.log("❌ Hatalı kullanım!");
  console.log("\n📖 Kullanım:");
  console.log("   node scripts/createUser.js <username> <email> <password>");
  console.log("\n📝 Örnek:");
  console.log("   node scripts/createUser.js admin admin@kds.com admin123");
  console.log("\n");
  process.exit(1);
}

const [username, email, password] = args;

// Basit validasyonlar
if (username.length < 3) {
  console.error("❌ Kullanıcı adı en az 3 karakter olmalıdır.");
  process.exit(1);
}

if (!email.includes("@")) {
  console.error("❌ Geçerli bir e-posta adresi girin.");
  process.exit(1);
}

if (password.length < 6) {
  console.error("❌ Şifre en az 6 karakter olmalıdır.");
  process.exit(1);
}

// Kullanıcıyı oluştur
createUser(username, email, password);
