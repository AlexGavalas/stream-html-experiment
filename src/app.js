import { readFile } from 'node:fs/promises';
import { Hono } from 'hono';
import { stream } from 'hono/streaming';
import { render, html } from 'swtl';

import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

import {
    renderInResolvedOrder,
    createReadableStreamFromAsyncGenerator,
} from './utils.js';

const app = new Hono();

const renderMdx = async () => {
    const content = await readFile('./src/content/test.mdx', 'utf-8');

    // await new Promise((resolve) => setTimeout(resolve, 1000));

    const htmlContent = await unified()
        .use(remarkParse)
        .use(remarkRehype)
        .use(rehypeSanitize)
        .use(rehypeStringify)
        .process(content);

    return htmlContent;
};

const getItemSlots = ({ count, getLoadingUI }) => {
    return Array.from(
        { length: count },
        (_, index) =>
            html`<slot name="item-${index}">${getLoadingUI({ index })}</slot>`,
    );
};

const getItem = async ({ delay, index }) => {
    await new Promise((resolve) => setTimeout(resolve, Math.random() * delay));

    return html`<div slot="item-${index}">
	Item ${index}
    </div>`;
    
    // Experiment with iframes
    return html`<div slot="item-${index}">
        <form action="/count" target="counter" method="GET">
            <button>Increase server counter</button>
        </form>
        <form action="/count-initial" target="counter" method="GET">
            <button>Reset server counter</button>
        </form>
    </div>`;
};

const getItems = ({ count, delay }) => {
    return Array.from({ length: count }, (_, index) =>
        getItem({ delay, index }),
    );
};

const shell = ({ count, children }) => html`
    <html>
        <head>
            <title>Streaming example></title>
        </head>
        <body>
            <template shadowrootmode="open">
                <style>
                    iframe {
                        border: none;
                    }
                </style>
                <iframe name="counter" src="/count-initial"></iframe>
                ${getItemSlots({
                    count,
                    getLoadingUI: ({ index }) =>
                        html`<p>Loading ${index}...</p>`,
                })}
            </template>
            ${renderInResolvedOrder(children)}
        </body>
    </html>
`;

app.get('/', (ctx) => {
    return stream(ctx, async (stream) => {
        ctx.res.headers.set('Content-Type', 'text/html');

        const itemsCount = 5;

        return stream.pipe(
            createReadableStreamFromAsyncGenerator(
                render(
                    shell({
                        count: itemsCount,
                        children: getItems({
                            count: itemsCount,
                            delay: 3000,
                        }),
                    }),
                ),
            ),
        );
    });
});

let counter = 0;

app.get('/count-initial', (ctx) => {
    counter = 0;
    return ctx.html`<p>Count initial!</p>`;
});

app.get('/count', (ctx) => {
    counter += 1;
    return ctx.html(`<p>Count ${counter}!</p>`);
});

export default app;
