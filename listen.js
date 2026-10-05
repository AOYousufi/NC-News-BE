const app = require("./app.js");
const db = require("./db/connection");
const migrate = require("./db/migrate");

const { PORT = 9090 } = process.env;

async function startServer() {
  try {
    await migrate();
    app.listen(PORT, () => console.log(`Listening on ${PORT}...`));
  } catch (error) {
    console.error("Unable to start server", error);
    await db.end();
    process.exit(1);
  }
}

startServer();
