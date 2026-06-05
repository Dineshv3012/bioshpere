from pydantic import BaseModel, EmailStr, field_validator, model_validator
from typing import Optional, List
from datetime import datetime
from app.models import UserRole, PostStatus


# ── Auth ───────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None

    @field_validator("username")
    @classmethod
    def username_valid(cls, v):
        if len(v) < 3 or len(v) > 50:
            raise ValueError("Username must be 3-50 characters")
        if not v.replace("_", "").replace("-", "").isalnum():
            raise ValueError("Username must be alphanumeric (underscores and hyphens allowed)")
        return v.lower()

    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


# ── Users ──────────────────────────────────────────────────────────────────────

class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    bio: Optional[str] = None
    profile_image: Optional[str] = None
    cover_image: Optional[str] = None
    website: Optional[str] = None
    twitter: Optional[str] = None
    github: Optional[str] = None
    linkedin: Optional[str] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    website: Optional[str] = None
    twitter: Optional[str] = None
    github: Optional[str] = None
    linkedin: Optional[str] = None


class UserPublic(BaseModel):
    id: int
    username: str
    full_name: Optional[str] = None
    bio: Optional[str] = None
    profile_image: Optional[str] = None
    cover_image: Optional[str] = None
    website: Optional[str] = None
    twitter: Optional[str] = None
    github: Optional[str] = None
    linkedin: Optional[str] = None
    role: UserRole
    is_verified: bool
    created_at: datetime
    followers_count: int = 0
    following_count: int = 0
    posts_count: int = 0
    is_following: Optional[bool] = None

    class Config:
        from_attributes = True


class UserProfile(UserPublic):
    pass


# ── Categories ─────────────────────────────────────────────────────────────────

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None


class CategoryResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    posts_count: int = 0

    class Config:
        from_attributes = True


# ── Tags ───────────────────────────────────────────────────────────────────────

class TagResponse(BaseModel):
    id: int
    name: str
    slug: str

    class Config:
        from_attributes = True


# ── Posts ──────────────────────────────────────────────────────────────────────

class PostCreate(BaseModel):
    title: str
    content: str
    excerpt: Optional[str] = None
    thumbnail: Optional[str] = None
    category_id: Optional[int] = None
    status: PostStatus = PostStatus.draft
    tags: Optional[List[str]] = []
    scheduled_at: Optional[datetime] = None


class PostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    excerpt: Optional[str] = None
    thumbnail: Optional[str] = None
    category_id: Optional[int] = None
    status: Optional[PostStatus] = None
    tags: Optional[List[str]] = None
    scheduled_at: Optional[datetime] = None


class PostSummary(BaseModel):
    id: int
    title: str
    slug: str
    excerpt: Optional[str] = None
    thumbnail: Optional[str] = None
    status: PostStatus
    views: int
    read_time: int
    published_at: Optional[datetime] = None
    created_at: datetime
    author: UserPublic
    category: Optional[CategoryResponse] = None
    tags: List[TagResponse] = []
    likes_count: int = 0
    comments_count: int = 0
    is_liked: Optional[bool] = None
    is_bookmarked: Optional[bool] = None

    class Config:
        from_attributes = True


class PostDetail(PostSummary):
    content: str
    updated_at: Optional[datetime] = None


# ── Comments ───────────────────────────────────────────────────────────────────

class CommentCreate(BaseModel):
    post_id: int
    content: str
    parent_id: Optional[int] = None

    @field_validator("content")
    @classmethod
    def content_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Comment cannot be empty")
        if len(v) > 2000:
            raise ValueError("Comment too long (max 2000 characters)")
        return v


class CommentUpdate(BaseModel):
    content: str


class CommentResponse(BaseModel):
    id: int
    post_id: int
    parent_id: Optional[int] = None
    content: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    user: UserPublic
    replies: List["CommentResponse"] = []
    likes_count: int = 0
    is_liked: Optional[bool] = None
    is_reported: bool = False

    class Config:
        from_attributes = True


CommentResponse.model_rebuild()


# ── Bookmarks ──────────────────────────────────────────────────────────────────

class BookmarkResponse(BaseModel):
    id: int
    post: PostSummary
    created_at: datetime

    class Config:
        from_attributes = True


# ── Notifications ──────────────────────────────────────────────────────────────

class NotificationResponse(BaseModel):
    id: int
    type: str
    message: Optional[str] = None
    entity_id: Optional[int] = None
    entity_type: Optional[str] = None
    is_read: bool
    created_at: datetime
    actor: Optional[UserPublic] = None

    class Config:
        from_attributes = True


# ── Pagination ─────────────────────────────────────────────────────────────────

class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    per_page: int
    pages: int


# ── AI ─────────────────────────────────────────────────────────────────────────

class AIRequest(BaseModel):
    content: str
    context: Optional[str] = None


class AITitleRequest(BaseModel):
    topic: str
    keywords: Optional[List[str]] = []


class AIResponse(BaseModel):
    result: str | List[str]
