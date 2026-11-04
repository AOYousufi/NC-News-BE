const { extractMentions } = require("../utils/mentions");

describe("extractMentions", () => {
  test("finds handles wrapped in punctuation or parentheses", () => {
    expect(extractMentions("Hello (@alice), meet @bob-smith!")).toEqual([
      "alice",
      "bob-smith",
    ]);
  });

  test("does not treat email addresses or double @ as mentions", () => {
    expect(extractMentions("alice@example.com @@admin @real_user")).toEqual([
      "real_user",
    ]);
  });

  test("does not truncate long usernames or hyphenated handles", () => {
    expect(
      extractMentions("@abcdefghijklmnopqrstuvwxyz12345 @foo- @valid_user")
    ).toEqual(["foo-", "valid_user"]);
  });

  test("deduplicates mentions while preserving their first appearance", () => {
    expect(extractMentions("@alice @bob @alice")).toEqual(["alice", "bob"]);
  });

  test("ignores short usernames and non-string bodies", () => {
    expect(extractMentions("@ab and @abc")).toEqual(["abc"]);
    expect(extractMentions(null)).toEqual([]);
  });
});
