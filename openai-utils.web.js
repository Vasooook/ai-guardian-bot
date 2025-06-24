import { fetch } from 'wix-fetch';
import FormData from 'form-data';
import axios from 'axios';

const OPENAI_API_KEY = '';
const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_WHISPER_URL = 'https://api.openai.com/v1/audio/transcriptions';

export async function moderateMessage(text) {
    const prompt = `
You are a calm and fair content reviewer.

Evaluate the message only for:

clear hate speech or targeted insults

threats of violence or incitement to harm

severe harassment or abusive spam

Do not flag casual slang, sarcasm, frustration, or impolite tone.

If the message clearly and seriously violates these rules, respond with:
"Hide"
Otherwise, respond with:
"Allow"

Message:
"""${text}"""
`;

    const response = await fetch(OPENAI_CHAT_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'You are an AI moderator.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.1
        })
    });

    const json = await response.json();
    return json?.choices?.[0]?.message?.content?.trim() || null;
}

export async function transcribeVoice(audioBuffer, mimeType) {
    try {
        const form = new FormData();
        // appending file — Buffer + имя + MIME
        form.append('file', audioBuffer, {
            filename: 'audio.ogg',
            contentType: mimeType
        });
        form.append('model', 'whisper-1');

        // axios сам подставит правильный Content-Type с границей
        const res = await axios.post(
            process.env.OPENAI_WHISPER_URL || OPENAI_WHISPER_URL,
            form, {
                headers: {
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY || OPENAI_API_KEY}`,
                    ...form.getHeaders()
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            }
        );

        // Обычно ответ у Whisper приходит в поле .data.text
        const text = res.data?.text;
        console.log('📝 Whisper response:', res.data);
        return typeof text === 'string' && text.length ? text : null;

    } catch (err) {
        console.error("❌ Ошибка при отправке на Whisper API:", err.response?.data || err);
        return null;
    }
}

export async function translateMessage(text, targetLangCode) {
    if (!targetLangCode) {
        throw new Error("Missing targetLangCode for translation");
    }

    const response = await fetch(OPENAI_CHAT_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{
                    role: 'system',
                    content: `
You are a concise translation assistant.
Always translate the user's input into ${targetLangCode}.
Respond with exactly the translated text and nothing else.
Do not add explanations, comments, or any extra formatting.
          `.trim()
                },
                {
                    role: 'user',
                    content: text
                }
            ],
            temperature: 0.0
        })
    });

    const json = await response.json();
    return (json.choices?.[0]?.message?.content || '').trim();
}