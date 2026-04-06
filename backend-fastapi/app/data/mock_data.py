"""
Beyond Headlines — In-memory mock data store.
All data is realistic and Bangladesh-focused.
"""
from copy import deepcopy
from datetime import datetime, timezone

# ────────────────────────────────────────────────────────────────────────────────
# USERS
# ────────────────────────────────────────────────────────────────────────────────

USERS = [
    {
        "id": "usr_01",
        "email": "admin@beyondheadlines.bd",
        "name": "Rafiqul Islam",
        "role": "ADMIN",
        "avatar": "https://i.pravatar.cc/150?u=rafiqul",
        "bio": "Editor-in-chief at Beyond Headlines. Former senior correspondent at The Daily Star.",
        "created_at": "2024-01-15T08:00:00Z",
        "updated_at": "2024-03-10T12:00:00Z",
    },
    {
        "id": "usr_02",
        "email": "editor@beyondheadlines.bd",
        "name": "Nusrat Jahan",
        "role": "EDITOR",
        "avatar": "https://i.pravatar.cc/150?u=nusrat",
        "bio": "Senior political correspondent. Covering Bangladesh Parliament since 2019.",
        "created_at": "2024-02-01T09:30:00Z",
        "updated_at": "2024-03-15T11:45:00Z",
    },
]

# ────────────────────────────────────────────────────────────────────────────────
# CATEGORIES
# ────────────────────────────────────────────────────────────────────────────────

CATEGORIES = [
    {"id": "cat_01", "name": "Politics", "slug": "politics", "description": "National and international political coverage", "color": "#E53E3E", "article_count": 12},
    {"id": "cat_02", "name": "Economy", "slug": "economy", "description": "Macroeconomics, trade, inflation, and fiscal policy", "color": "#DD6B20", "article_count": 9},
    {"id": "cat_03", "name": "Technology", "slug": "technology", "description": "Tech innovation, startups, and digital policy in Bangladesh", "color": "#3182CE", "article_count": 7},
    {"id": "cat_04", "name": "Culture", "slug": "culture", "description": "Arts, literature, heritage, and social trends", "color": "#805AD5", "article_count": 5},
    {"id": "cat_05", "name": "Energy", "slug": "energy", "description": "Power sector, renewables, and energy security", "color": "#38A169", "article_count": 4},
]

# ────────────────────────────────────────────────────────────────────────────────
# TAGS
# ────────────────────────────────────────────────────────────────────────────────

TAGS = [
    {"id": "tag_01", "name": "Bangladesh", "slug": "bangladesh", "article_count": 20},
    {"id": "tag_02", "name": "Inflation", "slug": "inflation", "article_count": 8},
    {"id": "tag_03", "name": "Election", "slug": "election", "article_count": 11},
    {"id": "tag_04", "name": "Budget", "slug": "budget", "article_count": 6},
    {"id": "tag_05", "name": "Climate", "slug": "climate", "article_count": 4},
]

# ────────────────────────────────────────────────────────────────────────────────
# SCRAPED HEADLINES
# ────────────────────────────────────────────────────────────────────────────────

SCRAPED_HEADLINES = [
    {
        "id": "hl_01",
        "headline": "সরকার রাষ্ট্রায়ত্ত ব্যাংকগুলো পুনর্গঠনের উদ্যোগ নিচ্ছে",
        "url": "https://prothomalo.com/economy/bank-restructure-2024",
        "source": "PROTHOM_ALO",
        "scraped_at": "2024-03-20T06:15:00Z",
        "cluster_id": "cls_01",
        "relevance_score": 0.91,
    },
    {
        "id": "hl_02",
        "headline": "Bangladesh plans major overhaul of state-owned banks amid NPL crisis",
        "url": "https://thedailystar.net/business/banking/news/bd-bank-npl-overhaul-3560789",
        "source": "DAILY_STAR",
        "scraped_at": "2024-03-20T06:45:00Z",
        "cluster_id": "cls_01",
        "relevance_score": 0.89,
    },
    {
        "id": "hl_03",
        "headline": "Electricity tariff hike likely in Q2 as gas supply remains tight",
        "url": "https://bdnews24.com/economy/electricity-tariff-hike-q2-2024",
        "source": "BDNEWS24",
        "scraped_at": "2024-03-20T07:00:00Z",
        "cluster_id": "cls_02",
        "relevance_score": 0.85,
    },
    {
        "id": "hl_04",
        "headline": "আসন্ন বাজেটে কৃষি প্রণোদনা বাড়ানোর পরিকল্পনা অর্থ মন্ত্রণালয়ের",
        "url": "https://jugantor.com/national/budget-agriculture-subsidy-2024",
        "source": "JUGANTOR",
        "scraped_at": "2024-03-20T07:20:00Z",
        "cluster_id": "cls_03",
        "relevance_score": 0.80,
    },
    {
        "id": "hl_05",
        "headline": "Dhaka's EV adoption lagging as charging infrastructure remains sparse",
        "url": "https://dhakatribune.com/bangladesh/technology/ev-charging-gap-dhaka",
        "source": "DHAKA_TRIBUNE",
        "scraped_at": "2024-03-20T07:50:00Z",
        "cluster_id": None,
        "relevance_score": 0.74,
    },
]

# ────────────────────────────────────────────────────────────────────────────────
# CLUSTERS
# ────────────────────────────────────────────────────────────────────────────────

CLUSTERS = [
    {
        "id": "cls_01",
        "topic": "State-Owned Bank NPL Crisis",
        "summary": (
            "Multiple sources are reporting on Bangladesh's swelling non-performing loan "
            "crisis in state-owned banks. The government is exploring emergency restructuring "
            "options ahead of the upcoming fiscal year budget, with the IMF weighing in."
        ),
        "is_emerging": True,
        "category": "Economy",
        "signal_strength": 0.92,
        "headline_count": 2,
        "detected_at": "2024-03-20T08:00:00Z",
        "updated_at": "2024-03-20T08:30:00Z",
    },
    {
        "id": "cls_02",
        "topic": "Energy Tariff and Gas Supply Tensions",
        "summary": (
            "Bangladesh faces mounting pressure on its energy sector. Gas supply from "
            "domestic fields continues to decline, forcing the government to consider "
            "another round of electricity tariff hikes in Q2 2024."
        ),
        "is_emerging": False,
        "category": "Energy",
        "signal_strength": 0.78,
        "headline_count": 1,
        "detected_at": "2024-03-19T14:00:00Z",
        "updated_at": "2024-03-20T07:10:00Z",
    },
    {
        "id": "cls_03",
        "topic": "FY2024-25 Budget Preparation",
        "summary": (
            "With the national budget six weeks away, various ministries are lobbying for "
            "increased allocations. Agriculture, education, and infrastructure top the list "
            "of priority sectors, but fiscal space remains constrained."
        ),
        "is_emerging": False,
        "category": "Economy",
        "signal_strength": 0.71,
        "headline_count": 1,
        "detected_at": "2024-03-18T09:00:00Z",
        "updated_at": "2024-03-20T07:30:00Z",
    },
]

# ────────────────────────────────────────────────────────────────────────────────
# ARTICLES
# ────────────────────────────────────────────────────────────────────────────────

ARTICLES = [
    {
        "id": "art_01",
        "title": "Bangladesh's Banking Sector on the Brink: The NPL Time Bomb",
        "slug": "bangladesh-banking-sector-npl-time-bomb",
        "body": (
            "Bangladesh's state-owned banks are sitting on a mountain of bad debt. "
            "As of December 2023, non-performing loans across the banking sector reached "
            "Tk 1.45 lakh crore — nearly 9% of total outstanding loans. Three state-owned "
            "banks — Sonali, Janata, and Agrani — account for nearly 40% of that figure.\n\n"
            "The Bangladesh Bank's latest stress test paints a grim picture. Under a moderate "
            "shock scenario, two of the six state-owned banks would require immediate capital "
            "infusions. Finance Ministry officials, speaking on condition of anonymity, "
            "confirmed that a restructuring roadmap is being prepared ahead of the FY2025 budget.\n\n"
            "The IMF, which is currently overseeing Bangladesh's $4.7 billion credit facility, "
            "has flagged the NPL situation as the primary structural risk to the macro-stability "
            "programme. The Fund's latest Article IV consultation — due to be published next "
            "month — is expected to call for an independent asset quality review."
        ),
        "excerpt": (
            "Bangladesh's state-owned banks are carrying Tk 1.45 lakh crore in non-performing "
            "loans. With an IMF programme underway and a budget six weeks away, the government "
            "faces its most complex banking crisis in a decade."
        ),
        "category_id": "cat_02",
        "tag_ids": ["tag_01", "tag_02"],
        "author_id": "usr_02",
        "status": "PUBLISHED",
        "cover_image": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200",
        "tone": "ANALYTICAL",
        "seo_title": "Bangladesh Banking Crisis 2024: NPL Debt Hits Tk 1.45 Lakh Crore",
        "seo_description": (
            "An in-depth analysis of Bangladesh's non-performing loan crisis in state-owned "
            "banks and what the government's restructuring plan means for the economy."
        ),
        "seo_keywords": ["Bangladesh banking", "NPL crisis", "state-owned banks", "IMF Bangladesh", "bad loans"],
        "word_count": 720,
        "read_time_minutes": 4,
        "created_at": "2024-03-18T10:00:00Z",
        "updated_at": "2024-03-20T09:30:00Z",
        "published_at": "2024-03-20T10:00:00Z",
        "view_count": 3847,
        "revision_count": 3,
    },
    {
        "id": "art_02",
        "title": "Climate Change and Bangladesh's Coastal Erasure",
        "slug": "climate-change-bangladesh-coastal-erosion-draft",
        "body": (
            "Along the chars of Bhola, an island district in southern Bangladesh, the land "
            "is disappearing at a rate of nearly two kilometres a year. Families who have "
            "farmed the same plots for generations now watch from bamboo houses as the "
            "Meghna River claims their history.\n\n"
            "Bangladesh loses an estimated 1,000 square kilometres of land to river erosion "
            "and sea-level rise each year — the equivalent of a Dhaka district every twelve "
            "months. Yet the scale of internal climate displacement has never been systematically "
            "counted. Draft figures from the Ministry of Disaster Management suggest 3.5 million "
            "people are 'climate mobile' in coastal districts."
        ),
        "excerpt": (
            "Bangladesh's coastline is retreating. With 3.5 million people already displaced "
            "internally and sea levels rising, the country faces an imminent reckoning with "
            "the human cost of climate change."
        ),
        "category_id": "cat_05",
        "tag_ids": ["tag_01", "tag_05"],
        "author_id": "usr_02",
        "status": "DRAFT",
        "cover_image": "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200",
        "tone": "EXPLANATORY",
        "seo_title": None,
        "seo_description": None,
        "seo_keywords": [],
        "word_count": 380,
        "read_time_minutes": 2,
        "created_at": "2024-03-21T14:00:00Z",
        "updated_at": "2024-03-21T16:45:00Z",
        "published_at": None,
        "view_count": 0,
        "revision_count": 1,
    },
]

# ────────────────────────────────────────────────────────────────────────────────
# REVISIONS
# ────────────────────────────────────────────────────────────────────────────────

REVISIONS = [
    {
        "id": "rev_01",
        "article_id": "art_01",
        "body_snapshot": "Early draft of the banking crisis article. Intro needed work.",
        "title_snapshot": "NPL Crisis in Bangladesh Banks",
        "saved_by": "usr_02",
        "saved_at": "2024-03-18T10:30:00Z",
        "revision_type": "autosave",
    },
    {
        "id": "rev_02",
        "article_id": "art_01",
        "body_snapshot": "Second draft — added IMF angle and quotes.",
        "title_snapshot": "Bangladesh's Banking Sector on the Brink",
        "saved_by": "usr_02",
        "saved_at": "2024-03-19T15:00:00Z",
        "revision_type": "manual",
    },
    {
        "id": "rev_03",
        "article_id": "art_01",
        "body_snapshot": "Final pre-publish version. Editor-approved.",
        "title_snapshot": "Bangladesh's Banking Sector on the Brink: The NPL Time Bomb",
        "saved_by": "usr_01",
        "saved_at": "2024-03-20T09:00:00Z",
        "revision_type": "manual",
    },
    {
        "id": "rev_04",
        "article_id": "art_02",
        "body_snapshot": "Initial notes and first two paragraphs on coastal erosion.",
        "title_snapshot": "Climate Change and Bangladesh's Coastal Erasure",
        "saved_by": "usr_02",
        "saved_at": "2024-03-21T14:30:00Z",
        "revision_type": "autosave",
    },
]

# ────────────────────────────────────────────────────────────────────────────────
# RESEARCH SESSIONS
# ────────────────────────────────────────────────────────────────────────────────

RESEARCH_SESSIONS = [
    {
        "id": "res_01",
        "article_id": "art_01",
        "angle": "The IMF conditionality angle — how the loan programme is reshaping Bangladesh's banking reform agenda",
        "summary": (
            "Research synthesises 14 primary sources across IMF programme documents, Bangladesh Bank "
            "circulars, and expert commentary. Key finding: the government has agreed in principle to "
            "an independent asset quality review as a structural benchmark under the IMF programme, "
            "with a Q3 2024 deadline. NPL figures are likely understated by 15-20% due to "
            "evergreening practices in state-owned banks."
        ),
        "sources": [
            {
                "title": "Bangladesh: Fourth Review Under the Extended Credit Facility",
                "url": "https://www.imf.org/en/Publications/CR/Issues/2024/02/bangladesh-ecf",
                "publisher": "International Monetary Fund",
                "published_at": "2024-02-15T00:00:00Z",
                "relevance_score": 0.97,
                "excerpt": (
                    "The authorities have committed to an independent asset quality review of the "
                    "six state-owned commercial banks as a structural benchmark for end-September 2024."
                ),
            },
            {
                "title": "Stress Testing Bangladesh's Banking Sector 2023",
                "url": "https://www.bb.org.bd/pub/annual/stresstesting_2023.pdf",
                "publisher": "Bangladesh Bank",
                "published_at": "2024-01-30T00:00:00Z",
                "relevance_score": 0.94,
                "excerpt": (
                    "Under a moderate shock scenario, capital adequacy ratios of two state-owned "
                    "commercial banks fall below the regulatory minimum, requiring Tk 4,200 crore "
                    "in immediate capital support."
                ),
            },
            {
                "title": "Non-Performing Loans in South Asian Banks: A Comparative Perspective",
                "url": "https://www.adb.org/publications/npl-south-asia-2024",
                "publisher": "Asian Development Bank",
                "published_at": "2024-01-10T00:00:00Z",
                "relevance_score": 0.82,
                "excerpt": (
                    "Bangladesh's NPL ratio of 8.8% is the highest among major South Asian economies, "
                    "surpassing Sri Lanka (6.2%) and Pakistan (7.4%), though official figures are "
                    "suspected to undercount restructured evergreened loans."
                ),
            },
        ],
        "timeline": [
            {"date": "2022-07-01", "event": "Bangladesh signs $4.7bn IMF Extended Credit Facility", "significance": "Triggered conditionality-based banking reform timeline"},
            {"date": "2023-06-01", "event": "NPL ratio breaches 8% threshold for first time since 2008", "significance": "Bangladesh Bank issues alert; Finance Ministry forms inter-ministerial task force"},
            {"date": "2024-01-15", "event": "IMF Fourth Review flags banking sector as primary macro risk", "significance": "Asset quality review now a structural benchmark"},
            {"date": "2024-03-20", "event": "Finance Ministry confirms restructuring roadmap in preparation", "significance": "Government acknowledges crisis publicly for first time"},
        ],
        "data_points": [
            {"label": "Total NPLs (Dec 2023)", "value": "Tk 1.45 lakh crore", "source": "Bangladesh Bank", "year": 2023},
            {"label": "NPL ratio (banking sector)", "value": "8.8%", "source": "Bangladesh Bank", "year": 2023},
            {"label": "Share of NPLs in state-owned banks", "value": "~40%", "source": "Bangladesh Bank", "year": 2023},
            {"label": "IMF credit facility", "value": "$4.7 billion", "source": "IMF", "year": 2022},
            {"label": "Capital shortfall (stress test)", "value": "Tk 4,200 crore", "source": "Bangladesh Bank stress test", "year": 2023},
        ],
        "gaps": [
            "Exact breakdown of NPLs by individual state-owned bank not publicly available",
            "No confirmed timeline for the independent asset quality review mandate",
            "Political economy of reform resistance within state-owned banks not documented",
            "Comparison with 2008 banking crisis resolution mechanism needed",
        ],
        "generated_at": "2024-03-20T08:45:00Z",
        "created_at": "2024-03-20T08:45:00Z",
    }
]

# ────────────────────────────────────────────────────────────────────────────────
# MOCK AI OUTPUTS
# ────────────────────────────────────────────────────────────────────────────────

MOCK_TOPIC_BRIEF = {
    "cluster_id": "cls_01",
    "topic": "State-Owned Bank NPL Crisis",
    "angle_suggestions": [
        "The IMF conditionality angle — how the $4.7bn loan programme is forcing Bangladesh's hand on banking reform",
        "Human cost angle — how bad loans to politically connected businesses crowd out credit for SMEs and farmers",
        "Historical angle — comparing the 2024 crisis to Bangladesh's last major banking crisis in 2008",
        "Accountability angle — which borrowers own the largest chunks of NPLs and why enforcement has failed",
    ],
    "key_questions": [
        "What is the government's exact restructuring plan, and does it have teeth?",
        "How much of the NPL figure is 'evergreened' — i.e., hidden through loan rollovers?",
        "What are the IMF's specific conditionalities and deadlines?",
        "What happens to depositors if a state-owned bank becomes insolvent?",
        "Has any major loan defaulter been criminally prosecuted in the last five years?",
    ],
    "background_context": (
        "Bangladesh's banking sector has long been divided between a dynamic private banking market "
        "and chronically underperforming state-owned commercial banks (SOCBs). The SOCBs — Sonali, "
        "Janata, Agrani, Rupali, BASIC, and BKB — collectively control about 28% of sector assets "
        "but generate 40% of all NPLs. Political interference in lending decisions has been "
        "documented by the Bangladesh Bank itself in confidential supervision reports."
    ),
    "stakeholders": [
        "Bangladesh Bank (central bank)",
        "Ministry of Finance",
        "IMF Resident Representative Office, Dhaka",
        "Association of Bankers Bangladesh",
        "Small business borrowers & depositors",
        "Independent economists (CPD, BIDS)",
    ],
    "suggested_sources": [
        "IMF Bangladesh programme documents (imf.org)",
        "Bangladesh Bank annual reports and stress tests",
        "Finance Ministry spokesperson",
        "Dr. Ahsan H. Mansur (Policy Research Institute) — leading banking reform expert",
        "Centre for Policy Dialogue (CPD) economic research",
    ],
    "urgency": "Developing",
}

MOCK_OUTLINE = {
    "angle": "The IMF conditionality angle — how the loan programme is reshaping Bangladesh's banking reform agenda",
    "tone": "ANALYTICAL",
    "intro_hook": (
        "Buried in paragraph 47 of the IMF's latest review document is a sentence that Dhaka's "
        "banking establishment has been dreading: an independent asset quality review of all six "
        "state-owned commercial banks is now a binding structural benchmark. Bangladesh has until "
        "September 2024 to comply — or risk the next tranche of its $4.7bn credit facility."
    ),
    "sections": [
        {
            "heading": "The Numbers Behind the Crisis",
            "subheadings": [
                "Tk 1.45 lakh crore: breaking down the NPL figure",
                "Why official statistics likely undercount the real problem",
                "State-owned vs private bank comparison",
            ],
            "suggested_word_count": 300,
            "notes": "Use Bangladesh Bank data; cite ADB comparative figures for context",
        },
        {
            "heading": "The IMF's Leverage",
            "subheadings": [
                "What the structural benchmark actually requires",
                "Timeline: September 2024 deadline and what happens if it's missed",
                "Previous conditionalities and whether they were met",
            ],
            "suggested_word_count": 350,
            "notes": "Source from IMF Fourth Review document; quote Resident Representative if available",
        },
        {
            "heading": "Inside the Restructuring Plan",
            "subheadings": [
                "What Finance Ministry officials have confirmed",
                "Independent asset quality review: who will conduct it?",
                "Capital injection vs governance reform debate",
            ],
            "suggested_word_count": 300,
            "notes": "Anonymised Finance Ministry source confirmed; seek on-record comment",
        },
        {
            "heading": "Who Pays?",
            "subheadings": [
                "Taxpayer exposure to state-owned bank bailouts",
                "Impact on SME credit access",
                "What depositors need to know",
            ],
            "suggested_word_count": 250,
            "notes": "This section grounds the story in public interest — essential for readability",
        },
    ],
    "conclusion_suggestion": (
        "End with the central tension: Bangladesh's government has signed up to reform in principle, "
        "but the political economy of state-owned bank reform — patronage networks, powerful defaulters, "
        "institutional inertia — has defeated every previous effort. The IMF conditionality provides "
        "external pressure, but whether it translates into structural change depends on political will "
        "that has historically been absent."
    ),
    "estimated_word_count": 1200,
}

MOCK_SUB_EDIT_ISSUES = [
    {
        "type": "clarity",
        "location": "Paragraph 1, sentence 3",
        "original": "The Bangladesh Bank's latest stress test paints a grim picture.",
        "suggestion": "The Bangladesh Bank's latest stress test reveals that two state-owned banks would require immediate capital injections even under a moderate economic shock.",
        "severity": "medium",
    },
    {
        "type": "bias",
        "location": "Paragraph 2",
        "original": "Finance Ministry officials, speaking on condition of anonymity, confirmed...",
        "suggestion": "Consider seeking an on-record comment or attributing more specifically to balance the anonymity with accountability.",
        "severity": "low",
    },
    {
        "type": "structure",
        "location": "Overall",
        "original": "The IMF reference appears late in the article (paragraph 3).",
        "suggestion": "Move the IMF programme framing earlier — this is the central hook of the story and should appear in the second paragraph at latest.",
        "severity": "high",
    },
    {
        "type": "grammar",
        "location": "Paragraph 3, sentence 2",
        "original": "The Fund's latest Article IV consultation — due to be published next month — is expected to call for an independent asset quality review.",
        "suggestion": "Clarify: it is the Fourth Programme Review, not an Article IV consultation. These are different IMF instruments.",
        "severity": "high",
    },
]

MOCK_SEO_METADATA = {
    "seo_title": "Bangladesh Banking Crisis 2024: NPL Debt Surges to Tk 1.45 Lakh Crore",
    "meta_description": (
        "An in-depth investigation into Bangladesh's non-performing loan crisis in state-owned banks, "
        "the IMF's reform conditionalities, and what the government's restructuring plan means for "
        "depositors and the broader economy."
    ),
    "keywords": [
        "Bangladesh banking crisis 2024",
        "non-performing loans Bangladesh",
        "state-owned banks Bangladesh",
        "IMF Bangladesh programme",
        "Bangladesh bank restructuring",
        "NPL crisis South Asia",
        "Sonali Bank Janata Bank",
    ],
    "slug_suggestion": "bangladesh-banking-npl-crisis-imf-2024",
    "open_graph_title": "Bangladesh's Banking Time Bomb: Tk 1.45 Lakh Crore in Bad Loans",
    "open_graph_description": (
        "Beyond Headlines investigates how Bangladesh's state-owned banks accumulated a mountain of "
        "bad debt — and why the IMF is now forcing the government to act."
    ),
    "readability_score": 72.4,
    "seo_score": 81.0,
}

MOCK_HEADLINE_SCORES = [
    {
        "headline": "Bangladesh's Banking Sector on the Brink: The NPL Time Bomb",
        "score": 84.5,
        "clarity": 88.0,
        "emotional_pull": 82.0,
        "seo_potential": 83.5,
        "notes": "Strong metaphor ('time bomb') creates urgency. 'NPL' is jargon — consider spelling out for general audience.",
    },
    {
        "headline": "The Bad Loan Crisis Threatening Bangladesh's Economy",
        "score": 76.2,
        "clarity": 90.0,
        "emotional_pull": 68.0,
        "seo_potential": 70.0,
        "notes": "More accessible but lacks specificity. 'Bad loan' is clearer than 'NPL' but headline is generic.",
    },
    {
        "headline": "Tk 1.45 Lakh Crore in Bad Debt: Inside Bangladesh's State Bank Meltdown",
        "score": 88.1,
        "clarity": 85.0,
        "emotional_pull": 87.0,
        "seo_potential": 92.0,
        "notes": "Best performer. Specific figure creates authority; 'meltdown' is strong but journalistically defensible given data.",
    },
]

MOCK_PACKAGING = {
    "image_concept": {
        "description": (
            "A wide-angle shot of the imposing colonial-era facade of Sonali Bank's headquarters "
            "on Motijheel Avenue, Dhaka, photographed at dusk. The bank building is slightly "
            "underexposed against a smouldering orange-red sky. In the foreground, blurred "
            "pedestrians pass — conveying institutional permanence against human flow."
        ),
        "mood": "Ominous, weighty, institutional",
        "color_palette": ["#1A1A2E", "#E94560", "#F5A623", "#0F3460"],
        "composition_notes": (
            "Rule of thirds — bank facade occupies left two-thirds. Sky dominates upper right. "
            "Consider a slow shutter speed to blur street traffic for dynamism."
        ),
        "suggested_alt_text": "Sonali Bank headquarters on Motijheel Avenue, Dhaka, photographed at dusk with a dramatic red sky.",
    },
    "pull_quotes": [
        {
            "quote": "Under a moderate shock scenario, two of the six state-owned banks would require immediate capital infusions.",
            "attribution": "Bangladesh Bank Stress Test 2023",
            "context": "Quantifying the systemic risk the NPL crisis poses to state-owned banks",
        },
        {
            "quote": "The IMF conditionality provides external pressure, but whether it translates into structural change depends on political will that has historically been absent.",
            "attribution": None,
            "context": "Closing analytical observation on the gap between reform commitment and delivery",
        },
    ],
    "social_captions": [
        {
            "platform": "twitter",
            "caption": (
                "Bangladesh's state-owned banks are sitting on Tk 1.45 lakh crore of bad loans — "
                "and the IMF is now forcing the government to act. Thread on the crisis 🧵"
            ),
            "hashtags": ["#Bangladesh", "#Banking", "#IMF", "#NPL", "#Economy"],
        },
        {
            "platform": "facebook",
            "caption": (
                "Our latest investigation: How Bangladesh's state-owned banks accumulated a mountain of bad debt, "
                "and why the government's restructuring plan may already be too late. "
                "Read the full story at the link below."
            ),
            "hashtags": ["#BeyondHeadlines", "#Bangladesh", "#BankingCrisis"],
        },
        {
            "platform": "instagram",
            "caption": (
                "Tk 1,450,000,000,000 in bad loans. That's what Bangladesh's state banks are sitting on. "
                "The IMF has given the government until September to clean it up — or face consequences. "
                "Link in bio for the full story."
            ),
            "hashtags": ["#Bangladesh", "#Economy", "#IMF", "#BeyondHeadlines", "#Journalism", "#SouthAsia"],
        },
        {
            "platform": "linkedin",
            "caption": (
                "Beyond Headlines investigates Bangladesh's deepening banking crisis. "
                "With Tk 1.45 lakh crore in non-performing loans and an IMF structural benchmark looming, "
                "the government faces its most complex banking reform challenge in two decades. "
                "Our analysis explores the numbers, the politics, and what it means for the economy."
            ),
            "hashtags": ["#Bangladesh", "#Finance", "#Banking", "#IMF", "#EmergingMarkets"],
        },
    ],
}

MOCK_INLINE_ASSIST = {
    "original_paragraph": (
        "The Bangladesh Bank's latest stress test paints a grim picture. "
        "Under a moderate shock scenario, two of the six state-owned banks would require "
        "immediate capital infusions."
    ),
    "improved_paragraph": (
        "Bangladesh Bank's latest stress-test results are unambiguous: under a moderate "
        "economic shock — a scenario that includes a 2-percentage-point rise in NPL ratios "
        "and a 15% decline in collateral valuations — two of the country's six state-owned "
        "commercial banks would face regulatory insolvency, requiring immediate capital "
        "injections totalling Tk 4,200 crore."
    ),
    "changes_made": [
        "Added specific stress-test parameters (NPL rise, collateral decline) for technical precision",
        "Replaced vague 'grim picture' with concrete regulatory consequence ('regulatory insolvency')",
        "Added the Tk 4,200 crore capital shortfall figure from research data",
        "Tightened sentence structure from two sentences to one compound sentence",
    ],
    "tone_applied": "ANALYTICAL",
}

MOCK_COUNTERPOINT = {
    "original_claim": (
        "Political interference in lending decisions has been documented by the Bangladesh Bank "
        "itself in confidential supervision reports."
    ),
    "counterpoint": (
        "Government officials and some banking economists argue that the NPL crisis in state-owned "
        "banks cannot be attributed solely — or even primarily — to political interference. "
        "They point to structural problems in credit appraisal methodology, inadequate collateral "
        "valuation practices, and global commodity shocks in 2022–23 that impaired the repayment "
        "capacity of otherwise sound borrowers. The Banking Companies Act, they note, already "
        "provides independent boards — the problem is enforcement, not political design."
    ),
    "supporting_evidence": [
        "Bangladesh Bank's Pillar 2 supervisory guidelines (2022) require independent credit committees",
        "Post-COVID global commodity shocks (2022) increased NPLs across the region, including in private banks",
        "Private banks' NPL ratio also rose from 3.9% to 5.4% between 2021 and 2023, suggesting systemic, not purely political, drivers",
    ],
    "nuance_notes": (
        "The claim is defensible and well-sourced, but the counterpoint strengthens the article "
        "by acknowledging that the crisis has multiple, overlapping causes. Consider a paragraph "
        "presenting both the political interference evidence and the structural factors, then "
        "explaining why the former makes the latter harder to resolve."
    ),
}

# ────────────────────────────────────────────────────────────────────────────────
# MEDIA
# ────────────────────────────────────────────────────────────────────────────────

MEDIA = [
    {
        "id": "med_01",
        "filename": "sonali-bank-headquarters.jpg",
        "url": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200",
        "mime_type": "image/jpeg",
        "size_bytes": 284500,
        "alt_text": "Sonali Bank headquarters, Motijheel, Dhaka",
        "uploaded_by": "usr_02",
        "uploaded_at": "2024-03-19T12:00:00Z",
        "article_id": "art_01",
    },
    {
        "id": "med_02",
        "filename": "coastal-erosion-bhola.jpg",
        "url": "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200",
        "mime_type": "image/jpeg",
        "size_bytes": 312000,
        "alt_text": "Coastal erosion on Bhola island, Bangladesh",
        "uploaded_by": "usr_02",
        "uploaded_at": "2024-03-21T15:30:00Z",
        "article_id": "art_02",
    },
]

# ────────────────────────────────────────────────────────────────────────────────
# ANALYTICS
# ────────────────────────────────────────────────────────────────────────────────

ANALYTICS_OVERVIEW = {
    "total_articles": 2,
    "published_articles": 1,
    "draft_articles": 1,
    "total_views": 3847,
    "total_authors": 2,
    "avg_read_time_minutes": 4.5,
    "top_category": "Economy",
    "articles_this_week": 2,
    "period": "2024-03-14 to 2024-03-21",
}

ANALYTICS_TOP_ARTICLES = [
    {
        "article_id": "art_01",
        "title": "Bangladesh's Banking Sector on the Brink: The NPL Time Bomb",
        "slug": "bangladesh-banking-sector-npl-time-bomb",
        "views": 3847,
        "avg_read_time_seconds": 215,
        "share_count": 412,
        "category": "Economy",
    },
]

ANALYTICS_TRAFFIC = [
    {"date": "2024-03-15", "views": 120, "unique_visitors": 98},
    {"date": "2024-03-16", "views": 215, "unique_visitors": 178},
    {"date": "2024-03-17", "views": 189, "unique_visitors": 155},
    {"date": "2024-03-18", "views": 340, "unique_visitors": 270},
    {"date": "2024-03-19", "views": 802, "unique_visitors": 644},
    {"date": "2024-03-20", "views": 1640, "unique_visitors": 1312},
    {"date": "2024-03-21", "views": 541, "unique_visitors": 430},
]

# ────────────────────────────────────────────────────────────────────────────────
# SCRAPE JOBS
# ────────────────────────────────────────────────────────────────────────────────

SCRAPE_JOBS = [
    {
        "job_id": "job_01",
        "status": "completed",
        "sources_scraped": ["PROTHOM_ALO", "DAILY_STAR", "BDNEWS24", "JUGANTOR", "DHAKA_TRIBUNE"],
        "headlines_found": 5,
        "clusters_updated": 2,
        "new_clusters": 1,
        "started_at": "2024-03-20T06:00:00Z",
        "completed_at": "2024-03-20T06:08:23Z",
        "error": None,
    },
]

LAST_SCRAPE_RUN = {
    "job_id": "job_01",
    "ran_at": "2024-03-20T06:00:00Z",
    "duration_seconds": 503,
    "headlines_found": 5,
    "clusters_detected": 3,
    "status": "completed",
}

# ────────────────────────────────────────────────────────────────────────────────
# PUBLISH QUEUE
# ────────────────────────────────────────────────────────────────────────────────

PUBLISH_QUEUE: list[dict] = []


# ────────────────────────────────────────────────────────────────────────────────
# Utility helpers (operate on the in-memory stores above)
# ────────────────────────────────────────────────────────────────────────────────

def get_user_by_id(user_id: str) -> dict | None:
    return next((u for u in USERS if u["id"] == user_id), None)


def get_user_by_email(email: str) -> dict | None:
    return next((u for u in USERS if u["email"] == email), None)


def get_article_by_id(article_id: str) -> dict | None:
    return next((a for a in ARTICLES if a["id"] == article_id), None)


def get_article_by_slug(slug: str) -> dict | None:
    return next((a for a in ARTICLES if a["slug"] == slug), None)


def get_cluster_by_id(cluster_id: str) -> dict | None:
    return next((c for c in CLUSTERS if c["id"] == cluster_id), None)


def get_research_by_article_id(article_id: str) -> list[dict]:
    return [r for r in RESEARCH_SESSIONS if r["article_id"] == article_id]


def get_research_by_session_id(session_id: str) -> dict | None:
    return next((r for r in RESEARCH_SESSIONS if r["id"] == session_id), None)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
