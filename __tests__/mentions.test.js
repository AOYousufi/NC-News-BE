const { extractMentions } = require("../utils/mentions");

describe("extractMentions", () => {
  test("finds unique mentions at the start of text and after whitespace", () => {
    expect(extractMentions("@alice Hi @bob, @alice!")).toEqual(["alice", "bob"]);
  });

  test("recognises usernames inside brackets, including trailing dashes", () => {
    expect(extractMentions("Hi (@sara-), [@john_doe], {@ravi_}, @sara-."))
      .toEqual(["sara-", "john_doe", "ravi_"]);
  });

  test("ignores email addresses, embedded handles and partial long usernames", () => {
    const tooLong = "x".repeat(31);
    expect(extractMentions(`bob@example.com hi@zoe @ab @${tooLong} @valid_name`))
      .toEqual(["valid_name"]);
  });

  test("returns no mentions for invalid input", () => {
    for (const value of [null, undefined, 123, {}, []]) {
      expect(extractMentions(value)).toEqual([]);
    }
  });
});
