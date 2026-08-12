/**
 * chat-worker.js
 * ─────────────────────────────────────────────────────────────────────────
 * Cloudflare Worker that powers the "Chat with AI" feature on the portfolio
 * site. It proxies requests to OpenRouter (openrouter.ai) so the API key
 * never touches the browser.
 *
 * WHY THIS EXISTS
 * The portfolio (index.html/script.js/style.css) is a static site with no
 * backend. Calling OpenRouter directly from script.js would mean putting
 * the API key in public JS — anyone could view-source it and rack up usage
 * on your account. This Worker sits in between: the browser calls the
 * Worker, the Worker calls OpenRouter with the secret key, and only the
 * Worker ever sees the key.
 *
 * DEPLOY STEPS (free, ~5 minutes)
 * 1. Get a free OpenRouter API key:
 *      https://openrouter.ai/keys  → "Create Key"
 *
 * 2. Install the Cloudflare CLI (if you don't have it) and log in:
 *      npm install -g wrangler
 *      wrangler login
 *
 * 3. In a new folder (or this repo), create wrangler.toml next to this file:
 *      name = "manish-portfolio-chat"
 *      main = "chat-worker.js"
 *      compatibility_date = "2024-01-01"
 *
 * 4. Set the API key as a secret (never goes into git):
 *      wrangler secret put OPENROUTER_API_KEY
 *      (paste the key when prompted)
 *
 * 5. Deploy:
 *      wrangler deploy
 *      → gives you a URL like https://manish-portfolio-chat.<you>.workers.dev
 *
 * 6. In script.js, set CHAT_API_URL to that URL + "/chat", e.g.:
 *      const CHAT_API_URL = 'https://manish-portfolio-chat.<you>.workers.dev/chat';
 *
 * 7. CORS is restricted to the origins listed in ALLOWED_ORIGINS below
 *    (production domain + common local dev setups). Redeploy with
 *    `wrangler deploy` any time you change this file.
 *
 * 8. Free-model IDs on OpenRouter rotate — check the live list any time at
 *      https://openrouter.ai/api/v1/models  (filter for ids ending ":free")
 *    and update OPENROUTER_MODEL below if the current one stops working.
 * ─────────────────────────────────────────────────────────────────────────
 */

// Origins allowed to call this Worker. Keep the production domain plus a
// handful of common local dev setups so testing on your machine works too.
// Remove the localhost/127.0.0.1/null entries once you're done testing
// locally, if you want to lock this down to production only.
const ALLOWED_ORIGINS = [
  'https://manishson.github.io',   // production (GitHub Pages)
  'http://localhost:8000',         // python3 -m http.server 8000
  'http://127.0.0.1:8000',
  'http://localhost:5500',         // VS Code "Live Server" default
  'http://127.0.0.1:5500',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'null',                          // opening index.html directly (double-click / file://)
];
// Free-tier model on OpenRouter. These ":free" IDs rotate as providers add/
// remove promotions — if this one ever 404s, check the live list at
// https://openrouter.ai/api/v1/models and swap in a current ":free" id.
// Avoid reasoning/"thinking" models here (e.g. nvidia/nemotron) — they tend
// to leak their internal chain-of-thought into the visible reply unless the
// client carefully separates reasoning tokens, which is overkill for a
// short-answer FAQ widget. A plain instruct model is more predictable.
const OPENROUTER_MODEL = 'liquid/lfm-2.5-2.6b:free';

// Everything the bot is allowed to know about Manish, drawn from the
// portfolio content itself. Keep this in sync if the resume changes.
const SYSTEM_PROMPT = `
You are the AI assistant embedded on Manish Sonawane's personal portfolio website.
You speak ABOUT Manish in the third person, in a friendly, concise, professional tone
(2-5 sentences per answer unless asked for detail). You are NOT Manish himself.

FACTS ABOUT MANISH SONAWANE (only use these — do not invent experience, dates, or claims):

ROLE: Senior AI/ML Engineer, 5+ years of experience building enterprise-scale LLM
systems, computer vision, NLP, and generative AI solutions.

WORK EXPERIENCE:
- Senior AI/ML Engineer, STL Digital (Apr 2025 – Present, current role): Designs MCP
  (Model Context Protocol) tools for structured LLM-to-enterprise-service interaction;
  builds production UIs with Streamlit and Reflex UI; implements function-calling and
  tool orchestration with LangGraph to turn natural language into executable multi-
  system actions; collaborates cross-functionally with product and backend teams.
- AI/ML Developer, Freelance (Dec 2024 – Apr 2025): Designed computer vision models for
  real-time weapon detection and face matching; built a deep-learning face-matching
  identity verification system; developed REST APIs with FastAPI; optimized throughput
  via GPU acceleration and model quantization.
- AI/ML Developer, Qodequay Technologies Pvt. Ltd. (Jun 2024 – Dec 2024): Designed NER
  models for the property services domain; compared LLM outputs vs. traditional NLP
  methods; built computer vision models for image classification/object detection;
  built MongoDB aggregation pipelines with Django REST Framework.
- ML Engineer, 47Billion (Feb 2021 – Jun 2024, 3+ years): Built object detection models
  (YOLO, Faster R-CNN); built a Document Digitization pipeline (OCR + transformer NLP)
  for legal document processing; built an AI legal document classification and
  summarization system at 90% accuracy; built a PII Extraction & Redaction system for
  PDFs; performed EDA with Pandas/Seaborn/Matplotlib.

FEATURED PROJECTS:
- Sentinel Bot — AI-powered enterprise automation assistant. Lets users run complex
  multi-system operations (GitHub, Jira, Confluence, databases, monitoring tools) via
  natural language. ~95% intent-to-action accuracy, 50+ services integrated, handles
  thousands of daily requests. Built with LangGraph, GPT-4, FastAPI, JSON Schema, ETL.
- Surveillance System — Real-time weapon detection and biometric face matching deployed
  on AWS, using YOLO/Faster R-CNN with GPU-optimized inference.
- Property Insights Automator — NER-based legal document classification and
  summarization system, 92% accuracy across 10,000+ documents, with PII redaction and
  EDA-driven feature engineering. Built with LegalBERT, LangChain, NER, Azure, Docker.
- Smaller POCs: Multi-Object Detection (YOLO/Faster R-CNN), Document Digitization
  (OCR+NLP), Legal Doc Classification & Summarization, PII Extraction & Redaction.

SKILLS: Python/SQL (98%), LLMs/Generative AI (95%), LangChain/LangGraph (93%),
Computer Vision — YOLO/R-CNN (90%), NLP/NER Systems (88%), Cloud — AWS/GCP/Azure (85%),
MLOps/Docker/Kubernetes (82%). Also: TensorFlow, PyTorch, Scikit-learn, GPT-4, Claude,
Llama 2, Mistral 7B, BERT, LegalBERT, RAG, MCP Tools, Function Calling, AWS
(EC2/SageMaker/Bedrock/S3/Lambda), Azure (Cognitive/Databricks/Blob/SQL), FastAPI,
Django REST, Flask, MongoDB, DynamoDB, Streamlit, Reflex UI.

EDUCATION: Bachelor of Engineering (B.E.), Dr. Babasaheb Ambedkar Marathwada
University, Aurangabad (2019). Diploma in Engineering, MSBTE (2016).

SOFT SKILLS: Attention to detail, communication, team management, problem solving,
time management, leadership, adaptability.

AVAILABILITY & CONTACT: Open to senior AI/ML roles, consulting, and AI projects.
Email: manishsonawane19@gmail.com · LinkedIn: linkedin.com/in/manish-sonawane-ai ·
Phone: +91 90751 66532.

RULES:
- Only answer using the facts above. If asked something not covered (e.g. personal
  life, unrelated topics, salary specifics), politely say you don't have that
  information and suggest contacting Manish directly via email.
- Never invent metrics, employers, or dates that aren't listed above.
- If asked who you are, say you're an AI assistant trained on Manish's portfolio, not
  Manish himself.
- Keep replies tight and skimmable — this is a chat widget, not an essay. Aim for
  2-5 sentences unless the visitor explicitly asks for more detail.
- Respond in PLAIN TEXT only — no markdown. That means no **bold**, no # headers, no
  bullet/asterisk lists. If you need to list things, write them inline in a sentence
  or use plain numbers like "1) ... 2) ..." — this chat widget renders raw text, so
  markdown symbols would show up literally instead of being formatted.
- When relevant, nudge visitors toward the "Projects" section or the contact email.
`.trim();

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(origin) });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders(origin) });
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    const message = (body && body.message ? String(body.message) : '').slice(0, 2000);
    const history = Array.isArray(body && body.history) ? body.history.slice(-10) : [];

    if (!message.trim()) {
      return new Response(JSON.stringify({ error: 'Empty message' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    if (!env.OPENROUTER_API_KEY) {
      return new Response(JSON.stringify({ error: 'Server not configured (missing OPENROUTER_API_KEY)' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    // Build an OpenAI-style "messages" array: system prompt, then prior
    // turns, then the new user message.
    const messages = [{ role: 'system', content: SYSTEM_PROMPT }];
    history.forEach((turn) => {
      messages.push({
        role: turn.role === 'assistant' ? 'assistant' : 'user',
        content: String(turn.text || '').slice(0, 2000),
      });
    });
    messages.push({ role: 'user', content: message });

    try {
      const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
          // Optional but recommended by OpenRouter for attribution/rankings —
          // has no effect on auth or billing.
          'HTTP-Referer': 'https://manishson.github.io',
          'X-Title': 'Manish Sonawane Portfolio Chat',
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages,
          temperature: 0.6,
          max_tokens: 1024,
          // Belt-and-suspenders: if OPENROUTER_MODEL ever gets swapped back to
          // a reasoning model, this tells OpenRouter to strip chain-of-thought
          // tokens out of the response instead of mixing them into `content`.
          reasoning: { exclude: true },
        }),
      });

      if (!orRes.ok) {
        const errText = await orRes.text();
        return new Response(JSON.stringify({ error: 'OpenRouter API error', detail: errText }), {
          status: 502,
          headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
        });
      }

      const data = await orRes.json();
      let reply =
        data &&
        data.choices &&
        data.choices[0] &&
        data.choices[0].message &&
        data.choices[0].message.content;

      // Some reasoning models still inline their scratchpad as <think>...</think>
      // (or similar tags) even with reasoning.exclude set — strip it defensively
      // so a stray model swap never leaks raw chain-of-thought into the chat.
      if (reply) {
        reply = reply.replace(/<(think|thinking|reasoning|scratchpad)>[\s\S]*?<\/\1>/gi, '').trim();
      }

      return new Response(
        JSON.stringify({
          reply: reply || "Sorry, I couldn't come up with a reply — try rephrasing, or email manishsonawane19@gmail.com.",
          // Echoed back so the chat UI can show a live "MODEL: ..." HUD
          // readout without hardcoding the model name on the client.
          model: OPENROUTER_MODEL,
        }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) } }
      );
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Upstream request failed', detail: String(err) }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }
  },
};
