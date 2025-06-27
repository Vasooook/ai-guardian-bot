import { items } from '@wix/data';

export async function saveToTelegramGroups(partialData, identifierType = 'linkedUser') {
    const COLLECTION = 'Groups';

    if (!['chatId', 'linkedUser', 'ownerId'].includes(identifierType)) {
        throw new Error(`Invalid identifierType: ${identifierType}`);
    }

    const idValue = String(partialData[identifierType]);
    if (!idValue) {
        throw new Error(`Missing identifier value for: ${identifierType}`);
    }

    const query = items.query(COLLECTION).eq(identifierType, idValue).limit(1);
    const existingQuery = await query.find();
    const existing = existingQuery.items[0];

    const dataToSave = {
        ...(existing || {}),
        ...partialData,
        updatedAt: new Date()
    };

    if (existing && existing._id) {
        dataToSave._id = existing._id;
    }

    return await items.save(COLLECTION, dataToSave);
}
