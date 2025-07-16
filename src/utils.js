import { render } from 'swtl';

const encoder = new TextEncoder();

export function createReadableStreamFromAsyncGenerator(output) {
    return new ReadableStream({
        async start(controller) {
            while (true) {
                const { done, value } = await output.next();

                if (done) {
                    controller.close();
                    break;
                }

                controller.enqueue(encoder.encode(value));
            }
        },
    });
}

export async function* renderInResolvedOrder(promises) {
    let promisesWithIndexes = promises.map((promise, index) => {
        return {
            index,
            promise: promise.then((value) => {
                return { index, value };
            }),
        };
    });

    while (promisesWithIndexes.length > 0) {
        const result = await Promise.race(
            promisesWithIndexes.map((p) => p.promise),
        );

        yield* render(result.value);

        promisesWithIndexes = promisesWithIndexes.filter((promise) => {
            return promise.index !== result.index;
        });
    }
}
