import secrets
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import User
from app.schemas import RegisterRequest, LoginRequest, TokenResponse, PasswordResetRequest, PasswordResetConfirm, ChangePasswordRequest, RefreshRequest
from app.utils.auth import hash_password, verify_password, create_access_token, create_refresh_token, decode_token, get_current_user
from app.utils.email import send_verification_email, send_password_reset_email

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", status_code=201)
async def register(
    body: RegisterRequest,
    background: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    # Check duplicates
    existing = await db.execute(
        select(User).where((User.email == body.email) | (User.username == body.username))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Email or username already exists")

    token = secrets.token_urlsafe(32)
    user = User(
        username=body.username,
        email=body.email,
        password_hash=hash_password(body.password),
        full_name=body.full_name,
        email_verification_token=token,
    )
    db.add(user)
    await db.flush()

    background.add_task(send_verification_email, body.email, body.username, token)
    return {"message": "Registration successful. Please check your email to verify your account."}


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(400, "Account is deactivated")
    if user.is_banned:
        raise HTTPException(403, "Account has been banned")

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    payload = decode_token(body.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(401, "Invalid refresh token")
    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(401, "User not found")
    access_token = create_access_token({"sub": str(user.id)})
    new_refresh = create_refresh_token({"sub": str(user.id)})
    return TokenResponse(access_token=access_token, refresh_token=new_refresh)


@router.get("/verify-email")
async def verify_email(token: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email_verification_token == token))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(400, "Invalid or expired verification token")
    user.is_verified = True
    user.email_verification_token = None
    return {"message": "Email verified successfully!"}


@router.post("/forgot-password")
async def forgot_password(
    body: PasswordResetRequest,
    background: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if user:
        token = secrets.token_urlsafe(32)
        user.password_reset_token = token
        user.password_reset_expires = datetime.now(timezone.utc) + timedelta(hours=1)
        background.add_task(send_password_reset_email, user.email, user.username, token)
    # Always return success to prevent email enumeration
    return {"message": "If that email exists, a reset link has been sent."}


@router.post("/reset-password")
async def reset_password(body: PasswordResetConfirm, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.password_reset_token == body.token))
    user = result.scalar_one_or_none()
    if not user or not user.password_reset_expires:
        raise HTTPException(400, "Invalid or expired reset token")
    if user.password_reset_expires < datetime.now(timezone.utc):
        raise HTTPException(400, "Reset token has expired")
    user.password_hash = hash_password(body.new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    return {"message": "Password reset successfully"}


@router.post("/change-password")
async def change_password(
    body: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(body.current_password, current_user.password_hash):
        raise HTTPException(400, "Current password is incorrect")
    current_user.password_hash = hash_password(body.new_password)
    return {"message": "Password changed successfully"}


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "profile_image": current_user.profile_image,
        "role": current_user.role,
        "is_verified": current_user.is_verified,
    }
