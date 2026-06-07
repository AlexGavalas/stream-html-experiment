export function createReadableStreamFromAsyncGenerator(output) {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      while (true) {
        const { done, value } = await output.next();

        controller.enqueue(encoder.encode(value));

        if (done) {
          controller.close();
          break;
        }
      }
    },
  });
}

export async function* renderInResolvedOrder(promises) {
  let promisesWithIndexes = promises.map((promise, index) => ({
    index,
    promise: promise.then((value) => ({ index, value })),
  }));

  while (promisesWithIndexes.length > 0) {
    const result = await Promise.race(
      promisesWithIndexes.map((p) => p.promise),
    );

    yield* result.value;

    promisesWithIndexes = promisesWithIndexes.filter(
      (promise) => promise.index !== result.index,
    );
  }
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
