# Task 1. Machine learning model: fake news classification

Notebook: [`notebooks/01_ml_model.ipynb`](../notebooks/01_ml_model.ipynb). Saved model: `models/logreg_tfidf.joblib`.

## 1. Dataset

**Fakeddit** (Nakamura et al., 2020) is a collection of Reddit posts labelled by the subreddit they were posted in. Posts from subreddits such as *theonion*, *fakehistoryporn* or *propagandaposters* are labelled fake; posts from *usnews*, *upliftingnews*, *mildlyinteresting* and similar are labelled real. This work uses the multimodal subset (posts that have an image) and only the text and metadata, not the images.

| Split | File | Rows |
|---|---|---|
| Train | `multimodal_train.tsv` | 564,000 |
| Test | `multimodal_test_public.tsv` | 59,319 |

Columns used:

| Column | Meaning |
|---|---|
| `clean_title` | Post title, lowercased, punctuation removed |
| `score` | Upvotes minus downvotes |
| `num_comments` | Number of comments |
| `upvote_ratio` | Share of votes that are upvotes |
| `2_way_label` | Target: **0 = fake, 1 = real** |

Findings from exploration (training split):

* **Class balance:** 60.6% fake, 39.4% real. Moderately imbalanced, so accuracy alone is not enough and a majority-class guess already scores about 61%.
* **Title length:** fake titles are shorter (median 5 words) than real ones (median 9 words). Many fake posts are short image captions.
* **Subreddits:** 22 subreddits; every one is either 100% fake or 100% real (figure `subreddits.png`). The label is effectively the subreddit name.
* **Missing values:** `num_comments` and `upvote_ratio` are missing for 167,857 rows (29.8%), and all of them are from one fake subreddit, `psbattle_artwork`. `score` has a few negative values (minimum -236).

![Class balance](figures/class_balance.png)
![Title length](figures/title_length.png)
![Posts per subreddit](figures/subreddits.png)

## 2. Data preparation

1. **Load only needed columns** (`usecols`), to keep memory use low on a 16 GB machine.
2. **Drop leaking and irrelevant columns.** `subreddit` is dropped because it determines the label exactly; a model given it would score ~100% while learning nothing about the text. `author`, `id` and `image_url` are identifiers and are not loaded at all.
3. **Sample.** 40,000 random training rows and 10,000 random test rows (`random_state=42`), taken from the official train and public test files, so the two sets never overlap. The class shares in both samples match the full files.
4. **Text features.** `clean_title` is turned into TF-IDF vectors: unigrams and bigrams, English stop words removed, terms appearing in fewer than 2 titles dropped, sublinear term frequency. This gives a vocabulary of 22,155 terms.
5. **Numeric features.** `score`, `num_comments`, `upvote_ratio`: missing values filled with the training median, negative values clipped to 0, `log1p` applied (counts are heavily right-skewed: `score` goes up to 137,179 while the median is 14), then standardised.
6. **One pipeline.** Steps 4 and 5 are combined with a `ColumnTransformer` and put in a single scikit-learn `Pipeline` together with the classifier, so all fitting (vocabulary, medians, scaling) uses the training data only, and the saved model takes raw rows as input.

## 3. Algorithm: logistic regression

`LogisticRegression(class_weight="balanced", max_iter=1000)`.

Reasons for the choice:

* **Suits sparse, high-dimensional text.** TF-IDF produces tens of thousands of sparse features. Linear models are a strong, standard baseline for this kind of input and train in seconds.
* **Interpretable.** Each word has one coefficient, so we can show which words push a prediction towards fake or real (section 4.3). This matters for a fake-news tool, where users should be able to see why a post was flagged.
* **Probabilistic output.** It returns a probability, so the decision threshold can be moved later if missing fake news is costlier than false alarms.
* **Handles imbalance simply.** `class_weight="balanced"` weights errors on the smaller (real) class more, so the model does not just favour the majority class.
* **Regularised by default** (L2, `C=1.0`), which limits overfitting to rare words.

## 4. Results

### 4.1 Metrics (test sample, n = 10,000)

| | Precision | Recall | F1 | Support |
|---|---|---|---|---|
| Fake | 0.863 | 0.826 | 0.844 | 6,071 |
| Real | 0.748 | 0.797 | 0.772 | 3,929 |
| Macro avg | 0.805 | 0.811 | 0.808 | 10,000 |

* **Accuracy: 81.5%**, against **60.7%** for always predicting "fake".

### 4.2 Confusion matrix

| | Predicted fake | Predicted real |
|---|---|---|
| **Actual fake** | 5,013 | 1,058 |
| **Actual real** | 797 | 3,132 |

![Confusion matrix](figures/confusion_matrix.png)

The more frequent error is fake posts classified as real (1,058, i.e. 17% of fake posts are missed).

### 4.3 Most informative words

| Fake word | Coefficient | Real word | Coefficient |
|---|---|---|---|
| circa | -5.35 | police | 5.15 |
| poster | -4.06 | sign | 4.59 |
| discussions | -3.86 | yearold | 4.02 |
| cutouts | -3.84 | says | 3.85 |
| available | -2.89 | cancer | 3.61 |
| mrw | -2.88 | homeless | 3.47 |
| soviet | -2.79 | restaurant | 3.38 |
| dont | -2.60 | store | 3.21 |
| happy | -2.57 | growing | 3.11 |
| imgur | -2.49 | court | 3.11 |
| nsfw | -2.47 | arrested | 3.10 |
| til | -2.46 | charged | 3.09 |
| oh | -2.40 | tree | 3.08 |
| shit | -2.38 | woman | 3.02 |
| believe | -2.37 | hotel | 2.99 |

![Top words](figures/top_words.png)

Metadata coefficients (on standardised values): `num_comments` +0.77, `upvote_ratio` -0.64, `score` -0.21.

## 5. Conclusions

* A TF-IDF + logistic regression model reaches **81.5% accuracy and 0.81 macro F1** on held-out Fakeddit posts, about 21 points above the majority-class baseline, using only the title and three engagement numbers.
* The top words show the model mostly learns the **style of each source community**, not whether a claim is true. "circa" and "soviet" come from *fakehistoryporn*, "poster" from *propagandaposters*, "mrw" and "til" from meme-style captions; real-side words like "police", "arrested", "court", "charged" are typical news headline vocabulary. So the model detects "looks like a satire/meme post" versus "looks like a news headline or ordinary photo", which is what Fakeddit's subreddit-based labels reward.
* **Limitations:**
  * Labels come from subreddits, not fact-checking, so performance here does not mean the model can verify individual claims.
  * The missing engagement values all belong to one fake subreddit, so the metadata features carry a small amount of source leakage even after imputation.
  * Only 40k of the 564k training rows were used; titles are short, so many posts carry little textual signal.
  * The model sees no images, although the dataset is multimodal and many "fake" posts are fake because of the image.
