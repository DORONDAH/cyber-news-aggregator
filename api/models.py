from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import datetime

import os

# Use /tmp for SQLite on Vercel as it's the only writable directory
if os.environ.get("VERCEL"):
    DATABASE_URL = "sqlite:////tmp/cyber_news.db"
else:
    DATABASE_URL = "sqlite:///./cyber_news.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    url = Column(String, unique=True, index=True)
    content = Column(Text)
    summary = Column(Text)
    source = Column(String)
    category = Column(String, default="General")
    published_at = Column(DateTime)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))

Base.metadata.create_all(bind=engine)
