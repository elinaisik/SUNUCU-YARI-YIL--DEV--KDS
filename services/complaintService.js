const pool = require("../config/database");

/**
 * Topic bazlı şikayet sayılarını getirir
 */
async function getComplaintsByTopic() {
  const conn = await pool.getConnection();
  
  try {
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

    return rows;
  } finally {
    conn.release();
  }
}

/**
 * Belirli bir topic için ürün dağılımını getirir
 * @param {number} topicId - Topic ID
 */
async function getProductDistributionByTopic(topicId) {
  const conn = await pool.getConnection();
  
  try {
    const [prod] = await conn.query(`
      SELECT 
        u.urun_adi,
        COUNT(*) AS sayi
      FROM feedback f
      JOIN siparisler s ON s.siparis_id = f.siparis_id
      JOIN urunler u ON u.urun_id = s.urun_id
      WHERE f.general_topic_id = ?
      GROUP BY u.urun_id, u.urun_adi;
    `, [topicId]);

    return prod;
  } finally {
    conn.release();
  }
}

module.exports = {
  getComplaintsByTopic,
  getProductDistributionByTopic
};
