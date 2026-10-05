const { Pool } = require("pg");

const ENV = process.env.NODE_ENV || "development";

require("dotenv").config({
  path: `${__dirname}/../.env.${ENV}`,
});

const config = {};

if (ENV === "production") {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL not set");
  }
  config.connectionString = process.env.DATABASE_URL;
  config.max = 2;
} else if (process.env.DATABASE_URL) {
  config.connectionString = process.env.DATABASE_URL;
} else if (!process.env.PGDATABASE) {
  throw new Error("PGDATABASE not set");
}

const db = new Pool(config);

module.exports = db;
