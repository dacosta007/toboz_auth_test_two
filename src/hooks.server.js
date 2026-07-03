import { TELEGRAM_BOT_TOKEN, PRODUCTION_URL } from '$env/static/private';

// Flag to track execution state across function cycles
let isWebhookRegistered = false;

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
  
  // 1. Run only once, in production environments, if not registered yet
  if (!isWebhookRegistered && process.env.NODE_ENV === 'production') {
    isWebhookRegistered = true; // Flips immediately to prevent racing conditions

    // Ensure the Vercel URL is cleanly formatted without trailing slashes
    const cleanBaseUrl = PRODUCTION_URL.endsWith('/') 
      ? PRODUCTION_URL.slice(0, -1) 
      : PRODUCTION_URL;
      
    const productionWebhookUrl = `${cleanBaseUrl}/api/webhook`;

    console.log(`📡 Production Auto-Sync: Registering webhook link: ${productionWebhookUrl}`);

    try {
      // 2. Programmatically fire the background registration check request
      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?url=${productionWebhookUrl}`);
      const data = await response.json();

      if (data.ok) {
        console.log(`✅ Production Auto-Sync Success: Telegram bot webhook is armed.`);
      } else {
        console.error(`❌ Production Auto-Sync Error: Telegram rejected registration - ${data.description}`);
        isWebhookRegistered = false; // Reset flag to retry on next cycle if failed
      }
    } catch (error) {
      console.error('❌ Production Auto-Sync Network Failure:', error);
      isWebhookRegistered = false;
    }
  }

  // Pass execution context safely down the normal SvelteKit rendering chain
  return await resolve(event);
}
  