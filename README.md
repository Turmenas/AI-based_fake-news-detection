# AI-based fake news detection

Internship ML assignment.

## Setup (Windows)

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
```

## Data

The task 1 notebook (`notebooks/01_ml_model.ipynb`), the neural networks (`notebooks/02_neural_network.ipynb`), the six-class title classifier (`notebooks/04_text_classification.ipynb`) and the logistic regression vs random forest comparison (`notebooks/06_model_comparison.ipynb`) use **Fakeddit**, a dataset of Reddit posts labelled fake or real:

> Kai Nakamura, Sharon Levy, William Yang Wang. *r/Fakeddit: A New Multimodal Benchmark Dataset for Fine-grained Fake News Detection.* LREC 2020. [arXiv:1911.03854](https://arxiv.org/abs/1911.03854) · [GitHub](https://github.com/entitize/Fakeddit)

## Headline Checker app

A web page styled as a news magazine (FACT). The reader writes a headline on page 2 and glues in its photo; page 3 shows whether the headline reads like fake news (DistilBERT from `notebooks/02_neural_network.ipynb`) and whether the photo looks AI-generated (CLIP + logistic regression from `notebooks/03_image_recognition.ipynb`). A FastAPI service in `app/` runs the models.

```powershell
.\.venv\Scripts\python -m uvicorn app.main:app
```

Then open http://127.0.0.1:8000, or double-click `run.bat`, which starts the server in its own window and opens the browser once the models are loaded. It needs `models/distilbert_6way.keras` and `models/clip_logreg.joblib` from those notebooks. The first start loads both models, which takes about a minute.

- `app/static/scenes/<place>/` holds the background photos, picked at random on each load, and `app/static/scenes/<place>/audio/` the matching background sounds (not in the repository). `app/static/covers/` holds cover images.
- Background photos from [Unsplash](https://unsplash.com/license): Daan Evers (café), Yasir Ekinci (city), Mark Harpur and Mike Benna (nature).
- `python -m app.check_app` checks that both models load and answer as expected.
