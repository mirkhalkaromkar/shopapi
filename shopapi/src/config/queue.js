const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

const QUEUE_URL = process.env.SQS_QUEUE_URL;

// real SQS client — only used when QUEUE_URL is set (i.e. on AWS)
const sqsClient = QUEUE_URL
  ? new SQSClient({ region: process.env.AWS_REGION || 'ap-south-1' })
  : null;

/**
 * Publish an event to SQS.
 * Falls back to console.log when running locally (no QUEUE_URL set).
 *
 * @param {string} eventType  e.g. 'PRODUCT_CREATED'
 * @param {object} payload    any JSON-serialisable object
 */
async function publish(eventType, payload) {
  const message = {
    eventType,
    payload,
    timestamp: new Date().toISOString(),
  };

  if (!sqsClient) {
    // local mock — just log so we can see the event
    console.log('[queue] (mock)', JSON.stringify(message, null, 2));
    return;
  }

  try {
    await sqsClient.send(new SendMessageCommand({
      QueueUrl   : QUEUE_URL,
      MessageBody: JSON.stringify(message),
      MessageAttributes: {
        eventType: { DataType: 'String', StringValue: eventType },
      },
    }));
    console.log(`[queue] Published: ${eventType}`);
  } catch (err) {
    console.error('[queue] Failed to publish:', err.message);
  }
}

module.exports = { publish };
