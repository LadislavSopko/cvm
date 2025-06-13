import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env file from workspace root
config({ path: resolve(__dirname, '.env') });