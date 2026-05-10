import { useState, useEffect, useCallback } from "react";
import { MAJOR_CITIES } from "@/lib/cities";

export interface Signal {
  id: string;
  message: string;
  city: string;
  lat: number;
  lng: number;
  timestamp: number;
  isFake?: boolean;
}

const FAKE_MESSAGES = [
  "Anyone hiring in Toronto?",
  "Looking for a roommate in NYC.",
  "Can someone show me around Houston?",
  "Selling concert tickets in Austin.",
  "Best cafés in Tokyo?",
  "Anyone want to meet in Amsterdam tonight?",
  "Giving away furniture in Dubai.",
  "Come visit my Taurus-owned coffee shop in Melbourne.",
  "Recommended coworking spaces in Berlin?",
  "Any Taurus meetups in London this weekend?",
  "Just moved to Singapore, hello Tribe!",
  "Best view of the sunset in Santorini?",
  "Who's up for a morning run in Central Park?",
  "Looking for a local guide in Kyoto.",
  "Anyone want to grab a coffee in Milan?",
  "Selling a vintage Taurus gold ring in Paris.",
  "Who knows the best hidden gems in Lisbon?",
  "Taurus-owned bakery opening soon in Seattle!",
  "Meeting up for drinks in Dublin at 8pm.",
  "Anyone heading to the festival in Rio?"
];

const CITY_NAMES = Object.keys(MAJOR_CITIES);

export function useSignals() {
  const [signals, setSignals] = useState<Signal[]>([]);

  const addSignal = useCallback((message: string, city: string, coords: [number, number], isFake = false) => {
    const newSignal: Signal = {
      id: Math.random().toString(36).substring(7),
      message,
      city,
      lat: coords[0],
      lng: coords[1],
      timestamp: Date.now(),
      isFake
    };
    setSignals(prev => [...prev, newSignal]);

    // Remove signal after 6 seconds (animation is 5s)
    setTimeout(() => {
      setSignals(prev => prev.filter(s => s.id !== newSignal.id));
    }, 6000);
  }, []);

  // Generate fake signals periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const message = FAKE_MESSAGES[Math.floor(Math.random() * FAKE_MESSAGES.length)];
      const cityName = CITY_NAMES[Math.floor(Math.random() * CITY_NAMES.length)];
      const coords = MAJOR_CITIES[cityName];

      addSignal(message, cityName, coords, true);
    }, 4000); // New signal every 4 seconds

    return () => clearInterval(interval);
  }, [addSignal]);

  return { signals, addSignal };
}
