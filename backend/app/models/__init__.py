from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime,
    ForeignKey, Enum, Float, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class UserRole(str, enum.Enum):
    user = "user"
    admin = "admin"
    moderator = "moderator"


class PostStatus(str, enum.Enum):
    draft = "draft"
    published = "published"
    scheduled = "scheduled"
    archived = "archived"


# ── Users ──────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100))
    bio = Column(Text)
    profile_image = Column(String(500))
    cover_image = Column(String(500))
    website = Column(String(255))
    twitter = Column(String(100))
    github = Column(String(100))
    linkedin = Column(String(100))
    role = Column(Enum(UserRole), default=UserRole.user, nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    is_banned = Column(Boolean, default=False)
    email_verification_token = Column(String(255))
    password_reset_token = Column(String(255))
    password_reset_expires = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    posts = relationship("Post", back_populates="author", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="user", cascade="all, delete-orphan")
    bookmarks = relationship("Bookmark", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", foreign_keys="[Notification.user_id]", back_populates="user", cascade="all, delete-orphan")
    post_likes = relationship("PostLike", back_populates="user", cascade="all, delete-orphan")
    comment_likes = relationship("CommentLike", back_populates="user", cascade="all, delete-orphan")

    followers = relationship(
        "Follow", foreign_keys="Follow.following_id", back_populates="following"
    )
    following = relationship(
        "Follow", foreign_keys="Follow.follower_id", back_populates="follower"
    )


# ── Categories ─────────────────────────────────────────────────────────────────

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    slug = Column(String(120), unique=True, nullable=False, index=True)
    description = Column(Text)
    icon = Column(String(50))
    color = Column(String(20))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    posts = relationship("Post", back_populates="category")


# ── Posts ──────────────────────────────────────────────────────────────────────

class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    slug = Column(String(550), unique=True, nullable=False, index=True)
    excerpt = Column(Text)
    content = Column(Text, nullable=False)
    thumbnail = Column(String(500))
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"))
    status = Column(Enum(PostStatus), default=PostStatus.draft, nullable=False)
    views = Column(Integer, default=0)
    read_time = Column(Integer, default=1)
    scheduled_at = Column(DateTime(timezone=True))
    published_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    author = relationship("User", back_populates="posts")
    category = relationship("Category", back_populates="posts")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")
    bookmarks = relationship("Bookmark", back_populates="post", cascade="all, delete-orphan")
    likes = relationship("PostLike", back_populates="post", cascade="all, delete-orphan")
    tags = relationship("PostTag", back_populates="post", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_posts_author_status", "author_id", "status"),
        Index("ix_posts_category_status", "category_id", "status"),
    )


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    slug = Column(String(60), unique=True, nullable=False, index=True)
    posts = relationship("PostTag", back_populates="tag")


class PostTag(Base):
    __tablename__ = "post_tags"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"))
    tag_id = Column(Integer, ForeignKey("tags.id", ondelete="CASCADE"))

    post = relationship("Post", back_populates="tags")
    tag = relationship("Tag", back_populates="posts")

    __table_args__ = (UniqueConstraint("post_id", "tag_id"),)


# ── Comments ───────────────────────────────────────────────────────────────────

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    parent_id = Column(Integer, ForeignKey("comments.id", ondelete="CASCADE"))
    content = Column(Text, nullable=False)
    is_reported = Column(Boolean, default=False)
    is_approved = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    post = relationship("Post", back_populates="comments")
    user = relationship("User", back_populates="comments")
    replies = relationship("Comment", back_populates="parent", cascade="all, delete-orphan", foreign_keys="[Comment.parent_id]")
    parent = relationship("Comment", back_populates="replies", remote_side=[id], foreign_keys="[Comment.parent_id]")
    likes = relationship("CommentLike", back_populates="comment", cascade="all, delete-orphan")

    __table_args__ = (Index("ix_comments_post_parent", "post_id", "parent_id"),)


# ── Likes ──────────────────────────────────────────────────────────────────────

class PostLike(Base):
    __tablename__ = "post_likes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="post_likes")
    post = relationship("Post", back_populates="likes")

    __table_args__ = (UniqueConstraint("user_id", "post_id"),)


class CommentLike(Base):
    __tablename__ = "comment_likes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    comment_id = Column(Integer, ForeignKey("comments.id", ondelete="CASCADE"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="comment_likes")
    comment = relationship("Comment", back_populates="likes")

    __table_args__ = (UniqueConstraint("user_id", "comment_id"),)


# ── Bookmarks ──────────────────────────────────────────────────────────────────

class Bookmark(Base):
    __tablename__ = "bookmarks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="bookmarks")
    post = relationship("Post", back_populates="bookmarks")

    __table_args__ = (UniqueConstraint("user_id", "post_id"),)


# ── Follows ────────────────────────────────────────────────────────────────────

class Follow(Base):
    __tablename__ = "follows"

    id = Column(Integer, primary_key=True, index=True)
    follower_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    following_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    follower = relationship("User", foreign_keys=[follower_id], back_populates="following")
    following = relationship("User", foreign_keys=[following_id], back_populates="followers")

    __table_args__ = (UniqueConstraint("follower_id", "following_id"),)


# ── Notifications ──────────────────────────────────────────────────────────────

class NotificationType(str, enum.Enum):
    new_comment = "new_comment"
    new_follower = "new_follower"
    post_like = "post_like"
    comment_like = "comment_like"
    comment_reply = "comment_reply"
    post_published = "post_published"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    actor_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    type = Column(Enum(NotificationType), nullable=False)
    entity_id = Column(Integer)
    entity_type = Column(String(50))
    message = Column(Text)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", foreign_keys=[user_id], back_populates="notifications")
