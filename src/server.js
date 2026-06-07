import { serve } from '@hono/node-server';
import streamExample from './stream-example.js';

serve(
  {
    fetch: streamExample.fetch,
    port: 3000,
  },
  () => {
    console.log('Server started at http://localhost:3000');
  },
);
