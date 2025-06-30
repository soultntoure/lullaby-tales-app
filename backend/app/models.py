from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    children = relationship("Child", back_populates="parent", cascade="all, delete-orphan")
    stories = relationship("Story", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}')>"

class Child(Base):
    __tablename__ = "children"

    id = Column(Integer, primary_key=True, index=True)
    parent_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    age = Column(Integer) # Optional age for age-appropriate content
    gender = Column(String) # Optional: for pronoun usage in stories
    interests = Column(JSON) # Store as JSON list (e.g., ["unicorns", "space", "dinosaurs"])
    friends = Column(JSON)   # Store as JSON list (e.g., ["Leo", "Maya"])
    favorite_characters = Column(JSON) # e.g., ["brave knight", "talking dog"]
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    parent = relationship("User", back_populates="children")
    stories = relationship("Story", back_populates="child", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Child(id={self.id}, name='{self.name}', parent_id={self.parent_id})>"

class Story(Base):
    __tablename__ = "stories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    child_id = Column(Integer, ForeignKey("children.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, index=True)
    story_text = Column(Text, nullable=False)
    audio_url = Column(String) # URL to the generated audio file in object storage
    prompt_parameters_used = Column(JSON) # Store the exact personalized inputs and LLM prompt details for reproducibility/debugging
    is_safe = Column(Boolean, default=True) # Flag indicating content safety check result
    word_count = Column(Integer) # Optional: for analytics/story length control
    duration_seconds = Column(Integer) # Optional: estimated audio duration
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="stories")
    child = relationship("Child", back_populates="stories")

    def __repr__(self):
        return f"<Story(id={self.id}, title='{self.title}', user_id={self.user_id}, child_id={self.child_id})>"
