const {
  addArticleToCollection,
  createCollection,
  deleteCollection,
  getCollection,
  listCollections,
  removeArticleFromCollection,
  updateCollection,
} = require("../Models/collection.model");

async function listCollectionsController(req, res, next) {
  try {
    const collections = await listCollections(req.user.username);
    res.status(200).send({ collections });
  } catch (error) {
    next(error);
  }
}

async function createCollectionController(req, res, next) {
  try {
    const collection = await createCollection(req.user.username, req.body);
    res.status(201).send({ collection });
  } catch (error) {
    next(error);
  }
}

async function getCollectionController(req, res, next) {
  try {
    const collection = await getCollection(
      req.user.username,
      req.params.collection_id
    );
    res.status(200).send({ collection });
  } catch (error) {
    next(error);
  }
}

async function updateCollectionController(req, res, next) {
  try {
    const collection = await updateCollection(
      req.user.username,
      req.params.collection_id,
      req.body
    );
    res.status(200).send({ collection });
  } catch (error) {
    next(error);
  }
}

async function deleteCollectionController(req, res, next) {
  try {
    await deleteCollection(req.user.username, req.params.collection_id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

async function addArticleController(req, res, next) {
  try {
    await addArticleToCollection(
      req.user.username,
      req.params.collection_id,
      req.params.article_id
    );
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

async function removeArticleController(req, res, next) {
  try {
    await removeArticleFromCollection(
      req.user.username,
      req.params.collection_id,
      req.params.article_id
    );
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  addArticleController,
  createCollectionController,
  deleteCollectionController,
  getCollectionController,
  listCollectionsController,
  removeArticleController,
  updateCollectionController,
};
