const devData = require("../data/development-data/index.js");
const seed = require("./seed.js");
const db = require("../connection.js");

async function runSeed() {
  try {
    await seed(devData);
  } catch (error) {
    console.error("Seed failed", error);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
}

doSeed();
