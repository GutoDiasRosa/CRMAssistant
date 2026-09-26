import os

os.environ.setdefault("SKIP_ALEMBIC_ON_STARTUP", "1")
os.environ.setdefault(
    "POSTGRES_URL",
    "postgresql+asyncpg://crm:crm@localhost:5432/crmassistant",
)
os.environ.setdefault("JWT_SECRET", "test-secret-test-secret-test-secret")
