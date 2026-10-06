import { NextRequest, NextResponse } from "next/server";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { name, phone, email, comment } = body;

    if (!name || !phone) {
      return NextResponse.json(
        {
          success: false,
          message: "Заполните имя и телефон",
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.error("Telegram environment variables are missing");

      return NextResponse.json(
        {
          success: false,
          message: "Ошибка конфигурации сервера",
        },
        {
          status: 500,
          headers: corsHeaders,
        },
      );
    }

    const message = `
<b>📩 Новая заявка с сайта</b>

<b>👤 Имя:</b> ${escapeHtml(name)}
<b>📞 Телефон / WhatsApp:</b> ${escapeHtml(phone)}
<b>📧 Email:</b> ${escapeHtml(email || "Не указан")}
<b>💬 Комментарий:</b> ${escapeHtml(comment || "Не указан")}
    `.trim();

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: "HTML",
        }),
      },
    );

    const telegramData = await telegramResponse.json();

    if (!telegramResponse.ok) {
      console.error("Telegram error:", telegramData);

      return NextResponse.json(
        {
          success: false,
          message: "Не удалось отправить заявку",
        },
        {
          status: 500,
          headers: corsHeaders,
        },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Заявка успешно отправлена",
      },
      {
        status: 200,
        headers: corsHeaders,
      },
    );
  } catch (error) {
    console.error("Contact API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Произошла ошибка при отправке",
      },
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
