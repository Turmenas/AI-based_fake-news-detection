# AI-based fake news detection

Internship ML assignment.

## Setup (Windows, NVIDIA GPU)

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cu128
.\.venv\Scripts\python -m pip install -r requirements.txt
```

Keras runs on the PyTorch backend: set `os.environ["KERAS_BACKEND"] = "torch"` before importing keras.

## Data

The task 1 notebook (`notebooks/01_ml_model.ipynb`) and the logistic regression vs random forest comparison (`notebooks/06_model_comparison.ipynb`) use **Fakeddit**, a dataset of Reddit posts labelled fake or real:

> Kai Nakamura, Sharon Levy, William Yang Wang. *r/Fakeddit: A New Multimodal Benchmark Dataset for Fine-grained Fake News Detection.* LREC 2020. [arXiv:1911.03854](https://arxiv.org/abs/1911.03854) · [GitHub](https://github.com/entitize/Fakeddit)
