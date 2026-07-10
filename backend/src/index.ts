import { buildServer } from "./server.js";
import { startKeeper } from "./keeper.js";
import { setupWebhook, telegramEnabled } from "./telegram.js";
import { config } from "./config.js";

const app = buildServer();

app.listen(config.port, () => {
  console.log(`[server] escuchando en :${config.port}`);
  if (telegramEnabled() && config.publicUrl) void setupWebhook(config.publicUrl);
  startKeeper();
});
