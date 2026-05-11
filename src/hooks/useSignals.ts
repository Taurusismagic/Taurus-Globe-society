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
  "Visiting London next week, any Tribe meetups? 🇬🇧",
  "Looking for a local guide in Kyoto. Lunch is on me! 🍱",
  "Spontaneous coffee at a Taurus-owned cafe in NYC? ☕️",
  "Anyone hiking in the Alps this weekend? Joining from Zurich. 🏔️",
  "Just landed in Dubai! Best spot for a sunset view? 🌅",
  "Taurus Tribe: Who's free for a mastermind chat in Berlin? 🧠",
  "Looking for the best hidden gems in Lisbon. Any tips? 🇵🇹",
  "Searching for a great coworking space in San Francisco. 💻",
  "First time in Sydney! Can someone show me around? 🇦🇺",
  "Spontaneous networking meetup at a rooftop in Paris tonight. ✨",
  "Who knows a Taurus-owned bakery in Amsterdam? 🥐",
  "Visiting Singapore for a week. Let’s connect, Tribe! 🤝",
  "Looking for a workout partner in Toronto. Taurus energy only! 💪",
  "Any Taurus artisans in Milan? Seeking local craft shops. 🎨",
  "Best spot for a quiet read in Barcelona? 📚",
  "Taurus founders: Let's meet up in Austin for a sync! 🚀",
  "Visiting Santorini. Any Taurus-owned villas or hotels? 🏨",
  "Who's attending the tech conference in Dublin? 🇮🇪",
  "Seeking a local Taurus mentor for a project in Mumbai. ❤️",
  "Taurus power is global. Spreading love from Seattle! 🌟"
];

const CITY_NAMES = Object.keys(MAJOR_CITIES);

export function useSignals() {
  const [signals, setSignals] = useState<Signal[]>([]);

  const addSignal = useCallback((message: string, city: string, coords: [number, number], isFake = false) => {
    const id = Math.random().toString(36).substring(7);
    const newSignal: Signal = {
      id,
      message,
      city,
      lat: coords[0],
      lng: coords[1],
      timestamp: Date.now(),
      isFake
    };
    setSignals(prev => [...prev, newSignal]);

    // Remove signal after 30 seconds (was 7s) to let them stay "planted" longer
    setTimeout(() => {
      setSignals(prev => prev.filter(s => s.id !== id));
    }, 30000);
  }, []);

  // initial signals
  useEffect(() => {
    const timer = setTimeout(() => {
      const cities = ["New York City", "London", "Tokyo", "Dubai", "Paris", "Berlin", "San Francisco", "Singapore", "Sydney", "Lisbon"];
      cities.forEach((city, i) => {
        setTimeout(() => {
          const coords = MAJOR_CITIES[city.toLowerCase()];
          if (coords) {
            addSignal(FAKE_MESSAGES[i % FAKE_MESSAGES.length], city, coords, true);
          }
        }, i * 300);
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [addSignal]);

  useEffect(() => {
    const interval = setInterval(() => {
      const message = FAKE_MESSAGES[Math.floor(Math.random() * FAKE_MESSAGES.length)];
      const cityName = CITY_NAMES[Math.floor(Math.random() * CITY_NAMES.length)];
      const coords = MAJOR_CITIES[cityName];
      
      addSignal(message, cityName, coords, true);
    }, 3000); // Increased frequency

    return () => clearInterval(interval);
  }, [addSignal]);

  return { signals, addSignal };
}
