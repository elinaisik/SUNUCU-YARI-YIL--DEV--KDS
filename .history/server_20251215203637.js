// EXPRESS
const express = require("express");
const app = express();

// MYSQL
const mysql = require("mysql2/promise");

// PATH
const path = require("path");

// EJS AYARLARI
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// STATIC DOSYALAR
app.use(express.static(path.join(__dirname, "public")));

// MYSQL BAĞLANTI HAVUZU
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "sonkds",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// AY İSİMLERİ
const ayIsimleri = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

function getDepartmentByName(topicName) {
  const t = topicName.toLowerCase();

  if (
    t.includes("batarya") ||
    t.includes("ekran") ||
    t.includes("bağlantı") ||
    t.includes("ses") ||
    t.includes("klavye") ||
    t.includes("kamera") ||
    t.includes("performans")
  ) return "donanim";

  if (t.includes("kargo")) return "kargo";
  if (t.includes("paketleme")) return "paketleme";
  if (t.includes("müşteri")) return "musteri";

  return "diger";
}



// ----------------------------------------------------------------------
// 📌 1) ANASAYFA ROUTE
// ----------------------------------------------------------------------
app.get("/", async (req, res) => {
  try {
    const conn = await pool.getConnection();

    // ⭐ 1) Genel işletme puanı ve 3 KPI puanı
    const [puanRows] = await conn.query(`
      SELECT 
        ROUND(
          (AVG(urun_puani) + AVG(kargo_puani) + AVG(paketleme_puani) + AVG(musteri_hizmet_puani)) / 4 * 2
        , 1) AS genel_puan_10,
        ROUND(AVG(kargo_puani), 1)         AS kargo_puan,
        ROUND(AVG(paketleme_puani), 1)     AS paketleme_puan,
        ROUND(AVG(musteri_hizmet_puani),1) AS musteri_hizmet_puan
      FROM feedback;
    `);

    const puan = puanRows[0] || {};
    const genelPuan10 = puan.genel_puan_10 || 0;
    const kargoPuan = puan.kargo_puan || 0;
    const paketlemePuan = puan.paketleme_puan || 0;
    const musteriHizmetPuan = puan.musteri_hizmet_puan || 0;

    // ⭐ 2) Aylık en çok satan ürün
    const [topProductRows] = await conn.query(`
      SELECT yil, ay, urun_id, urun_adi, toplam_adet
      FROM (
        SELECT 
          YEAR(s.siparis_tarihi)  AS yil,
          MONTH(s.siparis_tarihi) AS ay,
          s.urun_id,
          u.urun_adi,
          SUM(s.adet) AS toplam_adet,
          ROW_NUMBER() OVER (
            PARTITION BY YEAR(s.siparis_tarihi), MONTH(s.siparis_tarihi)
            ORDER BY SUM(s.adet) DESC
          ) AS rn
        FROM siparisler s
        JOIN urunler u ON u.urun_id = s.urun_id
        GROUP BY YEAR(s.siparis_tarihi), MONTH(s.siparis_tarihi), s.urun_id
      ) t
      WHERE rn = 1
      ORDER BY yil, ay;
    `);

    const topProdLabels = topProductRows.map((r) => {
      const ayAdi = ayIsimleri[r.ay - 1] || r.ay;
      return `${ayAdi} ${r.yil}`;
    });
    const topProdNames = topProductRows.map((r) => r.urun_adi);

    const uniqueProducts = [...new Set(topProdNames)];
    const datasetsTop = uniqueProducts.map((urunAdi) => ({
      label: urunAdi,
      data: topProductRows.map((r) => (r.urun_adi === urunAdi ? r.toplam_adet : null)),
    }));

    // ⭐ 3) Aylık toplam satış (line chart)
    const [monthlySalesRows] = await conn.query(`
      SELECT 
        YEAR(siparis_tarihi)  AS yil,
        MONTH(siparis_tarihi) AS ay,
        SUM(adet)             AS toplam_adet
      FROM siparisler
      GROUP BY YEAR(siparis_tarihi), MONTH(siparis_tarihi)
      ORDER BY yil, ay;
    `);

    const salesLabels = monthlySalesRows.map((r) => {
      const ayAdi = ayIsimleri[r.ay - 1] || r.ay;
      return `${ayAdi} ${r.yil}`;
    });
    const salesValues = monthlySalesRows.map((r) => r.toplam_adet);

    conn.release();

    res.render("index", {
      genelPuan10,
      kargoPuan,
      paketlemePuan,
      musteriHizmetPuan,
      topProdLabels,
      datasetsTop,
      salesLabels,
      salesValues
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Hata oluştu (Anasayfa)");
  }
});

// ----------------------------------------------------------------------
// 📌 2) ŞİKAYETLER SAYFASI
// ----------------------------------------------------------------------
app.get("/sikayetler", async (req, res) => {
  try {
    const conn = await pool.getConnection();

    // ⭐ Topic bazlı şikayet sayıları
    const [rows] = await conn.query(`
      SELECT 
        t.topic_id,
        t.topic_adi,
        COUNT(f.feedback_id) AS adet
      FROM feedback f
      JOIN topics t ON t.topic_id = f.general_topic_id
      WHERE f.general_topic_id IS NOT NULL
      GROUP BY t.topic_id, t.topic_adi
      ORDER BY adet DESC;
    `);

    const topicLabels = rows.map(r => r.topic_adi);
    const topicValues = rows.map(r => r.adet);

    // ⭐ Hover için ürün dağılımı
    const productDistributions = [];
    for (const r of rows) {
      const [prod] = await conn.query(`
        SELECT 
          u.urun_adi,
          COUNT(*) AS sayi
        FROM feedback f
        JOIN siparisler s ON s.siparis_id = f.siparis_id
        JOIN urunler u ON u.urun_id = s.urun_id
        WHERE f.general_topic_id = ?
        GROUP BY u.urun_id, u.urun_adi;
      `, [r.topic_id]);

      productDistributions.push(prod);
    }

    conn.release();

    res.render("sikayetler", {
      topicLabels,
      topicValues,
      productDistributions
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Hata oluştu (Şikayetler)");
  }
});

// ----------------------------------------------------------------------
// 📌 ÜRÜN BAZLI ANALİZ API (AJAX – Ürün Bazlı dropdown için)
// ----------------------------------------------------------------------
// ----------------------------------------------------------------------
// 📌 ÜRÜN BAZLI ANALİZ API
// ----------------------------------------------------------------------
app.get("/urun-analiz", async (req, res) => {
  try {
    const urunID = req.query.urun;
    const conn = await pool.getConnection();

    // 1️⃣ TOPIC bazlı şikayetler (PIE)
    const [topicRows] = await conn.query(`
      SELECT 
        t.topic_adi,
        COUNT(f.feedback_id) AS adet
      FROM feedback f
      JOIN topics t ON t.topic_id = f.general_topic_id
      JOIN siparisler s ON s.siparis_id = f.siparis_id
      WHERE s.urun_id = ?
      GROUP BY t.topic_id, t.topic_adi
      ORDER BY adet DESC
    `, [urunID]);

    const total = topicRows.reduce((s,r)=>s+r.adet,0);
    const pieLabels = topicRows.map(r => r.topic_adi);
    const pieValues = topicRows.map(r =>
      Number(((r.adet / total) * 100).toFixed(1))
    );

    // 2️⃣ SUBTOPIC detayları
    const [subRows] = await conn.query(`
      SELECT 
        st.subtopic_adi,
        COUNT(f.feedback_id) AS adet,
        t.topic_adi
      FROM feedback f
      JOIN sub_topics st ON st.subtopic_id = f.sub_topic_id
      JOIN topics t ON t.topic_id = st.topic_id
      JOIN siparisler s ON s.siparis_id = f.siparis_id
      WHERE s.urun_id = ?
      GROUP BY st.subtopic_id, st.subtopic_adi, t.topic_adi
      ORDER BY adet DESC
    `, [urunID]);

    // 3️⃣ Satış
    const [[satisRow]] = await conn.query(
      `SELECT SUM(adet) AS satis FROM siparisler WHERE urun_id = ?`,
      [urunID]
    );

    // 4️⃣ Memnuniyet
    const [[memRow]] = await conn.query(`
      SELECT ROUND(AVG(urun_puani),1) AS memScore
      FROM feedback f
      JOIN siparisler s ON s.siparis_id = f.siparis_id
      WHERE s.urun_id = ?
    `, [urunID]);

    // 5️⃣ Şikayet sayısı
    const [[sikayetRow]] = await conn.query(`
      SELECT COUNT(*) AS sikayet
      FROM feedback f
      JOIN siparisler s ON s.siparis_id = f.siparis_id
      WHERE s.urun_id = ?
        AND f.general_topic_id IS NOT NULL
    `,[urunID]);

    conn.release();

    // 🎯 RİSK HESABI
    const satis = satisRow.satis || 0;
    const sikayet = sikayetRow.sikayet || 0;
    const memScore = memRow.memScore || 0;

    const riskScore = Number(
      (((sikayet/satis)*0.6 + ((5-memScore)/5)*0.4) * 100).toFixed(1)
    );

    let riskLevel = "Düşük Risk", riskColor="#22c55e";
    if (riskScore >= 23) { riskLevel="Yüksek Risk"; riskColor="#e11d48"; }
    else if (riskScore >= 19) { riskLevel="Orta Risk"; riskColor="#facc15"; }

    res.json({
      pieLabels,
      pieValues,
      subRows,
      satis,
      sikayet,
      memScore,
      riskScore,
      riskLevel,
      riskColor
    });

  } catch (err) {
    console.error("Ürün analiz hatası:", err);
    res.status(500).json({ error:"Ürün analiz yapılamadı" });
  }
});




// ----------------------------------------------------------------------
// 📌 DEPARTMAN BAZLI ANALİZ API
// ----------------------------------------------------------------------
app.get("/departman-analiz", async (req, res) => {
  try {
    const conn = await pool.getConnection();

    // 1️⃣ Departman bazlı şikayet sayıları (PIE)
    const [deptRows] = await conn.query(`
      SELECT 
        t.topic_id,
        t.topic_adi,
        COUNT(f.feedback_id) AS adet
      FROM feedback f
      JOIN topics t ON t.topic_id = f.general_topic_id
      WHERE t.topic_id IN (17,18,19)
      GROUP BY t.topic_id, t.topic_adi
    `);

    const total = deptRows.reduce((s, r) => s + r.adet, 0);

    const pieLabels = deptRows.map(r => r.topic_adi);
    const pieValues = deptRows.map(r =>
      Number(((r.adet / total) * 100).toFixed(1))
    );

    // 2️⃣ Subtopic detayları (departmana göre)
    const [subRows] = await conn.query(`
      SELECT 
        st.subtopic_adi,
        COUNT(f.feedback_id) AS adet,
        t.topic_adi
      FROM feedback f
      JOIN sub_topics st ON st.subtopic_id = f.sub_topic_id
      JOIN topics t ON t.topic_id = st.topic_id
      WHERE t.topic_id IN (17,18,19)
      GROUP BY st.subtopic_id, st.subtopic_adi, t.topic_adi
      ORDER BY adet DESC
    `);

    conn.release();

    return res.json({
      pieLabels,
      pieValues,
      subRows
    });

  } catch (err) {
    console.error("Departman analiz hatası:", err);
    return res.status(500).json({ error: "Departman analiz yapılamadı" });
  }
});


// ----------------------------------------------------------------------
// 📌 3) SİMÜLASYON SAYFASI
// ----------------------------------------------------------------------
app.get("/simulasyon", (req, res) => {
  res.render("simulasyon");
});


// ----------------------------------------------------------------------
// 📌 İŞLETME GENELİ SİMÜLASYON VERİSİ
// ----------------------------------------------------------------------
app.get("/simulasyon-isletme", async (req, res) => {
  try {
    const conn = await pool.getConnection();

    // Topic bazlı şikayet sayıları (yorum dolu olanlar)
    const [rows] = await conn.query(`
      SELECT 
        t.topic_id,
        t.topic_adi,
        COUNT(*) AS adet
      FROM feedback f
      JOIN topics t ON t.topic_id = f.general_topic_id
      WHERE f.general_topic_id IS NOT NULL
        AND f.yorum IS NOT NULL
      GROUP BY t.topic_id, t.topic_adi
      ORDER BY adet DESC
    `);

    const total = rows.reduce((s,r) => s + r.adet, 0);

    const topics = rows.map(r => {
      const oran = Number(((r.adet / total) * 100).toFixed(1));
      let risk = "low", color = "green";
      if (oran >= 12) { risk="high"; color="red"; }
      else if (oran >= 10) { risk="medium"; color="orange"; }

      return {
        topic_id: r.topic_id,
        topic_adi: r.topic_adi,
        oran,
        risk,
        color
      };
    });

    const deptScore = {
      donanim: 0,
      kargo: 0,
      paketleme: 0,
      musteri: 0
    };

    topics.forEach(t => {
      const dept = getDepartmentByName(t.topic_adi);
      if (t.risk === "high") deptScore[dept] += 2;
      else if (t.risk === "medium") deptScore[dept] += 1;
    });

    // Karar önerisi
  const decisions = [];

if (deptScore.donanim >= 3)
  decisions.push(" Donanım iyileştirme önerilir");

if (deptScore.musteri >= 2)
  decisions.push(" Müşteri hizmetleri süreçleri iyileştirilmeli");

if (deptScore.kargo >= 1)
  decisions.push(" Kargo firması / teslimat süreçleri gözden geçirilmeli");

if (deptScore.paketleme >= 2)
  decisions.push("📦 Paketleme standartları iyileştirilmeli");

if (decisions.length === 0)
  decisions.push("🟢 Genel risk düşük, izleme önerilir");

const decision = decisions.join(" • ");


    res.json({ topics, decision });

  } catch (err) {
    console.error("İşletme simülasyon hatası:", err);
    res.status(500).json({ error: "Simülasyon verisi alınamadı" });
  }
});



// ----------------------------------------------------------------------
// 📌 SUNUCUYU BAŞLAT
// ----------------------------------------------------------------------
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor`);
});
