const {
  parsePositiveId,
  parsePositiveIntegerQuery,
} = require("../utils/validation");
const { validateArticleFields } = require("../utils/articleValidation");

function expectBadRequest(action, expectedMessage) {
  try {
    action();
  } catch (error) {
    expect(error).toMatchObject({
      status: 400,
      ...(expectedMessage ? { msg: expectedMessage } : {}),
    });
    return;
  }
  throw new Error("Expected a 400 Bad Request error");
}

describe("numeric request parameter validation", () => {
  test.each([
    ["1", 1],
    ["0007", 7],
    [42, 42],
  ])("parses a valid resource ID %s", (input, expected) => {
    expect(parsePositiveId(input)).toBe(expected);
  });

  test.each([
    null,
    undefined,
    "",
    "0",
    0,
    "-1",
    "1.5",
    "1e3",
    " 2 ",
    "not-a-number",
    "9007199254740992",
    [],
    {},
    true,
  ].map((input) => [input]))("rejects an invalid resource ID: %s", (input) => {
    expectBadRequest(() => parsePositiveId(input));
  });

  test("allows an omitted optional query parameter", () => {
    expect(parsePositiveIntegerQuery(undefined, "limit", 100)).toBeUndefined();
  });

  test("accepts a bounded positive integer query", () => {
    expect(parsePositiveIntegerQuery("100", "limit", 100)).toBe(100);
    expect(parsePositiveIntegerQuery("0005", "limit", 100)).toBe(5);
  });

  test.each(["0", "101", "-1", "2.5", "1e2", " 5 ", [], {}].map((input) => [input]))(
    "rejects an invalid bounded query: %s",
    (input) => {
      expectBadRequest(() => parsePositiveIntegerQuery(input, "limit", 100), "Invalid limit value");
    }
  );
});

describe("article payload validation", () => {
  const valid = {
    title: "  Example headline  ",
    topic: " coding ",
    body: "  Example article body  ",
  };

  test("trims text fields without mutating the original payload", () => {
    const input = { ...valid, status: "draft" };
    const cleaned = validateArticleFields(input);
    expect(cleaned).toEqual({
      title: "Example headline",
      topic: "coding",
      body: "Example article body",
      status: "draft",
    });
    expect(input).toEqual({ ...valid, status: "draft" });
  });

  test("allows a single field for a partial article update", () => {
    expect(validateArticleFields({ title: "  New title " }, { partial: true }))
      .toEqual({ title: "New title" });
  });

  test("allows clearing an optional article image", () => {
    expect(validateArticleFields({ article_img_url: null }, { partial: true }))
      .toEqual({ article_img_url: null });
    expect(validateArticleFields({ article_img_url: "" }, { partial: true }))
      .toEqual({ article_img_url: null });
  });

  test.each([
    "https://images.example.com/photo.jpg",
    "http://localhost:3000/uploads/photo.png",
  ])("accepts valid HTTP(S) article image URLs: %s", (url) => {
    expect(validateArticleFields({ article_img_url: `  ${url}  ` }, { partial: true }))
      .toEqual({ article_img_url: url });
  });

  test.each([
    "photo.jpg",
    "//images.example.com/photo.jpg",
    "javascript:alert(1)",
    "data:image/png;base64,AAAA",
    "ftp://example.com/photo.jpg",
    "https://",
    "   ",
    42,
  ])("rejects unsafe or malformed article image URLs: %s", (url) => {
    expectBadRequest(() => validateArticleFields({ article_img_url: url }, { partial: true }));
  });

  test.each([
    [{}],
    [{ ...valid, title: "   " }],
    [{ ...valid, body: " " }],
    [{ ...valid, title: "x".repeat(301) }],
    [{ ...valid, unexpected: true }],
    [{ ...valid, status: "archived" }],
    [null],
    [[]],
  ])("rejects malformed create payload: %s", (input) => {
    expectBadRequest(() => validateArticleFields(input));
  });

  test("rejects empty or unknown partial updates", () => {
    expectBadRequest(() => validateArticleFields({}, { partial: true }));
    expectBadRequest(() => validateArticleFields({ votes: 100 }, { partial: true }));
  });
});
