from pydantic import BaseModel
from typing import Optional, List
from enum import Enum


class ArticleStatus(str, Enum):
    DRAFT = "DRAFT"
    PENDING_REVIEW = "PENDING_REVIEW"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"


class Tone(str, Enum):
    ANALYTICAL = "ANALYTICAL"
    CRITICAL = "CRITICAL"
    EXPLANATORY = "EXPLANATORY"


class ArticleBase(BaseModel):
    title: str
    slug: Optional[str] = None
    body: Optional[str] = None
    excerpt: Optional[str] = None
    category_id: Optional[str] = None
    tag_ids: Optional[List[str]] = []
    author_id: Optional[str] = None
    status: ArticleStatus = ArticleStatus.DRAFT
    cover_image: Optional[str] = None
    tone: Optional[Tone] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    seo_keywords: Optional[List[str]] = []
    word_count: Optional[int] = None
    read_time_minutes: Optional[int] = None


class ArticleCreate(ArticleBase):
    pass


class ArticleUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    body: Optional[str] = None
    excerpt: Optional[str] = None
    category_id: Optional[str] = None
    tag_ids: Optional[List[str]] = None
    status: Optional[ArticleStatus] = None
    cover_image: Optional[str] = None
    tone: Optional[Tone] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    seo_keywords: Optional[List[str]] = None
    word_count: Optional[int] = None
    read_time_minutes: Optional[int] = None


class ArticleResponse(ArticleBase):
    id: str
    created_at: str
    updated_at: str
    published_at: Optional[str] = None
    view_count: Optional[int] = 0
    revision_count: Optional[int] = 0

    model_config = {"from_attributes": True}


class RevisionResponse(BaseModel):
    id: str
    article_id: str
    body_snapshot: str
    title_snapshot: str
    saved_by: str
    saved_at: str
    revision_type: str  # "autosave" | "manual"


class AutosaveRequest(BaseModel):
    body: str
    title: str


class CategoryBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    color: Optional[str] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryResponse(CategoryBase):
    id: str
    article_count: Optional[int] = 0


class TagBase(BaseModel):
    name: str
    slug: str


class TagCreate(TagBase):
    pass


class TagResponse(TagBase):
    id: str
    article_count: Optional[int] = 0
