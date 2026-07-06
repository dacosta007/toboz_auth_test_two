export const prerender = false;
export const ssr = false; // Kept false for static Server-Side Rendering


/** @type {import('./$types').LayoutServerLoad} */
export async function load() {
  return {};
}