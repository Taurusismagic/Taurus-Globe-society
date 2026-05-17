import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import admin from 'firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import firebaseConfig from './firebase-applet-config.json' assert { type: 'json' };
import { Resend } from 'resend';
import { GoogleGenAI } from "@google/genai";

// Initialize Firebase Admin
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: firebaseConfig.projectId,
  });
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const genAI = process.env.GEMINI_API_KEY ? new (GoogleGenAI as any)({ apiKey: process.env.GEMINI_API_KEY }) : null;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const firestore = getFirestore(firebaseConfig.firestoreDatabaseId);

const SEED_REQUESTS = [
  { message: "Who else is feeling magical today? 🌟", city: "New York City", lat: 40.7128, lng: -74.0060 },
  { message: "Looking for new friends in Berlin! Let's talk about the stars. ✨", city: "Berlin", lat: 52.5200, lng: 13.4050 },
  { message: "Just found a beautiful star map. It's so pretty! 💖", city: "Zurich", lat: 47.3769, lng: 8.5417 },
  { message: "The stars are shining bright in Tokyo. Wish you were here! 🇯🇵", city: "Tokyo", lat: 35.6762, lng: 139.6503 },
  { message: "Sending good vibes to everyone in our community! 🌈", city: "Dubai", lat: 25.2048, lng: 55.2708 },
  { message: "Who wants to share their favorite star story? 📖", city: "London", lat: 51.5074, lng: -0.1278 },
  { message: "Taurus power! Feeling happy and strong in California. ☀️", city: "San Francisco", lat: 37.7749, lng: -122.4194 },
  { message: "Made a wish on a falling star in Paris. It's a secret! 🥐", city: "Paris", lat: 48.8566, lng: 2.3522 },
  { message: "The moon is so big and beautiful tonight. Look up! 🌙", city: "Dublin", lat: 53.3498, lng: -6.2603 },
  { message: "Finding magic in the little things today. ✨", city: "Lisbon", lat: 38.7223, lng: -9.1393 },
  { message: "Art and stars go so well together. Painting in LA! 🎨", city: "Los Angeles", lat: 34.0522, lng: -118.2437 },
  { message: "So excited to meet all of you! Join us! 🤝", city: "Singapore", lat: 1.3521, lng: 103.8198 },
  { message: "Sunset meditation in Sydney was purely magical. 🌅", city: "Sydney", lat: -33.8688, lng: 151.2093 },
  { message: "Building a garden under the stars. So peaceful! 🌿", city: "Copenhagen", lat: 55.6761, lng: 12.5683 }
];

async function generateDailySeed() {
  const today = new Date().toISOString().split('T')[0];
  const seedSnap = await firestore.collection('tribe_seeds').where('date', '==', today).limit(1).get();
  
  if (seedSnap.empty) {
    // Pick a seed based on the date hash to iterate through the list
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const seedData = SEED_REQUESTS[dayOfYear % SEED_REQUESTS.length];
    
    await firestore.collection('tribe_seeds').add({
      ...seedData,
      date: today,
      created_at: FieldValue.serverTimestamp()
    });
    console.log(`[Seed] Generated new daily seed for ${today}: "${seedData.message}"`);
  }
}

let stripe: Stripe | null = null;
const getStripe = () => {
  if (!stripe && stripeSecretKey) {
    stripe = new Stripe(stripeSecretKey);
  }
  return stripe;
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for Stripe Webhook (needs raw body)
  app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const stripeClient = getStripe();

    if (!stripeClient || !sig || !endpointSecret) {
      return res.status(400).send('Webhook Error: Stripe or Webhook Secret not configured');
    }

    let event;

    try {
      event = stripeClient.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as any;
        const userId = session.metadata.user_id;
        const purchaseType = session.metadata.purchase_type;
        
        if (userId) {
          if (purchaseType === 'x_promotion') {
             await firestore.collection('promotion_requests').add({
                user_id: userId,
                status: 'pending',
                stripe_session_id: session.id,
                created_at: FieldValue.serverTimestamp()
             });
          } else {
            await firestore.collection('profiles').doc(userId).update({
              tier: 'paid',
              stripe_customer_id: session.customer,
              stripe_subscription_id: session.subscription,
              updated_at: FieldValue.serverTimestamp()
            });
          }
        }
        break;
      case 'customer.subscription.deleted':
        const subscription = event.data.object as any;
        const profileSnap = await firestore.collection('profiles')
          .where('stripe_subscription_id', '==', subscription.id)
          .limit(1)
          .get();
        
        if (!profileSnap.empty) {
          await profileSnap.docs[0].ref.update({
            tier: 'member',
            updated_at: FieldValue.serverTimestamp()
          });
        }
        break;
    }

    res.json({ received: true });
  });

  // Regular JSON middleware for other routes
  app.use(express.json());

  // API: Detailed Horoscope
  app.post('/api/horoscope', async (req, res) => {
    const { sign, dateId, dayName, isBirthdaySeason } = req.body;
    
    if (!genAI) {
      return res.status(500).json({ error: 'Gemini API not configured' });
    }

    try {
      const model = (genAI as any).getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: "You are the 'Taurus Is Magic' Star Guide. You are a wise, kind, and magical astrologer who helps people understand their day. Your voice is encouraging and mystical, but you use simple words that a 14-year-old would understand. You explain complex star movements in a way that feels like a story."
      });

      const prompt = `Generate a magical daily reading for ${sign} on ${dayName}, ${dateId}. 
      
      Style Guidelines:
      - Vibe: Friendly, magical, and easy to understand.
      - Topic 1 (Love): Friendships and how to be a good friend.
      - Topic 2 (Energy): Mood and how to feel balanced.
      - Topic 3 (Career): School work, hobbies, and goals.
      - Topic 4 (Planets): Simple explanation of where the planets are and what that means for our feelings.
      - Birthday Season context: ${isBirthdaySeason ? "It's their birthday season! Make it extra special." : "Standard day."}

      Format JSON exactly:
      {
        "general": "5 magical sentences + 1 fun daily tip",
        "love": "3 kind sentences about friends",
        "energy": "3 positive sentences about mood",
        "career": "3 encouraging sentences about school/goals",
        "planets": "5 simple sentences about the moon and stars today",
        "alignment_score": number (1-100),
        "power_hours": "e.g. 3:00 PM & Bedtime",
        "short_general": "1 quick magical sentence",
        "short_love": "1 quick sentence about friends",
        "short_energy": "1 quick sentence about mood",
        "short_career": "1 quick sentence about goals",
        "short_planets": "1 simple sentence about the sky"
      }`;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.9,
        }
      });

      const response = await result.response;
      let text = response.text();
      text = text.replace(/```json\n?|```/g, "").trim();
      
      const data = JSON.parse(text);
      res.json(data);
    } catch (err: any) {
      console.error(`[Horoscope API] Error: ${err.message}`);
      res.status(500).json({ error: err.message });
    }
  });

  // API: Validate Invite Code
  app.post('/api/invite/validate', async (req, res) => {
    const { code, increment = false } = req.body;
    if (!code) return res.status(400).json({ valid: false, error: 'Code required' });

    const codeSnap = await firestore.collection('invite_codes')
      .where('code', '==', code)
      .where('is_active', '==', true)
      .limit(1)
      .get();

    if (codeSnap.empty) return res.json({ valid: false, error: 'Invalid or inactive code' });

    const codeDoc = codeSnap.docs[0];
    const data = codeDoc.data();

    if (data.uses_so_far >= data.max_uses) {
      return res.json({ valid: false, error: 'Code usage limit reached' });
    }

    if (increment) {
      await codeDoc.ref.update({
        uses_so_far: FieldValue.increment(1)
      });
    }

    res.json({ valid: true });
  });

  // API: Geocode
  app.post('/api/geocode', async (req, res) => {
    const { city } = req.body;
    const key = process.env.OPENCAGE_API_KEY;
    
    console.log(`[Geocode] Request for: "${city}"`);
    
    if (!city) {
      return res.status(400).json({ error: 'City required' });
    }

    if (!key) {
      console.warn('[Geocode] WARNING: OPENCAGE_API_KEY not found. Using fallback coordinates.');
      // Random coordinates near London as fallback
      const lat = 51.5 + (Math.random() - 0.5) * 0.1;
      const lng = -0.1 + (Math.random() - 0.5) * 0.1;
      return res.json({ latitude: lat, longitude: lng, formatted: `${city} (Approximate)` });
    }

    try {
      const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(city)}&key=${key}&limit=1`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Geocode] OpenCage API error: ${response.status} ${errorText}`);
        // Fallback on API error too to allow user progression
        const lat = 40.7 + (Math.random() - 0.5) * 0.1; // NYC area
        const lng = -74.0 + (Math.random() - 0.5) * 0.1;
        return res.json({ latitude: lat, longitude: lng, formatted: `${city} (Fallback)` });
      }

      const data = await response.json() as any;
      console.log(`[Geocode] OpenCage response results: ${data.results?.length || 0}`);
      
      if (data.results && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry;
        const formatted = data.results[0].formatted;
        console.log(`[Geocode] Success: ${formatted} (${lat}, ${lng})`);
        res.json({ latitude: lat, longitude: lng, formatted });
      } else {
        console.warn(`[Geocode] No results found for: "${city}". Using fallback.`);
        const lat = 48.8 + (Math.random() - 0.5) * 0.1; // Paris area
        const lng = 2.3 + (Math.random() - 0.5) * 0.1;
        res.json({ latitude: lat, longitude: lng, formatted: `${city} (Unknown)` });
      }
    } catch (err: any) {
      console.error(`[Geocode] Request failed: ${err.message}`);
      // Final fallback
      res.json({ latitude: 0, longitude: 0, formatted: "The Void" });
    }
  });

  // API: Onboard User
  app.post('/api/auth/onboard', async (req, res) => {
    const { uid, email, displayName, city, sign, lat, lng, userType } = req.body;
    
    if (!uid || !email) return res.status(400).json({ error: 'UID and Email required' });

    console.log(`[Onboard] Initializing node for ${email} (${uid})`);

    try {
      const profileRef = firestore.collection('profiles').doc(uid);
      const profileSnap = await profileRef.get();

      if (!profileSnap.exists) {
        await profileRef.set({
          display_name: displayName || 'Taurus Member',
          email: email,
          city: city || 'Unknown',
          latitude: lat || 0,
          longitude: lng || 0,
          zodiac_sign: sign || 'Taurus',
          user_type: userType || 'fun',
          tier: 'member',
          is_visible: true,
          created_at: FieldValue.serverTimestamp(),
          updated_at: FieldValue.serverTimestamp()
        });

        // Send Welcome Email
        if (resend && email) {
          try {
            await resend.emails.send({
              from: 'Taurus Is Magic <onboarding@resend.dev>',
              to: [email],
              subject: 'Welcome to our magic world!',
              html: `
                <div style="font-family: serif; background-color: #05070A; color: #F5E6C0; padding: 40px; border: 1px solid #D4AF37;">
                  <h1 style="color: #D4AF37; font-style: italic; border-bottom: 1px solid rgba(212, 175, 55, 0.2); padding-bottom: 20px;">You are now part of our magic community!</h1>
                  <p style="font-size: 18px; line-height: 1.6;">Hi <strong>${displayName}</strong>,</p>
                  <p style="font-size: 16px; line-height: 1.6; opacity: 0.8;">
                    We're so happy to have you with us. Your magic signals are now coming from <strong>${city}</strong>.
                  </p>
                  <div style="margin: 30px 0; padding: 20px; background: rgba(212, 175, 55, 0.05); border-radius: 10px;">
                    <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.2em; color: rgba(212, 175, 55, 0.6);">Your Star Sign</p>
                    <p style="margin: 5px 0 0 0; font-size: 24px; font-style: italic;">${sign}</p>
                  </div>
                  <p style="font-size: 14px; opacity: 0.6; font-style: italic;">
                    "Be brave. Be kind. Be magical."
                  </p>
                  <hr style="border: 0; border-top: 1px solid rgba(212, 175, 55, 0.1); margin: 30px 0;">
                  <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.4;">
                    Made with love by Taurus Is Magic
                  </p>
                </div>
              `
            });
            console.log(`[Email] Welcome email sent to ${email}`);
          } catch (emailErr: any) {
            console.error(`[Email] Failed to send welcome email: ${emailErr.message}`);
          }
        }
      }

      res.json({ success: true });
    } catch (err: any) {
      console.error(`[Onboard] Error: ${err.message}`);
      res.status(500).json({ error: err.message });
    }
  });

  // API: Stripe Checkout
  app.post('/api/stripe/checkout', async (req, res) => {
    const { userId, email, type = 'subscription' } = req.body;
    const stripeClient = getStripe();
    if (!stripeClient) return res.status(500).json({ error: 'Stripe not configured' });

    try {
      const isPromo = type === 'x_promotion';
      const session = await stripeClient.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: isPromo ? process.env.STRIPE_X_PROMO_PRICE_ID : process.env.STRIPE_PRICE_ID,
            quantity: 1,
          },
        ],
        mode: isPromo ? 'payment' : 'subscription',
        success_url: `${process.env.APP_URL || 'http://localhost:3000'}/?payment=success`,
        cancel_url: `${process.env.APP_URL || 'http://localhost:3000'}/?payment=cancelled`,
        customer_email: email,
        metadata: {
          user_id: userId,
          purchase_type: type
        },
      });

      res.json({ url: session.url });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    generateDailySeed().catch(console.error);
  });
}

startServer();
