import express, { type ErrorRequestHandler } from 'express';
import { webhookSignatureMiddleware } from './security';
import { liquidationPayload, type LiquidationPayload } from './payload';

type ProcessResult = { error?: string; processedLiquidations?: number };
export function createWebhookApp(
  secret: string,
  processLiquidations: (payload: LiquidationPayload) => Promise<ProcessResult>,
) {
  const app = express();
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  // Verify the exact bytes before parsing JSON, regardless of Content-Type.
  app.post('/webhook', (req, res, next) => {
    if (req.headers['content-encoding'] && req.headers['content-encoding'] !== 'identity') {
      res.status(415).json({ error: 'Set Streams payload compression to None' });
      return;
    }
    next();
  }, express.raw({ type: () => true, limit: '1mb', inflate: false }),
  webhookSignatureMiddleware(secret), async (req, res) => {
    let json: unknown;
    try { json = JSON.parse(req.body.toString('utf8')); }
    catch { res.status(400).json({ error: 'Invalid JSON' }); return; }
    const parsed = liquidationPayload.safeParse(json);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid liquidation payload' });
      return;
    }
    try {
      const result = await processLiquidations(parsed.data);
      if (result.error || result.processedLiquidations !== parsed.data.filteredLogs.length) {
        throw new Error('Incomplete liquidation processing');
      }
      res.status(200).json({ message: 'Liquidations persisted', eventCount: result.processedLiquidations });
    } catch {
      console.error('Liquidation processing failed; returning 503 for retry');
      res.status(503).json({ error: 'Could not persist liquidations; retry delivery' });
    }
  });
  const errors: ErrorRequestHandler = (error, _req, res, next) => {
    if (res.headersSent) { next(error); return; }
    res.status(error.type === 'entity.too.large' ? 413 : 400).json({ error: 'Invalid request body' });
  };
  app.use(errors);
  return app;
}
