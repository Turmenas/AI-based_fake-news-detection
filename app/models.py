import os
os.environ.setdefault("KERAS_BACKEND", "torch")  # turi buti nustatyta pries importuojant keras

import base64, io, re
from pathlib import Path

import joblib, keras, keras_hub, numpy as np, torch
from huggingface_hub import snapshot_download
from PIL import Image, ImageOps
from tokenizers import BertWordPieceTokenizer

MODELS = Path(__file__).resolve().parent.parent / "models"
TYPES = ["true", "satire/parody", "false connection", "imposter content", "manipulated content", "misleading content"]  # 6_way_label 0-5


def clean(text):
    return " ".join(re.sub(r"[^a-z ]", "", text.lower()).split())  # kaip Fakeddit clean_title: mazosios raides, tik raides ir tarpai


class HeadlineModel:
    """DistilBERT is antro darbo: tikimybe, kad antraste netikra, sesi tipai ir kiek kiekvienas zodis paveike atsakyma."""

    def __init__(self, path=MODELS / "distilbert_6way.keras"):
        vocab = Path(snapshot_download("keras/distil_bert_base_en_uncased")) / "assets" / "tokenizer" / "vocabulary.txt"
        self.tok = BertWordPieceTokenizer(str(vocab), lowercase=True)
        self.tok.enable_truncation(40); self.tok.enable_padding(length=40)  # tas pats ilgis kaip mokant
        self.model = keras.saving.load_model(path, compile=False)

    def _probs(self, texts):
        ids = np.array([e.ids for e in self.tok.encode_batch(texts)], dtype="int32")
        logits = keras.ops.convert_to_numpy(self.model.predict_on_batch({"token_ids": ids, "padding_mask": ids != 0})).astype("float64")
        p = np.exp(logits - logits.max(1, keepdims=True))  # modelis grazina logitus, paverciam tikimybemis
        return p / p.sum(1, keepdims=True)

    def check(self, headline):
        words = headline.split()
        variants = [clean(headline)] + [clean(" ".join(words[:i] + words[i + 1:])) for i in range(len(words))]  # po viena zodi ismetam
        p = self._probs(variants)
        log_odds = np.log((1 - p[:, 0]) / p[:, 0])  # log-odds, nes prie 99 % tikimybe beveik nebejuda
        return {"p_fake": float(1 - p[0, 0]),
                "types": dict(zip(TYPES, p[0].round(4).tolist())),
                "words": [[w, round(float(log_odds[0] - log_odds[i + 1]), 3)] for i, w in enumerate(words)]}


class PhotoModel:
    """Uzsaldytas CLIP ViT-L/14 ir logistine regresija is trecio darbo: ar nuotrauka sugeneruota DI."""

    CUT = 0.67  # riba parinkta pagal validacija treciame darbe
    PRESET = "hf://keras/clip_vit_large_patch14"

    def __init__(self, path=MODELS / "clip_logreg.joblib"):
        self.clip = keras_hub.models.CLIPBackbone.from_preset(self.PRESET)
        self.to_clip = keras_hub.layers.CLIPImageConverter.from_preset(self.PRESET)  # centrinis kvadratas 224x224, kaip mokant
        self.logreg = joblib.load(path)

    def check(self, data_url):
        raw = base64.b64decode(data_url.split(",", 1)[-1], validate=True)
        im = ImageOps.exif_transpose(Image.open(io.BytesIO(raw))).convert("RGB")  # telefono nuotraukas pasukam kaip rodomos
        with torch.no_grad():
            e = keras.ops.convert_to_numpy(self.clip.get_vision_embeddings(keras.ops.stack([self.to_clip(np.asarray(im, dtype="float32"))])))
        e = e / np.linalg.norm(e, axis=1, keepdims=True)  # mokant vektoriai irgi buvo normuoti
        p_ai = float(self.logreg.predict_proba(e)[0, 1])
        return {"p_ai": p_ai, "ai": p_ai >= self.CUT, "cut": self.CUT}
