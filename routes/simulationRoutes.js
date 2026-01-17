const { getComplaintsForSimulation, processSimulationData } = require("../services/simulationService");

/**
 * Simülasyon sayfası route handler
 */
function getSimulationPage(req, res) {
  res.render("simulasyon");
}

/**
 * İşletme geneli simülasyon verisi API handler
 */
async function getSimulationData(req, res) {
  try {
    const rows = await getComplaintsForSimulation();
    const result = processSimulationData(rows);

    res.json(result);

  } catch (err) {
    console.error("İşletme simülasyon hatası:", err);
    res.status(500).json({ error: "Simülasyon verisi alınamadı" });
  }
}

module.exports = {
  getSimulationPage,
  getSimulationData
};
