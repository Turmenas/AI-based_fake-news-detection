# AI-based fake news detection

Internship ML assignment: multimodal (text + image) fake news detection trained on [Fakeddit](https://github.com/entitize/Fakeddit), evaluated additionally on a fresh 2025–26 Reddit test set.

## Setup (Windows, NVIDIA GPU)

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cu128
.\.venv\Scripts\python -m pip install -r requirements.txt
```

Keras runs on the PyTorch backend: set `os.environ["KERAS_BACKEND"] = "torch"` before importing keras.

Reddit API keys go in `.env` (git-ignored): `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_USER_AGENT`.

## Layout

- `data/` – datasets (git-ignored)
- `notebooks/` – experiments per task
- `models/` – saved models
- `app/` – Streamlit demo
- `report/` – write-up
