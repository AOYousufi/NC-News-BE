jest.mock("../db/connection", () => ({ query: jest.fn() }));
const db = require("../db/connection");
const { getNotifications } = require("../Models/notification.model");

describe("notification ordering", () => {
  beforeEach(() => jest.clearAllMocks());

  test.each([false, true])("uses a unique tie-breaker (unreadOnly=%s)", async (unreadOnly) => {
    const rows = [{ notification_id: 2 }, { notification_id: 1 }];
    db.query.mockResolvedValueOnce({ rows });
    await expect(getNotifications("alice", { unreadOnly })).resolves.toEqual(rows);
    const [sql, values] = db.query.mock.calls[0];
    expect(sql).toContain("ORDER BY n.created_at DESC, n.notification_id DESC");
    expect(sql).toContain("LIMIT 100");
    expect(sql).toContain("n.recipient_username = $1");
    expect(sql.includes("n.read_at IS NULL")).toBe(unreadOnly);
    expect(values).toEqual(["alice"]);
  });
});
