from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # JWT
    secret_key: str = "beyond-headlines-super-secret-key-change-in-production"
    access_token_expire_minutes: int = 60 * 24  # 24 hours

    # App
    app_name: str = "Beyond Headlines API"
    app_version: str = "1.0.0"
    debug: bool = True

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
