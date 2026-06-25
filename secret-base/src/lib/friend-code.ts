const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateFriendCode(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

export function normalizeFriendCode(code: string): string {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}
