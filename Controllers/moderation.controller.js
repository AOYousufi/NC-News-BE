const {
  getAdminAnalytics,
  getModeratorAuditLog,
} = require("../Models/moderation.model");

async function analyticsController(req, res, next) {
  try {
    const analytics = await getAdminAnalytics();
    res.status(200).send({ analytics });
  } catch (error) {
    next(error);
  }
}

async function auditLogController(req, res, next) {
  try {
    const audit = await getModeratorAuditLog(req.query);
    res.status(200).send({ audit });
  } catch (error) {
    next(error);
  }
}

module.exports = { analyticsController, auditLogController };
