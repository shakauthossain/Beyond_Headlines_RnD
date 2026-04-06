from pydantic import BaseModel
from typing import Optional, List


# ── Outline ──────────────────────────────────────────────────────────────────

class OutlineSection(BaseModel):
    heading: str
    subheadings: List[str]
    suggested_word_count: int
    notes: Optional[str] = None


class OutlineRequest(BaseModel):
    article_id: str
    angle: str
    tone: str
    sources: Optional[List[str]] = []


class OutlineResponse(BaseModel):
    article_id: str
    angle: str
    tone: str
    intro_hook: str
    sections: List[OutlineSection]
    conclusion_suggestion: str
    estimated_word_count: int
    generated_at: str


# ── Inline Assist ─────────────────────────────────────────────────────────────

class InlineAssistRequest(BaseModel):
    article_id: str
    paragraph: str
    tone: Optional[str] = "ANALYTICAL"


class InlineAssistResponse(BaseModel):
    article_id: str
    original_paragraph: str
    improved_paragraph: str
    changes_made: List[str]
    tone_applied: str
    generated_at: str


# ── Counterpoint ──────────────────────────────────────────────────────────────

class CounterpointRequest(BaseModel):
    article_id: str
    paragraph: str


class CounterpointResponse(BaseModel):
    article_id: str
    original_claim: str
    counterpoint: str
    supporting_evidence: List[str]
    nuance_notes: str
    generated_at: str


# ── Sub-edit ──────────────────────────────────────────────────────────────────

class SubEditIssue(BaseModel):
    type: str   # "grammar", "clarity", "bias", "structure"
    location: str
    original: str
    suggestion: str
    severity: str  # "low", "medium", "high"


class SubEditRequest(BaseModel):
    article_id: str


class SubEditResponse(BaseModel):
    article_id: str
    issues_found: int
    issues: List[SubEditIssue]
    overall_score: float  # 0-100
    summary: str
    generated_at: str


# ── SEO Metadata ──────────────────────────────────────────────────────────────

class SEOMetadataRequest(BaseModel):
    article_id: str


class SEOMetadataResponse(BaseModel):
    article_id: str
    seo_title: str
    meta_description: str
    keywords: List[str]
    slug_suggestion: str
    open_graph_title: str
    open_graph_description: str
    readability_score: float
    seo_score: float
    generated_at: str


# ── Headline Scoring ──────────────────────────────────────────────────────────

class HeadlineScore(BaseModel):
    headline: str
    score: float  # 0-100
    clarity: float
    emotional_pull: float
    seo_potential: float
    notes: str


class HeadlineScoringRequest(BaseModel):
    headlines: List[str]


class HeadlineScoringResponse(BaseModel):
    scored_headlines: List[HeadlineScore]
    recommended: str
    generated_at: str


# ── Packaging ─────────────────────────────────────────────────────────────────

class ImageConcept(BaseModel):
    description: str
    mood: str
    color_palette: List[str]
    composition_notes: str
    suggested_alt_text: str


class PullQuote(BaseModel):
    quote: str
    attribution: Optional[str] = None
    context: str


class SocialCaption(BaseModel):
    platform: str  # "twitter", "facebook", "instagram", "linkedin"
    caption: str
    hashtags: List[str]


class PackagingRequest(BaseModel):
    article_id: str


class PackagingResponse(BaseModel):
    article_id: str
    image_concept: ImageConcept
    pull_quotes: List[PullQuote]
    social_captions: List[SocialCaption]
    generated_at: str


class ImageConceptRequest(BaseModel):
    article_id: str


class ImageConceptResponse(BaseModel):
    article_id: str
    image_concept: ImageConcept
    generated_at: str


class SocialCaptionsRequest(BaseModel):
    article_id: str


class SocialCaptionsResponse(BaseModel):
    article_id: str
    social_captions: List[SocialCaption]
    generated_at: str


class PullQuotesRequest(BaseModel):
    article_id: str


class PullQuotesResponse(BaseModel):
    article_id: str
    pull_quotes: List[PullQuote]
    generated_at: str
