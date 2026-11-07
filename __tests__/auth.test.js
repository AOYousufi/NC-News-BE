const crypto = require("node:crypto");
const {
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
} = require("../utils/auth");

// Sign intentionally malformed claims with the test secret to exercise claim
// validation independently from signature verification.
function signTestClaims(payload) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const unsigned = `${header}.${body}`;
  const secret = process.env.JWT_SECRET || "nc-news-test-secret";
  const signature = crypto.createHmac("sha256", secret).update(unsigned).digest("base64url");
  return `${unsigned}.${signature}`;
}

describe("password hashing", () => {
  test("accepts the correct password and rejects a wrong one", async () => {
    const storedHash = await hashPassword("example-password");
    expect(storedHash).toMatch(/^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
    await expect(verifyPassword("example-password", storedHash)).resolves.toBe(true);
    await expect(verifyPassword("different-password", storedHash)).resolves.toBe(false);
  });

  test("generates a different salt for each password hash", async () => {
    const first = await hashPassword("example-password");
    const second = await hashPassword("example-password");
    expect(first).not.toBe(second);
  });

  test.each([
    null,
    undefined,
    "not-a-hash",
    "bcrypt$00$abcd",
    "scrypt$00$zz",
    "scrypt$" + "a".repeat(32) + "$zz",
    "scrypt$" + "a".repeat(31) + "$" + "b".repeat(128),
    "scrypt$" + "a".repeat(32) + "$" + "b".repeat(127),
    "scrypt$" + "a".repeat(32) + "$" + "b".repeat(128) + "$extra",
  ])("rejects malformed stored password hash: %s", async (storedHash) => {
    await expect(verifyPassword("anything", storedHash)).resolves.toBe(false);
  });
});

describe("signed bearer tokens", () => {
  test("verifies tokens issued by the server", () => {
    const token = signToken("example_user");
    expect(verifyToken(token).sub).toBe("example_user");
  });

  test.each([
    ["a blank subject", { sub: "  " }],
    ["a numeric subject", { sub: 123 }],
    ["a missing issued-at time", { iat: undefined }],
    ["a string issued-at time", { iat: "123" }],
    ["a string expiry", { exp: "9999999999" }],
    ["a future issued-at time", { iat: "future" }],
    ["an expiry before issued-at", { exp: "before" }],
  ])("rejects signed tokens with %s", (_label, overrides) => {
    const now = Math.floor(Date.now() / 1000);
    const claims = { sub: "example_user", iat: now, exp: now + 3600 };
    const adjusted = { ...overrides };
    if (adjusted.iat === "future") adjusted.iat = now + 120;
    if (adjusted.exp === "before") adjusted.exp = now - 120;
    expect(() => verifyToken(signTestClaims({ ...claims, ...adjusted }))).toThrow();
  });

  test("rejects modified tokens", () => {
    const token = signToken("example_user");
    const [header, payload, signature] = token.split(".");
    const alteredPayload = Buffer.from(
      JSON.stringify({ sub: "another_user", exp: 9999999999 })
    ).toString("base64url");
    expect(() => verifyToken([header, alteredPayload, signature].join("."))).toThrow();
  });
});
