import { items } from '@wix/data';
const COLLECTION = "TelegramUpdates";

export async function setStatus(chatId, status, extra = {}) {
    const _id = String(chatId);

    try {
        let existing = {};
        try {
            existing = await items.get(COLLECTION, _id);
        } catch (_) {
            console.log(`[DB] No existing record for chatId=${chatId}, creating new`);
        }

        const updatedItem = {
            ...existing,
            ...extra,
            _id,
            chatId,
            status,
            updatedAt: new Date()
        };

        const result = await items.save(COLLECTION, updatedItem);
        console.log(`[DB] Saved TelegramUpdate for chatId=${chatId}, status=${status}`);
        return result;
    } catch (err) {
        console.error(`❌ Failed to save status for chatId=${chatId}:`, err);
        throw err;
    }
}

export async function getStatus(chatId) {
    try {
        const result = await items.get(COLLECTION, String(chatId));
        return {
            status: result.status,
            lastCommand: result.lastCommand,
            lastCommandDate: result.lastCommandDate,
            lastMessageId: result.lastMessageId
        };
    } catch (err) {
        console.warn(`[DB] No status found for chat ${chatId}`);
        return null;
    }
}