import { serve } from '@hono/node-server';

import app from './app.js';

serve(app).listen(3000, () => {
    console.log('Server started at http://localhost:3000');
});
