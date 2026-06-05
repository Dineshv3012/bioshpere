from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload
from typing import Optional
import math

from app.database import get_db
from app.models import (
    User, Post, Follow, Bookmark, Notification, NotificationType,
    Category, PostStatus, Tag, PostTag
)
from app.schemas import UserUpdate, CategoryCreate
from app.utils.auth import get_current_user, get_optional_user, require_admin
from app.utils.cloudinary import upload_image

# ── Users ──────────────────────────────────────────────────────────────────────
users_router = APIRouter(prefix="/users", tags=["Users"])


@users_router.get("")
async def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(User).where(User.is_active == True, User.is_banned == False)
    if search:
        query = query.where(
            User.username.ilike(f"%{search}%") | User.full_name.ilike(f"%{search}%")
        )
    total_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_result.scalar()
    result = await db.execute(query.order_by(User.created_at.desc()).offset((page - 1) * per_page).limit(per_page))
    users = result.scalars().all()
    return {"items": [_serialize_user(u) for u in users], "total": total, "page": page, "per_page": per_page, "pages": math.ceil(total / per_page)}


def _serialize_user(u: User, current_user=None, followers_count=0, following_count=0, posts_count=0):
    return {
        "id": u.id,
        "username": u.username,
        "full_name": u.full_name,
        "bio": u.bio,
        "profile_image": u.profile_image,
        "cover_image": u.cover_image,
        "website": u.website,
        "twitter": u.twitter,
        "github": u.github,
        "linkedin": u.linkedin,
        "role": u.role,
        "is_verified": u.is_verified,
        "created_at": u.created_at,
        "followers_count": followers_count,
        "following_count": following_count,
        "posts_count": posts_count,
    }


@users_router.get("/{username}")
async def get_user_profile(
    username: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")

    followers = await db.execute(select(func.count(Follow.id)).where(Follow.following_id == user.id))
    following = await db.execute(select(func.count(Follow.id)).where(Follow.follower_id == user.id))
    posts = await db.execute(select(func.count(Post.id)).where(Post.author_id == user.id, Post.status == PostStatus.published))

    is_following = False
    if current_user:
        f = await db.execute(select(Follow).where(Follow.follower_id == current_user.id, Follow.following_id == user.id))
        is_following = f.scalar_one_or_none() is not None

    data = _serialize_user(user, current_user, followers.scalar(), following.scalar(), posts.scalar())
    data["is_following"] = is_following
    return data


@users_router.put("/{user_id}")
async def update_profile(
    user_id: int,
    body: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.id != user_id:
        raise HTTPException(403, "Not authorized")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(user, field, value)
    return {"message": "Profile updated"}


@users_router.post("/{user_id}/avatar")
async def upload_avatar(
    user_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.id != user_id:
        raise HTTPException(403, "Not authorized")
    result = await upload_image(file, folder="blogsphere/avatars", transformation={"width": 300, "height": 300, "crop": "fill"})
    result_obj = await db.execute(select(User).where(User.id == user_id))
    u = result_obj.scalar_one_or_none()
    if u:
        u.profile_image = result["url"]
    return {"url": result["url"]}


@users_router.get("/{user_id}/posts")
async def get_user_posts(
    user_id: int,
    page: int = Query(1, ge=1),
    per_page: int = Query(12, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    query = select(Post).options(
        selectinload(Post.author), selectinload(Post.category),
        selectinload(Post.tags).selectinload(PostTag.tag),
        selectinload(Post.likes), selectinload(Post.bookmarks),
    ).where(Post.author_id == user_id, Post.status == PostStatus.published).order_by(Post.published_at.desc())

    total_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_result.scalar()
    result = await db.execute(query.offset((page - 1) * per_page).limit(per_page))
    posts = result.scalars().all()

    from app.routers.posts import serialize_post
    return {"items": [serialize_post(p, current_user) for p in posts], "total": total, "page": page, "per_page": per_page, "pages": math.ceil(total / per_page)}


@users_router.get("/{user_id}/bookmarks")
async def get_user_bookmarks(
    user_id: int,
    page: int = Query(1, ge=1),
    per_page: int = Query(12, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.id != user_id:
        raise HTTPException(403, "Not authorized")
    result = await db.execute(
        select(Bookmark).options(
            selectinload(Bookmark.post).selectinload(Post.author),
            selectinload(Bookmark.post).selectinload(Post.category),
            selectinload(Bookmark.post).selectinload(Post.likes),
            selectinload(Bookmark.post).selectinload(Post.bookmarks),
            selectinload(Bookmark.post).selectinload(Post.tags).selectinload(PostTag.tag),
        ).where(Bookmark.user_id == user_id).order_by(Bookmark.created_at.desc())
        .offset((page - 1) * per_page).limit(per_page)
    )
    bookmarks = result.scalars().all()
    from app.routers.posts import serialize_post
    return {"items": [serialize_post(b.post, current_user) for b in bookmarks if b.post]}


# ── Follow ─────────────────────────────────────────────────────────────────────
follow_router = APIRouter(prefix="/follow", tags=["Follow"])


@follow_router.post("/{user_id}")
async def toggle_follow(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.id == user_id:
        raise HTTPException(400, "Cannot follow yourself")
    target = await db.execute(select(User).where(User.id == user_id))
    if not target.scalar_one_or_none():
        raise HTTPException(404, "User not found")

    existing = await db.execute(select(Follow).where(Follow.follower_id == current_user.id, Follow.following_id == user_id))
    follow = existing.scalar_one_or_none()
    if follow:
        await db.delete(follow)
        return {"following": False}
    db.add(Follow(follower_id=current_user.id, following_id=user_id))
    return {"following": True}


# ── Categories ─────────────────────────────────────────────────────────────────
categories_router = APIRouter(prefix="/categories", tags=["Categories"])


@categories_router.get("")
async def list_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Category).order_by(Category.name))
    categories = result.scalars().all()
    out = []
    for cat in categories:
        count_result = await db.execute(select(func.count(Post.id)).where(Post.category_id == cat.id, Post.status == PostStatus.published))
        out.append({
            "id": cat.id, "name": cat.name, "slug": cat.slug,
            "description": cat.description, "icon": cat.icon,
            "color": cat.color, "posts_count": count_result.scalar(),
        })
    return out


@categories_router.post("", status_code=201)
async def create_category(
    body: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    from slugify import slugify
    cat = Category(name=body.name, slug=slugify(body.name), description=body.description, icon=body.icon, color=body.color)
    db.add(cat)
    return {"message": "Category created"}


# ── Notifications ──────────────────────────────────────────────────────────────
notifications_router = APIRouter(prefix="/notifications", tags=["Notifications"])


@notifications_router.get("")
async def get_notifications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
    )
    notifications = result.scalars().all()
    return [{"id": n.id, "type": n.type, "message": n.message, "entity_id": n.entity_id, "entity_type": n.entity_type, "is_read": n.is_read, "created_at": n.created_at} for n in notifications]


@notifications_router.post("/mark-all-read")
async def mark_all_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Notification).where(Notification.user_id == current_user.id, Notification.is_read == False))
    for n in result.scalars().all():
        n.is_read = True
    return {"message": "All notifications marked as read"}


# ── Admin ──────────────────────────────────────────────────────────────────────
admin_router = APIRouter(prefix="/admin", tags=["Admin"])


@admin_router.get("/stats")
async def admin_stats(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    users = await db.execute(select(func.count(User.id)))
    posts = await db.execute(select(func.count(Post.id)))
    from app.models import Comment
    comments = await db.execute(select(func.count(Comment.id)))
    categories = await db.execute(select(func.count(Category.id)))
    views = await db.execute(select(func.sum(Post.views)))
    return {
        "total_users": users.scalar(),
        "total_posts": posts.scalar(),
        "total_comments": comments.scalar(),
        "total_categories": categories.scalar(),
        "total_views": views.scalar() or 0,
    }


@admin_router.get("/users")
async def admin_list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    result = await db.execute(select(User).order_by(User.created_at.desc()).offset((page - 1) * per_page).limit(per_page))
    users = result.scalars().all()
    total = (await db.execute(select(func.count(User.id)))).scalar()
    return {"items": [_serialize_user(u) for u in users], "total": total, "page": page, "per_page": per_page, "pages": math.ceil(total / per_page)}


@admin_router.post("/users/{user_id}/ban")
async def ban_user(user_id: int, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    user.is_banned = True
    return {"message": "User banned"}


@admin_router.post("/users/{user_id}/unban")
async def unban_user(user_id: int, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    user.is_banned = False
    return {"message": "User unbanned"}


@admin_router.get("/posts")
async def admin_list_posts(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    result = await db.execute(
        select(Post).options(selectinload(Post.author)).order_by(Post.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
    )
    posts = result.scalars().all()
    total = (await db.execute(select(func.count(Post.id)))).scalar()
    return {"items": [{"id": p.id, "title": p.title, "status": p.status, "views": p.views, "created_at": p.created_at, "author": p.author.username} for p in posts], "total": total}


# ── AI ─────────────────────────────────────────────────────────────────────────
ai_router = APIRouter(prefix="/ai", tags=["AI"])


def get_gemini():
    from app.config import settings
    if not settings.GEMINI_API_KEY:
        raise HTTPException(503, "AI features not configured")
    import google.generativeai as genai
    genai.configure(api_key=settings.GEMINI_API_KEY)
    return genai.GenerativeModel("gemini-1.5-flash")


@ai_router.post("/generate-titles")
async def generate_titles(
    body: dict,
    current_user: User = Depends(get_current_user),
):
    model = get_gemini()
    topic = body.get("topic", "")
    prompt = f"""Generate 5 compelling, SEO-friendly blog post titles about: "{topic}"
    Return ONLY a JSON array of strings, no explanation. Example: ["Title 1", "Title 2"]"""
    response = model.generate_content(prompt)
    import json, re
    text = response.text.strip()
    text = re.sub(r"```json|```", "", text).strip()
    titles = json.loads(text)
    return {"titles": titles}


@ai_router.post("/generate-summary")
async def generate_summary(
    body: dict,
    current_user: User = Depends(get_current_user),
):
    model = get_gemini()
    content = body.get("content", "")[:3000]
    prompt = f"Write a compelling 2-3 sentence excerpt/summary for this blog post. Return ONLY the summary text:\n\n{content}"
    response = model.generate_content(prompt)
    return {"summary": response.text.strip()}


@ai_router.post("/generate-tags")
async def generate_tags(
    body: dict,
    current_user: User = Depends(get_current_user),
):
    model = get_gemini()
    content = body.get("content", "")[:2000]
    prompt = f"""Generate 5-8 relevant tags for this blog post content. Return ONLY a JSON array of lowercase strings.
    Example: ["python", "web-development", "tutorial"]
    Content: {content}"""
    response = model.generate_content(prompt)
    import json, re
    text = re.sub(r"```json|```", "", response.text.strip()).strip()
    tags = json.loads(text)
    return {"tags": tags}


@ai_router.post("/seo-suggestions")
async def seo_suggestions(
    body: dict,
    current_user: User = Depends(get_current_user),
):
    model = get_gemini()
    title = body.get("title", "")
    content = body.get("content", "")[:2000]
    prompt = f"""Provide 3 concise SEO improvement suggestions for this blog post.
    Title: {title}
    Content snippet: {content}
    Return ONLY a JSON array of suggestion strings."""
    response = model.generate_content(prompt)
    import json, re
    text = re.sub(r"```json|```", "", response.text.strip()).strip()
    suggestions = json.loads(text)
    return {"suggestions": suggestions}


@ai_router.post("/grammar-check")
async def grammar_check(
    body: dict,
    current_user: User = Depends(get_current_user),
):
    model = get_gemini()
    content = body.get("content", "")[:3000]
    prompt = f"Fix any grammar, spelling, and style issues in this text. Return ONLY the corrected text:\n\n{content}"
    response = model.generate_content(prompt)
    return {"corrected": response.text.strip()}
