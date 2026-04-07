# Research & Planning

## Beyond Headlines - AI system plan

### Guiding principles

Before anything else, three rules that should govern every AI decision in this platform:

Every AI output is **structured, not conversational.** No chat bubbles, no "Here's what I found!" — outputs render as formatted reports with sections, labels, and clear hierarchy. The journalist should feel like they're reading a briefing document, not talking to a chatbot.

AI is **always assistive, never autonomous.** Nothing gets published without a human accepting it. Every AI suggestion has an accept/reject/edit control next to it.

The system should **fail gracefully.** If the AI returns garbage or times out, the journalist can still work manually. AI enhances the workflow, it doesn't block it.

### Model recommendation

Based on the meeting note requirement to compare Claude, OpenAI, and Perplexity for 500 article generation, here's the practical split:

**Claude Sonnet 4.5** — primary model for all writing, framing, sub-editing, and structured briefing tasks. Best balance of quality and cost for long-form editorial work, strong instruction-following for structured output.

**Perplexity Sonar Pro** — for Step 3 only, where real-time web search and source retrieval is needed. Sonar's built-in search grounding saves building a separate scraping + retrieval pipeline from scratch.

**API Gateway: OpenRouter** — all models (Claude Sonnet, Claude Haiku, Perplexity Sonar) are accessed through a single OpenRouter account at `https://openrouter.ai/api/v1`. One API key, one bill, OpenAI-compatible interface. No separate Anthropic or Perplexity accounts needed.

**OpenAI GPT-4o** — optional fallback available via OpenRouter. Only bring it in if Claude underperforms on a specific task during testing. Avoid running two primary models simultaneously — it adds cost and complexity with no clear benefit.

### Revised One

| Step | Task | Model | Reason |
| --- | --- | --- | --- |
| Step 1 | Headline clustering | Claude Haiku | Simple JSON grouping task |
| Step 1 | Scraping | Rule-based (BullMQ) | No AI needed |
| Step 2 | Topic brief & framing | Claude Sonnet | Shapes entire story angle |
| Step 3 | Web search & retrieval | Perplexity Sonar Pro (OpenRouter) | Built-in search grounding |
| Step 3 | Research synthesis | Claude Haiku | Summarisation, not reasoning |
| Step 4 | Outline & drafting | Claude Sonnet | Quality-critical writing task |
| Step 5 | Sub-editing & flow | Claude Sonnet | Directly affects published article |
| Step 5 | SEO metadata | Claude Haiku | Low-stakes structured output |
| Step 6 | Packaging & captions | Claude Haiku | Short, low-stakes outputs |
| Step 7 | Publish workflow | No AI | Pure CMS logic |

### Step-by-step AI plan

### Step 1 — News intake & signal detection

**Model: BullMQ (scraping) + Claude Haiku (clustering)**

Product features:

- News Intelligence Feed dashboard panel that auto-refreshes every 30 minutes
- Headlines grouped into topic clusters with a cluster label (e.g. "Energy Crisis — 14 articles")
- Each cluster shows a 2-line AI-generated summary of what's happening
- A separate "Emerging" tag for topics spiking in coverage in the last 6 hours
- Sentiment indicator per cluster — shows whether coverage is critical, neutral, or supportive

What gets scraped and what does not:

- Scrape headlines, URLs, categories, and timestamps only from the 5 approved sources — Prothom Alo, Daily Star, BDNews24, Jugantor, Dhaka Tribune
- Do not scrape full article text — too legally risky and maintenance-heavy for MVP
- International coverage handled by Perplexity in Step 3, not by a separate scraper

Technical approach:

- BullMQ repeatable job every 30 minutes pulls headline metadata from 5 sources
- Raw headlines stored in PostgreSQL with source, timestamp, and URL
- Batch headlines sent to Claude Haiku with a clustering prompt — returns JSON with cluster name, member headlines, 2-sentence summary, and sentiment
- Redis caches cluster output with 30-minute TTL — no re-clustering until next scrape cycle
- Emerging detection is pure arithmetic — compare cluster size across the last 3 cycles, flag if growth exceeds 3x — no AI needed here

<aside>
💡

Why Haiku: clustering and summarising headlines is a simple structured output task. No reasoning depth required. Haiku handles it well at a fraction of Sonnet's cost.

</aside>

---

### Step 2 — Topic selection & framing

**Model: Claude Sonnet**

Product features:

- When a journalist clicks a cluster, a "Topic Brief" panel slides open
- The brief contains: a 3–4 sentence issue summary, 3 key questions driving the story, a stakeholder list (who is involved and what position they hold), and 2–3 contrasting viewpoints
- An "Angle selector" lets the journalist pick or write their own angle before proceeding
- The chosen angle is saved and carried through as context for all subsequent steps

Technical approach:

- Single Claude Sonnet call triggered on cluster click
- Pass cluster headlines and summary as context
- System prompt positions Claude as a senior editorial analyst producing a structured brief
- Output schema: `issue_summary`, `key_questions[]`, `stakeholders[]`, `viewpoints[]`
- Confirmed angle stored in session state and attached to the article DB record from this point forward

<aside>
💡

Why Sonnet: the angle a journalist picks here shapes the entire article. This is the highest-leverage AI call in the pipeline. Quality matters.

</aside>

---

### Step 3 — Deep research & context building

**Model: Perplexity API (retrieval) + Claude Haiku (synthesis)**

This is the most technically complex step. The split between Perplexity and Haiku is what keeps it affordable.

Product features:

- Research Workspace panel with four tabs: Sources, Timeline, Data Points, Gaps
- Each source is shown as a card with a headline, outlet, credibility tier badge, and a 2-sentence summary
- One-click bookmark to add a source to the article's reference list
- A "Historical context" section showing a timeline of how this issue has developed
- A "Gaps" section flagging what's missing from current coverage — this is a high-value editorial feature

Technical approach:

- Use Perplexity API here for real-time web search — query it with the confirmed angle as the search prompt
- Local PostgreSQL DB queried in parallel for historical headlines on the same topic cluster from past scrape cycles
- Both result sets were passed to Claude Haiku with a synthesis prompt asking for: timeline extraction, data point identification, and narrative gap detection
- Haiku returns JSON: `timeline[]` as `{date, event, source}`, `data_points[]`, `gaps[]`
- Credibility scoring is a hardcoded tier list — Tier 1 for the 5 approved sources, Tier 2 for general web results — rendered as a badge, no AI involved
- Research output stored in a `research_sessions` table linked to the article record
- Redis caches Perplexity results with 2-hour TTL - same query within 2 hours hits cache, not Perplexity again
- All AI calls routed through a single OpenRouter API key (`OPENROUTER_API_KEY`) using an OpenAI-compatible SDK

<aside>
💡

Why this split: Perplexity is paid for its search grounding, not its reasoning. Once it returns sources, handing synthesis to Haiku instead of Sonnet saves high cost per research session with no meaningful quality loss — summarisation and timeline extraction are well within Haiku's capability.

</aside>

---

### Step 4 — Drafting & story construction

**Model: Claude Sonnet**

Product features:

- Block-based Writing Panel - not WYSIWYG
- On entry, AI generates a suggested outline: intro, context, analysis, conclusion - each as a collapsed block the journalist can expand and fill
- Inline AI assist button on any paragraph - journalist highlights text, clicks assist, sees a diff view with Claude's suggestion
- Tone selector: Analytical / Critical / Explanatory - passed as a parameter to every writing prompt
- Counterpoint suggester - separate panel showing the steel-maned opposite position for the current paragraph
- Autosave every 30 seconds with full revision history in DB

Technical approach:

- Outline generation: single Sonnet call on panel load, passing confirmed angle, bookmarked sources, and tone setting - returns JSON outline with section labels and a 1-sentence direction for each section
- Inline assist: user selects paragraph → Sonnet receives selected text plus full article context → returns revised version → diff view shown to journalist
- Counterpoint: separate Sonnet prompt asking Claude to steelman the opposing position - shown as a side panel card, never auto-inserted
- All autosaves create a revision record in DB - the journalist can roll back to any version

<aside>
💡

Why Sonnet: journalist is actively writing here. This is quality-critical. Haiku's writing quality is noticeably weaker for long-form analytical content.

</aside>

---

### Step 5 — Sub-editing & optimisation

**Model: Claude Sonnet (editorial checks) + Claude Haiku (SEO metadata)**

Product features:

- A "Sub-edit" button that triggers a full article analysis
- Results returned in a structured panel with tabs: Clarity, Tone, Flow, SEO
- Each tab lists specific issues with the relevant paragraph highlighted in the editor
- Each issue shows the problem and a suggested fix - the journalist accepts or dismisses individually
- Headline analyser - paste up to 3 headline options, AI scores each on clarity, SEO strength, and brand voice fit
- SEO metadata auto-generated: meta title, meta description, suggested tags - all editable

Technical approach:

- Sub-edit: single Sonnet call with full article text and brand voice guidelines in system prompt  returns JSON with `clarity_issues[]`, `tone_issues[]`, `flow_issues[]`, each object containing `paragraph_index`, `issue_description`, `suggested_fix`
- Headline scoring: Sonnet call passing up to 3 headlines - returns score out of 10 per headline with 1-line rationale
- SEO metadata: separate Haiku call passing title and first 200 words - returns `meta_title`, `meta_description`, `tags[]`

<aside>
💡

Why the split: sub-editing and headline scoring directly affect the quality of the published article - Sonnet justified. SEO metadata is a short structured extraction task - Haiku is sufficient and cuts cost here.

</aside>

---

### Step 6 — Visual & packaging support

**Model: Claude Haiku**

Product features:

- Auto-generated feature image concept — a text description suitable for briefing a designer, no image generation in MVP
- Pull quote suggester — AI picks the 2–3 most quotable lines from the article
- Social caption generator — 3 variants: Twitter/X short, LinkedIn professional, WhatsApp forward-friendly
- All outputs are suggestions — journalist selects and edits before saving to the article record

Technical approach:

- All three features triggered by a single Generate Packaging button — runs as 3 parallel Haiku calls to keep latency low
- Image concept: pass headline and article summary, return a 2–3 sentence visual description
- Pull quotes: Haiku returns `{quote, paragraph_index}[]` — rendered as selectable cards

<aside>
💡

Why Haiku: these are all short, low-stakes structured outputs. The journalist reviews and edits everything before it goes anywhere. Haiku is more than capable here.

</aside>

---

### Step 7 — Review & publication

**Model: No AI**

Product features:

- Pre-publish checklist: headline set, meta description filled, feature image concept saved, at least one tag added
- Two publish routes: Submit for review (flags article in CMS queue for Admin) or Publish now (Editor direct publish)
- Post-publish: article record updated with status, publish timestamp, slug, and category

Technical approach:

- Pure CMS workflow - no AI involvement
- Publish API call updates article status in PostgreSQL from `draft` to `published`
- Google Analytics slug tracking fires on publish
- Approval route: `pending_review` status flag in the article table - Admin sees these in a filtered CMS queue
- Ad slots registered with Google Ad Manager on publish

Why no AI: this is a workflow and data management step. Adding AI here adds cost and latency with zero editorial benefit.

- A "Historical context" section showing a timeline of how this issue has developed
- A "Gaps" section flagging what's missing from current coverage — this is a high-value editorial feature
