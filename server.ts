import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const opencageKey = process.env.OPENCAGE_API_KEY || '';

// Lazy initialization to prevent crash on startup if keys are missing
let supabaseAdmin: any = null;
const getSupabaseAdmin = () => {
  if (!supabaseAdmin) {
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('Supabase URL or Service Key missing. Admin features will fail.');
      return null;
    }
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabaseAdmin;
};

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

    const admin = getSupabaseAdmin();
    if (!admin) return res.status(500).send('Supabase admin not configured');

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as any;
        const userId = session.metadata.supabase_user_id;
        if (userId) {
          await admin
            .from('profiles')
            .update({ 
              tier: 'paid', 
              stripe_customer_id: session.customer,
              stripe_subscription_id: session.subscription
            })
            .eq('id', userId);
        }
        break;
      case 'customer.subscription.deleted':
        const subscription = event.data.object as any;
        await admin
          .from('profiles')
          .update({ tier: 'member' })
          .eq('stripe_subscription_id', subscription.id);
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

    const admin = getSupabaseAdmin();
    if (!admin) return res.status(500).json({ error: 'Supabase admin not configured' });

    const { data, error } = await admin
      .from('invite_codes')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single();

    if (error || !data) return res.json({ valid: false, error: 'Invalid or inactive code' });

    if (data.uses_so_far >= data.max_uses) {
      return res.json({ valid: false, error: 'Code usage limit reached' });
    }

    if (increment) {
      // Increment usage atomically
      const { error: updateError } = await admin
        .from('invite_codes')
        .update({ uses_so_far: data.uses_so_far + 1 })
        .eq('id', data.id);
      
      if (updateError) return res.status(500).json({ valid: false, error: 'Failed to claim code' });
    }

    res.json({ valid: true });
  });

  // API: Geocode
  app.post('/api/geocode', async (req, res) => {
    const { city } = req.body;
    const key = process.env.OPENCAGE_API_KEY;
    
    console.log(`[Geocode] Request for: "${city}"`);
    
    if (!city || !key) {
      console.error('[Geocode] Error: Missing city or API key');
      return res.status(400).json({ error: !key ? 'Geocoding API key not configured' : 'City required' });
    }

    try {
      const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(city)}&key=${key}&limit=1`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Geocode] OpenCage API error: ${response.status} ${errorText}`);
        return res.status(response.status).json({ error: 'Geocoding service error' });
      }

      const data = await response.json() as any;
      console.log(`[Geocode] OpenCage response results: ${data.results?.length || 0}`);
      
      if (data.results && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry;
        const formatted = data.results[0].formatted;
        console.log(`[Geocode] Success: ${formatted} (${lat}, ${lng})`);
        res.json({ latitude: lat, longitude: lng, formatted });
      } else {
        console.warn(`[Geocode] No results found for: "${city}"`);
        res.status(404).json({ error: 'City not found' });
      }
    } catch (err: any) {
      console.error(`[Geocode] Request failed: ${err.message}`);
      res.status(500).json({ error: 'Geocoding failed' });
    }
  });

  // API: Stripe Checkout
  app.post('/api/stripe/checkout', async (req, res) => {
    const { userId, email } = req.body;
    if (!stripe) return res.status(500).json({ error: 'Stripe not configured' });

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: process.env.STRIPE_PRICE_ID,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.APP_URL || 'http://localhost:3000'}/?payment=success`,
        cancel_url: `${process.env.APP_URL || 'http://localhost:3000'}/?payment=cancelled`,
        customer_email: email,
        metadata: {
          supabase_user_id: userId,
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
