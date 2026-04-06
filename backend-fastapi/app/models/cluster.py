from pydantic import BaseModel
from typing import Optional, List
from enum import Enum


class Source(str, Enum):
    PROTHOM_ALO = "PROTHOM_ALO"
    DAILY_STAR = "DAILY_STAR"
    BDNEWS24 = "BDNEWS24"
    JUGANTOR = "JUGANTOR"
    DHAKA_TRIBUNE = "DHAKA_TRIBUNE"


class ScrapedHeadline(BaseModel):
    id: str
    headline: str
    url: str
    source: Source
    scraped_at: str
    cluster_id: Optional[str] = None
    relevance_score: Optional[float] = None


class ClusterBase(BaseModel):
    topic: str
    summary: str
    is_emerging: bool = False
    category: Optional[str] = None
    signal_strength: Optional[float] = None


class ClusterResponse(ClusterBase):
    id: str
    headline_count: int
    headlines: Optional[List[ScrapedHeadline]] = None
    detected_at: str
    updated_at: str

    model_config = {"from_attributes": True}
