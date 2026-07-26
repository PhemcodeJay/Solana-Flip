"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const bot_1 = require("./bot");
dotenv_1.default.config();
const bot = new bot_1.Bot();
bot.start().catch((error) => {
    console.error('Fatal error starting bot:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map