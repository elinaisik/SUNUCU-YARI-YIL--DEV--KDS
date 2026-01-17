const {
  getComplaintsByTopicForProduct,
  getSubtopicsForProduct,
  getProductSales,
  getProductSatisfactionScore,
  getProductComplaintCount
} = require("../services/productService");
const { calculateProductRisk, getRiskLevelAndColor } = require("../utils/helpers");

/**
 * Ürün bazlı analiz API handler
 */
async function getProductAnalysis(req, res) {
  try {
    const urunID = req.query.urun;

    // 1) TOPIC bazlı şikayetler (PIE)
    const topicRows = await getComplaintsByTopicForProduct(urunID);

    const total = topicRows.reduce((s, r) => s + r.adet, 0);
    const pieLabels = topicRows.map(r => r.topic_adi);
    const pieValues = topicRows.map(r =>
      Number(((r.adet / total) * 100).toFixed(1))
    );

    // 2) SUBTOPIC detayları
    const subRows = await getSubtopicsForProduct(urunID);

    // 3) Satış
    const satis = await getProductSales(urunID);

    // 4) Memnuniyet
    const memScore = await getProductSatisfactionScore(urunID);

    // 5) Şikayet sayısı
    const sikayet = await getProductComplaintCount(urunID);

    // 6) RİSK HESABI
    const riskScore = calculateProductRisk(satis, sikayet, memScore);
    const { riskLevel, riskColor } = getRiskLevelAndColor(riskScore);

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
    res.status(500).json({ error: "Ürün analiz yapılamadı" });
  }
}

module.exports = {
  getProductAnalysis
};
