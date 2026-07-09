import { buildServer } from "./server.js";
import { startKeeper } from "./keeper.js";
import { config } from "./config.js";

const app = buildServer();

app.listen(config.port, () => {
  console.log(`[server] escuchando en :${config.port}`);
  startKeeper();
});
