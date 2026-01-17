const { getComplaintsByDepartment, getSubtopicsByDepartment } = require("../services/departmentService");

/**
 * Departman bazlı analiz API handler
 */
async function getDepartmentAnalysis(req, res) {
  try {
    // 1) Departman bazlı şikayet sayıları (PIE)
    const deptRows = await getComplaintsByDepartment();

    const total = deptRows.reduce((s, r) => s + r.adet, 0);

    const pieLabels = deptRows.map(r => r.topic_adi);
    const pieValues = deptRows.map(r =>
      Number(((r.adet / total) * 100).toFixed(1))
    );

    // 2) Subtopic detayları (departmana göre)
    const subRows = await getSubtopicsByDepartment();

    return res.json({
      pieLabels,
      pieValues,
      subRows
    });

  } catch (err) {
    console.error("Departman analiz hatası:", err);
    return res.status(500).json({ error: "Departman analiz yapılamadı" });
  }
}

module.exports = {
  getDepartmentAnalysis
};
