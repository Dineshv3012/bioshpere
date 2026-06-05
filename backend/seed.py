"""
BlogSphere Database Seeder
Run: python seed.py

Seeds the database with:
  - Admin user
  - Sample categories
  - Sample tags
  - Sample blog posts
"""

import asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.config import settings
from app.models import Base, User, Category, Post, Tag, PostTag, UserRole, PostStatus
from app.utils.auth import hash_password
from python_slugify import slugify
from datetime import datetime, timezone

engine = create_async_engine(settings.DATABASE_URL, echo=False)
Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

CATEGORIES = [
    {"name": "Technology",   "icon": "💻", "color": "#2563EB", "description": "Latest in tech"},
    {"name": "AI",           "icon": "🤖", "color": "#7c3aed", "description": "Artificial intelligence & ML"},
    {"name": "Programming",  "icon": "⌨️",  "color": "#059669", "description": "Code tutorials & tips"},
    {"name": "Business",     "icon": "📊", "color": "#d97706", "description": "Entrepreneurship & strategy"},
    {"name": "Lifestyle",    "icon": "🌿", "color": "#dc2626", "description": "Life, wellness & hobbies"},
    {"name": "Education",    "icon": "🎓", "color": "#0891b2", "description": "Learning & growth"},
    {"name": "Health",       "icon": "❤️",  "color": "#e11d48", "description": "Health & fitness"},
    {"name": "Sports",       "icon": "⚽", "color": "#16a34a", "description": "Sports & athletics"},
]

SAMPLE_POSTS = [
    {
        "title": "Getting Started with FastAPI: A Complete Guide",
        "content": """<h2>Introduction</h2>
<p>FastAPI is a modern, high-performance web framework for building APIs with Python 3.7+ based on standard Python type hints. It's one of the fastest Python frameworks available, second only to NodeJS and Go.</p>
<h2>Why FastAPI?</h2>
<ul>
<li><strong>Fast</strong>: Very high performance, on par with NodeJS and Go</li>
<li><strong>Fast to code</strong>: Increase the speed to develop features by about 200% to 300%</li>
<li><strong>Fewer bugs</strong>: Reduce about 40% of human-induced errors</li>
<li><strong>Intuitive</strong>: Great editor support, completion everywhere</li>
<li><strong>Easy</strong>: Designed to be easy to use and learn</li>
<li><strong>Short</strong>: Minimize code duplication</li>
<li><strong>Robust</strong>: Get production-ready code with automatic interactive documentation</li>
</ul>
<h2>Installation</h2>
<pre><code>pip install fastapi uvicorn[standard]</code></pre>
<h2>Your First API</h2>
<pre><code>from fastapi import FastAPI

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Hello World"}</code></pre>
<h2>Running the Server</h2>
<pre><code>uvicorn main:app --reload</code></pre>
<p>Navigate to <code>http://127.0.0.1:8000/docs</code> to see the interactive API documentation.</p>
<h2>Conclusion</h2>
<p>FastAPI is an excellent choice for building modern APIs. Its performance characteristics, automatic documentation generation, and developer-friendly design make it a top choice for Python developers.</p>""",
        "category": "Programming",
        "tags": ["python", "fastapi", "api", "web-development"],
        "status": "published",
    },
    {
        "title": "The Future of AI: What GPT Models Mean for Developers",
        "content": """<h2>The AI Revolution</h2>
<p>Artificial intelligence has come a long way in recent years. Large language models like GPT-4 and beyond are reshaping how we think about software development, creativity, and human-computer interaction.</p>
<h2>How Developers Can Leverage AI</h2>
<p>As a developer, you're sitting at the forefront of one of the most exciting technological shifts in history. Here's how you can leverage these tools:</p>
<blockquote>The best developers of tomorrow will be those who learn to collaborate effectively with AI, not those who compete against it.</blockquote>
<h2>Practical Applications</h2>
<ul>
<li>Code generation and completion</li>
<li>Automated code review and bug detection</li>
<li>Natural language interfaces for complex systems</li>
<li>Intelligent documentation generation</li>
<li>AI-assisted testing</li>
</ul>
<h2>The Skills That Still Matter</h2>
<p>Despite the rise of AI coding assistants, certain developer skills remain irreplaceable: system design, architecture thinking, debugging complex systems, and understanding business requirements.</p>""",
        "category": "AI",
        "tags": ["ai", "machine-learning", "gpt", "future-of-tech"],
        "status": "published",
    },
    {
        "title": "10 Tailwind CSS Tips Every Developer Should Know",
        "content": """<h2>Why Tailwind CSS?</h2>
<p>Tailwind CSS has taken the frontend development world by storm. Its utility-first approach allows developers to build complex UIs without ever leaving their HTML. Here are 10 tips to level up your Tailwind game.</p>
<h2>1. Use the JIT Mode</h2>
<p>Just-In-Time mode generates your CSS on-demand, resulting in faster build times and allowing you to use arbitrary values.</p>
<h2>2. Leverage the `@apply` Directive</h2>
<pre><code>.btn {
  @apply px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700;
}</code></pre>
<h2>3. Use CSS Variables for Dynamic Theming</h2>
<p>Combine Tailwind with CSS custom properties for powerful dynamic theming capabilities.</p>
<h2>4. Group Variants</h2>
<p>Use the <code>group</code> class to style children based on parent state.</p>
<h2>5. Dark Mode Made Easy</h2>
<p>Tailwind's built-in dark mode support makes implementing theme switching trivial.</p>
<h2>Conclusion</h2>
<p>These tips will help you write cleaner, more maintainable Tailwind CSS. The key is practice – the more you use these patterns, the more natural they become.</p>""",
        "category": "Programming",
        "tags": ["tailwindcss", "css", "frontend", "web-design"],
        "status": "published",
    },
]


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with Session() as db:
        # ── Admin user ──────────────────────────────────────────────────────
        from sqlalchemy import select
        existing_admin = await db.execute(select(User).where(User.email == "admin@blogsphere.com"))
        if not existing_admin.scalar_one_or_none():
            admin = User(
                username="admin",
                email="admin@blogsphere.com",
                password_hash=hash_password("Admin@123456"),
                full_name="BlogSphere Admin",
                bio="Platform administrator",
                role=UserRole.admin,
                is_active=True,
                is_verified=True,
            )
            db.add(admin)

            sample_author = User(
                username="johndoe",
                email="john@blogsphere.com",
                password_hash=hash_password("John@123456"),
                full_name="John Doe",
                bio="Full-stack developer and technical writer. Loves Python, React, and cloud architecture.",
                role=UserRole.user,
                is_active=True,
                is_verified=True,
            )
            db.add(sample_author)
            await db.flush()

            # ── Categories ──────────────────────────────────────────────────
            cat_map = {}
            for c in CATEGORIES:
                cat = Category(name=c["name"], slug=slugify(c["name"]), description=c["description"], icon=c["icon"], color=c["color"])
                db.add(cat)
                await db.flush()
                cat_map[c["name"]] = cat

            # ── Posts ───────────────────────────────────────────────────────
            for p in SAMPLE_POSTS:
                slug = slugify(p["title"])
                post = Post(
                    title=p["title"],
                    slug=slug,
                    content=p["content"],
                    excerpt=p["content"][:200].replace("<", "").replace(">", "")[:200],
                    author_id=sample_author.id,
                    category_id=cat_map.get(p["category"], cat_map.get("Technology")).id,
                    status=PostStatus.published,
                    views=0,
                    read_time=max(1, len(p["content"].split()) // 200),
                    published_at=datetime.now(timezone.utc),
                )
                db.add(post)
                await db.flush()

                # Tags
                for tag_name in p["tags"]:
                    tag_slug = slugify(tag_name)
                    tag_res = await db.execute(select(Tag).where(Tag.slug == tag_slug))
                    tag = tag_res.scalar_one_or_none()
                    if not tag:
                        tag = Tag(name=tag_name, slug=tag_slug)
                        db.add(tag)
                        await db.flush()
                    db.add(PostTag(post_id=post.id, tag_id=tag.id))

            await db.commit()
            print("✅ Database seeded successfully!")
            print("   Admin:  admin@blogsphere.com / Admin@123456")
            print("   Author: john@blogsphere.com  / John@123456")
        else:
            print("⚠️  Database already seeded. Skipping.")


if __name__ == "__main__":
    asyncio.run(seed())
