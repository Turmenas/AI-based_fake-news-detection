import json
from pathlib import Path
from urllib.parse import quote

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from app.models import HeadlineModel, PhotoModel

STATIC = Path(__file__).resolve().parent / "static"


class SceneLibrary:
    """Fono nuotraukos su garsais (scenes/<vieta>/ ir scenes/<vieta>/audio/), virseliai (covers/) ir puslapio vertimo garsai (sfx/)."""

    PHOTOS, SOUNDS = {".jpg", ".jpeg", ".png", ".webp"}, {".mp3", ".ogg", ".wav"}
    root = STATIC

    def _url(self, p):
        return f"/{quote(p.relative_to(self.root).as_posix())}"  # quote: tarpai ir emoji failu varduose

    def _files(self, folder, kinds):
        return sorted(self._url(p) for p in folder.glob("*") if p.suffix.lower() in kinds)

    def _covers(self):  # kiekvienam virseliui jo fotografas is covers/credits.json
        folder = self.root / "covers"
        credits = json.loads((folder / "credits.json").read_text(encoding="utf-8")) if (folder / "credits.json").exists() else {}
        return [{"url": self._url(p), "credit": credits.get(p.name, "")} for p in sorted(folder.glob("*")) if p.suffix.lower() in self.PHOTOS]

    def listing(self):  # skaitom kaskart, kad nauji failai atsirastu be perkrovimo
        scenes = {d.name: {"photos": self._files(d, self.PHOTOS), "sounds": self._files(d / "audio", self.SOUNDS)}
                  for d in sorted((self.root / "scenes").iterdir()) if d.is_dir()}
        return {"scenes": {k: v for k, v in scenes.items() if v["photos"]},  # vieta be nuotrauku netinka fonui
                "covers": self._covers(),
                "sfx": self._files(self.root / "sfx", self.SOUNDS)}


class HeadlineIn(BaseModel):
    text: str = Field(min_length=1, max_length=300)


class PhotoIn(BaseModel):
    image: str = Field(min_length=1, max_length=20_000_000)  # base64, apie 15 MB nuotrauka


headlines, photos, library = HeadlineModel(), PhotoModel(), SceneLibrary()  # modeliai kraunami viena karta paleidziant
app = FastAPI(title="Headline Checker")


@app.get("/api/assets")
def assets():
    return library.listing()


@app.post("/api/headline")
def check_headline(body: HeadlineIn):
    return headlines.check(body.text)


@app.post("/api/photo")
def check_photo(body: PhotoIn):
    try:
        return photos.check(body.image)
    except (ValueError, OSError):  # ne base64 arba ne paveikslelis
        raise HTTPException(400, "Not an image")


app.mount("/", StaticFiles(directory=STATIC, html=True), name="static")  # puslapis ir failai; po API, kad /api butu tikrinamas pirmas
