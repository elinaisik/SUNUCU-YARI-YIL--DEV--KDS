const { getComplaintsByTopic, getProductDistributionByTopic } = require("../services/complaintService");

/**
 * Şikayetler sayfası route handler
 */
async function getComplaints(req, res) {
  try {
    // Topic bazlı şikayet sayıları
    const rows = await getComplaintsByTopic();

    const topicLabels = rows.map(r => r.topic_adi);
    const topicValues = rows.map(r => r.adet);

    // Hover için ürün dağılımı
    const productDistributions = [];
    for (const r of rows) {
      const prod = await getProductDistributionByTopic(r.topic_id);
      productDistributions.push(prod);
    }

    res.render("sikayetler", {
      topicLabels,
      topicValues,
      productDistributions
    });
  } catch (err) {
    console.error("Şikayetler sayfası hatası:", err);
    res.status(500).send("Hata oluştu (Şikayetler)");
  }
}

module.exports = {
  getComplaints
};
