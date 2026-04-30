from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from dotenv import load_dotenv

project_root = Path(__file__).resolve().parents[2]
env_path = project_root / "backend" / ".env"
if not env_path.exists():
    env_path = project_root / ".env"
load_dotenv(dotenv_path=env_path)

@dataclass(frozen=True)
class Settings:
    mongodb_uri: str | None
    mongodb_database: str
    data_file: Path
    embedding_provider: str
    embedding_model: str
    embedding_dimensions: int
    groq_api_key: str | None
    vector_search_index: str
    llm_provider: str
    llm_model: str
    llm_base_url: str | None

    @property
    def use_mongodb(self) -> bool:
        return bool(self.mongodb_uri)


def get_settings() -> Settings:
    data_file_env = os.getenv("DHAMMAPADA_DATA_FILE")
    project_root = Path(__file__).resolve().parents[2]
    default_data_file = project_root / "data" / "dhammapada.json"
    if data_file_env:
        configured_path = Path(data_file_env)
        data_file = configured_path if configured_path.is_absolute() else (project_root / configured_path)
        data_file = data_file.resolve()
    else:
        data_file = default_data_file
    embedding_provider = os.getenv("EMBEDDING_PROVIDER", "local").lower().strip()
    default_dimensions = "1536" if embedding_provider == "openai" else "384"
    return Settings(
        mongodb_uri=os.getenv("MONGODB_URI"),
        mongodb_database=os.getenv("MONGODB_DATABASE", "dhammapada"),
        data_file=data_file,
        embedding_provider=embedding_provider,
        embedding_model=os.getenv("EMBEDDING_MODEL", "text-embedding-3-small"),
        embedding_dimensions=int(os.getenv("EMBEDDING_DIMENSIONS", default_dimensions)),
        groq_api_key=os.getenv("GROQ_API_KEY"),
        vector_search_index=os.getenv("MONGODB_VECTOR_SEARCH_INDEX", "verse_vector_index"),
        llm_provider=os.getenv("LLM_PROVIDER", "none").lower().strip(),
        llm_model=os.getenv("LLM_MODEL", "llama3-8b-8192"),
        llm_base_url=os.getenv("LLM_BASE_URL"),
    )


settings = get_settings()
