from sqlalchemy import Column, Integer, String, BigInteger, Boolean, Float, DateTime, ForeignKey, Text, func, UniqueConstraint
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    telegram_id = Column(BigInteger, unique=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

class Room(Base):
    __tablename__ = 'rooms'

    id = Column(Integer, primary_key=True)
    code = Column(String, unique=True, nullable=False)
    owner_id = Column(BigInteger, nullable=False)
    is_playing = Column(Boolean, default=False)
    current_time = Column(Float, default=0)
    created_at = Column(DateTime, server_default=func.now())
    expires_at = Column(DateTime, nullable=True)

class RoomUser(Base):
    __tablename__ = 'room_users'

    id = Column(Integer, primary_key=True)
    room_id = Column(Integer, ForeignKey('rooms.id', ondelete='CASCADE'))
    user_id = Column(String, nullable=False)  # telegram_id или кастомный id
    name = Column(String)
    last_name = Column(String)
    username = Column(String)
    photo_url = Column(String)
    source = Column(String, default='web')
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    __table_args__ = (UniqueConstraint('room_id', 'user_id', name='_room_user_uc'),)

class Track(Base):
    __tablename__ = 'tracks'

    id = Column(Integer, primary_key=True)
    room_id = Column(Integer, ForeignKey('rooms.id', ondelete='CASCADE'))
    order = Column(Integer)
    track_id = Column(String)
    title = Column(String)
    src = Column(Text)
    cover = Column(Text)
    artists = Column(Text)
    type = Column(String)
    is_playing = Column(Boolean, default=False)
    current_time = Column(Float, default=0)
    duration = Column(Float, default=0)
    added_at = Column(DateTime, server_default=func.now())