jest.mock("../db/connection", () => ({ query: jest.fn() }));
const db = require("../db/connection");
const { listCollections, getCollection } = require("../Models/collection.model");

beforeEach(() => jest.resetAllMocks());

test("collection list uses a unique tie-breaker for equal timestamps", async () => {
  db.query.mockResolvedValueOnce({ rows: [] });
  await expect(listCollections("alice")).resolves.toEqual([]);
  expect(db.query).toHaveBeenCalledWith(
    expect.stringContaining("ORDER BY c.updated_at DESC, c.created_at DESC, c.collection_id DESC"),
    ["alice"]
  );
});

test("collection articles use a unique tie-breaker for equal added times", async () => {
  db.query.mockResolvedValueOnce({ rows: [{ collection_id: 7 }] })
    .mockResolvedValueOnce({ rows: [] });
  await expect(getCollection("alice", "7")).resolves.toEqual({ collection_id: 7, articles: [] });
  expect(db.query).toHaveBeenNthCalledWith(2,
    expect.stringContaining("ORDER BY ca.added_at DESC, a.article_id DESC"), [7]);
});
