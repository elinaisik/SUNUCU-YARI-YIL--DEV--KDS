const pool = require("../config/database");

/**
 * Genel işletme puanını ve KPI puanlarını getirir
 */
async function getBusinessScores() {
  const conn = await pool.getConnection();
  
  try {
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
    return {
      genelPuan10: puan.genel_puan_10 || 0,
      kargoPuan: puan.kargo_puan || 0,
      paketlemePuan: puan.paketleme_puan || 0,
      musteriHizmetPuan: puan.musteri_hizmet_puan || 0
    };
  } finally {
    conn.release();
  }
}

/**
 * Aylık en çok satan ürünleri getirir
 */
async function getTopProductsByMonth() {
  const conn = await pool.getConnection();
  
  try {
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

    return topProductRows;
  } finally {
    conn.release();
  }
}

/**
 * Aylık toplam satışları getirir
 */
async function getMonthlySales() {
  const conn = await pool.getConnection();
  
  try {
    const [monthlySalesRows] = await conn.query(`
      SELECT 
        YEAR(siparis_tarihi)  AS yil,
        MONTH(siparis_tarihi) AS ay,
        SUM(adet)             AS toplam_adet
      FROM siparisler
      GROUP BY YEAR(siparis_tarihi), MONTH(siparis_tarihi)
      ORDER BY yil, ay;
    `);

    return monthlySalesRows;
  } finally {
    conn.release();
  }
}

module.exports = {
  getBusinessScores,
  getTopProductsByMonth,
  getMonthlySales
};
