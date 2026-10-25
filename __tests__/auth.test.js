const {
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
} = require("../utils/auth");

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

  test("rejects modified tokens", () => {
    const token = signToken("example_user");
    const [header, payload, signature] = token.split(".");
    const alteredPayload = Buffer.from(
      JSON.stringify({ sub: "another_user", exp: 9999999999 })
    ).toString("base64url");
    expect(() => verifyToken([header, alteredPayload, signature].join("."))).toThrow();
  });
});
