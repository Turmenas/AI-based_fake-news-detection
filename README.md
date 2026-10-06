# AI-based fake news detection

Internship ML assignment.

## Setup (Windows, NVIDIA GPU)

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cu128
.\.venv\Scripts\python -m pip install -r requirements.txt
```

Keras runs on the PyTorch backend: set `os.environ["KERAS_BACKEND"] = "torch"` before importing keras.
