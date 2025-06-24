
import { handleTelegramUpdate, handleGroupMembershipUpdate } from 'backend/AIModerBot/telegram-handler.web';
import { updateTelegramGroupSubscription } from 'backend/AIModerBot/subscription-utils.web';

export async function post_telegramhook(request) {

    let raw;
    try {
        raw = await request.body.text();
        console.log('📦 RAW Telegram hook body:', raw);
    } catch (e) {
        console.error('❌ Ошибка чтения тела запроса:', e);
        return {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: { ok: false }
        };
    }

    let update;
    try {
        update = JSON.parse(raw);
        console.log('📩 Получен Telegram update:', JSON.stringify(update));
    } catch (e) {
        console.error('❌ JSON.parse failed:', e);

        return ok({
            body: { ok: true }
        });

    }

    setTimeout(() => {
        try {
            console.log('🔍 processTelegramUpdate start');
            processTelegramUpdate(update);
        } catch (e) {
            console.error('❌ processTelegramUpdate error:', e);
        }
    }, 0);

    return ok({
        body: { ok: true }
    });

}

export function processTelegramUpdate(update) {
    const type = Object.keys(update).find(k => typeof update[k] === 'object') || 'unknown';
    console.log(`🔍 Обнаружен тип update: ${type}`);

    if (type === 'message' || type === 'edited_message') {
        handleTelegramUpdate(update)
            .catch(err => console.error('❌ handleTelegramUpdate error:', err));
    } else if (type === 'my_chat_member') {
        handleGroupMembershipUpdate(update).catch(err => console.error("❌ handleGroupMembershipUpdate:", err));
    } else {
        console.log(`[SKIP] Неизвестный тип update: ${type}`);
    }
}

export function get_telegramhook(request) {
    // простой health-check для GET
    return ok({ body: { ok: true, message: "GET received" } });
}

export function get_orderStatus(request) {
    let params = request.query;
    let orderReference = params["orderReference"];

    if (!orderReference) {
        return badRequest({ body: { message: "Missing orderReference" } });
    }

    return items.query("Orders")
        .eq("orderReference", orderReference)
        .find()
        .then((results) => {
            if (results.items.length === 0) {
                return badRequest({ body: { message: "Order not found" } });
            }

            let order = results.items[0];
            return ok({ body: { status: order.status, paymentDate: order.paymentDate || null } });
        })
        .catch((error) => {
            console.error("❌ Ошибка получения статуса заказа:", error);
            return badRequest({ body: { message: "Server error" } });
        });
}