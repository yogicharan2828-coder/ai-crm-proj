from app.database.database import engine, Base
from app.models.interaction import Interaction

def init_db():
    Base.metadata.create_all(bind=engine)