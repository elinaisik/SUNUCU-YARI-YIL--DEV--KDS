const { getBusinessScores, getTopProductsByMonth, getMonthlySales } = require("../services/homeService");
const { ayIsimleri } = require("../config/constants");

/**
 * Anasayfa route handler
 */
async function getHome(req, res) {
  try {
    // 1) Genel işletme puanı ve 3 KPI puanı
    const scores = await getBusinessScores();

    // 2) Aylık en çok satan ürün
    const topProductRows = await getTopProductsByMonth();
    
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

    // 3) Aylık toplam satış (line chart)
    const monthlySalesRows = await getMonthlySales();

    const salesLabels = monthlySalesRows.map((r) => {
      const ayAdi = ayIsimleri[r.ay - 1] || r.ay;
      return `${ayAdi} ${r.yil}`;
    });
    const salesValues = monthlySalesRows.map((r) => r.toplam_adet);

    res.render("index", {
      genelPuan10: scores.genelPuan10,
      kargoPuan: scores.kargoPuan,
      paketlemePuan: scores.paketlemePuan,
      musteriHizmetPuan: scores.musteriHizmetPuan,
      topProdLabels,
      datasetsTop,
      salesLabels,
      salesValues
    });
  } catch (err) {
    console.error("Anasayfa hatası:", err);
    res.status(500).send("Hata oluştu (Anasayfa)");
  }
}

module.exports = {
  getHome
};
