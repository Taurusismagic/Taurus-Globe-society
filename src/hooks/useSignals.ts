import { useState, useEffect, useCallback } from "react";
import { MAJOR_CITIES } from "@/lib/cities";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { handleFirestoreError, OperationType } from "@/lib/errorUtils";

export interface Signal {
  id: string;
  message: string;
  city: string;
  lat: number;
  lng: number;
  timestamp: number;
  isFake?: boolean;
  isSeed?: boolean;
}

const FAKE_MESSAGES = [
  "Feeling so lucky today! The moon is in a great spot for us Taurus friends. ✨",
  "Just saw a shooting star in London. Sending good vibes! 🌠",
  "Taurus power! Feeling really focused and happy today in Tokyo. 🇯🇵",
  "Anyone else feeling extra creative today? The stars are so pretty. 🎨",
  "Sending a big hug from NYC to everyone in our community. ❤️",
  "The stars told me today is going to be amazing for all of us. 🌟",
  "Magic is everywhere if you know where to look. Greetings from Paris! 🥐",
  "Found a lucky penny and a four-leaf clover today. Taurus luck! 🍀",
  "Dreaming of big things under the moonlight in Sydney. 🌙",
  "So happy to be part of this community. You guys are the best! ✨",
  "The planets are lining up for a great weekend. Who's excited? 🪐",
  "Just meditated under the stars. Feeling so peaceful. 🧘‍♀️",
  "Taurus energy is so grounding. Sending love from Berlin. 🕯️",
  "Make a wish! The universe is listening today. 🕯️",
  "Don't forget to smile today. The sun is shining for you! ☀️",
  "Feeling so connected to the universe right now. Magic is real. ✨",
  "Who else loves the smell of rain? Perfect Taurus weather. 🌧️",
  "Just a reminder that you are special and loved. 💖",
  "The stars are cheering for you today. Go get 'em! 🚀"
];

const CITY_NAMES = Object.keys(MAJOR_CITIES);

export function useSignals() {
  const [sessionSignals, setSessionSignals] = useState<Signal[]>([]);
  const [seedSignals, setSeedSignals] = useState<Signal[]>([]);

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
    setSessionSignals(prev => [...prev, newSignal]);

    // Remove session signals after 30 seconds
    setTimeout(() => {
      setSessionSignals(prev => prev.filter(s => s.id !== id));
    }, 30000);
  }, []);

  // Fetch persistent seeds from Firestore
  useEffect(() => {
    const q = query(
      collection(db, "tribe_seeds"),
      orderBy("created_at", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const seeds = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          message: data.message,
          city: data.city,
          lat: data.lat,
          lng: data.lng,
          timestamp: data.created_at?.toMillis() || Date.now(),
          isSeed: true
        } as Signal;
      });
      setSeedSignals(seeds);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "tribe_seeds");
    });

    return () => unsubscribe();
  }, []);

  // initial session signals
  useEffect(() => {
    const timers: any[] = [];
    
    const startTimer = setTimeout(() => {
      const cities = ["New York City", "London", "Tokyo", "Dubai", "Paris", "Berlin", "San Francisco", "Singapore", "Sydney", "Lisbon"];
      cities.forEach((city, i) => {
        const t = setTimeout(() => {
          const coords = MAJOR_CITIES[city.toLowerCase()];
          if (coords) {
            addSignal(FAKE_MESSAGES[i % FAKE_MESSAGES.length], city, coords, true);
          }
        }, i * 300);
        timers.push(t);
      });
    }, 1500);

    return () => {
      clearTimeout(startTimer);
      timers.forEach(t => clearTimeout(t));
    };
  }, [addSignal]);

  useEffect(() => {
    const interval = setInterval(() => {
      const message = FAKE_MESSAGES[Math.floor(Math.random() * FAKE_MESSAGES.length)];
      const cityName = CITY_NAMES[Math.floor(Math.random() * CITY_NAMES.length)];
      const coords = MAJOR_CITIES[cityName];
      
      addSignal(message, cityName, coords, true);
    }, 3000);

    return () => clearInterval(interval);
  }, [addSignal]);

  return { signals: [...seedSignals, ...sessionSignals], addSignal };
}
