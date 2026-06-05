from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from app.config import settings
from app.database import create_tables
from app.routers.auth import router as auth_router
from app.routers.posts import router as posts_router
from app.routers.comments import router as comments_router
from app.routers import (
    users_router, follow_router, categories_router,
    notifications_router, admin_router, ai_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
    yield


app = FastAPI(
    title="BlogSphere API",
    description="Production-ready blogging platform API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
PREFIX = settings.API_V1_STR
app.include_router(auth_router, prefix=PREFIX)
app.include_router(posts_router, prefix=PREFIX)
app.include_router(comments_router, prefix=PREFIX)
app.include_router(users_router, prefix=PREFIX)
app.include_router(follow_router, prefix=PREFIX)
app.include_router(categories_router, prefix=PREFIX)
app.include_router(notifications_router, prefix=PREFIX)
app.include_router(admin_router, prefix=PREFIX)
app.include_router(ai_router, prefix=PREFIX)


@app.get("/")
async def root():
    return {"message": "BlogSphere API is running 🚀", "docs": "/api/docs"}


@app.get("/health")
async def health():
    return {"status": "healthy", "version": "1.0.0"}


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=settings.DEBUG)
