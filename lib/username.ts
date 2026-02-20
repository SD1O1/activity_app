export function slugifyUsernameBase(input: string): string {
    const normalized = input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_\s]/g, "")
      .replace(/\s+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "");
  
    return normalized;
  }
  
  export function generateUsernameFromName(name: string, userId: string): string {
    const base = slugifyUsernameBase(name);
    const fallbackBase = base.length >= 3 ? base : "user";
    const suffix = userId.replace(/-/g, "").slice(0, 6).toLowerCase();
  
    return `${fallbackBase}_${suffix}`.slice(0, 30);
  }  