from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, scoped_session, sessionmaker

Base = declarative_base()
db_session = scoped_session(sessionmaker(autocommit=False, autoflush=False))

def init_db(engine):
    Base.metadata.create_all(bind=engine)
