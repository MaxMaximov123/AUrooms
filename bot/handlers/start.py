from aiogram import Router, types
from aiogram.types import ReplyKeyboardMarkup, KeyboardButton
from utils import get_or_create_user
from keyboards.reply import get_main_keyboard
from aiogram.filters import Command

router = Router()

@router.message(Command("start"))
async def start_cmd(message: types.Message):
    tg_user = message.from_user
    await get_or_create_user(tg_user.id)

    await message.answer("Привет! Что хочешь сделать?", reply_markup=get_main_keyboard())