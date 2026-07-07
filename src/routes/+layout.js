export const prerender = false;
export const ssr = true; // Enables Bun server to render layout elements before sending to browser


/** @type {import('./$types').LayoutServerLoad} */
export async function load() {
  return {};
}