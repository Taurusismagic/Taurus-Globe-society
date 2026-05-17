/**
 * The Banalities: A list of stock, useless, or low-resolution phrases
 * designated for extermination from the Taurus Nexus.
 */
export const BANALITIES = [
  // Greetings
  /^hi$/i, /^hello$/i, /^hey$/i, /^sup$/i, /^yo$/i,
  
  // Verification
  /^test$/i, /^testing$/i, /is this working/i, /anyone (there|here)/i,
  
  // Low-resolution agreement
  /^cool$/i, /^nice$/i, /^ok$/i, /^awesome$/i, /^great$/i, /^k$/i,
  
  // Empty mirth
  /^lol$/i, /^haha$/i, /^lmao$/i, /^rofl$/i,
  
  // Low-effort outreach
  /what'?s up/i, /how are you/i,
  
  // Competition
  /^first$/i, /^first comment$/i,
];

/**
 * Checks if a message is considered "spiritually empty" based on the banality list.
 */
export function isBanality(message: string): boolean {
  const trimmed = message.trim();
  if (trimmed.length < 3) return true; // Too short to be profound
  
  return BANALITIES.some((pattern: any) => {
    if (typeof pattern === 'string') {
      return trimmed.toLowerCase() === (pattern as string).toLowerCase();
    }
    return (pattern as RegExp).test(trimmed);
  });
}

export const BANALITY_ERROR = "Wait! Your message is a bit too short or simple. Try sharing something more special or magical with the Tribe.";
