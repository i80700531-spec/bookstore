import dotenv from 'dotenv';
dotenv.config();

export const TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8489768603:AAEY22zfIOrhhBRGAfLkAw13GWgtOs3gEyE';
export const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || '588796266';
export const PORT = process.env.PORT || 3001;
export const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_books_123';
