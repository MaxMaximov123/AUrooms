from aiogram.types import ReplyKeyboardMarkup, KeyboardButton

def get_main_keyboard():
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="Создать комнату")],
            [KeyboardButton(text="Мои комнаты")]
        ],
        resize_keyboard=True
    )