<script>
  import { IconArrowLeft } from "@tabler/icons-svelte-runes";
  import SsoDirectory from "$lib/components/SsoDirectory.svelte";
  import GoogleSignIn from "$lib/components/GoogleSignIn.svelte";
  import GoogleSignIn2 from "$lib/components/GoogleSignIn2.svelte";
  import YahooSignIn from "$lib/components/YahooSignIn.svelte";
  import AppleSignIn from "$lib/components/AppleSignIn.svelte";
  import MicrosoftSignIn from "$lib/components/MicrosoftSignIn.svelte";
  import AolSignIn from "$lib/components/AolSignIn.svelte";
  import EmailSignIn from "$lib/components/EmailSignIn.svelte";


  let activeBrand = $state('home') // 'home' | 'google' | 'google2' | 'yahoo' | 'apple' | 'microsoft'  | 'aol' | 'email'

  let showNavbar = $state('hide') // 'show' | 'hide'
</script>


<section class="w-full min-h-screen m-0 p-0 flex flex-col relative bg-[#f8f9fa] font-sans">
  
  <!-- Floating universal quick back-to-home button visible when inside a brand flow -->
  {#if activeBrand !== 'home'}
    <button
      onclick={() => activeBrand = 'home'}
      class="fixed top-4 left-4 z-50 flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 hover:text-black rounded-full border border-gray-200 shadow-sm text-[11px] font-bold cursor-pointer transition-all hover:scale-105 active:scale-95 duration-150 select-none animate-fadeIn"
    >
      <IconArrowLeft stroke="currentColor" />
      <span>SSO Home</span>
    </button>
  {/if}

  <!-- Sticky Switcher Bar -->
  {#if showNavbar === 'show'}
    <div class="w-full sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-gray-200 py-3.5 px-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center text-white text-xs font-black">
          S
        </div>
        <div>
          <h1 class="text-sm font-bold text-gray-900 tracking-wide">Svelte 5 Brand Replicas</h1>
          <p class="text-[10px] text-gray-500 font-medium uppercase tracking-wider font-mono">SvelteKit Runes Architecture</p>
        </div>
      </div>

      <!-- Active Brand Switchers -->
      <div class="inline-flex items-center gap-1 bg-gray-100 p-1 rounded-full border border-gray-200/60 shadow-inner">
        <button
          onclick={() => activeBrand = 'home'}
          class="px-4 py-2 text-xs font-bold leading-none rounded-full transition-all duration-200 select-none cursor-pointer {activeBrand === 'home' ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/70'}"
        >
          Home
        </button>

        <button
          onclick={() => activeBrand = 'google'}
          class="px-4 py-2 text-xs font-bold leading-none rounded-full transition-all duration-200 select-none cursor-pointer {activeBrand === 'google' ? 'bg-[#1a73e8] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/70'}"
        >
          Google
        </button>

        <button
          onclick={() => activeBrand = 'google2'}
          class="px-4 py-2 text-xs font-bold leading-none rounded-full transition-all duration-200 select-none cursor-pointer {activeBrand === 'google' ? 'bg-[#1a73e8] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/70'}"
        >
          Google 2
        </button>

        <button
          onclick={() => activeBrand = 'yahoo'}
          class="px-4 py-2 text-xs font-bold leading-none rounded-full transition-all duration-200 select-none cursor-pointer {activeBrand === 'yahoo' ? 'bg-[#6001d2] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/70'}"
        >
          Yahoo!
        </button>

        <button
          onclick={() => activeBrand = 'apple'}
          class="px-4 py-2 text-xs font-bold leading-none rounded-full transition-all duration-200 select-none cursor-pointer {activeBrand === 'apple' ? 'bg-[#1d1d1f] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/70'}"
        >
          Apple
        </button>

        <button
          onclick={() => activeBrand = 'microsoft'}
          class="px-4 py-2 text-xs font-bold leading-none rounded-full transition-all duration-200 select-none cursor-pointer {activeBrand === 'microsoft' ? 'bg-[#0067b8] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/70'}"
        >
          Microsoft
        </button>

        <button
          onclick={() => activeBrand = 'aol'}
          class="px-4 py-2 text-xs font-bold leading-none rounded-full transition-all duration-200 select-none cursor-pointer {activeBrand === 'aol' ? 'bg-[#3f4dfa] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/70'}"
        >
          AOL
        </button>

        <button
          onclick={() => activeBrand = 'email'}
          class="px-4 py-2 text-xs font-bold leading-none rounded-full transition-all duration-200 select-none cursor-pointer {activeBrand === 'email' ? 'bg-slate-800 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/70'}"
        >
          Email & Pw
        </button>
      </div>

      <!-- Svelte indicator -->
      <div class="hidden lg:flex items-center gap-2 text-xs font-mono text-gray-400">
        <span class="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
        <span>Svelte 5 Runes Active</span>
      </div>
    </div>
  {/if}

  <!-- Dynamic Views -->
  <div class="flex-1 w-full transition-all duration-300">
    {#if activeBrand === 'home'}
      <SsoDirectory onSelectBrand={(brand) => activeBrand = brand} />
    {:else if activeBrand === 'google'}
      <GoogleSignIn />
    {:else if activeBrand === 'google2'}
      <GoogleSignIn2 />
    {:else if activeBrand === 'yahoo'}
      <YahooSignIn />
    {:else if activeBrand === 'apple'}
      <AppleSignIn />
    {:else if activeBrand === 'microsoft'}
      <MicrosoftSignIn />
    {:else if activeBrand === 'aol'}
      <AolSignIn />
    {:else if activeBrand === 'email'}
      <EmailSignIn />
    {/if}
  </div>
</section>
