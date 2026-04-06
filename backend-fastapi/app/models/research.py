from pydantic import BaseModel
from typing import Optional, List


class DataPoint(BaseModel):
    label: str
    value: str
    source: str
    year: Optional[int] = None


class TimelineEvent(BaseModel):
    date: str
    event: str
    significance: str


class ResearchSource(BaseModel):
    title: str
    url: str
    publisher: str
    published_at: str
    relevance_score: float
    excerpt: str


class ResearchSession(BaseModel):
    id: str
    article_id: str
    angle: str
    summary: str
    sources: List[ResearchSource]
    timeline: List[TimelineEvent]
    data_points: List[DataPoint]
    gaps: List[str]
    generated_at: str
    created_at: str


class TopicBriefRequest(BaseModel):
    cluster_id: str


class TopicBriefResponse(BaseModel):
    cluster_id: str
    topic: str
    angle_suggestions: List[str]
    key_questions: List[str]
    background_context: str
    stakeholders: List[str]
    suggested_sources: List[str]
    urgency: str  # "Breaking", "Developing", "Feature"
    generated_at: str


class ResearchGenerateRequest(BaseModel):
    article_id: str
    angle: str


class ResearchSessionResponse(ResearchSession):
    pass
