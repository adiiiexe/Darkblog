from fastapi import FastAPI, APIRouter, HTTPException, status, Depends, UploadFile, File, Form, Cookie
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import requests
import cloudinary
import cloudinary.uploader

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Cloudinary configuration
cloudinary.config(
    cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME'),
    api_key=os.environ.get('CLOUDINARY_API_KEY'),
    api_secret=os.environ.get('CLOUDINARY_API_SECRET'),
    secure=True
)

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Pydantic Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    username: str
    picture: Optional[str] = None
    bio: Optional[str] = ""
    theme_color: str = "#00ff88"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSession(BaseModel):
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Blog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    username: str
    title: str
    cover_image: Optional[str] = None
    content: str
    is_published: bool = False
    likes: int = 0
    views: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Comment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    blog_id: str
    user_id: str
    username: str
    user_picture: Optional[str] = None
    text: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Like(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    blog_id: str
    user_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Auth Helper
async def get_current_user(session_token: Optional[str] = Cookie(None), authorization: Optional[str] = None):
    token = session_token
    if not token and authorization:
        if authorization.startswith("Bearer "):
            token = authorization.replace("Bearer ", "")
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session = await db.user_sessions.find_one({"session_token": token})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    if datetime.now(timezone.utc) > session["expires_at"].replace(tzinfo=timezone.utc):
        await db.user_sessions.delete_one({"session_token": token})
        raise HTTPException(status_code=401, detail="Session expired")
    
    user = await db.users.find_one({"id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user)

# Root route
@api_router.get("/")
async def root():
    return {"message": "NightBlog API"}

# Auth Routes
@api_router.post("/auth/session")
async def create_session(session_id: str = Form(...)):
    try:
        response = requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        response.raise_for_status()
        session_data = response.json()
        
        # Check if user exists
        existing_user = await db.users.find_one({"email": session_data["email"]}, {"_id": 0})
        
        if not existing_user:
            # Generate unique username
            base_username = session_data["name"].lower().replace(" ", "_")
            username = base_username
            counter = 1
            while await db.users.find_one({"username": username}):
                username = f"{base_username}_{counter}"
                counter += 1
            
            user = User(
                email=session_data["email"],
                name=session_data["name"],
                username=username,
                picture=session_data.get("picture"),
            )
            await db.users.insert_one(user.model_dump())
        else:
            user = User(**existing_user)
        
        # Create session
        session_token = session_data["session_token"]
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        
        await db.user_sessions.insert_one({
            "user_id": user.id,
            "session_token": session_token,
            "expires_at": expires_at,
            "created_at": datetime.now(timezone.utc)
        })
        
        response = JSONResponse(content={"user": user.model_dump()})
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=7 * 24 * 60 * 60,
            path="/"
        )
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@api_router.post("/auth/logout")
async def logout(session_token: Optional[str] = Cookie(None)):
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response = JSONResponse(content={"message": "Logged out"})
    response.delete_cookie(key="session_token", path="/")
    return response

# User Routes
@api_router.get("/users/{username}")
async def get_user_profile(username: str):
    user = await db.users.find_one({"username": username}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    blogs = await db.blogs.find({"username": username, "is_published": True}, {"_id": 0}).to_list(100)
    
    return {
        "user": user,
        "blogs": blogs
    }

@api_router.put("/users/profile")
async def update_profile(
    bio: str = Form(""),
    theme_color: str = Form("#00ff88"),
    profile_picture: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user)
):
    update_data = {
        "bio": bio,
        "theme_color": theme_color
    }
    
    if profile_picture:
        try:
            file_content = await profile_picture.read()
            result = cloudinary.uploader.upload(
                file_content,
                folder="nightblog/profiles",
                public_id=f"profile_{current_user.id}",
                transformation=[{"width": 400, "height": 400, "crop": "fill", "gravity": "face"}]
            )
            update_data["picture"] = result["secure_url"]
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")
    
    await db.users.update_one({"id": current_user.id}, {"$set": update_data})
    
    updated_user = await db.users.find_one({"id": current_user.id}, {"_id": 0})
    return User(**updated_user)

# Blog Routes
@api_router.get("/blogs")
async def get_blogs(search: Optional[str] = None, skip: int = 0, limit: int = 20):
    query = {"is_published": True}
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"username": {"$regex": search, "$options": "i"}}
        ]
    
    blogs = await db.blogs.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return blogs

@api_router.get("/blogs/{blog_id}")
async def get_blog(blog_id: str):
    blog = await db.blogs.find_one({"id": blog_id}, {"_id": 0})
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    
    # Increment views
    await db.blogs.update_one({"id": blog_id}, {"$inc": {"views": 1}})
    blog["views"] += 1
    
    return blog

@api_router.get("/blogs/{blog_id}/comments")
async def get_comments(blog_id: str):
    comments = await db.comments.find({"blog_id": blog_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return comments

@api_router.post("/blogs")
async def create_blog(
    title: str = Form(...),
    content: str = Form(...),
    is_published: bool = Form(False),
    cover_image: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user)
):
    cover_url = None
    if cover_image:
        try:
            file_content = await cover_image.read()
            result = cloudinary.uploader.upload(
                file_content,
                folder="nightblog/covers",
                transformation=[{"width": 1200, "height": 630, "crop": "fill"}]
            )
            cover_url = result["secure_url"]
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")
    
    blog = Blog(
        user_id=current_user.id,
        username=current_user.username,
        title=title,
        content=content,
        cover_image=cover_url,
        is_published=is_published
    )
    
    await db.blogs.insert_one(blog.model_dump())
    return blog

@api_router.put("/blogs/{blog_id}")
async def update_blog(
    blog_id: str,
    title: str = Form(...),
    content: str = Form(...),
    is_published: bool = Form(False),
    cover_image: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user)
):
    blog = await db.blogs.find_one({"id": blog_id}, {"_id": 0})
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    
    if blog["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = {
        "title": title,
        "content": content,
        "is_published": is_published,
        "updated_at": datetime.now(timezone.utc)
    }
    
    if cover_image:
        try:
            file_content = await cover_image.read()
            result = cloudinary.uploader.upload(
                file_content,
                folder="nightblog/covers",
                transformation=[{"width": 1200, "height": 630, "crop": "fill"}]
            )
            update_data["cover_image"] = result["secure_url"]
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")
    
    await db.blogs.update_one({"id": blog_id}, {"$set": update_data})
    
    updated_blog = await db.blogs.find_one({"id": blog_id}, {"_id": 0})
    return Blog(**updated_blog)

@api_router.delete("/blogs/{blog_id}")
async def delete_blog(blog_id: str, current_user: User = Depends(get_current_user)):
    blog = await db.blogs.find_one({"id": blog_id}, {"_id": 0})
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    
    if blog["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.blogs.delete_one({"id": blog_id})
    await db.comments.delete_many({"blog_id": blog_id})
    await db.likes.delete_many({"blog_id": blog_id})
    
    return {"message": "Blog deleted"}

@api_router.post("/blogs/{blog_id}/like")
async def toggle_like(blog_id: str, current_user: User = Depends(get_current_user)):
    existing_like = await db.likes.find_one({"blog_id": blog_id, "user_id": current_user.id})
    
    if existing_like:
        await db.likes.delete_one({"blog_id": blog_id, "user_id": current_user.id})
        await db.blogs.update_one({"id": blog_id}, {"$inc": {"likes": -1}})
        return {"liked": False}
    else:
        like = Like(blog_id=blog_id, user_id=current_user.id)
        await db.likes.insert_one(like.model_dump())
        await db.blogs.update_one({"id": blog_id}, {"$inc": {"likes": 1}})
        return {"liked": True}

@api_router.get("/blogs/{blog_id}/liked")
async def check_liked(blog_id: str, current_user: User = Depends(get_current_user)):
    like = await db.likes.find_one({"blog_id": blog_id, "user_id": current_user.id})
    return {"liked": like is not None}

@api_router.post("/blogs/{blog_id}/comments")
async def add_comment(
    blog_id: str,
    text: str = Form(...),
    current_user: User = Depends(get_current_user)
):
    comment = Comment(
        blog_id=blog_id,
        user_id=current_user.id,
        username=current_user.username,
        user_picture=current_user.picture,
        text=text
    )
    
    await db.comments.insert_one(comment.model_dump())
    return comment

@api_router.get("/users/{username}/blogs")
async def get_user_blogs(username: str, current_user: Optional[User] = None):
    query = {"username": username}
    
    # If not the profile owner, only show published blogs
    if not current_user or current_user.username != username:
        query["is_published"] = True
    
    blogs = await db.blogs.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return blogs

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()