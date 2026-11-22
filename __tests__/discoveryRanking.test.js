jest.mock("../db/connection", () => ({ query: jest.fn() }));

const db = require("../db/connection");
const {
  getTrendingArticles,
  getArticleRecommendations,
} = require("../Models/discovery.model");

describe("stable article discovery rankings", () => {
  beforeEach(() => jest.clearAllMocks());

  test("trending articles use article ID to break equal score and timestamp ties", async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    await expect(getTrendingArticles({ limit: "5" })).resolves.toEqual([]);

    expect(db.query).toHaveBeenCalledTimes(1);
    expect(db.query.mock.calls[0][0]).toContain(
      "ORDER BY hot_score DESC, a.created_at DESC, a.article_id DESC"
    );
    expect(db.query.mock.calls[0][1]).toEqual([5]);
  });

  test("recommendations use article ID to break equal score and timestamp ties", async () => {
    db.query
      .mockResolvedValueOnce({
        rows: [{ article_id: 7, topic: "coding", author: "alice" }],
      })
      .mockResolvedValueOnce({ rows: [] });

    await expect(getArticleRecommendations("7", { limit: "3" }))
      .resolves.toEqual([]);

    expect(db.query).toHaveBeenCalledTimes(2);
    expect(db.query.mock.calls[1][0]).toContain(
      "ORDER BY recommendation_score DESC, a.created_at DESC, a.article_id DESC"
    );
    expect(db.query.mock.calls[1][1]).toEqual([7, "coding", "alice", 3]);
  });
});
