<script>
  import { onMount } from 'svelte';

  // --- TYPE DEFINITIONS & ENUMS ---
  const AuthStep = $state({
    EMAIL: 'EMAIL',
    PASSWORD: 'PASSWORD',
    MFA_SELECT: 'MFA_SELECT',
    MFA_PROMPT: 'MFA_PROMPT',
    MFA_OTP: 'MFA_OTP',
    SUCCESS: 'SUCCESS'
  } )

  const MfaMethod = {
    PROMPT: 'PROMPT',
    OTP: 'OTP'
  } 

  // interface SecurityEvent {
  //   id: string;
  //   timestamp: string;
  //   type: 'INFO' | 'WARN' | 'SUCCESS' | 'ERROR';
  //   message: string;
  //   details?: string;
  // }


  let email = $state('dacosta00736@gmail.com');
  let step = $state(AuthStep.EMAIL);
  let mfaMethodChosen = $state(null);
  let targetMatchingNumber = $state(48);
  let mobileOtpCode = $state('840291');
  let isProcessing = $state(false);
  
  // UI Inputs & Focus States
  let emailInput = $derived(email);
  let passwordInput = $state('');
  let otpInput = $state('');
  
  let emailFocused = $state(false);
  let passwordFocused = $state(false);
  let otpFocused = $state(false);
  
  let showPassword = $state(false);
  let errorText = $state('');

  // Mobile Device Simulation States
  let phoneTime = $state('08:12');
  let batteryLevel = $state(94);
  let deviceVibrating = $state(false);
  let userApprovedPromptIdentity = $state(false);
  let wrongAttempts = $state(0);
  let numberSelectionOptions = $state([]);

  // Security Lab & Environment Payload Options
  let activeTab = $state('EXPLANATION'); // 'EXPLANATION' | 'ATTACK_LAB' | 'STANDARDS'
  let copied = $state(false);
  
  let simulatedDeviceLocation = $state('London, UK (Estimated IP: 84.23.181.12)');
  let simulatedBrowserInfo = $state('Chrome on macOS (Ventura OS 13.5)');

  const locations = [
    'London, UK (Estimated IP: 84.23.181.12)',
    'New York, USA (Estimated IP: 104.244.76.1)',
    'Paris, France (Estimated IP: 195.154.122.3)',
    'Tokyo, Japan (Estimated IP: 210.140.10.99)',
  ];

  const browsers = [
    'Chrome on macOS (Ventura OS 13.5)',
    'Firefox on Windows 11 (Gecko Engine)',
    'Safari on iPadOS 17 (WebKit Engine)',
    'Edge on Ubuntu Linux (Blink Engine)',
  ];

  // Live Terminal Logs
  let logs = $state([
    {
      id: 'init-evt',
      timestamp: '08:12:14',
      type: 'INFO',
      message: 'Svelte 5 MFA Simulator component initialized.',
      details: 'Fine-grained reactive runes binding active. Standby for secure assertion payload.'
    }
  ]);

  // --- LIFECYCLE & EFFECTS ---
  onMount(() => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const mins = now.getMinutes().toString().padStart(2, '0');
    phoneTime = `${hours}:${mins}`;
    addLog('MFA Academic Cryptography Simulator initialized in Svelte 5.', 'INFO');
  });

  // Track email synchronizations
  $effect(() => {
    emailInput = email;
  });

  // --- LOG HANDLER ---
  function addLog(message, type='INFO' | 'WARN' | 'SUCCESS' | 'ERROR', details) {
    const now = new Date();
    const timestamp = now.toTimeString().split(' ')[0];
    logs = [
      {
        id: Math.random().toString(36).substring(2, 9),
        timestamp,
        type,
        message,
        details
      },
      ...logs
    ];
  }

  function clearLogs() {
    logs = [];
    addLog('System Logs cleared.', 'INFO');
  }

  function handleCopyLogs() {
    const text = logs.map(l => `[${l.timestamp}] [${l.type}] ${l.message} ${l.details ? `(${l.details})` : ''}`).join('\n');
    navigator.clipboard.writeText(text);
    copied = true;
    setTimeout(() => { copied = false; }, 2000);
    addLog('System Logs copied to clipboard.', 'INFO');
  }

  // --- STATE TRANSITIONS ---
  function triggerStepTransition(nextStep, logText, details) {
    isProcessing = true;
    addLog('Synthesizing workspace changes...', 'INFO');
    
    setTimeout(() => {
      step = nextStep;
      isProcessing = false;
      addLog(logText, 'INFO', details);
    }, 900);
  }

  // --- WORKSPACE ACTIONS ---
  function handleEmailSubmit(e) {
    e.preventDefault();
    if (!emailInput.trim()) {
      errorText = 'Enter an email or phone number';
      addLog('Login validation failed: empty identifier', 'WARN');
      return;
    }
    
    if (!emailInput.includes('@') && emailInput.length < 5) {
      errorText = 'Enter a valid email address';
      addLog(`Invalid email identifier: "${emailInput}"`, 'WARN');
      return;
    }

    errorText = '';
    email = emailInput;
    
    triggerStepTransition(
      AuthStep.PASSWORD,
      `Identifier validated: ${email}`,
      'The sign-in client requests password verification. Secure cryptohandshake initiates.'
    );
  }

  function handlePasswordSubmit(e) {
    e.preventDefault();
    if (!passwordInput.trim()) {
      errorText = 'Enter your password';
      addLog('Password validation failed: empty field', 'WARN');
      return;
    }

    if (passwordInput.length < 5) {
      errorText = 'Wrong password. Try again or click Forgot password.';
      addLog('Failed password attempt. Length under threshold.', 'WARN');
      return;
    }

    errorText = '';
    addLog('Primary password verification passed. Multi-Factor (2FA) policy triggered.', 'SUCCESS');
    
    // Choose random number & secure OTP challenge
    targetMatchingNumber = Math.floor(Math.random() * 89) + 10;
    mobileOtpCode = Math.floor(100000 + Math.random() * 900000).toString();

    triggerStepTransition(
      AuthStep.MFA_SELECT,
      'Redirecting to Multi-factor Authentication directory...',
      `Policy requires secondary verification. Options compiled: SMS OTP, and App-Push Contextual Verification.`
    );
  }

  function selectMfaMethod(method) {
    mfaMethodChosen = method;
    
    if (method === MfaMethod.PROMPT) {
      addLog(
        `Device Prompt selected. Dispatched notification payload to mobile authenticator.`,
        'INFO',
        `Push Target: Samsung Galaxy/iPad - Target Match Value: ${targetMatchingNumber}`
      );
      
      // Calculate distractor numbers for high-fidelity prompt choice buttons
      const correct = targetMatchingNumber;
      let distractor1 = Math.floor(Math.random() * 89) + 10;
      while (distractor1 === correct) {
        distractor1 = Math.floor(Math.random() * 89) + 10;
      }
      let distractor2 = Math.floor(Math.random() * 89) + 10;
      while (distractor2 === correct || distractor2 === distractor1) {
        distractor2 = Math.floor(Math.random() * 89) + 10;
      }

      numberSelectionOptions = [correct, distractor1, distractor2].sort(() => Math.random() - 0.5);
      userApprovedPromptIdentity = false;
      wrongAttempts = 0;
      deviceVibrating = true;
      setTimeout(() => { deviceVibrating = false; }, 1800);

      triggerStepTransition(
        AuthStep.MFA_PROMPT,
        `Device verification active. Waiting for mobile response on Code: [${targetMatchingNumber}]`,
        'Encrypted push channel established via Firebase Cloud Messaging (FCM). Session tokens exchanged with device ID.'
      );
    } else {
      addLog(
        `SMS OTP selected. Dispatched SMS transmission over GSM network.`,
        'INFO',
        `Text payload: "G-${mobileOtpCode} is your Google verification code." to simulated end-device.`
      );
      
      deviceVibrating = true;
      setTimeout(() => { deviceVibrating = false; }, 1000);

      triggerStepTransition(
        AuthStep.MFA_OTP,
        `SMS OTP authentication active. Waiting for code: G-${mobileOtpCode}`,
        'OTP generated with 5-minute expiry. Secure hashed storage waiting for user visual mapping.'
      );
    }
  }

  function handleOtpSubmit(e) {
    e.preventDefault();
    const cleanOtp = otpInput.replace(/\D/g, '');
    
    if (!cleanOtp) {
      errorText = 'Enter a verification code';
      addLog('OTP entry failed: empty value', 'WARN');
      return;
    }

    if (cleanOtp !== mobileOtpCode) {
      errorText = 'Incorrect code. Check your simulated smartphone notification or SMS log and try again.';
      addLog(`OTP Verification failed: Entered "${cleanOtp}", expected "${mobileOtpCode}"`, 'ERROR');
      return;
    }

    errorText = '';
    addLog(`OTP Verification matched: ${cleanOtp} matches active challenge key.`, 'SUCCESS');
    
    triggerStepTransition(
      AuthStep.SUCCESS,
      'MFA requirements fulfilled. Authenticated session token issued.',
      `Security assertion verified. Logged in as: ${email}`
    );
  }

  function handleApproveIdentityResponse(confirmed) {
    if (confirmed) {
      userApprovedPromptIdentity = true;
      addLog(
        'User confirmed identity sign-in on device. Moving to numerical choice array matching step.',
        'INFO',
        'Authentication service requires match verification to prevent accidental trigger approvals.'
      );
    } else {
      addLog('User rejected prompt on Google Authenticator. Denying session tokens.', 'WARN');
      step = AuthStep.MFA_SELECT;
      mfaMethodChosen = null;
    }
  }

  function handleNumberMatchClick(num) {
    if (num === targetMatchingNumber) {
      addLog(`Numerical selection matched on companion device! Selection: [${num}]`, 'SUCCESS');
      
      isProcessing = true;
      setTimeout(() => {
        step = AuthStep.SUCCESS;
        isProcessing = false;
        addLog('MFA Handshake successfully completed. JWT assertion established.', 'SUCCESS');
      }, 800);
    } else {
      wrongAttempts += 1;
      addLog(`Wrong selection clicked on companion device: [${num}]. Expected: [${targetMatchingNumber}].`, 'ERROR');
      
      if (wrongAttempts >= 2) {
        addLog('Device verification blocked due to repeated incorrect choices.', 'ERROR');
        step = AuthStep.MFA_SELECT;
        mfaMethodChosen = null;
      }
    }
  }

  function handleReset() {
    email = 'dacosta00736@gmail.com';
    step = AuthStep.EMAIL;
    mfaMethodChosen = null;
    passwordInput = '';
    otpInput = '';
    errorText = '';
    userApprovedPromptIdentity = false;
    wrongAttempts = 0;
    addLog('State machine reset. Reverted back to step 1: Identifier Entry.', 'WARN');
  }

  function handleLocationChange(loc) {
    simulatedDeviceLocation = loc;
    addLog(`Environmental Simulation: Location updated to ${loc}`, 'INFO');
  }

  function handleBrowserChange(browser) {
    simulatedBrowserInfo = browser;
    addLog(`Environmental Simulation: User-Agent headers updated to ${browser}`, 'INFO');
  }
</script>

<div class="min-h-screen bg-[#f8f9fa] flex flex-col text-[#202124] font-sans selection:bg-[#d2e3fc]">
  <main class="grow p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
    <!-- MAIN TWO COLUMN PANELS -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
      
      <!-- COLUMN 1: LEFT SUBGRID (Web sign-in client + Mobile Phone side-by-side) -->
      <div class="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-start bg-white p-5 md:p-6 rounded-2xl border border-neutral-200 shadow-xs relative">
        
        <!-- Segment Indicators -->
        <div class="absolute top-3 left-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest pointer-events-none select-none hidden md:block">
          🖥️ Local Desktop Browser
        </div>
        <div class="absolute top-3 right-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest pointer-events-none select-none text-right hidden md:block">
          📱 Authenticating Smartphone
        </div>

        <!-- GOOGLE SIGN-IN BOX (🖥️ BROWSER) -->
        <div class="pt-4 flex justify-center w-full">
          <div id="google-signin-workspace" class="flex flex-col items-center w-full">
            <div id="google-chrome-shell" class="w-full max-w-md bg-white rounded-xl shadow-md border border-[#dadce0] transition-all overflow-hidden relative">
              
              <!-- Animated Progress Bar if processing -->
               <div class="absolute top-0 left-0 right-0 h-1 bg-[#e8f0fe] overflow-hidden transition-opacity duration-300 {isProcessing ? 'opacity-100' : 'opacity-0'}">
                <div class="h-full bg-[#1a73e8] animate-[loading-bar_1.2s_infinite_ease-in-out]"></div>
              </div>
              <!-- {#if isProcessing}
                <div class="absolute top-0 left-0 right-0 h-1 bg-[#e8f0fe] overflow-hidden">
                  <div class="h-full bg-blue-300 w-1/3 animate-[pulse_1s_infinite] rounded-full"></div>
                </div>
              {/if} -->

              <div class="p-8 sm:p-10 flex flex-col justify-between min-h-125">
                
                <!-- Header section -->
                <div>
                  <!-- Google Logo -->
                  <div class="flex items-center justify-center space-x-0.5 select-none mb-6">
                    <span class="font-display font-medium text-[24px] tracking-tight text-[#4285F4]">G</span>
                    <span class="font-display font-medium text-[24px] tracking-tight text-[#EA4335]">o</span>
                    <span class="font-display font-medium text-[24px] tracking-tight text-[#FBBC05]">o</span>
                    <span class="font-display font-medium text-[24px] tracking-tight text-[#4285F4]">g</span>
                    <span class="font-display font-medium text-[24px] tracking-tight text-[#34A853]">l</span>
                    <span class="font-display font-medium text-[24px] tracking-tight text-[#EA4335]">e</span>
                  </div>

                  <!-- Email Address back-to-start Pill -->
                  {#if step !== AuthStep.EMAIL && step !== AuthStep.SUCCESS}
                    <button 
                      onclick={() => { step = AuthStep.EMAIL; mfaMethodChosen = null; }}
                      class="flex items-center space-x-2 border border-[#dadce0] rounded-full px-3 py-1 pr-4 inline-flex text-sm text-[#3c4043] hover:bg-gray-50 cursor-pointer mb-6 transition-colors select-none"
                    >
                      <div class="w-5 h-5 bg-[#e8f0fe] text-[#1a73e8] rounded-full flex items-center justify-center">
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <span class="font-medium truncate max-w-45 text-xs">{email}</span>
                      <svg class="w-3 h-3 text-[#5f6368]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  {/if}

                  <!-- State Titles -->
                  {#if step === AuthStep.EMAIL}
                    <div>
                      <h2 class="text-2xl font-normal text-[#202124] tracking-tight font-display">Sign in</h2>
                      <p class="text-base text-[#202124] mt-2 font-normal">to continue to your Google Account</p>
                    </div>
                  {:else if step === AuthStep.PASSWORD}
                    <div>
                      <h2 class="text-2xl font-normal text-[#202124] tracking-tight font-display">Welcome</h2>
                      <p class="text-sm text-[#5f6368] mt-1">To connect securely, please verify your identity password.</p>
                    </div>
                  {:else if step === AuthStep.MFA_SELECT}
                    <div>
                      <h2 class="text-2xl font-normal text-[#202124] tracking-tight font-display">2-Step Verification</h2>
                      <p class="text-sm text-[#5f6368] mt-2">
                        To help keep your account secure, Google wants to make sure it's really you signing in.
                      </p>
                    </div>
                  {:else if step === AuthStep.MFA_PROMPT}
                    <div>
                      <h2 class="text-2xl font-normal text-[#202124] tracking-tight font-display">Check your phone</h2>
                      <p class="text-sm text-[#5f6368] mt-2 leading-relaxed">
                        Google sent a notification to your simulated smartphone. Click the matching number to confirm identity.
                      </p>
                    </div>
                  {:else if step === AuthStep.MFA_OTP}
                    <div>
                      <h2 class="text-2xl font-normal text-[#202124] tracking-tight font-display">2-Step Verification</h2>
                      <p class="text-sm text-[#5f6368] mt-2">
                        A text message with a 6-digit verification code was sent to your matching simulated phone number.
                      </p>
                    </div>
                  {:else if step === AuthStep.SUCCESS}
                    <div class="flex flex-col items-center text-center py-4">
                      <!-- Success check SVG -->
                      <svg class="w-14 h-14 text-[#34A853] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h2 class="text-2xl font-normal text-[#202124] tracking-tight font-display">Sign-in confirmed</h2>
                      <p class="text-sm text-[#5f6368] mt-2 leading-relaxed max-w-70">
                        Welcome back! You have successfully signed in using protected Multi-Factor protocols in Svelte 5.
                      </p>
                    </div>
                  {/if}
                </div>

                <!-- Forms Body -->
                <div class="my-8 grow">
                  {#if errorText}
                    <div class="bg-red-50 text-[#c5221f] rounded-lg p-3 text-sm flex items-start space-x-2 my-4 border border-red-100">
                      <svg class="w-5 h-5 shrink-0 text-[#c5221f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>{errorText}</span>
                    </div>
                  {/if}

                  <!-- EMAIL INPUT STAGE -->
                  {#if step === AuthStep.EMAIL}
                    <form onsubmit={handleEmailSubmit} class="space-y-6">
                      <div class="relative pt-2">
                        <input
                          id="svelte-email-input"
                          type="text"
                          bind:value={emailInput}
                          onfocus={() => emailFocused = true}
                          onblur={() => emailFocused = false}
                          class="w-full px-3 py-3.5 border rounded-md text-base text-[#202124] focus:outline-none transition-all {
                            emailFocused || emailInput ? 'border-[#1a73e8] border-2 ring-0' : 'border-[#dadce0]'
                          } {errorText ? 'border-[#c5221f] focus:border-[#c5221f]' : ''}"
                        />
                        <label
                          for="svelte-email-input"
                          class="absolute left-3 transition-all cursor-text text-sm select-none {
                            emailFocused || emailInput
                              ? '-top-2 px-1 bg-white text-[#1a73e8] text-xs font-medium'
                              : 'top-5 text-[#5f6368] text-base'
                          } {errorText ? 'text-[#c5221f]' : ''}"
                        >
                          Email or phone
                        </label>
                      </div>

                      <button 
                        type="button" 
                        onclick={() => addLog('Academic Simulation: Sign-in identifiers bypass actual database storage.', 'INFO')}
                        class="text-sm font-medium text-[#1a73e8] hover:text-[#1557b0] transition-colors focus:outline-none block hover:underline"
                      >
                        Forgot email?
                      </button>

                      <div class="flex items-center justify-between pt-6">
                        <button
                          type="button"
                          onclick={() => { emailInput = 'dacosta00736@gmail.com'; addLog('Filled default credential.', 'INFO'); }}
                          class="text-sm font-medium text-[#1a73e8] hover:text-[#1557b0] hover:bg-[#f6fafe] px-3 py-2 rounded transition-colors"
                        >
                          Use preset email
                        </button>
                        <button
                          type="submit"
                          class="bg-[#1a73e8] hover:bg-[#1557b0] text-white font-medium text-sm px-6 py-2.5 rounded-full transition-all shadow-sm"
                        >
                          Next
                        </button>
                      </div>
                    </form>
                  {/if}

                  <!-- PASSWORD INPUT STAGE -->
                  {#if step === AuthStep.PASSWORD}
                    <form onsubmit={handlePasswordSubmit} class="space-y-6">
                      <div class="relative pt-2">
                        <input
                          id="svelte-password-input"
                          type={showPassword ? 'text' : 'password'}
                          bind:value={passwordInput}
                          onfocus={() => passwordFocused = true}
                          onblur={() => passwordFocused = false}
                          class="w-full px-3 py-3.5 border rounded-md text-base text-[#202124] focus:outline-none pr-10 transition-all {
                            passwordFocused || passwordInput ? 'border-[#1a73e8] border-2 ring-0' : 'border-[#dadce0]'
                          } {errorText ? 'border-[#c5221f] focus:border-[#c5221f]' : ''}"
                        />
                        <label
                          for="svelte-password-input"
                          class="absolute left-3 transition-all cursor-text text-sm select-none {
                            passwordFocused || passwordInput
                              ? '-top-2 px-1 bg-white text-[#1a73e8] text-xs font-medium'
                              : 'top-5 text-[#5f6368] text-base'
                          } {errorText ? 'text-[#c5221f]' : ''}"
                        >
                          Enter your password
                        </label>
                        
                        <button
                          type="button"
                          onclick={() => showPassword = !showPassword}
                          class="absolute right-3 top-5 text-[#5f6368] hover:text-[#202124]"
                        >
                          <!-- Password show/hide SVG -->
                          {#if showPassword}
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          {:else}
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          {/if}
                        </button>
                      </div>

                      <div class="flex items-center space-x-2 select-none">
                        <input 
                          type="checkbox" 
                          id="svelte-show-pass-checkbox"
                          bind:checked={showPassword} 
                          class="rounded text-[#1a73e8] focus:ring-[#1a73e8] border-[#dadce0] w-4 h-4 cursor-pointer"
                        />
                        <label for="svelte-show-pass-checkbox" class="text-sm text-[#202124] cursor-pointer">Show password</label>
                      </div>

                      <div class="flex items-center justify-between pt-6">
                        <button
                          type="button"
                          onclick={() => { passwordInput = 'researchUser2026!'; addLog('Filled sandbox password key.', 'INFO'); }}
                          class="text-sm font-medium text-[#1a73e8] hover:text-[#1557b0] hover:bg-[#f6fafe] px-3 py-2 rounded transition-colors"
                        >
                          Use sample password
                        </button>
                        <button
                          type="submit"
                          class="bg-[#1a73e8] hover:bg-[#1557b0] text-white font-medium text-sm px-6 py-2.5 rounded-full transition-all shadow-sm"
                        >
                          Next
                        </button>
                      </div>
                    </form>
                  {/if}

                  <!-- MFA SELECT METHOD STAGE -->
                  {#if step === AuthStep.MFA_SELECT}
                    <div class="space-y-4">
                      <p class="text-[#202124] text-sm font-medium mb-3">Select a verification step to complete login:</p>
                      
                      <!-- Google Prompt Method -->
                      <button
                        onclick={() => selectMfaMethod(MfaMethod.PROMPT)}
                        class="w-full border border-[#dadce0] rounded-xl p-4 text-left hover:bg-[#f4f8fe] hover:border-[#8ab4f8] transition-all flex items-start space-x-4 cursor-pointer group"
                      >
                        <div class="p-2.5 bg-[#e8f0fe] rounded-lg text-[#1a73e8] shrink-0 group-hover:bg-[#d2e3fc]">
                          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div class="grow">
                          <div class="flex items-center space-x-2">
                            <span class="font-semibold text-sm text-[#202124]">Google Prompt (Device Challenge)</span>
                            <span class="bg-[#e6f4ea] text-[#137333] text-[10px] px-2 py-0.5 rounded font-medium">Recommended</span>
                          </div>
                          <p class="text-xs text-[#5f6368] mt-1 leading-relaxed">
                            Tap **Yes** on your mobile device, then match the requested 2-digit number. Fully defends against remote hijackers.
                          </p>
                        </div>
                      </button>

                      <!-- SMS OTP Method -->
                      <button
                        onclick={() => selectMfaMethod(MfaMethod.OTP)}
                        class="w-full border border-[#dadce0] rounded-xl p-4 text-left hover:bg-[#f4f8fe] hover:border-[#8ab4f8] transition-all flex items-start space-x-4 cursor-pointer group"
                      >
                        <div class="p-2.5 bg-[#e8f0fe] rounded-lg text-[#1a73e8] shrink-0 group-hover:bg-[#d2e3fc]">
                          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <div class="grow">
                          <span class="font-semibold text-sm text-[#202124]">Get a verification code (SMS OTP)</span>
                          <p class="text-xs text-[#5f6368] mt-1 leading-relaxed">
                            Google sends a 6-digit verification security code dynamically via cellular networks to your smartphone.
                          </p>
                        </div>
                      </button>
                    </div>
                  {/if}

                  <!-- GOOGLE PROMPT CHALLENGE VALUE DISPLAY -->
                  {#if step === AuthStep.MFA_PROMPT}
                    <div class="flex flex-col items-center text-center space-y-5 py-2 animate-fade-in">
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

                      <div class="bg-[#f8f9fa] rounded-xl p-4 border border-[#e8eaed] w-full max-w-85 space-y-4">
                        <p class="text-xs text-[#5f6368] uppercase tracking-wider font-semibold">Your Verification Challenge Number</p>
                        <div class="text-[52px] font-display font-bold text-[#1a73e8] tracking-wider leading-none select-none my-1">
                          {targetMatchingNumber}
                        </div>
                        <p class="text-xs text-[#5f6368] leading-relaxed">
                          Match this code on your companion device to secure the session. Choosing incorrect numbers blocks the token request.
                        </p>
                      </div>

                      <div class="flex items-center space-x-2 text-xs text-[#5f6368]">
                        <div class="w-4 h-4 border-2 border-t-transparent border-[#1a73e8] rounded-full animate-spin"></div>
                        <span>Waiting for mobile verification confirmation...</span>
                      </div>
                    </div>
                  {/if}

                  <!-- SMS OTP VERIFICATION INPUT STAGE -->
                  {#if step === AuthStep.MFA_OTP}
                    <form onsubmit={handleOtpSubmit} class="space-y-6">
                      <div class="text-sm text-[#202124] font-medium">
                        Enter the 6-digit code shown on your phone screen:
                      </div>

                      <div class="relative pt-2">
                        <div class="flex items-center border border-[#dadce0] rounded-md focus-within:border-[#1a73e8] focus-within:border-2 focus-within:ring-0 overflow-hidden">
                          <span class="pl-3.5 pr-1 font-display font-medium text-base text-[#5f6368] select-none">G-</span>
                          <input
                            type="text"
                            maxlength="6"
                            bind:value={otpInput}
                            onfocus={() => otpFocused = true}
                            onblur={() => otpFocused = false}
                            class="w-full py-3.5 text-base text-[#202124] focus:outline-none placeholder-gray-300 font-display font-medium tracking-widest"
                            placeholder="______"
                          />
                        </div>
                      </div>

                      <div class="flex justify-between items-center pt-6">
                        <button
                          type="button"
                          onclick={() => {
                            const code = Math.floor(100000 + Math.random() * 900000).toString();
                            mobileOtpCode = code;
                            addLog(`New 6-digit SMS code issued: G-${code}`, 'SUCCESS');
                          }}
                          class="text-sm font-medium text-[#1a73e8] hover:text-[#1557b0] hover:bg-[#f6fafe] px-3 py-2 rounded transition-colors"
                        >
                          Resend code
                        </button>
                        <button
                          type="submit"
                          class="bg-[#1a73e8] hover:bg-[#1557b0] text-white font-medium text-sm px-6 py-2.5 rounded-full transition-all shadow-sm"
                        >
                          Verify Code
                        </button>
                      </div>
                    </form>
                  {/if}

                  <!-- SUCCESS ASSERTION DISPLAY -->
                  {#if step === AuthStep.SUCCESS}
                    <div class="space-y-4 pt-4">
                      <div class="border border-[#e8eaed] rounded-xl p-4 bg-[#f8f9fa] text-xs space-y-2">
                        <div class="flex justify-between border-b border-gray-100 pb-2">
                          <span class="font-semibold text-gray-700">Account:</span>
                          <span class="text-gray-900 font-mono">{email}</span>
                        </div>
                        <div class="flex justify-between border-b border-gray-100 pb-2">
                          <span class="font-semibold text-gray-700">Method used:</span>
                          <span class="text-[#1a73e8] font-bold">
                            {mfaMethodChosen === MfaMethod.PROMPT ? 'Google Sign-In Prompt' : 'SMS Code OTP'}
                          </span>
                        </div>
                        <div class="flex justify-between border-b border-gray-100 pb-2">
                          <span class="font-semibold text-gray-700">Challenge Code:</span>
                          <span class="text-gray-900 font-mono font-bold">
                            {mfaMethodChosen === MfaMethod.PROMPT ? `#${targetMatchingNumber}` : `G-${mobileOtpCode}`}
                          </span>
                        </div>
                        <div class="flex justify-between">
                          <span class="font-semibold text-gray-700">FIDO Verification:</span>
                          <span class="text-[#137333] font-semibold">Assertion Resolved (Svelte 5)</span>
                        </div>
                      </div>

                      <button
                        onclick={handleReset}
                        class="w-full bg-[#1a73e8] hover:bg-[#1557b0] text-white font-medium text-sm px-6 py-2.5 rounded-full transition-all shadow-sm"
                      >
                        Restart Auth Simulation
                      </button>
                    </div>
                  {/if}

                </div>

                <!-- Footer elements -->
                <div class="flex items-center justify-between text-xs text-[#5f6368] mt-4 pt-4 border-t border-[#f1f3f4]">
                  <span>English (United States)</span>
                  <div class="flex space-x-4">
                    <span class="hover:text-gray-900 cursor-pointer">Help</span>
                    <span class="hover:text-gray-900 cursor-pointer">Privacy</span>
                    <span class="hover:text-gray-900 cursor-pointer">Terms</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- COMPANION SMARTPHONE (📱 SIMULATOR) -->
        <div class="pt-4 flex justify-center w-full">
          <div id="companion-device" class="flex flex-col items-center">
            
            <div class="text-xs text-[#5f6368] font-semibold uppercase tracking-widest mb-3 flex items-center gap-1.5 select-none">
              <!-- Smartphone icon -->
              <svg class="w-3.5 h-3.5 text-[#1a73e8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Companion Authenticator Device (Simulated)
            </div>

            <!-- Bezels and device phone frame -->
            <div
              class="w-72.5 h-145 bg-[#1a1c1e] rounded-[44px] p-2.5 shadow-2xl relative border-4 border-[#3c4043] transition-all duration-300 {
                deviceVibrating ? 'animate-phone-vibrate border-red-500 shadow-red-100' : ''
              }"
            >
              <!-- Smartphone top notch speaker -->
              <div class="absolute top-5 left-1/2 -translate-x-1/2 w-32 h-5 bg-[#1a1c1e] rounded-b-2xl z-50 flex items-center justify-center">
                <div class="w-12 h-1 bg-[#3c4043] rounded-full absolute top-1"></div>
                <div class="w-2.5 h-2.5 bg-[#25282a] rounded-full absolute right-8"></div>
              </div>

              <!-- Device Screen Area -->
              <div class="w-full h-full bg-[#121314] rounded-[34px] overflow-hidden relative flex flex-col justify-between font-sans text-neutral-200">
                
                <!-- Status clock header -->
                <div class="h-10 px-6 pt-3 flex items-center justify-between z-40 text-[11px] font-medium tracking-tight bg-linear-to-b from-black/40 to-transparent w-full">
                  <span>{phoneTime}</span>
                  <div class="flex items-center space-x-1.5">
                    <span>94%</span>
                    <!-- Battery icon SVG representation -->
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M21 12H3" />
                    </svg>
                  </div>
                </div>

                <!-- PUSH SMS NOTIFICATION INBOX POPUP -->
                {#if step === AuthStep.MFA_OTP}
                  <div class="absolute top-12 left-2.5 right-2.5 bg-neutral-900/95 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 shadow-lg text-left z-50 flex items-start space-x-3 cursor-pointer">
                    <div class="p-2 bg-blue-600 rounded-full text-white mt-0.5">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex justify-between items-center">
                        <span class="text-xs font-bold text-white">Messages</span>
                        <span class="text-[10px] text-neutral-400">Now</span>
                      </div>
                      <p class="text-xs text-neutral-200 font-semibold mt-1">G-{mobileOtpCode}</p>
                      <p class="text-[10px] text-neutral-400 truncate mt-0.5">is your Google verification code.</p>
                    </div>
                  </div>
                {/if}

                <!-- MAIN PHONE VISUALS (IDLE OR CHALLENGES) -->
                <div class="grow flex flex-col items-center justify-between p-4 relative pt-2">
                  {#if step !== AuthStep.MFA_PROMPT}
                    <!-- Idle screen widgets and icons -->
                    <div class="absolute inset-0 flex flex-col justify-between p-6 bg-linear-to-tr from-[#111827] via-[#101b3b] to-[#040d21] z-10 text-center">
                      <div class="mt-14 space-y-1">
                        <h2 class="text-4xl font-light text-white tracking-wide">{phoneTime}</h2>
                        <p class="text-[11px] text-neutral-400 font-medium">Svelte Authenticator Sandbox</p>
                      </div>

                      <div class="grid grid-cols-4 gap-4 px-2 mb-10 text-center text-white text-[9px]">
                        <div class="flex flex-col items-center space-y-1">
                          <div class="w-10 h-10 bg-[#ea4335]/25 backdrop-blur border border-white/5 rounded-2xl flex items-center justify-center text-[#ea4335]">
                            ✉️
                          </div>
                          <span class="truncate w-full text-neutral-300">Gmail</span>
                        </div>
                        <div class="flex flex-col items-center space-y-1">
                          <div class="w-10 h-10 bg-[#4285f4]/25 backdrop-blur border border-white/5 rounded-2xl flex items-center justify-center text-[#4285f4]">
                            ⚙️
                          </div>
                          <span class="truncate w-full text-neutral-300">Settings</span>
                        </div>
                        <div class="flex flex-col items-center space-y-1">
                          <div class="w-10 h-10 bg-[#34a853]/25 backdrop-blur border border-white/5 rounded-2xl flex items-center justify-center text-[#34a853]">
                            🗺️
                          </div>
                          <span class="truncate w-full text-neutral-300">Maps</span>
                        </div>
                        <div class="flex flex-col items-center space-y-1">
                          <div class="w-10 h-10 bg-neutral-800 border border-white/5 rounded-2xl flex items-center justify-center text-cyan-400">
                            🛡️
                          </div>
                          <span class="truncate w-full text-neutral-300">Secure</span>
                        </div>
                      </div>

                      <div class="bg-white/5 backdrop-blur rounded-2xl p-4 border border-white/5 mx-2 text-left mb-6">
                        <p class="text-[10px] text-cyan-400 font-bold uppercase tracking-wider mb-1">State Sync</p>
                        <p class="text-xs text-neutral-300 leading-relaxed">
                          {#if step === AuthStep.EMAIL}Desktop identifying account name.{/if}
                          {#if step === AuthStep.PASSWORD}Desktop verifies password hash.{/if}
                          {#if step === AuthStep.MFA_SELECT}Select a verification factor on desktop.{/if}
                          {#if step === AuthStep.SUCCESS}Challenge solved. Session unlocked.{/if}
                        </p>
                      </div>
                    </div>
                  {:else}
                    <!-- ACTIVE GOOGLE PROMPT SYSTEM VERIFICATION PUSH -->
                    <div class="absolute inset-0 bg-black/80 backdrop-blur-xs z-30 flex flex-col justify-end p-2">
                      <div class="w-full bg-[#1e2022] rounded-[28px] p-5 pb-6 border border-white/10 text-neutral-200 text-left space-y-4 shadow-xl">
                        
                        <div class="flex items-center space-x-2 text-sm font-semibold border-b border-white/15 pb-3">
                          <span class="text-xs text-neutral-300 font-medium">Verify login</span>
                        </div>

                        {#if !userApprovedPromptIdentity}
                          <!-- QUESTION STATE -->
                          <div class="space-y-4">
                            <h3 class="text-base font-semibold text-white tracking-wide">Trying to sign in?</h3>
                            
                            <div class="bg-neutral-900/50 rounded-xl p-3 border border-white/5 space-y-2.5 text-xs">
                              <div class="flex items-center space-x-2">
                                <div class="w-5 h-5 bg-[#e8f0fe] text-blue-600 rounded-full flex items-center justify-center font-bold text-[10px]">
                                  {email.substring(0, 1).toUpperCase()}
                                </div>
                                <span class="text-neutral-200 font-medium font-mono text-[10px] truncate">{email}</span>
                              </div>
                              
                              <div class="flex items-start space-x-2 text-neutral-400 text-[10px] leading-tight">
                                <span>🌐 Browser: {simulatedBrowserInfo}</span>
                              </div>

                              <div class="flex items-start space-x-2 text-neutral-400 text-[10px] leading-tight">
                                <span class="text-[#34a853]">📍 Location: {simulatedDeviceLocation}</span>
                              </div>
                            </div>

                            <p class="text-[10px] text-neutral-400">
                              Confirm you are active on the browser page. Tap **Yes** to progress to code verification.
                            </p>

                            <div class="flex space-x-3 pt-2">
                              <button
                                onclick={() => handleApproveIdentityResponse(false)}
                                class="flex-1 bg-neutral-800 hover:bg-neutral-700 text-red-400 font-semibold text-xs py-3 rounded-full text-center transition-colors"
                              >
                                No, deny
                              </button>
                              <button
                                onclick={() => handleApproveIdentityResponse(true)}
                                class="flex-1 bg-[#4285f4] hover:bg-[#357ae8] text-white font-semibold text-xs py-3 rounded-full text-center transition-colors shadow-sm"
                              >
                                Yes, it's me
                              </button>
                            </div>
                          </div>
                        {:else}
                          <!-- NUMBER MATCH KEYPAD STATE -->
                          <div class="space-y-4 text-center">
                            <h3 class="text-sm font-semibold text-white tracking-wide text-left">
                              Select the number shown on your desktop screen:
                            </h3>
                            
                            <p class="text-[11px] text-neutral-400 leading-normal text-left">
                              Locate and tap code **{targetMatchingNumber}** to satisfy the verification challenge.
                            </p>

                            {#if wrongAttempts > 0}
                              <div class="bg-red-950/40 text-red-400 border border-red-900/40 rounded-lg p-2 text-[10px] text-left">
                                Incorrect selection. Attempts remaining: {2 - wrongAttempts}
                              </div>
                            {/if}

                            <div class="grid grid-cols-3 gap-3">
                              {#each numberSelectionOptions as opt}
                                <button
                                  onclick={() => handleNumberMatchClick(opt)}
                                  class="bg-neutral-800 hover:bg-neutral-700 text-white font-display text-lg font-bold py-4 rounded-xl transition-all border border-white/5 active:bg-[#4285f4]"
                                >
                                  {opt}
                                </button>
                              {/each}
                            </div>

                            <button
                              onclick={() => userApprovedPromptIdentity = false}
                              class="text-[10px] text-blue-400 hover:underline pt-2 block text-left"
                            >
                              ← Back to details
                            </button>
                          </div>
                        {/if}

                      </div>
                    </div>
                  {/if}

                </div>

                <!-- Bottom home line bar indicator -->
                <div class="h-4 w-full flex justify-center items-center pb-2.5 z-40">
                  <div class="w-24 h-1 bg-white/25 rounded-full"></div>
                </div>

              </div>
            </div>

          </div>
        </div>

      </div>

      <!-- COLUMN 2: RIGHT SIDE LAB PANELS (Security Analyzer / Diagnostics Logs) -->
      <div class="lg:col-span-4 h-full">
        <div id="mfa-security-analysis-dashboard" class="bg-white rounded-xl border border-[#dadce0] p-5 sm:p-6 shadow-sm flex flex-col h-full justify-between space-y-5">
          
          <!-- Title details -->
          <div>
            <div class="flex items-center space-x-2 text-[#1a73e8] mb-1">
              <h2 class="font-display font-medium text-lg text-gray-900">Security Sandbox Lab</h2>
            </div>
            <p class="text-xs text-[#5f6368] leading-relaxed">
              Explore and contrast the cryptographic differences between legacy SMS OTP verification and modern app-based Number Matching.
            </p>
          </div>

          <!-- Tabs Menu navigation -->
          <div class="flex border-b border-[#dadce0] gap-4 text-xs font-semibold select-none">
            <button
              onclick={() => activeTab = 'EXPLANATION'}
              class="pb-2.5 transition-all relative cursor-pointer {
                activeTab === 'EXPLANATION' ? 'text-[#1a73e8] border-b-2 border-[#1a73e8]' : 'text-[#5f6368] hover:text-[#202124]'
              }"
            >
              Verification Analysis
            </button>
            <button
              onclick={() => activeTab = 'ATTACK_LAB'}
              class="pb-2.5 transition-all relative cursor-pointer {
                activeTab === 'ATTACK_LAB' ? 'text-[#1a73e8] border-b-2 border-[#1a73e8]' : 'text-[#5f6368] hover:text-[#202124]'
              }"
            >
              Context Controls
            </button>
            <button
              onclick={() => activeTab = 'STANDARDS'}
              class="pb-2.5 transition-all relative cursor-pointer {
                activeTab === 'STANDARDS' ? 'text-[#1a73e8] border-b-2 border-[#1a73e8]' : 'text-[#5f6368] hover:text-[#202124]'
              }"
            >
              Protocol Metrics
            </button>
          </div>

          <!-- TAB CONTENTS -->
          <div class="grow overflow-y-auto max-h-70 pr-1">
            
            {#if activeTab === 'EXPLANATION'}
              <div class="space-y-4 text-xs text-justify leading-relaxed text-gray-700 animate-fade-in">
                <div class="p-3 bg-blue-50/50 border border-blue-100 rounded-lg space-y-1.5">
                  <h4 class="font-bold text-blue-900">How Number Matching Defeats Attacks</h4>
                  <p class="text-blue-800 leading-normal text-[11px]">
                    Standard push alerts ask "Is this you?". Fatigue hacking (bombarding users with login loops until they click Yes) is defeated by displaying a target code on the browser and requiring keypad verification on the phone.
                  </p>
                </div>

                <div class="p-3 bg-amber-50/50 border border-amber-100 rounded-lg space-y-1.5">
                  <h4 class="font-bold text-amber-900">SMS OTP Weaknesses</h4>
                  <p class="text-amber-800 leading-normal text-[11px]">
                    SMS transmits via unencrypted cellular protocols. This lets attackers perform SIM swaps or intercept SMS routing packets directly on global telecom links.
                  </p>
                </div>
              </div>
            {/if}

            {#if activeTab === 'ATTACK_LAB'}
              <div class="space-y-4">
                <h4 class="font-bold text-xs text-gray-800 uppercase tracking-wide">Payload Telemetry Settings</h4>
                
                <div class="space-y-1">
                  <label for="" class="text-[10px] font-bold text-neutral-500 block">Simulate Location</label>
                  <select
                    value={simulatedDeviceLocation}
                    onchange={(e) => handleLocationChange(e.currentTarget.value)}
                    class="w-full text-xs border border-gray-300 rounded p-1.5 bg-white"
                  >
                    {#each locations as loc}
                      <option value={loc}>{loc}</option>
                    {/each}
                  </select>
                </div>

                <div class="space-y-1">
                  <label for="" class="text-[10px] font-bold text-neutral-500 block">Simulate Browser Client Type</label>
                  <select
                    value={simulatedBrowserInfo}
                    onchange={(e) => handleBrowserChange(e.currentTarget.value)}
                    class="w-full text-xs border border-gray-300 rounded p-1.5 bg-white"
                  >
                    {#each browsers as b}
                      <option value={b}>{b}</option>
                    {/each}
                  </select>
                </div>
              </div>
            {/if}

            {#if activeTab === 'STANDARDS'}
              <div class="space-y-3 text-xs">
                <h4 class="font-bold text-gray-800 uppercase tracking-wide">Protocol Comparison</h4>
                <table class="w-full border-collapse border border-gray-200 text-left text-[11px]">
                  <thead>
                    <tr class="bg-gray-50 border-b border-gray-200">
                      <th class="p-2 font-bold text-gray-700">Security Vector</th>
                      <th class="p-2 font-bold text-gray-700">SMS OTP</th>
                      <th class="p-2 font-bold text-green-700">Number Prompt</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100 text-gray-600">
                    <tr>
                      <td class="p-2 font-medium">Remote Shield</td>
                      <td class="p-2 text-red-500">Weak (Intercept)</td>
                      <td class="p-2 text-green-600 font-bold">Strong</td>
                    </tr>
                    <tr>
                      <td class="p-2 font-medium">SIM Swap Defenses</td>
                      <td class="p-2 text-red-500">None</td>
                      <td class="p-2 text-green-600 font-bold">Immune</td>
                    </tr>
                    <tr>
                      <td class="p-2 font-medium">Fatigue Bomb Block</td>
                      <td class="p-2 text-orange-500">Medium</td>
                      <td class="p-2 text-green-600 font-bold">Absolute</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            {/if}

          </div>

          <!-- DIAGNOSTIC HANDSHAKE LOGS TERMINAL -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-gray-800 uppercase tracking-wider">Handshake Terminal (Live)</span>
              <div class="flex space-x-2 text-neutral-400">
                <button
                  onclick={handleCopyLogs}
                  class="p-1 hover:text-blue-500 border border-neutral-100 rounded hover:bg-neutral-50 cursor-pointer flex items-center text-[10px]"
                >
                  <span>{copied ? 'Copied ✓' : 'Copy'}</span>
                </button>
                <button
                  onclick={clearLogs}
                  class="p-1 hover:text-red-500 border border-neutral-100 rounded hover:bg-neutral-50 cursor-pointer flex items-center text-[10px]"
                >
                  <span>Clear</span>
                </button>
              </div>
            </div>

            <div class="bg-[#121314] text-[#a9b2c3] rounded-lg p-3 font-mono text-[10px] h-35 overflow-y-auto border border-black space-y-1">
              {#if logs.length === 0}
                <div class="text-neutral-500 italic text-center pt-10">No protocol events logged.</div>
              {:else}
                {#each logs as log (log.id)}
                  <div class="leading-relaxed hover:bg-neutral-900 px-1 py-0.5 rounded transition-colors">
                    <span class="text-neutral-500">[{log.timestamp}]</span>{' '}
                    <span class="{
                      log.type === 'SUCCESS' ? 'text-green-400 font-semibold' :
                      log.type === 'WARN' ? 'text-yellow-400' :
                      log.type === 'ERROR' ? 'text-red-400 font-bold' : 'text-gray-400'
                    }">[{log.type}]</span>{' '}
                    <span class="text-white">{log.message}</span>
                    {#if log.details}
                      <div class="text-neutral-400 text-[9px] pl-4 italic">→ {log.details}</div>
                    {/if}
                  </div>
                {/each}
              {/if}
            </div>
          </div>

        </div>
      </div>

    </div>

  </main>

  <footer class="bg-white border-t border-[#dadce0] py-6 text-center text-xs text-[#5f6368] select-none mt-12">
    <div class="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
      <span>Google MFA Education Workspace • Svelte 5 Edition</span>
      <span>Built with Svelte Runes & compliance-ready design variables.</span>
    </div>
  </footer>

</div>

<style>
  /* Custom Animations for Svelte Google MFA Simulator */
  @keyframes phone-vibrate {
    0% { transform: translate(0, 0) rotate(0deg); }
    10% { transform: translate(-2px, -1px) rotate(-1deg); }
    20% { transform: translate(-1px, 1px) rotate(1deg); }
    30% { transform: translate(1px, 2px) rotate(0deg); }
    40% { transform: translate(-1px, -1px) rotate(1deg); }
    50% { transform: translate(2px, 1px) rotate(-1deg); }
    60% { transform: translate(1px, -2px) rotate(0deg); }
    70% { transform: translate(-2px, 1px) rotate(1deg); }
    80% { transform: translate(1px, 1px) rotate(-1deg); }
    90% { transform: translate(-1px, -1px) rotate(0deg); }
    100% { transform: translate(0, 0) rotate(0deg); }
  }

  :global(.animate-phone-vibrate) {
    animation: phone-vibrate 0.15s ease-in-out infinite;
  }

  @keyframes fade-in {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .animate-fade-in {
    animation: fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
</style>
