const createTopic = require("../Models/createTopic.model");

async function createTopicController(req, res, next) {
  try {
    const topic = await createTopic(req.body);
    res.status(201).send({ topic });
  } catch (error) {
    next(error);
  }
}

module.exports = createTopicController;
