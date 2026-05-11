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
import firebaseConfig from './firebase-applet-config.json' assert { type: 'json' };

// Initialize Firebase Admin
if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const firestore = admin.firestore();

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
                created_at: admin.firestore.FieldValue.serverTimestamp()
             });
          } else {
            await firestore.collection('profiles').doc(userId).update({
              tier: 'paid',
              stripe_customer_id: session.customer,
              stripe_subscription_id: session.subscription,
              updated_at: admin.firestore.FieldValue.serverTimestamp()
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
            updated_at: admin.firestore.FieldValue.serverTimestamp()
          });
        }
        break;
    }

    res.json({ received: true });
  });

  // Regular JSON middleware for other routes
  app.use(express.json());

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
        uses_so_far: admin.firestore.FieldValue.increment(1)
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
  });
}

startServer();
