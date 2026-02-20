require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.BOT_TOKEN;
if (!token) {
  console.error("BOT_TOKEN missing in .env");
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });
console.log("Bot started");

// Track last bot message per chat
const lastMessage = {};

// Helper to send messages & auto-delete old ones
async function sendStep(chatId, text, buttons = null) {
  if (lastMessage[chatId]) {
    try {
      await bot.deleteMessage(chatId, lastMessage[chatId]);
    } catch (err) {}
  }

  const options = {};
  if (buttons) {
    options.reply_markup = { inline_keyboard: buttons };
  }

  const sentMessage = await bot.sendMessage(chatId, text, options);
  lastMessage[chatId] = sentMessage.message_id;
}

// START – Trigger on ANY message
bot.on('message', async (msg) => {
  if (!msg.from || msg.from.is_bot) return;
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || "there";

  await sendStep(
    chatId,
    `Hey ${firstName} 👋\n\nWelcome! Would be happy to give you access to our VIP trade membership. Before we get started, I just need to check one thing.\n\nDo you have a minimum of £1000 available to trade with?\n\nWe ask this so we can recommend the best option for you.`,
    [
      [{ text: "✅ Yes, I have minimum £1000+", callback_data: "has_500" }],
      [{ text: "❌ No, I don’t", callback_data: "no_500" }]
    ]
  );
});

// ✅ HANDLE ALL BUTTON CLICKS
bot.on('callback_query', async (query) => {
  const data = query.data;
  const chatId = query.message.chat.id;
  try { await bot.answerCallbackQuery(query.id); } catch {}

  // ✅ NO £500 → ASK ABOUT STEP 3 SETUP
  if (data === "no_500") {
    await sendStep(chatId,
      "No worries! Have you already set up and verified your Puprime trading account?",
      [
        [{ text: "❌ No", url: "https://t.me/PuprimeAccountSetup" }],
        [{ text: "I already have an account", url: "https://t.me/ExistingPuprimeAccount" }],
        [{ text: "✅ Yes", callback_data: "access_free_trades" }],
        [{ text: "🔙 Back", callback_data: "go_start" }]
      ]
    );
    return;
  }

  // ✅ RESULTS CHANNEL PATH (replaces Free Trades)
if (data === "access_free_trades") {
  await sendStep(chatId,
    "You're not ready for VIP yet — that's fine ✅\n\nStay connected and get regular updates on our daily trade results as your capital is too low to join VIP!",
    [
      [{ text: "📊 View Results Channel", url: "https://t.me/+IP-ZztKHbUFkNTVk" }],
      [{ text: "💬 Speak to Support", url: "https://t.me/thegoldroomsupport" }],
      [{ text: "🔙 Back", callback_data: "no_500" }]
    ]
  );
  return;
}

  // ✅ YES £500 → CHECK STEP 3
  if (data === "has_500") {
    await sendStep(chatId,
      "Great! Have you set up and verified your Puprime trading account?",
      [
        [{ text: "❌ No", url: "https://t.me/PuprimeAccountSetup" }],
        [{ text: "I already have an account", url: "https://t.me/ExistingPuprimeAccount" }],
        [{ text: "✅ Yes", callback_data: "access_vip" }],
        [{ text: "🔙 Back", callback_data: "go_start" }]
      ]
    );
    return;
  }

  // ✅ BACK TO START
  if (data === "go_start") {
    await sendStep(chatId,
      "No problem! Let's start again ✅\n\nDo you currently have at least £1000 available to trade with?",
      [
        [{ text: "✅ Yes, I have minimum £1000+", callback_data: "has_500" }],
        [{ text: "❌ No, I don’t", callback_data: "no_500" }]
      ]
    );
    return;
  }

  // ✅ VIP ENTRY QUESTION
  if (data === "access_vip") {
    await sendStep(chatId,
      "Before we continue to VIP Access, which of the following best describes you?",
      [
        [{ text: "📝 Beginner", callback_data: "qual_beginner" }],
        [{ text: "⚙️ Intermediate", callback_data: "qual_intermediate" }],
        [{ text: "🧠 Advanced", callback_data: "qual_advanced" }],
        [{ text: "🤔 I'm not sure", callback_data: "not_sure" }],
        [{ text: "🔙 Back", callback_data: "has_500" }]
      ]
    );
    return;
  }

  // ✅ "I'M NOT SURE" PATH – SHOW PLAN MENU
  if (data === "not_sure") {
    await sendStep(chatId,
      "No problem! I can help you decide ✅\n\nWhich plan would you like to learn more about?",
      [
        [{ text: "📝 Mentorship Plan (Beginner)", callback_data: "learn_beginner" }],
        [{ text: "⚙️ Education Plan (Intermediate)", callback_data: "learn_intermediate" }],
        [{ text: "🧠 Advanced Plan (Signals Only)", callback_data: "learn_advanced" }],
        [{ text: "🔙 Back", callback_data: "access_vip" }]
      ]
    );
    return;
  }
  // ✅ BEGINNER PLAN OVERVIEW
  if (data === "learn_beginner") {
    await sendStep(chatId,
      `📝 Mentorship Plan – Best for Beginners\n\nIf you're new to trading or copy/paste signals and want to build confidence with guidance and support, this package is for you.\n\n✅ What you get:\n- Access to our VIP Trade Channel\n- Real-time updates on trades and price action\n- Video education on account setup, copy/paste techniques and strategies, risk management techniques and importance\n- Trading psychology support (90% of success)\n- 2x private mentorship Zoom calls per month\nSession 1:live account strategy\nSession 2: evaluating your trading, assessing areas for improvement and tweaks in technique and psychology to improve your trading\n\nThis plan helps you learn while earning ✅\n\nDo you think the Mentorship Plan suits you best?`,
      [
        [{ text: "✅ Yes, I want this plan", callback_data: "buy_beginner" }],
        [{ text: "🎥 Watch plan video", url: "https://youtu.be/BjCHMptTbwI" }],
        [{ text: "💬 Speak to support", url: "https://t.me/thegoldroomsupport" }],
        [{ text: "🔙 Back", callback_data: "not_sure" }]
      ]
    );
    return;
  }

  // ✅ INTERMEDIATE PLAN OVERVIEW
  if (data === "learn_intermediate") {
    await sendStep(chatId,
      `⚙️ Education Plan – For Developing Traders\n\nYou have some general experience with signals, but have never received any education or guidance on how to copy/paste for consistent profitability. If you need guidance on account setup, how to copy/paste, risk management and psychology, but don't want any personal mentorship, this package is for you!\n\n✅ What you get:\n- VIP Trades access\n- Trade breakdowns + live price action insights\n- Account growth systems\n- Advanced risk management\n- Trade psychology mastery\n\nThis plan helps you go from inconsistent to confidently profitable 📈\n\nIs the Education Plan right for you?`,
      [
        [{ text: "✅ Yes, I want this plan", callback_data: "buy_intermediate" }],
        [{ text: "🎥 Watch plan video", url: "https://youtu.be/KxUusCxW2bY" }],
        [{ text: "💬 Speak to support", url: "https://t.me/thegoldroomsupport" }],
        [{ text: "🔙 Back", callback_data: "not_sure" }]
      ]
    );
    return;
  }

  // ✅ ADVANCED PLAN OVERVIEW
  if (data === "learn_advanced") {
    await sendStep(chatId,
      `🧠 Advanced Plan – Signals Only\n\nAlready confident with trading execution and just want high win-rate, accurate daily trade signals?\n\n✅ What you get:\n- VIP Trades Channel only\n- High-accuracy trade setups daily\n- Real-time trade management updates\n- Fast execution notifications\n- Market structure & analysis breakdowns\n\nThis plan is for serious traders only who want results without mentorship.\n\nIs the Advanced Plan right for you?`,
      [
        [{ text: "✅ Yes, I want this plan", callback_data: "buy_advanced" }],
        [{ text: "🎥 Watch plan video", url: "https://youtu.be/QSFpDbRDxSk" }],
        [{ text: "💬 Speak to support", url: "https://t.me/thegoldroomsupport" }],
        [{ text: "🔙 Back", callback_data: "not_sure" }]
      ]
    );
    return;
  }

  // ✅ DIRECT PATH OPTION STILL WORKS (WITHOUT "I'M NOT SURE")
  if (data === "qual_beginner") {
    await sendStep(chatId,
      "You've selected Beginner.\n\nWant to join now or learn more first?",
      [
        [{ text: "📌 Plan Overview", callback_data: "learn_beginner" }],
        [{ text: "✅ Join Now (£250/month)", callback_data: "buy_beginner" }],
        [{ text: "🔙 Back", callback_data: "access_vip" }]
      ]
    );
    return;
  }

  if (data === "qual_intermediate") {
    await sendStep(chatId,
      "You've selected Intermediate.\n\nWould you like full plan details before joining?",
      [
        [{ text: "📌 Plan Overview", callback_data: "learn_intermediate" }],
        [{ text: "✅ Join Now (£200/month)", callback_data: "buy_intermediate" }],
        [{ text: "🔙 Back", callback_data: "access_vip" }]
      ]
    );
    return;
  }

  if (data === "qual_advanced") {
    await sendStep(chatId,
      "You've selected Advanced.\n\nWould you like full plan details before joining?",
      [
        [{ text: "📌 Plan Overview", callback_data: "learn_advanced" }],
        [{ text: "✅ Join Now (£150/month)", callback_data: "buy_advanced" }],
        [{ text: "🔙 Back", callback_data: "access_vip" }]
      ]
    );
    return;
  }
  // ✅ PAY BUTTONS – PLACEHOLDERS (Replace later with Stripe links)
  if (data === "buy_beginner") {
    await sendStep(chatId,
      "🔥 You're choosing the Mentorship Plan (Beginner).\n\nClick below to complete your subscription:",
      [
        [{ text: "💳 Join Mentorship Plan (£250/month)", url: "https://buy.stripe.com/8x2fZjfKheT3h0q3oRbsc05" }],
        [{ text: "🔙 Back", callback_data: "learn_beginner" }]
      ]
    );
    return;
  }

  if (data === "buy_intermediate") {
    await sendStep(chatId,
      "🔥 You're choosing the Education Plan (Intermediate).\n\nClick below to complete your subscription:",
      [
        [{ text: "💳 Join Education Plan (£200/month)", url: "https://buy.stripe.com/dRm28t8hPdOZfWm1gJbsc04" }],
        [{ text: "🔙 Back", callback_data: "learn_intermediate" }]
      ]
    );
    return;
  }

  if (data === "buy_advanced") {
    await sendStep(chatId,
      "🔥 You're choosing the Advanced Plan (Signals Only).\n\nClick below to complete your subscription:",
      [
        [{ text: "💳 Join Advanced Plan (£150/month)", url: "https://buy.stripe.com/8x2dRb55D12d6lM9Nfbsc03" }],
        [{ text: "🔙 Back", callback_data: "learn_advanced" }]
      ]
    );
    return;
  }
});
