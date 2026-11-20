jest.mock("../db/connection", () => ({ query: jest.fn() }));

const db = require("../db/connection");
const { fetchAllArticles } = require("../Models/getAllArticles.model");

describe("article filter validation", () => {
  beforeEach(() => jest.clearAllMocks());

  test.each([
    ["2026-02-29", "date_from"],
    ["2024-02-30", "date_to"],
    ["2026-04-31", "date_from"],
    ["2026-13-01", "date_to"],
    ["2026-00-01", "date_from"],
    ["2026-2-01", "date_to"],
  ])("rejects invalid calendar date %s", async (date, field) => {
    await expect(fetchAllArticles({ [field]: date })).rejects.toMatchObject({
      status: 400,
      msg: `Invalid ${field} value`,
    });
    expect(db.query).not.toHaveBeenCalled();
  });

  test("accepts leap day as an inclusive starting date", async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total_count: 0 }] })
      .mockResolvedValueOnce({ rows: [] });

    const response = await fetchAllArticles({ date_from: "2024-02-29" });

    expect(response.articles).toEqual([]);
    expect(db.query).toHaveBeenCalledTimes(2);
    expect(db.query.mock.calls[0][1]).toEqual(["2024-02-29"]);
    expect(db.query.mock.calls[1][1]).toEqual(["2024-02-29"]);
  });

  test.each([
    ["discount_20%", String.raw`%discount\_20\%%`],
    [String.raw`path\file`, String.raw`%path\\file%`],
  ])("escapes special characters in a literal search term: %s", async (search, expected) => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total_count: 1 }] })
      .mockResolvedValueOnce({ rows: [{ article_id: 7 }] });

    const response = await fetchAllArticles({ search });

    expect(response.articles).toEqual([{ article_id: 7 }]);
    expect(db.query).toHaveBeenCalledTimes(2);
    expect(db.query.mock.calls[0][1]).toEqual([expected]);
    expect(db.query.mock.calls[1][1]).toEqual([expected]);
    expect(db.query.mock.calls[0][0]).toContain("ILIKE $1");
  });


  test.each(["constructor", "toString", "valueOf", "__proto__"])(
    "rejects inherited object names as sort keys: %s",
    async (sort_by) => {
      await expect(fetchAllArticles({ sort_by })).rejects.toMatchObject({
        status: 400,
        msg: "Invalid sort_by column",
      });
      expect(db.query).not.toHaveBeenCalled();
    }
  );

  test("still accepts explicitly supported sort keys", async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total_count: 0 }] })
      .mockResolvedValueOnce({ rows: [] });

    await fetchAllArticles({ sort_by: "votes", order: "asc" });

    expect(db.query).toHaveBeenCalledTimes(2);
    expect(db.query.mock.calls[1][0]).toContain("ORDER BY articles.votes ASC");
  });


  test.each([
    { p: String(Number.MAX_SAFE_INTEGER) },
    { p: String(Number.MAX_SAFE_INTEGER), limit: "100" },
    { p: "90071992547411", limit: "100" },
  ])("rejects pagination that would calculate an unsafe SQL offset: %p", async (options) => {
    await expect(fetchAllArticles(options)).rejects.toMatchObject({
      status: 400,
      msg: "Invalid page value",
    });
    expect(db.query).not.toHaveBeenCalled();
  });

  test("accepts a small, safe pagination offset", async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total_count: 25 }] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await fetchAllArticles({ p: "2", limit: "10" });

    expect(result.pagination).toMatchObject({
      page: 2,
      limit: 10,
      total_count: 25,
      has_previous: true,
      has_next: true,
    });
    expect(db.query.mock.calls[1][1].slice(-2)).toEqual([10, 10]);
  });


  test.each([
    ["created_at", "desc", "ORDER BY articles.created_at DESC, articles.article_id DESC"],
    ["votes", "asc", "ORDER BY articles.votes ASC, articles.article_id ASC"],
    ["comment_count", "desc", "ORDER BY comment_count DESC, articles.article_id DESC"],
    ["article_id", "asc", "ORDER BY articles.article_id ASC LIMIT"],
  ])("uses stable article ordering for %s %s", async (sort_by, order, expected) => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total_count: 20 }] })
      .mockResolvedValueOnce({ rows: [] });

    await fetchAllArticles({ sort_by, order, limit: "5", p: "2" });

    const sql = db.query.mock.calls[1][0];
    expect(sql).toContain(expected);
    expect(db.query.mock.calls[1][1].slice(-2)).toEqual([5, 5]);
  });

});
