import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "./errorUtils";

export interface ZodiacHoroscope {
  sign: string;
  date: string;
  // Detailed fields
  general: string;
  love: string;
  energy: string;
  career: string;
  planets: string;
  isBirthdaySeason: boolean;
  // 2.0 Intelligence
  alignmentScore: number;
  powerHours: string;
  // Short versions (Pulse)
  short: {
    general: string;
    love: string;
    energy: string;
    career: string;
    planets: string;
  };
}

function checkBirthdaySeason(sign: string, month: number, day: number): boolean {
  const s = sign.toLowerCase();
  if (s === 'aries') return (month === 3 && day >= 21) || (month === 4 && day <= 19);
  if (s === 'taurus') return (month === 4 && day >= 20) || (month === 5 && day <= 20);
  if (s === 'gemini') return (month === 5 && day >= 21) || (month === 6 && day <= 20);
  if (s === 'cancer') return (month === 6 && day >= 21) || (month === 7 && day <= 22);
  if (s === 'leo') return (month === 7 && day >= 23) || (month === 8 && day <= 22);
  if (s === 'virgo') return (month === 8 && day >= 23) || (month === 9 && day <= 22);
  if (s === 'libra') return (month === 9 && day >= 23) || (month === 10 && day <= 22);
  if (s === 'scorpio') return (month === 10 && day >= 23) || (month === 11 && day <= 21);
  if (s === 'sagittarius') return (month === 11 && day >= 22) || (month === 12 && day <= 21);
  if (s === 'capricorn') return (month === 12 && day >= 22) || (month === 1 && day <= 19);
  if (s === 'aquarius') return (month === 1 && day >= 20) || (month === 2 && day <= 18);
  if (s === 'pisces') return (month === 2 && day >= 19) || (month === 3 && day <= 20);
  return false;
}

export async function getDetailedHoroscope(sign: string = "Taurus"): Promise<ZodiacHoroscope> {
  const normSign = sign.charAt(0).toUpperCase() + sign.slice(1).toLowerCase();
  
  // Get current date in Eastern Time robustly
  const now = new Date();
  
  // Get current date string for doc ID
  const dateId = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now);

  const docId = `${dateId}_${normSign.toLowerCase()}`;
  const dayName = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'long' }).format(now);
  
  // Calculate birthday season parts from nyDate
  const nyParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    month: 'numeric',
    day: 'numeric'
  }).formatToParts(now);
  const monthInt = parseInt(nyParts.find(p => p.type === 'month')?.value || "0");
  const dayInt = parseInt(nyParts.find(p => p.type === 'day')?.value || "0");
  const isBirthdaySeason = checkBirthdaySeason(normSign, monthInt, dayInt);

  try {
    // 1. Check Firestore first for caching
    const docRef = doc(db, "daily_horoscopes", docId);
    let cachedDoc;
    try {
      cachedDoc = await getDoc(docRef);
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, `daily_horoscopes/${docId}`);
      throw e;
    }
    
    if (cachedDoc.exists()) {
      return cachedDoc.data() as ZodiacHoroscope;
    }

    console.log(`[Horoscope] Proxying ${normSign} daily broadcast via Nexus...`);

    // 2. Not cached? Call server-side proxy
    const response = await fetch('/api/horoscope', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sign: normSign, dateId, dayName, isBirthdaySeason })
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const data = await response.json();
    
    const horoscope: ZodiacHoroscope = {
      sign: normSign,
      date: dateId,
      general: data.general,
      love: data.love,
      energy: data.energy,
      career: data.career,
      planets: data.planets,
      alignmentScore: data.alignment_score || 85,
      powerHours: data.power_hours || "Sunrise & Midnight",
      isBirthdaySeason,
      short: {
        general: data.short_general,
        love: data.short_love,
        energy: data.short_energy,
        career: data.short_career,
        planets: data.short_planets
      }
    };

    // 3. Cache it client-side too
    try {
      await setDoc(doc(db, "daily_horoscopes", docId), horoscope);
    } catch (e) {
      console.warn("[Horoscope] Cache write failed:", e);
    }

    return horoscope;
  } catch (error) {
    console.error(`Error fetching ${normSign} horoscope:`, error);
    // Return high-fidelity fallback
    return {
      sign: normSign,
      date: dateId,
      general: `The cosmic alignment for ${normSign} on this ${dayName} suggests a period of quiet integration. ${isBirthdaySeason ? "Your solar return energy is building." : "Steady your frequency as you navigate the current transits."} Meditation for the Day: Patience is the most technical of virtues.`,
      love: "Connection flows through shared silence and the frequency of presence.",
      energy: "A steady taurian anchor maintains your momentum amidst the orbital shift.",
      career: "Strategic observation in your field yields significant structural results today.",
      planets: `The primary transits affecting ${normSign} today provide a stabilizing influence as the Moon enters a harmonic degrees.`,
      alignmentScore: 75,
      powerHours: "Sunrise & Midnight",
      isBirthdaySeason,
      short: {
        general: "Seek balance and internal clarity today.",
        love: "Value the unspoken connections.",
        energy: "Conserve your mental focus for deeper tasks.",
        career: "Observe local dynamics before executing your plan.",
        planets: "Transits favor stability and grounding today."
      }
    };
  }
}
