from aiogram import Router, types
from keyboards.inline import get_open_room_button
from utils import create_room
from config import WEB_APP_URL
from aiogram import Router, types, F

create_room_handler = Router()

@create_room_handler.message(F.text == "Создать комнату")
async def create_room_handler_func(msg: types.Message):
    room_code = await create_room(msg.from_user.id)

    text = f"Комната создана!\nID: <code>{room_code}</code>"
    await msg.answer(
        text,
        reply_markup=get_open_room_button(room_code, WEB_APP_URL)
    )