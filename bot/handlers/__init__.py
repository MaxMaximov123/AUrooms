from .start import router as start_router
from .create import create_room_handler
from .list_rooms import list_rooms_handler
from .callbacks import callback_handler

def register_handlers(dp):
    dp.include_router(start_router)
    dp.include_router(create_room_handler)
    dp.include_router(list_rooms_handler)
    dp.include_router(callback_handler)