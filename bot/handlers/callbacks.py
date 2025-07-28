from aiogram import Router, types, F
from aiogram.types import CallbackQuery
from bot.utils import get_rooms_by_owner, delete_room
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from bot.config import WEB_APP_URL
from bot.keyboards.inline import (
    get_rooms_page, get_open_room_button, get_room_action_buttons
)
from bot.config import WEB_APP_URL

callback_handler = Router()

@callback_handler.callback_query(F.data.startswith("page:"))
async def paginate_rooms(cb: CallbackQuery):
    _, page = cb.data.split(":")
    rooms = await get_rooms_by_owner(cb.from_user.id)
    await cb.message.edit_reply_markup(
        reply_markup=get_rooms_page(rooms, int(page))
    )
    await cb.answer()

@callback_handler.callback_query(F.data.startswith("room:"))
async def room_details(cb: CallbackQuery):
    _, room_code = cb.data.split(":")
    text = f"Комната: <code>{room_code}</code>"
    await cb.message.edit_text(
        text,
        reply_markup=get_room_action_buttons(room_code, WEB_APP_URL)
    )
    await cb.answer()

@callback_handler.callback_query(lambda c: c.data.startswith("share:"))
async def share_room(callback: types.CallbackQuery):
    code = callback.data.split(":")[1]

    text = f"{callback.from_user.full_name} приглашает вас присоединиться к прослушиванию музыки 🎶"

    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(
            text="Открыть комнату",
            switch_inline_query=f"t.me/music_together_bot/AUrooms?room={code}"
            # web_app=WebAppInfo(url=f"{WEB_APP_URL}?room={code}")
        )]
    ])

    await callback.message.answer(text, reply_markup=keyboard)
    await callback.answer("Сообщение отправлено, вы можете его переслать!")

@callback_handler.callback_query(F.data.startswith("delete:"))
async def delete_room_cb(cb: CallbackQuery):
    _, room_code = cb.data.split(":")
    await delete_room(cb.from_user.id, room_code)
    await cb.message.edit_text(f"Комната <code>{room_code}</code> удалена.")
    await cb.answer("Удалено")