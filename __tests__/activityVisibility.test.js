jest.mock("../db/connection", () => ({ query: jest.fn() }));
const db = require("../db/connection");
const { getActivity } = require("../Models/social.model");

test("activity excludes saved articles that are no longer published", async () => {
  db.query.mockResolvedValueOnce({ rows: [{ saved_articles: 0 }] })
    .mockResolvedValueOnce({ rows: [] });
  expect(await getActivity("alice")).toEqual({
    stats: { saved_articles: 0 }, activity: [],
  });
  const [sql, params] = db.query.mock.calls[1];
  expect(sql).toMatch(/WHERE sa\.username = \$1 AND a\.status = 'published' AND a\.deleted_at IS NULL/);
  expect(params).toEqual(["alice"]);
  // The user's own drafts should still appear in their private activity.
  expect(sql).toContain("WHERE author = $1 AND deleted_at IS NULL");
});
