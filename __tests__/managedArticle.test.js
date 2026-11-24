jest.mock("../db/connection", () => ({ query: jest.fn() }));
const db = require("../db/connection");
const { getManagedArticle } = require("../Models/social.model");

describe("managed article comment count", () => {
  beforeEach(() => jest.resetAllMocks());

  test("counts only non-deleted comments without excluding articles with no comments", async () => {
    const article = { article_id: 7, comment_count: 0 };
    db.query.mockResolvedValueOnce({ rows: [article] });
    await expect(getManagedArticle("alice", "7")).resolves.toEqual(article);
    const [sql, params] = db.query.mock.calls[0];
    expect(sql).toContain("LEFT JOIN comments c ON c.article_id = a.article_id AND c.deleted_at IS NULL");
    expect(sql).toContain("COUNT(c.comment_id)::int AS comment_count");
    expect(params).toEqual([7, "alice"]);
  });

  test("does not return an article outside the owner's scope", async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    await expect(getManagedArticle("alice", "7")).rejects.toMatchObject({ status: 404 });
    expect(db.query.mock.calls[0][0]).toContain("a.author = $2");
  });
});
