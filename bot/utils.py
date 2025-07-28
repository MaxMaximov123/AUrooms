import random
import string
from sqlalchemy import select, delete
from db.models import Room
from db.session import async_session
from sqlalchemy import select
from db.models import User
from db.session import async_session

async def get_or_create_user(telegram_id: int) -> User:
    async with async_session() as session:
        result = await session.execute(select(User).where(User.telegram_id == telegram_id))
        user = result.scalars().first()

        if not user:
            user = User(telegram_id=telegram_id)
            session.add(user)
            await session.commit()
            await session.refresh(user)

        return user

def generate_code(length=6):
    return ''.join(random.choices(string.digits, k=length))

async def create_room(user_id: int) -> str:
    code = generate_code()

    async with async_session() as session:
        room = Room(code=code, owner_id=user_id)
        session.add(room)
        await session.commit()
        return code

async def get_rooms_by_owner(owner_id: int) -> list[dict]:
    async with async_session() as session:
        result = await session.execute(
            select(Room).where(Room.owner_id == owner_id).order_by(Room.id.desc())
        )
        rooms = result.scalars().all()
        return [{"code": room.code} for room in rooms]

async def delete_room(owner_id: int, code: str) -> None:
    async with async_session() as session:
        await session.execute(
            delete(Room).where(Room.owner_id == owner_id, Room.code == code)
        )
        await session.commit()