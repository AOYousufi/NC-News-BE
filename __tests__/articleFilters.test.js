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
});
