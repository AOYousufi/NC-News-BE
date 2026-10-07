const {
  createReport,
  listReports,
  reviewReport,
} = require("../Models/report.model");

async function createReportController(req, res, next) {
  try {
    const report = await createReport(req.user.username, req.body);
    res.status(201).send({ report });
  } catch (error) {
    next(error);
  }
}

async function listReportsController(req, res, next) {
  try {
    const reports = await listReports({ status: req.query.status });
    res.status(200).send({ reports });
  } catch (error) {
    next(error);
  }
}

async function reviewReportController(req, res, next) {
  try {
    if (
      !req.body ||
      Object.keys(req.body).length !== 1 ||
      !Object.prototype.hasOwnProperty.call(req.body, "status")
    ) {
      return next({ status: 400, msg: "Bad Request" });
    }

    const report = await reviewReport(
      req.params.report_id,
      req.user.username,
      req.body.status
    );
    res.status(200).send({ report });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createReportController,
  listReportsController,
  reviewReportController,
};
