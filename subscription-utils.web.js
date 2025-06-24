import { items } from '@wix/data';



export async function updateTelegramGroupSubscription(orderReference, transactionStatus) {
    console.log(`📡 updateTelegramGroupSubscription: ${orderReference}, статус: ${transactionStatus}`);

    const parts = orderReference.split("-");
    const linkedUserStr = parts[1];
    const linkedUser = parseInt(linkedUserStr, 10);

    if (isNaN(linkedUser)) {
        console.warn(`⚠️ Невозможно извлечь linkedUser из orderReference: ${orderReference}`);
        return;
    }

    const isSuccess = ["approved", "success"].includes(transactionStatus.toLowerCase());

    const tgQuery = await items.query("TelegramGroups")
        .eq("linkedUser", linkedUser)
        .limit(1)
        .find();

    if (!tgQuery.items.length) {
        console.warn(`⚠️ TelegramGroups не найдена по linkedUser=${linkedUser}`);
        return;
    }

    const existing = tgQuery.items[0];
    const currentStatus = (existing.subscriptionObject?.status || "").toLowerCase();
    const incomingStatus = transactionStatus.toLowerCase();

    if (currentStatus === incomingStatus) {
        console.log(`⏩ Статус не изменился (текущий = ${currentStatus}), обновление не требуется`);
        return;
    }

    const updatedItem = {
        ...existing,
        isPaid: isSuccess,
        subscriptionValid: isSuccess,
        subscriptionObject: {
            ...(existing.subscriptionObject || {}),
            status: transactionStatus,
            lastPaymentDate: new Date(),
            updatedAt: new Date()
        },
        updatedAt: new Date()
    };

    try {
        await items.save("TelegramGroups", updatedItem);
        console.log(`✅ TelegramGroups обновлён для linkedUser=${linkedUser}`);
    } catch (err) {
        console.error("❌ Ошибка при сохранении TelegramGroups:", err);
    }
}

