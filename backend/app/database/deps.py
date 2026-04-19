from app.database.session import SessionLocal

# Dependency for FastAPI routes
def get_db():
    db = SessionLocal()
    try:
        yield db  # Provides a session to the route
    finally:
        db.close()  # Ensures the session is closed after the request