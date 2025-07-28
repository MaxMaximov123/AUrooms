from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo


def get_open_room_button(code: str, base_url: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(
            text="Открыть",
            web_app=WebAppInfo(url=f"{base_url}?room={code}")
        )]
    ])


def get_room_action_buttons(code: str, base_url: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(
            text="Открыть",
            web_app=WebAppInfo(url=f"{base_url}?room={code}")
        )],
        [InlineKeyboardButton(text="Поделиться", switch_inline_query_current_chat=f"t.me/music_together_bot/AUrooms/room={code}")],
        [InlineKeyboardButton(text="Удалить", callback_data=f"delete:{code}")]
    ])


def get_rooms_page(rooms: list, page: int) -> InlineKeyboardMarkup:
    limit = 5
    start = page * limit
    end = start + limit
    page_rooms = rooms[start:end]

    keyboard = [
        [InlineKeyboardButton(text=room["code"], callback_data=f"room:{room['code']}")]
        for room in page_rooms
    ]

    nav = []
    if page > 0:
        nav.append(InlineKeyboardButton(text="« Назад", callback_data=f"page:{page - 1}"))
    if end < len(rooms):
        nav.append(InlineKeyboardButton(text="Вперёд »", callback_data=f"page:{page + 1}"))
    if nav:
        keyboard.append(nav)

    return InlineKeyboardMarkup(inline_keyboard=keyboard)