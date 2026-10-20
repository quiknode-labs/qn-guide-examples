import { processLiquidationData } from './transform';
import { createWebhookApp } from './webhook';

const secret = process.env.WEBHOOK_SECRET_KEY?.trim();
if (!secret) throw new Error('WEBHOOK_SECRET_KEY is required');
const port = Number(process.env.PORT ?? 3005);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
const app = createWebhookApp(secret, processLiquidationData);
const server = app.listen(port, () => console.log(`Webhook listening on http://localhost:${port}`));
server.requestTimeout = 30_000;
for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.once(signal, () => server.close());
}
