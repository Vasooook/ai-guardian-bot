import { fetch } from 'wix-fetch';
import { getStatus, setStatus } from 'backend/AIModerBot/updates.web';
import { saveToTelegramGroups } from 'backend/AIModerBot/telegram-db-utils.web';
import { moderateMessage, transcribeVoice, translateMessage } from 'backend/AIModerBot/openai-utils.web';
import { webMethod, Permissions } from 'wix-web-module';
import { items } from '@wix/data';
import { Buffer } from 'buffer';
import axios from 'axios';
import { detectLang } from 'backend/AIModerBot/lang-utils.js';

const BOT_TOKEN = "";
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
export const LANG = {
    en: {
        welcome: "👋 Hi, {name}! This is the AI moderator for Telegram groups.",
        features: "⚙️ Features:\n" +
            "▸ Auto-moderation — filters offensive or spam messages\n" +
            "▸ Voice recognition — converts voice to text\n" +
            "▸ Language translation — detects & translates languages\n" +
            "▸ WebApp connection — manage your group via UI\n" +
            "▸ Filter configuration — choose what to allow\n",

        instruction: "📌 First, add this bot to your Telegram group and set it as an administrator.",
        webAppBtn: "⚙️ Open WebApp after adding the bot"
    },
    ru: {
        welcome: "👋 Привет, {name}! Это AI-модератор для Telegram-групп.",
        features: "⚙️ Возможности:\n" +
            "▸ Автомодерация — фильтрация спама и оскорблений\n" +
            "▸ Распознавание речи — преобразование голосовых\n" +
            "▸ Перевод — определение и перевод языка\n" +
            "▸ WebApp-панель — удобное управление ботом\n" +
            "▸ Настройка фильтров — гибкий контроль правил\n",

        instruction: "📌 Сначала добавьте этого бота в свою группу Telegram и назначьте его администратором.",
        webAppBtn: "⚙️ Открыть WebApp после добавления бота"
    },
    es: {
        welcome: "👋 ¡Hola, {name}! Este es el moderador de IA para grupos de Telegram.",
        features: "⚙️ Funciones:\n" +
            "▸ Moderación automática — filtra mensajes ofensivos o spam\n" +
            "▸ Reconocimiento de voz — convierte voz a texto\n" +
            "▸ Traducción de idiomas — detecta y traduce\n" +
            "▸ Conexión WebApp — gestiona tu grupo desde la interfaz\n" +
            "▸ Configuración de filtros — controla qué se permite\n",

        instruction: "📌 Primero, agrega este bot a tu grupo de Telegram y hazlo administrador.",
        webAppBtn: "⚙️ Abrir WebApp después de añadir el bot"
    },
    pt: {
        welcome: "👋 Olá, {name}! Este é o moderador de IA para grupos do Telegram.",
        features: "⚙️ Funcionalidades:\n" +
            "▸ Moderação automática — filtra mensagens ofensivas ou spam\n" +
            "▸ Reconhecimento de voz — converte voz em texto\n" +
            "▸ Tradução — detecta e traduz idiomas\n" +
            "▸ Conexão WebApp — gerencie o grupo via interface\n" +
            "▸ Configuração de filtros — controle personalizado\n",

        instruction: "📌 Primeiro, adicione este bot ao seu grupo do Telegram e defina-o como administrador.",
        webAppBtn: "⚙️ Abrir WebApp após adicionar o bot"
    },
    de: {
        welcome: "👋 Hallo, {name}! Das ist der KI-Moderator für Telegram-Gruppen.",
        features: "⚙️ Funktionen:\n" +
            "▸ Automatische Moderation — filtert unerwünschte Inhalte\n" +
            "▸ Spracherkennung — wandelt Sprache in Text um\n" +
            "▸ Übersetzung — erkennt und übersetzt Sprachen\n" +
            "▸ WebApp-Verbindung — Gruppenverwaltung per UI\n" +
            "▸ Filterkonfiguration — individuell anpassbar\n",

        instruction: "📌 Füge diesen Bot zunächst deiner Telegram-Gruppe hinzu und mache ihn zum Administrator.",
        webAppBtn: "⚙️ WebApp öffnen, nachdem der Bot hinzugefügt wurde"
    },
    fr: {
        welcome: "👋 Salut, {name} ! Voici le modérateur IA pour les groupes Telegram.",
        features: "⚙️ Fonctions :\n" +
            "▸ Modération automatique — filtre les spams et insultes\n" +
            "▸ Reconnaissance vocale — transforme la voix en texte\n" +
            "▸ Traduction — détecte et traduit les langues\n" +
            "▸ Connexion WebApp — interface intuitive de gestion\n" +
            "▸ Configuration des filtres — contrôle personnalisé\n",

        instruction: "📌 Ajoutez d'abord ce bot à votre groupe Telegram et définissez-le comme administrateur.",
        webAppBtn: "⚙️ Ouvrir WebApp après avoir ajouté le bot"
    },
    tr: {
        welcome: "👋 Merhaba, {name}! Bu Telegram grupları için AI moderatörüdür.",
        features: "⚙️ Özellikler:\n" +
            "▸ Otomatik moderasyon — spam ve hakaretleri filtreler\n" +
            "▸ Ses tanıma — sesi metne dönüştürür\n" +
            "▸ Çeviri — dili algılar ve çevirir\n" +
            "▸ WebApp bağlantısı — arayüz ile yönetim\n" +
            "▸ Filtre ayarları — kişiselleştirilebilir\n",

        instruction: "📌 Önce bu botu Telegram grubunuza ekleyin ve yönetici olarak atayın.",
        webAppBtn: "⚙️ Bot eklendikten sonra WebApp'i aç"
    },
    ar: {
        welcome: "👋 مرحبًا {name}! هذا هو المشرف الذكي لمجموعات تيليجرام.",
        features: "⚙️ الميزات:\n" +
            "▸ الإشراف التلقائي — تصفية الرسائل المسيئة\n" +
            "▸ التعرف على الصوت — تحويل الصوت إلى نص\n" +
            "▸ الترجمة — الكشف عن اللغة وترجمتها\n" +
            "▸ اتصال WebApp — واجهة إدارة مرئية\n" +
            "▸ تكوين الفلاتر — قابل للتخصيص\n",

        instruction: "📌 أولاً، أضف هذا الروبوت إلى مجموعتك على تيليجرام وعيّنه كمسؤول.",
        webAppBtn: "⚙️ افتح WebApp بعد إضافة الروبوت"
    },
    uk: {
        welcome: "👋 Привіт, {name}! Це AI-модератор для Telegram-груп.",
        features: "⚙️ Можливості:\n" +
            "▸ Автомодерація — фільтрує спам і образи\n" +
            "▸ Розпізнавання мови — перетворює голос у текст\n" +
            "▸ Переклад — визначає мову та перекладає\n" +
            "▸ WebApp — зручне керування групою\n" +
            "▸ Налаштування фільтрів — гнучке управління\n",

        instruction: "📌 Спочатку додайте цього бота до своєї Telegram-групи та надайте йому права адміністратора.",
        webAppBtn: "⚙️ Відкрити WebApp після додавання бота"
    },
    fa: {
        welcome: "👋 سلام، {name}! این ربات هوشمند مدیریت گروه‌های تلگرام است.",
        features: "⚙️ امکانات:\n" +
            "▸ مدیریت خودکار — حذف پیام‌های نامناسب\n" +
            "▸ تشخیص صدا — تبدیل صدا به متن\n" +
            "▸ ترجمه — تشخیص و ترجمه زبان‌ها\n" +
            "▸ اتصال WebApp — کنترل از طریق رابط کاربری\n" +
            "▸ تنظیم فیلترها — سفارشی‌سازی‌شده\n",

        instruction: "📌 ابتدا این ربات را به گروه تلگرام خود اضافه کرده و آن را به عنوان مدیر تنظیم کنید.",
        webAppBtn: "⚙️ باز کردن WebApp پس از افزودن ربات"
    },
    zh: {
        welcome: "👋 你好，{name}！这是用于 Telegram 群组的 AI 管理员。",
        features: "⚙️ 功能：\n" +
            "▸ 自动审核 — 过滤垃圾或攻击性信息\n" +
            "▸ 语音识别 — 将语音转为文字\n" +
            "▸ 翻译功能 — 自动检测并翻译语言\n" +
            "▸ WebApp连接 — 通过界面管理群组\n" +
            "▸ 筛选器配置 — 灵活设定规则\n",

        instruction: "📌 首先将该机器人添加到你的 Telegram 群组中并设置为管理员。",
        webAppBtn: "⚙️ 添加机器人后打开 WebApp"
    }
};
const VIOLATION_REASONS = {
    en: "Your message was removed due to inappropriate content.",
    ru: "Ваше сообщение было удалено из-за нарушения правил.",
    uk: "Ваше повідомлення видалено через порушення правил.",
    es: "Tu mensaje fue eliminado por contenido inapropiado.",
    pt: "Sua mensagem foi removida por conteúdo impróprio.",
    de: "Deine Nachricht wurde wegen unangemessenen Inhalts entfernt.",
    fr: "Votre message a été supprimé pour contenu inapproprié.",
    tr: "Mesajınız uygunsuz içerik nedeniyle silindi.",
    ar: "تم حذف رسالتك بسبب المحتوى غير اللائق.",
    fa: "پیام شما به دلیل محتوای نامناسب حذف شد.",
    zh: "您的消息因不当内容被删除。"
};

export const setTelegramLocalizedCommands = webMethod(Permissions.Anyone, async () => {

    const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

    const commands = [
        { command: "/start", descriptionKey: "Начать работу" }
    ];

    const translations = {
        en: ["Start bot"],
        ru: ["Начать работу"],
        es: ["Iniciar bot"],
        pt: ["Iniciar bot"],
        de: ["Bot starten"],
        fr: ["Démarrer le bot"],
        tr: ["Botu başlat"],
        ar: ["بدء البوت"],
        uk: ["Запустити бота"],
        fa: ["شروع ربات"],
        zh: ["启动机器人"]
    };

    for (const [langCode, labels] of Object.entries(translations)) {
        const localizedCommands = commands.map((cmd, i) => ({
            command: cmd.command,
            description: labels[i]
        }));

        const payload = {
            language_code: langCode,
            commands: localizedCommands
        };

        try {
            const res = await fetch(`${TELEGRAM_API}/setMyCommands`, {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const result = await res.json();
            console.log(`✅ [${langCode}]`, result);
        } catch (err) {
            console.error(`❌ [${langCode}]`, err.message || err);
        }
    }

    return { ok: true };
});

export async function sendTelegramMessage(chatId, text, replyToMessageId = null) {
    const payload = {
        chat_id: chatId,
        text: escapeMarkdown(text),
        parse_mode: 'MarkdownV2',
        ...(replyToMessageId ? { reply_to_message_id: replyToMessageId } : {})
    };

    try {
        const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (!json.ok) {
            console.warn('⚠️ sendMessage failed:', json);
        } else {
            console.log(`✅ Message sent: chat=${chatId}, msg=${json.result.message_id}`);
        }
    } catch (e) {
        console.error('❌ sendTelegramMessage error:', e);
    }
}

function escapeMarkdown(text) {
    return text
        .replace(/\\/g, '\\\\')
        .replace(/[_[\]()~`>#+=|{}.!-]/g, '\\$&');
}

export async function getTelegramVoiceBuffer(fileUrl) {
    try {
        const res = await axios.get(fileUrl, { responseType: 'arraybuffer' });
        return Buffer.from(res.data);
    } catch (err) {
        console.error("❌ Ошибка в getTelegramVoiceBuffer:", err);
        return null;
    }
}

export async function getTelegramFileUrl(fileId) {
    try {
        const res = await fetch(`${TELEGRAM_API}/getFile?file_id=${fileId}`);
        const json = await res.json();
        if (json.ok && json.result.file_path) {
            return `https://api.telegram.org/file/bot${BOT_TOKEN}/${json.result.file_path}`;
        }
        throw new Error('no file_path');
    } catch (e) {
        console.error('❌ getTelegramFileUrl error:', e);
        return null;
    }
}

async function addViolationToGroup(chatId, violation) {
    const result = await items.query("TelegramViolations").eq("chatId", chatId).limit(1).find();
    const existing = result.items[0];

    if (existing) {
        await items.save("TelegramViolations", {
            ...existing,
            violations: [...(existing.violations || []), violation]
        });
    } else {
        await items.save("TelegramViolations", {
            chatId,
            groupTitle: null,
            violations: [violation]
        });
    }
}

export const confirmGroupOwner = webMethod(Permissions.Anyone, async ({ userId }) => {
    if (!userId || typeof userId !== 'number') {
        throw new Error("Invalid userId");
    }

    try {
        const result = await items.query("TelegramGroups")
            .eq('ownerId', userId)
            .hasSome('type', ['group', 'supergroup'])
            .eq('moderatorOn', true)
            .descending('addedAt')
            .limit(1)
            .find();

        if (!result.items.length) {
            return { ok: false, reason: "NO_GROUP_FOUND" };
        }

        const group = result.items[0];

        await saveToTelegramGroups({
            linkedUser: userId,
            subscriptionCheckedAt: new Date()
        }, 'linkedUser');

        return {
            ok: true,
            groupId: group.chatId,
            title: group.groupTitle || null
        };

    } catch (err) {
        console.error("❌ confirmGroupOwner error:", err);
        return { ok: false, reason: "SERVER_ERROR" };
    }
});

export async function sendTelegramWebAppButton(chatId, label, userId, name, lang) {
    try {
        const url = `https://365jpg.art/ai-panel?user=${userId}&name=${encodeURIComponent(name)}&lang=${lang}`;
        const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: '🔧 Нажмите кнопку ниже для открытия интерфейса:',
                reply_markup: {
                    keyboard: [
                        [{ text: label, web_app: { url } }]
                    ],
                    resize_keyboard: true,
                    one_time_keyboard: true
                }
            })
        });
        const json = await res.json();
        if (!json.ok) console.warn('⚠️ sendWebAppButton failed:', json);
        else console.log(`✅ WebApp button sent: chat=${chatId}`);
    } catch (e) {
        console.error('❌ sendTelegramWebAppButton error:', e);
    }
}

export async function handleTelegramUpdate(update) {
    console.log('▶️ Enter handleTelegramUpdate', update.update_id);
    const msg = update.message || update.edited_message;
    if (!msg || (!msg.text && !msg.voice)) {
        console.log('⏭️ Нет текста и нет голоса — выходим');
        return;
    }

    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    const updateId = update.update_id;
    const textRaw = msg.text?.trim() || '';
    const langCode = (msg.from.language_code || 'en').toLowerCase();
    const userLang = LANG[langCode] || LANG.en;
    const firstName = msg.from.first_name || 'User';

    /*const seen = await items.query('TelegramProcessed')
        .eq('updateId', updateId)
        .limit(1)
        .find();
    if (seen.items.length) {
        console.log(`⏭️ Update уже обработан: ${updateId}`);
        return;
    }
    await items.insert('TelegramProcessed', {
        _id: String(updateId),
        chatId,
        messageId,
        updateId,
        processedAt: new Date()
    });*/

    if (textRaw === '/start') {
        const st = await getStatus(chatId);
        if (st?.lastCommand !== '/start') {
            await setStatus(chatId, 'active', {
                language: langCode,
                firstName,
                lastCommand: '/start',
                lastCommandDate: new Date(),
                isGroup: msg.chat.type !== 'private'
            });
            await sendTelegramMessage(chatId, userLang.welcome.replace('{name}', firstName));
            await sendTelegramMessage(chatId, userLang.features);
            if (userLang.instruction) {
                await sendTelegramMessage(chatId, userLang.instruction);
            }
        }
        return;
    }

    const chatIdStr = String(chatId);
    let grpRes = await items.query('TelegramGroups')
        .eq('chatId', chatIdStr)
        .limit(1)
        .find();

    if (!grpRes.items.length) {
        console.log('⚠️ Запись по string chatId не найдена, пробуем по number');
        grpRes = await items.query('TelegramGroups')
            .eq('chatId', chatId)
            .limit(1)
            .find();
    }

    const group = grpRes.items[0];
    if (!group) {
        console.log('⏭️ TelegramGroups record не найден, выходим');
        return;
    }

    if (!group.moderatorOn || !group.isPaid || !group.voiceToTextOn) {
        console.log('⏭️ Модерация или подписка не активны — выходим', {
            moderatorOn: group.moderatorOn,
            isPaid: group.isPaid,
            voiceToTextOn: group.voiceTiTextOn
        });
        return;
    }

    let finalText = msg.text?.trim() || '';
    if (msg.voice) {
        console.log('🔊 Голосовое сообщение, запускаем транскрипцию...');
        const fileUrl = await getTelegramFileUrl(msg.voice.file_id);
        const buf = fileUrl && await getTelegramVoiceBuffer(fileUrl);
        if (!buf) {
            console.error('❌ Не удалось скачать голосовое — выходим');
            return;
        }
        const transcript = await transcribeVoice(buf, msg.voice.mime_type || 'audio/ogg');
        console.log('📝 Результат транскрипции:', transcript);
        if (!transcript) {
            console.error('❌ Транскрипт пустой — не отправляем перевод или модерацию');
            finalText = '';
        } else {
            finalText = transcript;
        }
    }

    if (!finalText) {
        console.log('⏭️ Нет текста после транскрипции — выходим');
        return;
    }

    const mod = await moderateMessage(finalText);

    if (mod === 'Hide') {
        const reason = VIOLATION_REASONS[group.translationLang] || 'Inappropriate message';
        const mention = msg.from.username ?
            `@${msg.from.username}` :
            `${firstName}`;

        await sendTelegramMessage(
            chatId,
            `⚠️ ${reason}\n${mention}, please follow the rules.`,
            messageId
        );
        await deleteTelegramMessage(chatId, messageId);
        return;
    }

    const sourceLang = detectLang(finalText);
    console.log('🕵️ Detected language:', sourceLang);

    let translatedText = null;

    const shouldTranslate = (
        group.translationLang &&
        sourceLang &&
        sourceLang !== group.translationLang
    );

    if (shouldTranslate) {
        try {
            translatedText = await translateMessage(finalText, group.translationLang);
        } catch (e) {
            console.error('❌ Ошибка при переводе:', e);
        }
    }

    if (translatedText && translatedText !== finalText) {
        await sendTelegramMessage(chatId, `🗯️ ${translatedText}`, messageId);
    } else {
        await sendTelegramMessage(chatId, `📝 ${finalText}`, messageId);
    }

}

export async function deleteTelegramMessage(chatId, messageId) {
    try {
        const res = await fetch(`${TELEGRAM_API}/deleteMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, message_id: messageId })
        });
        const json = await res.json();
        if (!json.ok) console.warn('⚠️ deleteMessage failed:', json);
    } catch (e) {
        console.error('❌ deleteTelegramMessage error:', e);
    }
}

export async function handleGroupMembershipUpdate(update) {
    console.log('🔔 handleGroupMembershipUpdate:', JSON.stringify(update));

    try {
        let cm = update.my_chat_member;

        // Альтернатива — если событие пришло как message
        if (!cm && update.message) {
            const msg = update.message;
            const newMember = msg.new_chat_member || (msg.new_chat_members && msg.new_chat_members[0]);
            if (newMember) {
                cm = {
                    chat: msg.chat,
                    from: msg.from,
                    new_chat_member: newMember,
                    old_chat_member: msg.left_chat_member ? { status: 'left' } : {}
                };
            }
        }

        if (!cm) {
            console.log('⏭️ Не membership-событие, выходим');
            return;
        }

        const chatId = String(cm.chat.id);
        const newStatus = cm.new_chat_member.status;
        const oldStatus = cm.old_chat_member.status;

        // Бот удалён из группы — удаляем запись
        if (newStatus === 'left') {
            const q = await items.query('TelegramGroups').eq('chatId', chatId).limit(1).find();
            if (q.items.length) {
                await items.remove('TelegramGroups', q.items[0]._id);
                console.log(`🗑️ Удалили запись для chatId=${chatId}`);
            }
            return;
        }

        // Статус не поменялся или не стал админом — игнор
        if (newStatus === oldStatus || (newStatus !== 'administrator' && newStatus !== 'creator')) {
            console.log('⏭️ Не админ-статус — выходим', { newStatus, oldStatus });
            return;
        }

        // Проверка, существует ли уже запись
        const q2 = await items.query('TelegramGroups').eq('chatId', chatId).limit(1).find();
        const existing = q2.items[0];
        console.log('🔍 existing record:', existing);

        // Сбор данных для вставки/обновления
        const record = {
            chatId,
            type: cm.chat.type || 'group',
            groupTitle: cm.chat.title || null,
            addedAt: existing?.addedAt || new Date(),
            updatedAt: new Date(),

            subscriptionCheckedAt: existing?.subscriptionCheckedAt || null,
            recToken: existing?.recToken || null,
            subscriptionObject: existing?.subscriptionObject || null,
            order: existing?.order || null,

            ownerId: cm.from.id,
            linkedUser: cm.from.id,
            confirmedByUserId: true,
            adminConfirmed: true,

            moderatorOn: true,
            voiceToTextOn: true,
            langFilterOn: existing?.langFilterOn || false,
            subscriptionValid: existing?.subscriptionValid || false,
            isPaid: existing?.isPaid || false,

            // Всегда true при добавлении
            webAppButtonSent: true
        };

        let recordId;
        if (existing) {
            recordId = existing._id;
            await items.update('TelegramGroups', { _id: recordId, ...record });
            console.log('⬆️ Обновили запись, _id=', recordId);
        } else {
            const inserted = await items.insert('TelegramGroups', record);
            recordId = inserted._id;
            console.log('🆕 Вставили новую запись, _id=', recordId);
        }

        // Отправка WebApp-кнопки только если её ещё не было
        if (!existing?.webAppButtonSent) {
            const lang = (cm.from.language_code || 'en').toLowerCase();
            const label = LANG[lang]?.webAppBtn || LANG.en.webAppBtn;
            console.log('🚀 Шлём WebApp-кнопку пользователю', cm.from.id);

            await sendTelegramWebAppButton(
                cm.from.id,
                label,
                cm.from.id,
                cm.from.first_name,
                lang
            );

            console.log('✅ WebApp-кнопка отправлена (webAppButtonSent установлен заранее)');
        }
    } catch (err) {
        console.error('❌ Ошибка в handleGroupMembershipUpdate:', err);
    }
}