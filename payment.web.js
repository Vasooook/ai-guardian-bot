import crypto from 'crypto';
import { Permissions, webMethod } from 'wix-web-module';
import { items } from '@wix/data';

export const generateWayForPaySubscriptionParams = webMethod(Permissions.Anyone, async ({ userId, firstName, langCode }) => {
    const merchantAccount = '';
    const merchantDomainName = '';
    const secretKey = '';

    const orderReference = `sub-${userId}-${Date.now()}`;
    const orderDate = Math.floor(Date.now() / 1000);
    const amount = 0.99;

    const currency = 'USD';
    const productName = ['AI Moderator'];
    const productCount = [1];
    const productPrice = [amount];

    const returnUrl = `https://www.your-domain/ai-panel?user=${userId}&order=${orderReference}&lang=${langCode}&name=${firstName}`;


    const signatureString = [
        merchantAccount,
        merchantDomainName,
        orderReference,
        orderDate,
        amount,
        currency,
        ...productName,
        ...productCount,
        ...productPrice
    ].join(';');

    const merchantSignature = crypto
        .createHmac('md5', secretKey)
        .update(signatureString)
        .digest('hex');

    // 🔁 Обновление TelegramGroups
    const linkedUser = parseInt(userId, 10);
    if (isNaN(linkedUser)) {
        throw new Error("Invalid userId — cannot convert to number.");
    }

    const COLLECTION = 'TelegramGroups';

    try {
        const query = await items.query(COLLECTION)
            .eq('linkedUser', linkedUser)
            .limit(1)
            .find();

        const existing = query.items[0];

        const updatedItem = {
            ...(existing || {}),
            linkedUser,
            subscriptionObject: {
                ...(existing?.subscriptionObject || {}),
                status: 'pending',
                orderReference,
                updatedAt: new Date()
            },
            updatedAt: new Date()
        };

        if (existing && existing._id) {
            updatedItem._id = existing._id;
        }

        await items.save(COLLECTION, updatedItem);
    } catch (err) {
        console.error("❌ Ошибка при обновлении подписки:", err);
        throw err;
    }

    // ✅ Формируем корректный URL вручную
    return {
        params: {
            merchantAccount,
            merchantDomainName,
            orderReference,
            orderDate: orderDate.toString(),
            amount: amount.toString(),
            currency,
            clientFirstName: firstName,
            language: 'EN',
            regularOn: '1',
            regularAmount: amount.toString(),
            regularMode: 'monthly',
            regularBehavior: 'preset',
            merchantSignature,
            returnUrl,
            productName,
            productCount,
            productPrice
        }
    };
});
