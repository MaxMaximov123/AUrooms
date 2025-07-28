from aiogram import Router, types
from aiogram import Router, types, F
from utils import get_rooms_by_owner
from keyboards.inline import get_rooms_page

list_rooms_handler = Router()

@list_rooms_handler.message(F.text == "Мои комнаты")
async def my_rooms(msg: types.Message):
    rooms = await get_rooms_by_owner(msg.from_user.id)
    await msg.answer("Ваши комнаты:", reply_markup=get_rooms_page(rooms, page=0))