import { json } from '@sveltejs/kit';
import Pusher from 'pusher';
import { PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER } from '$env/static/private';

const pusher = new Pusher({
  appId: PUSHER_APP_ID,
  key: PUSHER_KEY,
  secret: PUSHER_SECRET,
  cluster: PUSHER_CLUSTER,
  useTLS: true
});

/** @type {import('./$types').RequestHandler} */
export const POST = async ({ request }) => {
  const body = await request.text();
  
  // Convert standard x-www-form-urlencoded params from Pusher client
  const params = new URLSearchParams(body);
  const socketId = params.get('socket_id');
  const channelName = params.get('channel_name');

  if (!socketId || !channelName) {
    return json({ error: 'Missing parameters' }, { status: 400 });
  }

  try {
    // Generate the authentication signatures string signature
    const authResponse = pusher.authenticate(socketId, channelName);
    
    // Explicitly return the raw payload parameters to prevent SvelteKit response body mismatches
    return json(authResponse);
  } catch (error) {
    console.error('Pusher authentication failure:', error);
    return json({ error: 'Authentication generation failed' }, { status: 500 });
  }
};
