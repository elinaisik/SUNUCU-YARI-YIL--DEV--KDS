const pool = require("../config/database");

/**
 * Departman bazlı şikayet sayılarını getirir (Kargo, Paketleme, Müşteri Hizmetleri)
 */
async function getComplaintsByDepartment() {
  const conn = await pool.getConnection();
  
  try {
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

    return deptRows;
  } finally {
    conn.release();
  }
}

/**
 * Departman bazlı subtopic detaylarını getirir
 */
async function getSubtopicsByDepartment() {
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
      WHERE t.topic_id IN (17,18,19)
      GROUP BY st.subtopic_id, st.subtopic_adi, t.topic_adi
      ORDER BY adet DESC
    `);

    return subRows;
  } finally {
    conn.release();
  }
}

module.exports = {
  getComplaintsByDepartment,
  getSubtopicsByDepartment
};
