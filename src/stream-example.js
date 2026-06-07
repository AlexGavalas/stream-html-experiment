import { Hono } from 'hono';
import { html } from 'hono/html';
import { stream } from 'hono/streaming';
import {
  createReadableStreamFromAsyncGenerator,
  renderInResolvedOrder,
  sleep,
} from './utils.js';

const app = new Hono();

const renderLoadingItem = async ({ delay, index }) => {
  if (delay) {
    await sleep(Math.random() * delay);
  }

  return html`<p><?start name="item-${index}">Loading item ${index}<?end></p>`;
};

const renderDelayedContentItem = async ({ delay, index }) => {
  await sleep(Math.random() * delay);

  return html`<template for="item-${index}">Item ${index}</template>`;
};

// A simple async generator that yields chunks of HTML over time.
async function* dataStream(totalParts, delay) {
  const loadingItems = Array.from({ length: totalParts }, (_, index) =>
    renderLoadingItem({ index }),
  );

  yield* renderInResolvedOrder(loadingItems);

  await sleep(3000);

  const contetItems = Array.from({ length: totalParts }, (_, index) =>
    renderDelayedContentItem({ delay, index }),
  );

  yield* renderInResolvedOrder(contetItems);
}

app.get('/', (ctx) => {
  return stream(ctx, async (stream) => {
    ctx.res.headers.set('Content-Type', 'text/html');

    return stream.pipe(
      createReadableStreamFromAsyncGenerator(dataStream(5, 1000)),
    );
  });
});

export default app;
