import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { GoogleGenAI } from 'npm:@google/genai';
import * as kv from './kv_store.tsx';

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', logger(console.log));

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Initialize Google Generative AI
const getGeminiClient = () => {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }
  return new GoogleGenAI({ apiKey });
};

// Helper to verify auth
async function verifyAuth(authHeader: string | null) {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return null;
  }
  
  return user;
}

// ============================================================================
// AUTH ROUTES
// ============================================================================

app.post('/make-server-b3c2a063/auth/signup', async (c) => {
  try {
    const { email, password, name, phone, role = 'elderly' } = await c.req.json();
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, phone, role },
      // Automatically confirm email since email server hasn't been configured
      email_confirm: true
    });
    
    if (error) {
      // Check if it's a duplicate email error
      if (error.message.includes('already been registered') || error.code === 'email_exists') {
        return c.json({ error: 'A user with this email address has already been registered' }, 422);
      }
      throw error;
    }
    
    // Create user profile in KV store
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email,
      name,
      phone,
      role,
      language: 'hi',
      createdAt: new Date().toISOString()
    });
    
    return c.json({ success: true, user: data.user });
  } catch (error) {
    console.error('Signup error:', error);
    return c.json({ error: error.message || 'Signup failed' }, 400);
  }
});

// ============================================================================
// MEDICATION ROUTES
// ============================================================================

app.get('/make-server-b3c2a063/medications', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    
    const medications = await kv.getByPrefix(`medication:${user.id}:`);
    return c.json({ medications: medications.map(m => m.value) });
  } catch (error) {
    console.error('Get medications error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.post('/make-server-b3c2a063/medications', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    
    const medication = await c.req.json();
    const medicationId = medication.id || crypto.randomUUID();
    
    const medicationData = {
      ...medication,
      id: medicationId,
      userId: user.id,
      createdAt: new Date().toISOString()
    };
    
    await kv.set(`medication:${user.id}:${medicationId}`, medicationData);
    
    return c.json({ success: true, medication: medicationData });
  } catch (error) {
    console.error('Create medication error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.put('/make-server-b3c2a063/medications/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    
    const medicationId = c.req.param('id');
    const updates = await c.req.json();
    
    const existing = await kv.get(`medication:${user.id}:${medicationId}`);
    if (!existing) {
      return c.json({ error: 'Medication not found' }, 404);
    }
    
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await kv.set(`medication:${user.id}:${medicationId}`, updated);
    
    return c.json({ success: true, medication: updated });
  } catch (error) {
    console.error('Update medication error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.delete('/make-server-b3c2a063/medications/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    
    const medicationId = c.req.param('id');
    await kv.del(`medication:${user.id}:${medicationId}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Delete medication error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// PRESCRIPTION PROCESSING WITH GEMINI
// ============================================================================

app.post('/make-server-b3c2a063/process-prescription', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    
    const { imageBase64 } = await c.req.json();
    
    if (!imageBase64) {
      return c.json({ error: 'No image provided' }, 400);
    }
    
    console.log('Processing prescription with Gemini 2.5 Flash...');
    
    // Initialize Gemini client
    const ai = getGeminiClient();
    
    // Extract base64 data (remove data:image/jpeg;base64, prefix if present)
    const base64Data = imageBase64.includes(',') 
      ? imageBase64.split(',')[1] 
      : imageBase64;
    
    // Determine mime type from data URL or default to jpeg
    let mimeType = 'image/jpeg';
    if (imageBase64.startsWith('data:')) {
      const mimeMatch = imageBase64.match(/data:([^;]+);/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
      }
    }
    
    console.log('Image mime type:', mimeType);
    console.log('Base64 data length:', base64Data.length);
    
    const contents = [
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Data,
        },
      },
      {
        text: `Extract medication information from this prescription image in Hindi. 
Return ONLY valid JSON with this exact structure:
{
  "medications": [
    {
      "name": "medication name in Hindi",
      "strength": "strength (e.g., 500mg)",
      "dosage": "dosage form (e.g., गोली, सिरप)",
      "frequency": "frequency (e.g., दिन में 2 बार)",
      "timing": ["morning", "evening"],
      "duration": "duration (e.g., 7 दिन)",
      "instructions": "special instructions in Hindi"
    }
  ]
}
If you cannot read the prescription clearly, return: {"error": "prescription not clear"}`
      },
    ];
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
    });
    
    const textContent = response.text;
    
    if (!textContent) {
      console.error('No text content in Gemini response');
      return c.json({ error: 'No response from Gemini' }, 500);
    }
    
    console.log('Extracted text from Gemini:', textContent);
    
    // Parse JSON from response
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Could not find JSON in response:', textContent);
      return c.json({ error: 'Could not parse prescription' }, 400);
    }
    
    const extracted = JSON.parse(jsonMatch[0]);
    
    if (extracted.error) {
      return c.json({ error: extracted.error }, 400);
    }
    
    // Save prescription record
    const prescriptionId = crypto.randomUUID();
    await kv.set(`prescription:${user.id}:${prescriptionId}`, {
      id: prescriptionId,
      userId: user.id,
      imageUrl: imageBase64,
      extracted,
      processedAt: new Date().toISOString()
    });
    
    console.log('Prescription processed successfully:', prescriptionId);
    
    return c.json({ 
      success: true, 
      prescriptionId,
      medications: extracted.medications 
    });
  } catch (error) {
    console.error('Prescription processing error:', error);
    console.error('Error stack:', error.stack);
    return c.json({ 
      error: error.message,
      type: error.name 
    }, 500);
  }
});

// ============================================================================
// DOSE EVENT ROUTES
// ============================================================================

app.post('/make-server-b3c2a063/dose-events', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    
    const event = await c.req.json();
    const eventId = event.id || crypto.randomUUID();
    
    const eventData = {
      ...event,
      id: eventId,
      userId: user.id,
      createdAt: event.createdAt || new Date().toISOString()
    };
    
    await kv.set(`dose-event:${user.id}:${eventId}`, eventData);
    
    return c.json({ success: true, event: eventData });
  } catch (error) {
    console.error('Create dose event error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.get('/make-server-b3c2a063/dose-events', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    
    const events = await kv.getByPrefix(`dose-event:${user.id}:`);
    return c.json({ events: events.map(e => e.value) });
  } catch (error) {
    console.error('Get dose events error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// PILL VERIFICATION WITH GEMINI VISION
// ============================================================================

app.post('/make-server-b3c2a063/verify-pill', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    
    const { imageBase64, medicationName, expectedAppearance } = await c.req.json();
    
    console.log('Verifying pill with Gemini 2.5 Flash...');
    
    const ai = getGeminiClient();
    
    // Extract base64 data (remove data:image/jpeg;base64, prefix if present)
    const base64Data = imageBase64.includes(',') 
      ? imageBase64.split(',')[1] 
      : imageBase64;
    
    const contents = [
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Data,
        },
      },
      {
        text: `Verify if this is the correct medication: "${medicationName}". Expected appearance: "${expectedAppearance}".
Analyze the pill/medicine in the image and return ONLY valid JSON:
{
  "verified": true or false,
  "confidence": 0-100,
  "reason": "explanation in Hindi"
}`
      },
    ];
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
    });
    
    const textContent = response.text;
    
    if (!textContent) {
      console.error('No text content in Gemini response');
      return c.json({ error: 'No response from Gemini' }, 500);
    }
    
    console.log('Gemini verification response:', textContent);
    
    const jsonMatch = textContent?.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return c.json({ error: 'Could not verify pill' }, 400);
    }
    
    const verification = JSON.parse(jsonMatch[0]);
    return c.json({ success: true, verification });
  } catch (error) {
    console.error('Pill verification error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// CAREGIVER ROUTES
// ============================================================================

app.post('/make-server-b3c2a063/caregiver/link', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    
    const { elderlyUserId } = await c.req.json();
    
    const linkId = crypto.randomUUID();
    await kv.set(`caregiver-link:${linkId}`, {
      id: linkId,
      caregiverId: user.id,
      elderlyUserId,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    
    return c.json({ success: true, linkId });
  } catch (error) {
    console.error('Caregiver link error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.get('/make-server-b3c2a063/caregiver/patients', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    
    const links = await kv.getByPrefix('caregiver-link:');
    const userLinks = links
      .map(l => l.value)
      .filter(link => link.caregiverId === user.id && link.status === 'approved');
    
    const patients = await Promise.all(
      userLinks.map(async (link) => {
        const patient = await kv.get(`user:${link.elderlyUserId}`);
        const medications = await kv.getByPrefix(`medication:${link.elderlyUserId}:`);
        const events = await kv.getByPrefix(`dose-event:${link.elderlyUserId}:`);
        
        return {
          ...patient,
          medications: medications.map(m => m.value),
          recentEvents: events.map(e => e.value).slice(0, 10)
        };
      })
    );
    
    return c.json({ patients });
  } catch (error) {
    console.error('Get patients error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// PUSH NOTIFICATION SUBSCRIPTION
// ============================================================================

app.post('/make-server-b3c2a063/notifications/subscribe', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    
    const subscription = await c.req.json();
    
    await kv.set(`push-subscription:${user.id}`, {
      userId: user.id,
      subscription,
      createdAt: new Date().toISOString()
    });
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Subscribe notification error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// TWILIO VOICE CALLING FOR MEDICATION REMINDERS
// ============================================================================

app.post('/make-server-b3c2a063/twilio/make-call', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    
    const { phoneNumber, medicationName, reminderId } = await c.req.json();
    
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');
    
    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      return c.json({ error: 'Twilio credentials not configured' }, 500);
    }
    
    // Create TwiML for the call
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const twimlUrl = `${supabaseUrl}/functions/v1/make-server-b3c2a063/twilio/voice?medication=${encodeURIComponent(medicationName)}&reminderId=${reminderId}`;
    
    // Make Twilio API call
    const auth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Calls.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: phoneNumber,
          From: twilioPhoneNumber,
          Url: twimlUrl,
          Method: 'POST'
        }).toString()
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Twilio call error:', error);
      return c.json({ error: 'Failed to make call' }, 500);
    }
    
    const data = await response.json();
    
    // Store call record
    await kv.set(`call:${data.sid}`, {
      callSid: data.sid,
      userId: user.id,
      reminderId,
      medicationName,
      phoneNumber,
      status: 'initiated',
      createdAt: new Date().toISOString()
    });
    
    return c.json({ success: true, callSid: data.sid });
  } catch (error) {
    console.error('Make call error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// TwiML endpoint for voice content
app.post('/make-server-b3c2a063/twilio/voice', async (c) => {
  try {
    const medicationName = c.req.query('medication') || 'your medication';
    const reminderId = c.req.query('reminderId') || '';
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const gatherUrl = `${supabaseUrl}/functions/v1/make-server-b3c2a063/twilio/gather`;
    
    // Generate TwiML response
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="hi-IN">
    नमस्ते। यह आपकी दवाई का रिमाइंडर है।
  </Say>
  <Pause length="1"/>
  <Say voice="Polly.Aditi" language="hi-IN">
    आपको ${medicationName} लेने का समय हो गया है।
  </Say>
  <Pause length="1"/>
  <Gather action="${gatherUrl}?reminderId=${reminderId}" method="POST" numDigits="1" timeout="10">
    <Say voice="Polly.Aditi" language="hi-IN">
      अगर आपने दवाई ले ली है, तो १ दबाएं।
    </Say>
    <Pause length="1"/>
    <Say voice="Polly.Aditi" language="hi-IN">
      अगर आप रिमाइंडर को स्नूज़ करना चाहते हैं, तो ९ दबाएं।
    </Say>
  </Gather>
  <Say voice="Polly.Aditi" language="hi-IN">
    हमें कोई जवाब नहीं मिला। कृपया बाद में दवाई लें।
  </Say>
</Response>`;
    
    return c.text(twiml, 200, { 'Content-Type': 'text/xml' });
  } catch (error) {
    console.error('Voice endpoint error:', error);
    return c.text('<Response><Say>An error occurred</Say></Response>', 500, {
      'Content-Type': 'text/xml'
    });
  }
});

// Handle DTMF input from user
app.post('/make-server-b3c2a063/twilio/gather', async (c) => {
  try {
    const body = await c.req.text();
    const params = new URLSearchParams(body);
    const digit = params.get('Digits');
    const callSid = params.get('CallSid');
    const reminderId = c.req.query('reminderId') || '';
    
    console.log('DTMF received:', { digit, callSid, reminderId });
    
    let twiml = '';
    
    if (digit === '1') {
      // User confirmed they took the medication
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="hi-IN">
    धन्यवाद। आपकी दवाई रिकॉर्ड कर ली गई है। स्वस्थ रहें।
  </Say>
  <Hangup/>
</Response>`;
      
      // Update reminder status
      if (reminderId) {
        await kv.set(`reminder-response:${reminderId}`, {
          reminderId,
          callSid,
          action: 'taken',
          timestamp: new Date().toISOString()
        });
      }
    } else if (digit === '9') {
      // User wants to snooze
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="hi-IN">
    ठीक है। हम १५ मिनट में फिर से याद दिलाएंगे।
  </Say>
  <Hangup/>
</Response>`;
      
      // Update reminder to snooze
      if (reminderId) {
        await kv.set(`reminder-response:${reminderId}`, {
          reminderId,
          callSid,
          action: 'snoozed',
          snoozeUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          timestamp: new Date().toISOString()
        });
      }
    } else {
      // Invalid input
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="hi-IN">
    गलत इनपुट। कृपया १ या ९ दबाएं।
  </Say>
  <Redirect method="POST">/make-server-b3c2a063/twilio/voice?reminderId=${reminderId}</Redirect>
</Response>`;
    }
    
    return c.text(twiml, 200, { 'Content-Type': 'text/xml' });
  } catch (error) {
    console.error('Gather endpoint error:', error);
    return c.text('<Response><Say>An error occurred</Say><Hangup/></Response>', 500, {
      'Content-Type': 'text/xml'
    });
  }
});

// Get reminder response status
app.get('/make-server-b3c2a063/twilio/reminder-status/:reminderId', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    
    const reminderId = c.req.param('reminderId');
    const response = await kv.get(`reminder-response:${reminderId}`);
    
    return c.json({ status: response || { action: 'pending' } });
  } catch (error) {
    console.error('Get reminder status error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/make-server-b3c2a063/health', (c) => {
  return c.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

Deno.serve(app.fetch);