const express = require("express");
const authenticateUser = require("../middleware/auth");
const {
  addArticleController,
  createCollectionController,
  deleteCollectionController,
  getCollectionController,
  listCollectionsController,
  removeArticleController,
  updateCollectionController,
} = require("../Controllers/collection.controller");

const router = express.Router();

router.use(authenticateUser);
router.get("/", listCollectionsController);
router.post("/", createCollectionController);
router.get("/:collection_id", getCollectionController);
router.patch("/:collection_id", updateCollectionController);
router.delete("/:collection_id", deleteCollectionController);
router.post("/:collection_id/articles/:article_id", addArticleController);
router.delete("/:collection_id/articles/:article_id", removeArticleController);

module.exports = router;
