import httpx

from app.config import settings


def get_async_client() -> httpx.AsyncClient:
    return httpx.AsyncClient(
        timeout=settings.HTTP_TIMEOUT_SECONDS,
        verify=settings.VERIFY_SSL
    )