/**
 * worker.js — SQS consumer
 *
 * Runs as a separate process: `node src/worker.js`
 * Polls SQS every 5 seconds and processes product events.
 *
 * Locally: no SQS_QUEUE_URL set → logs a message and exits gracefully.
 * On AWS : connects to the real SQS queue and long-polls.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} = require('@aws-sdk/client-sqs');

const QUEUE_URL   = process.env.SQS_QUEUE_URL;
const AWS_REGION  = process.env.AWS_REGION || 'ap-south-1';
const POLL_WAIT   = 5;   // seconds (long-poll)

if (!QUEUE_URL) {
  console.log('[worker] SQS_QUEUE_URL not set — nothing to poll locally.');
  console.log('[worker] Set SQS_QUEUE_URL in .env when running on AWS.');
  process.exit(0);
}

const sqs = new SQSClient({ region: AWS_REGION });

// ── Event handlers ─────────────────────────────────────────

function handleProductCreated(payload) {
  console.log(`[worker] New product created — ID: ${payload.id}, Name: ${payload.name}`);
  // TODO: trigger inventory check, send notification email, update search index
}

function handleProductUpdated(payload) {
  console.log(`[worker] Product updated — ID: ${payload.id}`);
  // TODO: re-index product in search
}

function handleProductDeleted(payload) {
  console.log(`[worker] Product deleted — ID: ${payload.id}`);
  // TODO: remove from search index, notify warehouse
}

const handlers = {
  PRODUCT_CREATED: handleProductCreated,
  PRODUCT_UPDATED: handleProductUpdated,
  PRODUCT_DELETED: handleProductDeleted,
};

// ── Poll loop ──────────────────────────────────────────────

async function poll() {
  try {
    const { Messages } = await sqs.send(new ReceiveMessageCommand({
      QueueUrl           : QUEUE_URL,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds    : POLL_WAIT,   // long-polling — reduces empty receives
    }));

    if (!Messages || !Messages.length) return;

    for (const msg of Messages) {
      try {
        const { eventType, payload } = JSON.parse(msg.Body);
        console.log(`[worker] Received: ${eventType}`);

        const handler = handlers[eventType];
        if (handler) {
          await handler(payload);
        } else {
          console.warn(`[worker] No handler for event: ${eventType}`);
        }

        // delete from queue only after successful processing
        await sqs.send(new DeleteMessageCommand({
          QueueUrl     : QUEUE_URL,
          ReceiptHandle: msg.ReceiptHandle,
        }));
      } catch (msgErr) {
        console.error('[worker] Failed to process message:', msgErr.message);
        // message returns to queue after visibility timeout — will be retried
      }
    }
  } catch (err) {
    console.error('[worker] Poll error:', err.message);
  }
}

// ── Start ──────────────────────────────────────────────────

console.log('[worker] Starting — polling queue:', QUEUE_URL);

setInterval(poll, (POLL_WAIT + 1) * 1000);
poll(); // first poll immediately
