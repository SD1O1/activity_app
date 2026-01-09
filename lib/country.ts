export async function detectCountryCode(): Promise<string> {
    try {
      const res = await fetch("https://ipapi.co/json");
      const data = await res.json();
  
      if (data?.country_calling_code) {
        return data.country_calling_code;
      }
  
      return "+91"; // fallback
    } catch {
      return "+91"; // safe default
    }
  }  