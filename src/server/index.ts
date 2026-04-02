import 'dotenv/config';
import { createApp } from './app.ts';

const port = Number(process.env.API_PORT ?? 4010);
const app = createApp();

app.listen(port, '0.0.0.0', () => {
  console.log(`Inventory API listening on http://127.0.0.1:${port}`);
});
