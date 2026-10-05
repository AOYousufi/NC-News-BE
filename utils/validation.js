function badRequest(message = "Bad Request") {
  return { status: 400, msg: message };
}

function parsePositiveId(value) {
  if (
    (typeof value !== "string" && typeof value !== "number") ||
    !/^\d+$/.test(String(value))
  ) {
    throw badRequest();
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw badRequest();
  }

  return parsed;
}

function parsePositiveIntegerQuery(value, field, max) {
  if (value === undefined) return undefined;
  if (
    (typeof value !== "string" && typeof value !== "number") ||
    !/^\d+$/.test(String(value))
  ) {
    throw badRequest(`Invalid ${field} value`);
  }

  const parsed = Number(value);
  if (
    !Number.isSafeInteger(parsed) ||
    parsed < 1 ||
    (max !== undefined && parsed > max)
  ) {
    throw badRequest(`Invalid ${field} value`);
  }

  return parsed;
}

module.exports = { badRequest, parsePositiveId, parsePositiveIntegerQuery };
