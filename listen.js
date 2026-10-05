const app = require("./app.js");
const db = require("./db/connection");
const migrate = require("./db/migrate");

const { PORT = 9090 } = process.env;
const ENV = process.env.NODE_ENV || "development";

async function startServer() {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET not set");
    }

    if (ENV === "production") {
      await migrate();
    }

    app.listen(PORT, () => console.log(`Listening on ${PORT}...`));
  } catch (error) {
    console.error("Unable to start server", error);
    await db.end();
    process.exit(1);
  }
}

startServer();
