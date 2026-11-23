jest.mock("../db/connection", () => ({ query: jest.fn() }));

const db = require("../db/connection");
const { selectCommentsByArticle_ID } = require("../Models/selectCommentsByID.model");

describe("article comment ordering", () => {
  beforeEach(() => jest.clearAllMocks());

  test("orders newest comments first and breaks timestamp ties by comment ID", async () => {
    const comments = [{ comment_id: 12 }, { comment_id: 11 }];
    db.query
      .mockResolvedValueOnce({ rows: [{ article_id: 3 }] })
      .mockResolvedValueOnce({ rows: comments });

    await expect(selectCommentsByArticle_ID("3")).resolves.toEqual(comments);

    expect(db.query).toHaveBeenCalledTimes(2);
    expect(db.query.mock.calls[0][1]).toEqual([3]);
    expect(db.query.mock.calls[1][0]).toMatch(
      /ORDER BY created_at DESC, comment_id DESC;/
    );
    expect(db.query.mock.calls[1][1]).toEqual([3]);
  });

  test("does not query the database for an invalid article ID", async () => {
    await expect(selectCommentsByArticle_ID("invalid")).rejects.toMatchObject({
      status: 400,
    });
    expect(db.query).not.toHaveBeenCalled();
  });

  test("preserves 404 for unpublished or missing articles", async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    await expect(selectCommentsByArticle_ID("3")).rejects.toMatchObject({
      status: 404,
      msg: "Not Found",
    });
    expect(db.query).toHaveBeenCalledTimes(1);
  });
});
