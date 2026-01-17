const pool = require("../config/database");

/**
 * Ürün için topic bazlı şikayetleri getirir
 * @param {number} urunID - Ürün ID
 */
async function getComplaintsByTopicForProduct(urunID) {
  const conn = await pool.getConnection();
  
  try {
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

    return topicRows;
  } finally {
    conn.release();
  }
}

/**
 * Ürün için subtopic detaylarını getirir
 * @param {number} urunID - Ürün ID
 */
async function getSubtopicsForProduct(urunID) {
  const conn = await pool.getConnection();
  
  try {
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

    return subRows;
  } finally {
    conn.release();
  }
}

/**
 * Ürünün toplam satış sayısını getirir
 * @param {number} urunID - Ürün ID
 */
async function getProductSales(urunID) {
  const conn = await pool.getConnection();
  
  try {
    const [[satisRow]] = await conn.query(
      `SELECT SUM(adet) AS satis FROM siparisler WHERE urun_id = ?`,
      [urunID]
    );

    return satisRow.satis || 0;
  } finally {
    conn.release();
  }
}

/**
 * Ürünün memnuniyet skorunu getirir
 * @param {number} urunID - Ürün ID
 */
async function getProductSatisfactionScore(urunID) {
  const conn = await pool.getConnection();
  
  try {
    const [[memRow]] = await conn.query(`
      SELECT ROUND(AVG(urun_puani),1) AS memScore
      FROM feedback f
      JOIN siparisler s ON s.siparis_id = f.siparis_id
      WHERE s.urun_id = ?
    `, [urunID]);

    return memRow.memScore || 0;
  } finally {
    conn.release();
  }
}

/**
 * Ürünün şikayet sayısını getirir
 * @param {number} urunID - Ürün ID
 */
async function getProductComplaintCount(urunID) {
  const conn = await pool.getConnection();
  
  try {
    const [[sikayetRow]] = await conn.query(`
      SELECT COUNT(*) AS sikayet
      FROM feedback f
      JOIN siparisler s ON s.siparis_id = f.siparis_id
      WHERE s.urun_id = ?
        AND f.general_topic_id IS NOT NULL
    `, [urunID]);

    return sikayetRow.sikayet || 0;
  } finally {
    conn.release();
  }
}

module.exports = {
  getComplaintsByTopicForProduct,
  getSubtopicsForProduct,
  getProductSales,
  getProductSatisfactionScore,
  getProductComplaintCount
};
