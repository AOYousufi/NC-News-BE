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

});
