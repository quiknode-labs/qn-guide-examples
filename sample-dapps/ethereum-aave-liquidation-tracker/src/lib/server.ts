import { config } from 'dotenv';
import express, { Request, Response } from 'express';
import { processLiquidationData } from './transform';
import { webhookSignatureMiddleware } from './security';

config();

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware to parse JSON with raw body for signature verification
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf.toString('utf8');
    },
  })
);


/**
 * Health check endpoint
 */
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Webhook endpoint for receiving Quicknode Stream data
 * Responds immediately and processes data asynchronously to avoid timeouts
 */
app.post('/webhook', webhookSignatureMiddleware, async (req: any, res: Response) => {
  try {
    const webhookData = req.body;

    // Log incoming webhook
    console.log('Received webhook data:', JSON.stringify(webhookData, null, 2));

    // Validate webhook data structure
    if (!webhookData || typeof webhookData !== 'object') {
      return res.status(400).json({ error: 'Invalid webhook data format' });
    }

    // Extract timestamp and filteredLogs from webhook payload
    const { timestamp, filteredLogs } = webhookData;

    // Handle Quicknode test/ping requests (empty or minimal payload)
    if (!timestamp || !filteredLogs) {
      console.log('Received test/ping request from Quicknode');
      return res.status(200).json({
        message: 'Webhook endpoint is healthy and ready to receive events'
      });
    }

    // Respond immediately to avoid timeout (Quicknode expects response within 30s)
    res.status(202).json({
      message: 'Webhook received, processing asynchronously',
      timestamp,
      eventCount: filteredLogs.length
    });

    // Process the liquidation data asynchronously
    // This runs in the background and won't block the response
    processLiquidationData({
      timestamp,
      filteredLogs,
    })
      .then(result => {
        if (result.error) {
          console.error('Error processing liquidation data:', result.error);
        } else {
          console.log('Successfully processed liquidation data:', result);
        }
      })
      .catch(error => {
        console.error('Fatal error processing liquidation data:', error);
      });

  } catch (error) {
    console.error('Webhook endpoint error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Start the server
 */
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║   Aave Liquidation Webhook Server Started     ║
╚═══════════════════════════════════════════════╝

Server running on: http://localhost:${PORT}
Webhook endpoint: http://localhost:${PORT}/webhook
Health check: http://localhost:${PORT}/health

Signature verification: ${process.env.WEBHOOK_SECRET_KEY ? 'ENABLED' : 'DISABLED'}
Quicknode RPC: ${process.env.QUICKNODE_RPC_URL ? 'CONFIGURED' : 'NOT CONFIGURED'}

Waiting for webhook events...
  `);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});
