from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    mongodb_uri: str | None
    mongodb_database: str
    data_file: Path

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
    return Settings(
        mongodb_uri=os.getenv("MONGODB_URI"),
        mongodb_database=os.getenv("MONGODB_DATABASE", "dhammapada"),
        data_file=data_file,
    )


settings = get_settings()
