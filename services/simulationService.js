const pool = require("../config/database");
const { getDepartmentByName } = require("../utils/helpers");

/**
 * İşletme geneli için topic bazlı şikayet verilerini getirir
 */
async function getComplaintsForSimulation() {
  const conn = await pool.getConnection();
  
  try {
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

    return rows;
  } finally {
    conn.release();
  }
}

/**
 * Simülasyon verilerini işleyip risk ve karar önerileri döndürür
 * @param {Array} rows - Topic bazlı şikayet verileri
 */
function processSimulationData(rows) {
  const total = rows.reduce((s, r) => s + r.adet, 0);

  const topics = rows.map(r => {
    const oran = Number(((r.adet / total) * 100).toFixed(1));
    let risk = "low", color = "green";
    if (oran >= 12) { 
      risk = "high"; 
      color = "red"; 
    } else if (oran >= 10) { 
      risk = "medium"; 
      color = "orange"; 
    }

    return {
      topic_id: r.topic_id,
      topic_adi: r.topic_adi,
      oran,
      risk,
      color
    };
  });

  // Departman skorlarını hesapla
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

  // Karar önerileri oluştur
  const decisions = generateDecisions(deptScore);

  return { topics, decision: decisions };
}

/**
 * Departman skorlarına göre karar önerileri oluşturur
 * @param {object} deptScore - Departman skorları
 */
function generateDecisions(deptScore) {
  const decisions = [];
  let hasGreen = false;

  // DONANIM
  if (deptScore.donanim >= 3) {
    decisions.push("🔴 Donanım iyileştirme ve ürün revizyonu önerilir");
  } else if (deptScore.donanim === 1 || deptScore.donanim === 2) {
    decisions.push("🟡 Donanım kaynaklı şikayetler izlenmeli ve teknik analiz yapılmalı");
  } else {
    hasGreen = true;
  }

  // MÜŞTERİ HİZMETLERİ
  if (deptScore.musteri >= 2) {
    decisions.push("🔴 Müşteri hizmetleri süreçleri yeniden yapılandırılmalı, personel eğitimi planlanmalı");
  } else if (deptScore.musteri === 1) {
    decisions.push("🟡 Müşteri hizmetleri performansı izlenmeli ve eğitim ihtiyacı değerlendirilmelidir");
  } else {
    hasGreen = true;
  }

  // KARGO
  if (deptScore.kargo >= 2) {
    decisions.push("🔴 Kargo firması hizmet seviyesi düşüktür, alternatif firmalar değerlendirilmelidir");
  } else if (deptScore.kargo === 1) {
    decisions.push("🟡 Kargo süreçleri ve teslimat süreleri izlenmelidir");
  } else {
    hasGreen = true;
  }

  // PAKETLEME
  if (deptScore.paketleme >= 2) {
    decisions.push("🔴 Paketleme standartları ve kalite kontrol süreçleri iyileştirilmelidir");
  } else if (deptScore.paketleme === 1) {
    decisions.push("🟡 Paketleme süreçleri izlenmeli ve kalite denetimi yapılmalıdır");
  } else {
    hasGreen = true;
  }

  // YEŞİL ÖZET
  if (hasGreen) {
    decisions.push("🟢 Risk seviyesi düşük alanlarda mevcut süreçlerin izlenmesi yeterlidir");
  }

  return decisions;
}

module.exports = {
  getComplaintsForSimulation,
  processSimulationData
};
