/**
 * Topic adına göre departman belirler
 * @param {string} topicName - Topic adı
 * @returns {string} - Departman adı (donanim, kargo, paketleme, musteri, diger)
 */
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

/**
 * Risk skoruna göre risk seviyesi ve renk döndürür
 * @param {number} riskScore - Risk skoru (0-100)
 * @returns {object} - {riskLevel, riskColor}
 */
function getRiskLevelAndColor(riskScore) {
  let riskLevel = "Düşük Risk";
  let riskColor = "#22c55e";
  
  if (riskScore >= 23) {
    riskLevel = "Yüksek Risk";
    riskColor = "#e11d48";
  } else if (riskScore >= 19) {
    riskLevel = "Orta Risk";
    riskColor = "#facc15";
  }
  
  return { riskLevel, riskColor };
}

/**
 * Ürün için risk skoru hesaplar
 * @param {number} satis - Toplam satış sayısı
 * @param {number} sikayet - Şikayet sayısı
 * @param {number} memScore - Memnuniyet skoru (0-5)
 * @returns {number} - Risk skoru (0-100)
 */
function calculateProductRisk(satis, sikayet, memScore) {
  if (satis === 0) return 0;
  return Number(
    (((sikayet / satis) * 0.6 + ((5 - memScore) / 5) * 0.4) * 100).toFixed(1)
  );
}

module.exports = {
  getDepartmentByName,
  getRiskLevelAndColor,
  calculateProductRisk
};
