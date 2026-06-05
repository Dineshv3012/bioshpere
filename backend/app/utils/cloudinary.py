import cloudinary
import cloudinary.uploader
from app.config import settings
from fastapi import UploadFile, HTTPException
import io

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
)

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_SIZE_MB = 5


async def upload_image(
    file: UploadFile,
    folder: str = "blogsphere",
    transformation: dict = None,
) -> dict:
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, "Only JPEG, PNG, WebP, and GIF images are allowed")

    content = await file.read()
    if len(content) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(400, f"File too large. Max {MAX_SIZE_MB}MB allowed")

    upload_params = {
        "folder": folder,
        "resource_type": "image",
        "quality": "auto:good",
        "fetch_format": "auto",
    }
    if transformation:
        upload_params["transformation"] = transformation

    result = cloudinary.uploader.upload(io.BytesIO(content), **upload_params)
    return {
        "url": result["secure_url"],
        "public_id": result["public_id"],
        "width": result.get("width"),
        "height": result.get("height"),
    }


async def delete_image(public_id: str):
    cloudinary.uploader.destroy(public_id)
