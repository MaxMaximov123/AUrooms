from aiogram import Bot, Dispatcher
from aiogram.enums.parse_mode import ParseMode
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.types import BotCommand
from bot.config import BOT_TOKEN
from bot.handlers import register_handlers
from aiogram.client.default import DefaultBotProperties

async def main():
    bot = Bot(
        token=BOT_TOKEN,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML)
    )
    dp = Dispatcher(storage=MemoryStorage())
    register_handlers(dp)

    await bot.set_my_commands([
        BotCommand(command="start", description="Запустить бота"),
    ])

    await dp.start_polling(bot)

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())