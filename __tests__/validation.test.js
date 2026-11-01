const { parsePositiveId, parsePositiveIntegerQuery } = require("../utils/validation");
const { validateArticleFields } = require("../utils/articleValidation");

function expectBadRequest(fn, message = "Bad Request") {
  let thrown;
  try {
    fn();
  } catch (error) {
    thrown = error;
  }
  expect(thrown).toEqual({ status: 400, msg: message });
}

describe("numeric HTTP input validation", () => {
  test("accepts positive safe IDs and normalises leading zeroes", () => {
    expect(parsePositiveId("1")).toBe(1);
    expect(parsePositiveId("00042")).toBe(42);
    expect(parsePositiveId(Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER);
  });

  test.each([
    "0", "", "-2", "2.5", "1e2", " 2", "2 ", "9007199254740992",
    Number.MAX_SAFE_INTEGER + 1, false, null, undefined, [], {},
  ])("rejects malformed or unsafe ID: %p", (value) => {
    expectBadRequest(() => parsePositiveId(value));
  });

  test("accepts an omitted pagination query and valid bounded numbers", () => {
    expect(parsePositiveIntegerQuery(undefined, "limit", 100)).toBeUndefined();
    expect(parsePositiveIntegerQuery("01", "limit", 100)).toBe(1);
    expect(parsePositiveIntegerQuery("100", "limit", 100)).toBe(100);
  });

  test.each(["0", "101", "-1", "1.5", " 2", null, [], {}])(
    "rejects invalid bounded pagination value: %p",
    (value) => {
      expectBadRequest(
        () => parsePositiveIntegerQuery(value, "limit", 100),
        "Invalid limit value"
      );
    }
  );
});

describe("article field validation", () => {
  test("trims valid fields and supports clearing the image URL", () => {
    expect(validateArticleFields({
      title: "  A title  ",
      topic: "  cats ",
      body: "  An article  ",
      article_img_url: "",
      status: "draft",
    })).toEqual({
      title: "A title",
      topic: "cats",
      body: "An article",
      article_img_url: null,
      status: "draft",
    });
  });

  test("allows a partial edit with only supplied fields", () => {
    expect(validateArticleFields({ title: "  Updated " }, { partial: true }))
      .toEqual({ title: "Updated" });
  });

  test("enforces required fields and nonempty partial edits", () => {
    expectBadRequest(() => validateArticleFields({ title: "Title", topic: "cats" }));
    expectBadRequest(() => validateArticleFields({}, { partial: true }));
  });

  test("rejects invalid types, unexpected fields and invalid status", () => {
    expectBadRequest(() => validateArticleFields(null));
    expectBadRequest(() => validateArticleFields([]));
    expectBadRequest(() => validateArticleFields({ title: 123 }, { partial: true }));
    expectBadRequest(() => validateArticleFields({ extra: "unexpected" }, { partial: true }));
    expectBadRequest(() => validateArticleFields({ status: "archived" }, { partial: true }));
  });

  test("rejects fields exceeding the documented limits", () => {
    expectBadRequest(() => validateArticleFields({ title: "x".repeat(301) }, { partial: true }));
    expectBadRequest(() => validateArticleFields({ body: "x".repeat(50001) }, { partial: true }));
  });
});
