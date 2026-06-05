from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import Optional
import math

from app.database import get_db
from app.models import Comment, CommentLike, User, Post
from app.schemas import CommentCreate, CommentUpdate
from app.utils.auth import get_current_user, get_optional_user

router = APIRouter(prefix="/comments", tags=["Comments"])


def serialize_comment(comment: Comment, current_user: Optional[User] = None, depth: int = 0) -> dict:
    is_liked = False
    if current_user:
        is_liked = any(l.user_id == current_user.id for l in comment.likes)
    return {
        "id": comment.id,
        "post_id": comment.post_id,
        "parent_id": comment.parent_id,
        "content": comment.content,
        "created_at": comment.created_at,
        "updated_at": comment.updated_at,
        "likes_count": len(comment.likes),
        "is_liked": is_liked,
        "is_reported": comment.is_reported,
        "user": {
            "id": comment.user.id,
            "username": comment.user.username,
            "full_name": comment.user.full_name,
            "profile_image": comment.user.profile_image,
            "role": comment.user.role,
            "is_verified": comment.user.is_verified,
        },
        "replies": [
            serialize_comment(r, current_user, depth + 1)
            for r in comment.replies
        ] if depth < 3 else [],
    }


@router.get("/post/{post_id}")
async def get_post_comments(
    post_id: int,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    # Only top-level comments
    result = await db.execute(
        select(Comment)
        .options(
            selectinload(Comment.user),
            selectinload(Comment.likes),
            selectinload(Comment.replies).selectinload(Comment.user),
            selectinload(Comment.replies).selectinload(Comment.likes),
            selectinload(Comment.replies).selectinload(Comment.replies).selectinload(Comment.user),
            selectinload(Comment.replies).selectinload(Comment.replies).selectinload(Comment.likes),
        )
        .where(Comment.post_id == post_id, Comment.parent_id.is_(None), Comment.is_approved == True)
        .order_by(Comment.created_at)
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    comments = result.scalars().all()

    total_result = await db.execute(
        select(func.count(Comment.id))
        .where(Comment.post_id == post_id, Comment.parent_id.is_(None))
    )
    total = total_result.scalar()

    return {
        "items": [serialize_comment(c, current_user) for c in comments],
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": math.ceil(total / per_page),
    }


@router.post("", status_code=201)
async def create_comment(
    body: CommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify post exists
    post_result = await db.execute(select(Post).where(Post.id == body.post_id))
    if not post_result.scalar_one_or_none():
        raise HTTPException(404, "Post not found")

    # Verify parent exists if given
    if body.parent_id:
        parent_result = await db.execute(
            select(Comment).where(Comment.id == body.parent_id, Comment.post_id == body.post_id)
        )
        if not parent_result.scalar_one_or_none():
            raise HTTPException(404, "Parent comment not found")

    comment = Comment(
        post_id=body.post_id,
        user_id=current_user.id,
        parent_id=body.parent_id,
        content=body.content,
    )
    db.add(comment)
    return {"message": "Comment added", "comment_id": comment.id}


@router.put("/{comment_id}")
async def update_comment(
    comment_id: int,
    body: CommentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Comment).where(Comment.id == comment_id))
    comment = result.scalar_one_or_none()
    if not comment:
        raise HTTPException(404, "Comment not found")
    if comment.user_id != current_user.id:
        raise HTTPException(403, "Not authorized")
    comment.content = body.content
    return {"message": "Comment updated"}


@router.delete("/{comment_id}", status_code=204)
async def delete_comment(
    comment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Comment).where(Comment.id == comment_id))
    comment = result.scalar_one_or_none()
    if not comment:
        raise HTTPException(404, "Comment not found")
    if comment.user_id != current_user.id and current_user.role.value not in ("admin", "moderator"):
        raise HTTPException(403, "Not authorized")
    await db.delete(comment)


@router.post("/{comment_id}/like")
async def toggle_comment_like(
    comment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(CommentLike).where(
            CommentLike.comment_id == comment_id,
            CommentLike.user_id == current_user.id,
        )
    )
    like = result.scalar_one_or_none()
    if like:
        await db.delete(like)
        return {"liked": False}
    db.add(CommentLike(comment_id=comment_id, user_id=current_user.id))
    return {"liked": True}


@router.post("/{comment_id}/report")
async def report_comment(
    comment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Comment).where(Comment.id == comment_id))
    comment = result.scalar_one_or_none()
    if not comment:
        raise HTTPException(404, "Comment not found")
    comment.is_reported = True
    return {"message": "Comment reported"}
