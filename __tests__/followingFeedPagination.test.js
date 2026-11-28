jest.mock("../db/connection", () => ({ query: jest.fn() }));
jest.mock("../Models/notification.model", () => ({ createNotification: jest.fn() }));

const db = require("../db/connection");
const { getFollowingFeed } = require("../Models/social.model");

describe("following feed pagination", () => {
  beforeEach(() => {
    db.query.mockReset();
    db.query.mockResolvedValue({ rows: [] });
  });

  test.each([
    [{ limit: "1.5" }, "limit"],
    [{ page: "2.5" }, "page"],
    [{ page: "Infinity" }, "page"],
    [{ limit: ["2", "3"] }, "limit"],
    [{ page: "0" }, "page"],
    [{ page: String(Number.MAX_SAFE_INTEGER) }, "page"],
  ])("rejects invalid pagination %p before querying", async (options, field) => {
    await expect(getFollowingFeed("alice", options)).rejects.toMatchObject({
      status: 400,
      msg: `Invalid ${field} value`,
    });
    expect(db.query).not.toHaveBeenCalled();
  });

  test("preserves default pagination", async () => {
    await getFollowingFeed("alice");
    expect(db.query.mock.calls[0][1]).toEqual(["alice", 20, 0]);
  });

  test("preserves the existing limit cap and calculates a valid offset", async () => {
    await getFollowingFeed("alice", { limit: "100", page: "3" });
    expect(db.query.mock.calls[0][1]).toEqual(["alice", 50, 100]);
  });
});
