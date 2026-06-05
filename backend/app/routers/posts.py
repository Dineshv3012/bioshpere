from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, asc, or_
from sqlalchemy.orm import selectinload, joinedload
from typing import Optional
import math
from slugify import slugify

from app.database import get_db
from app.models import Post, PostLike, Bookmark, Tag, PostTag, PostStatus, Notification, NotificationType, Follow
from app.schemas import PostCreate, PostUpdate, PostDetail, PostSummary, PaginatedResponse
from app.utils.auth import get_current_user, get_optional_user
from app.utils.cloudinary import upload_image
from app.models import User

router = APIRouter(prefix="/posts", tags=["Posts"])


def estimate_read_time(content: str) -> int:
    words = len(content.split())
    return max(1, round(words / 200))


async def get_post_or_404(post_id: int, db: AsyncSession) -> Post:
    result = await db.execute(
        select(Post)
        .options(
            selectinload(Post.author),
            selectinload(Post.category),
            selectinload(Post.tags).selectinload(PostTag.tag),
            selectinload(Post.likes),
            selectinload(Post.bookmarks),
        )
        .where(Post.id == post_id)
    )
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(404, "Post not found")
    return post


def serialize_post(post: Post, current_user: Optional[User] = None) -> dict:
    liked = False
    bookmarked = False
    if current_user:
        liked = any(l.user_id == current_user.id for l in post.likes)
        bookmarked = any(b.user_id == current_user.id for b in post.bookmarks)

    return {
        "id": post.id,
        "title": post.title,
        "slug": post.slug,
        "excerpt": post.excerpt,
        "thumbnail": post.thumbnail,
        "status": post.status,
        "views": post.views,
        "read_time": post.read_time,
        "published_at": post.published_at,
        "created_at": post.created_at,
        "updated_at": post.updated_at,
        "likes_count": len(post.likes),
        "comments_count": len(post.comments) if "comments" in post.__dict__ else 0,
        "is_liked": liked,
        "is_bookmarked": bookmarked,
        "author": {
            "id": post.author.id,
            "username": post.author.username,
            "full_name": post.author.full_name,
            "profile_image": post.author.profile_image,
            "role": post.author.role,
            "is_verified": post.author.is_verified,
        },
        "category": {
            "id": post.category.id,
            "name": post.category.name,
            "slug": post.category.slug,
            "color": post.category.color,
            "icon": post.category.icon,
        } if post.category else None,
        "tags": [{"id": pt.tag.id, "name": pt.tag.name, "slug": pt.tag.slug} for pt in post.tags],
    }


@router.get("")
async def list_posts(
    page: int = Query(1, ge=1),
    per_page: int = Query(12, ge=1, le=50),
    category: Optional[str] = None,
    tag: Optional[str] = None,
    author: Optional[str] = None,
    search: Optional[str] = None,
    sort: Optional[str] = "latest",
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    query = (
        select(Post)
        .options(
            selectinload(Post.author),
            selectinload(Post.category),
            selectinload(Post.tags).selectinload(PostTag.tag),
            selectinload(Post.likes),
            selectinload(Post.bookmarks),
        )
        .where(Post.status == PostStatus.published)
    )

    if search:
        query = query.where(or_(
            Post.title.ilike(f"%{search}%"),
            Post.excerpt.ilike(f"%{search}%"),
        ))
    if category:
        from app.models import Category
        query = query.join(Post.category).where(Post.category.has(slug=category))
    if author:
        query = query.join(Post.author).where(Post.author.has(username=author))
    if tag:
        query = query.join(Post.tags).join(PostTag.tag).where(Tag.slug == tag)

    # Sorting
    if sort == "popular":
        query = query.order_by(desc(Post.views))
    elif sort == "most_liked":
        query = query.order_by(desc(func.count(PostLike.id)))
    else:
        query = query.order_by(desc(Post.published_at))

    total_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_result.scalar()

    offset = (page - 1) * per_page
    result = await db.execute(query.offset(offset).limit(per_page))
    posts = result.scalars().all()

    return {
        "items": [serialize_post(p, current_user) for p in posts],
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": math.ceil(total / per_page),
    }


@router.get("/trending")
async def trending_posts(
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    result = await db.execute(
        select(Post)
        .options(selectinload(Post.author), selectinload(Post.category), selectinload(Post.tags).selectinload(PostTag.tag), selectinload(Post.likes), selectinload(Post.bookmarks))
        .where(Post.status == PostStatus.published)
        .order_by(desc(Post.views))
        .limit(5)
    )
    posts = result.scalars().all()
    return [serialize_post(p, current_user) for p in posts]


@router.get("/feed")
async def user_feed(
    page: int = Query(1, ge=1),
    per_page: int = Query(12, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    following_ids_result = await db.execute(
        select(Follow.following_id).where(Follow.follower_id == current_user.id)
    )
    following_ids = [r[0] for r in following_ids_result.all()]

    if not following_ids:
        return {"items": [], "total": 0, "page": page, "per_page": per_page, "pages": 0}

    query = (
        select(Post)
        .options(selectinload(Post.author), selectinload(Post.category), selectinload(Post.tags).selectinload(PostTag.tag), selectinload(Post.likes), selectinload(Post.bookmarks))
        .where(Post.author_id.in_(following_ids), Post.status == PostStatus.published)
        .order_by(desc(Post.published_at))
    )
    total_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_result.scalar()

    result = await db.execute(query.offset((page - 1) * per_page).limit(per_page))
    posts = result.scalars().all()
    return {"items": [serialize_post(p, current_user) for p in posts], "total": total, "page": page, "per_page": per_page, "pages": math.ceil(total / per_page)}


@router.get("/slug/{slug}")
async def get_post_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    result = await db.execute(
        select(Post)
        .options(selectinload(Post.author), selectinload(Post.category), selectinload(Post.tags).selectinload(PostTag.tag), selectinload(Post.likes), selectinload(Post.bookmarks))
        .where(Post.slug == slug)
    )
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(404, "Post not found")
    if post.status != PostStatus.published and (not current_user or current_user.id != post.author_id):
        raise HTTPException(404, "Post not found")
    post.views += 1
    data = serialize_post(post, current_user)
    data["content"] = post.content
    return data


@router.get("/{post_id}")
async def get_post(
    post_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    post = await get_post_or_404(post_id, db)
    if post.status != PostStatus.published and (not current_user or current_user.id != post.author_id):
        raise HTTPException(404, "Post not found")

    # Increment views
    post.views += 1
    data = serialize_post(post, current_user)
    data["content"] = post.content
    return data


@router.post("", status_code=201)
async def create_post(
    body: PostCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    base_slug = slugify(body.title)
    slug = base_slug
    counter = 1
    while True:
        existing = await db.execute(select(Post).where(Post.slug == slug))
        if not existing.scalar_one_or_none():
            break
        slug = f"{base_slug}-{counter}"
        counter += 1

    from datetime import datetime, timezone as tz
    published_at = None
    if body.status == PostStatus.published:
        published_at = datetime.now(tz.utc)

    post = Post(
        title=body.title,
        slug=slug,
        content=body.content,
        excerpt=body.excerpt or body.content[:200],
        thumbnail=body.thumbnail,
        author_id=current_user.id,
        category_id=body.category_id,
        status=body.status,
        read_time=estimate_read_time(body.content),
        published_at=published_at,
        scheduled_at=body.scheduled_at,
    )
    db.add(post)
    await db.flush()

    # Handle tags
    for tag_name in (body.tags or []):
        tag_slug = slugify(tag_name)
        tag_result = await db.execute(select(Tag).where(Tag.slug == tag_slug))
        tag = tag_result.scalar_one_or_none()
        if not tag:
            tag = Tag(name=tag_name.lower(), slug=tag_slug)
            db.add(tag)
            await db.flush()
        db.add(PostTag(post_id=post.id, tag_id=tag.id))

    return {"id": post.id, "slug": post.slug, "message": "Post created successfully"}


@router.put("/{post_id}")
async def update_post(
    post_id: int,
    body: PostUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(404, "Post not found")
    if post.author_id != current_user.id and current_user.role.value not in ("admin", "moderator"):
        raise HTTPException(403, "Not authorized")

    if body.title is not None:
        post.title = body.title
    if body.content is not None:
        post.content = body.content
        post.read_time = estimate_read_time(body.content)
    if body.excerpt is not None:
        post.excerpt = body.excerpt
    if body.thumbnail is not None:
        post.thumbnail = body.thumbnail
    if body.category_id is not None:
        post.category_id = body.category_id
    if body.status is not None:
        from datetime import datetime, timezone as tz
        if body.status == PostStatus.published and post.status != PostStatus.published:
            post.published_at = datetime.now(tz.utc)
        post.status = body.status
    if body.scheduled_at is not None:
        post.scheduled_at = body.scheduled_at

    if body.tags is not None:
        # Remove old tags
        old_tags = await db.execute(select(PostTag).where(PostTag.post_id == post_id))
        for pt in old_tags.scalars().all():
            await db.delete(pt)
        for tag_name in body.tags:
            tag_slug = slugify(tag_name)
            tag_result = await db.execute(select(Tag).where(Tag.slug == tag_slug))
            tag = tag_result.scalar_one_or_none()
            if not tag:
                tag = Tag(name=tag_name.lower(), slug=tag_slug)
                db.add(tag)
                await db.flush()
            db.add(PostTag(post_id=post.id, tag_id=tag.id))

    return {"message": "Post updated successfully"}


@router.delete("/{post_id}", status_code=204)
async def delete_post(
    post_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(404, "Post not found")
    if post.author_id != current_user.id and current_user.role.value not in ("admin", "moderator"):
        raise HTTPException(403, "Not authorized")
    await db.delete(post)


@router.post("/upload-image")
async def upload_post_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    result = await upload_image(file, folder="blogsphere/posts")
    return {"url": result["url"]}


@router.post("/{post_id}/like")
async def toggle_like(
    post_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(PostLike).where(PostLike.post_id == post_id, PostLike.user_id == current_user.id)
    )
    like = result.scalar_one_or_none()
    if like:
        await db.delete(like)
        return {"liked": False}
    else:
        db.add(PostLike(post_id=post_id, user_id=current_user.id))
        return {"liked": True}


@router.post("/{post_id}/bookmark")
async def toggle_bookmark(
    post_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Bookmark).where(Bookmark.post_id == post_id, Bookmark.user_id == current_user.id)
    )
    bookmark = result.scalar_one_or_none()
    if bookmark:
        await db.delete(bookmark)
        return {"bookmarked": False}
    else:
        db.add(Bookmark(post_id=post_id, user_id=current_user.id))
        return {"bookmarked": True}
