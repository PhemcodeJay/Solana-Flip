import dotenv from 'dotenv';
import { Bot } from './bot';

dotenv.config();

const bot = new Bot();

bot.start().catch((error: unknown) => {
  console.error('Fatal error starting bot:', error);
  process.exit(1);
});
