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

- `app/static/scenes/<place>/` holds the background photos, picked at random on each load, and `app/static/scenes/<place>/audio/` the matching background sounds. `app/static/covers/` holds cover images (with the credit shown on the cover in `covers/credits.json`) and `app/static/sfx/` the page-turn sound. File names don't matter: the app lists these folders every time the page loads.
- Background photos from [Unsplash](https://unsplash.com/license): Daan Evers (café), Yasir Ekinci (city), Mark Harpur and Mike Benna (nature).
- Fonts (Besley, Bodoni Moda, Caveat, Libre Franklin, Source Serif 4) from [Google Fonts](https://fonts.google.com/), [SIL Open Font License 1.1](https://openfontlicense.org/), stored in `app/static/fonts/`.
- Page turning: [StPageFlip](https://github.com/Nodlik/StPageFlip) 2.0.7 (MIT licence), bundled as `app/static/page-flip.js`.
- Background sounds and the page-turn sound from [Pixabay](https://pixabay.com/service/license-summary/).
- Cover photos from [Wikimedia Commons](https://commons.wikimedia.org/), resized and cropped to the cover shape (`aldrin-moon.jpg`, `march-on-washington.jpg` and `everson-museum-stairs.jpg` are also extended at the top with their plain sky or wall colour):
  - `aldrin-moon.jpg`: [Buzz Aldrin on the Moon, 1969](https://commons.wikimedia.org/wiki/File:Buzz_Aldrin_by_Neil_Armstrong.jpg), Neil Armstrong, NASA, public domain
  - `moon-landing-newspaper.jpg`: [Girl reading the Moon landing newspaper, 1969](https://commons.wikimedia.org/wiki/File:Land_on_the_Moon_7_21_1969-repair.jpg), Jack Weir, public domain
  - `reagan-berlin-wall.jpg`: [Ronald Reagan's Berlin Wall speech, 1987](https://commons.wikimedia.org/wiki/File:President_Ronald_Reagan_Making_His_Berlin_Wall_Speech_at_Brandenburg_Gate_West_Berlin_-_DPLA_-_dce9b53e6ef9b7e01d184ce61f78871b.jpg), White House Photographic Office, public domain
  - `robert-kennedy-rally.jpg`: [Robert Kennedy at a CORE rally, 1963](https://commons.wikimedia.org/wiki/File:Robert_Kennedy_CORE_rally_speech2.jpg), Warren K. Leffler, public domain
  - `pankhurst-arrest.jpg`: [Emmeline Pankhurst arrested outside Buckingham Palace, 1914](https://commons.wikimedia.org/wiki/File:Mrs_Emmeline_Pankhurst,_Leader_of_the_Women%27s_Suffragette_movement,_is_arrested_outside_Buckingham_Palace_while_trying_to_present_a_petition_to_King_George_V_in_May_1914._Q81486.jpg), unknown author, public domain
  - `churchill-v-sign.jpg`: [Winston Churchill's V sign](https://commons.wikimedia.org/wiki/File:Churchill_V_sign_HU_55521.jpg), unknown author, public domain
  - `hindenburg.jpg`: [Hindenburg disaster, 1937](https://commons.wikimedia.org/wiki/File:Hindenburg_disaster,_1937.jpg), Murray Becker, Associated Press, public domain
  - `reagan-gorbachev-geneva.jpg`: [Reagan and Gorbachev at the Geneva Summit, 1985](https://commons.wikimedia.org/wiki/File:President_Ronald_Reagan_and_Mikhail_Gorbachev_at_The_Geneva_Summit_Joint_Statement_in_Geneva_Switzerland_-_DPLA_-_afdc59fa6900274f57d8fa0d6f3a0be8.jpg), White House Photographic Office, public domain
  - `march-on-washington.jpg`: [March on Washington, 1963](https://commons.wikimedia.org/wiki/File:March_on_Washington_edit.jpg), Warren K. Leffler, public domain
  - `berlin-wall-juggler.jpg`: [Juggling on the Berlin Wall, 1989](https://commons.wikimedia.org/wiki/File:Juggling_on_the_Berlin_Wall_1a.jpg), Yann Forget (edited version), [CC BY-SA 3.0](http://creativecommons.org/licenses/by-sa/3.0/)
  - `vilnius-rally-1988.jpg`: [Rally against the Molotov-Ribbentrop Pact, Vilnius, 23 August 1988](https://commons.wikimedia.org/wiki/File:A_rally_in_Lithuania_commemorate_and_condemn_the_Molotov-Ribbentrop_Pact,_August_23,_1988,_Vilnius,_Vingis_Park.jpg), Lithuanian Central State Archives, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0)
  - `petit-journal-1908.jpg`: [Le Petit Journal cover on the Balkan crisis, 1908](https://commons.wikimedia.org/wiki/File:Le_Petit_Journal_Balkan_Crisis_(1908).jpg), unknown author, public domain
  - `nixon-contact-sheet.jpg`: [Richard Nixon contact sheet](https://commons.wikimedia.org/wiki/File:Nixon_Contact_Sheet_WHPO-E3392.jpg), Karl Schumacher, public domain
  - `dagestani-couple.jpg`: [Dagestani man and woman](https://commons.wikimedia.org/wiki/File:Dagestani_man_and_woman.jpg), Sergei Prokudin-Gorskii, public domain
  - `svaneti-elder.jpg`: [Old man in Mestia, Svaneti](https://commons.wikimedia.org/wiki/File:Old_peasant_with_dagger_and_long_smoking_pipe,_Mestia,_Svanetia,_Georgia_(Republic).jpg), unknown photographer, restored by Adam Cuerden, public domain
  - `bearded-man.jpg`: [Bearded man with long hair](https://commons.wikimedia.org/wiki/File:Bearded_man_with_long_hair-3052641.jpg), subhamshome28, [CC0](http://creativecommons.org/publicdomain/zero/1.0/deed.en)
  - `newspaper-reader-basantapur.jpg`: [Old man reading a newspaper, Basantapur](https://commons.wikimedia.org/wiki/File:Old_man_reading_newspaper_early_in_the_morning_at_Basantapur-IMG_6800.jpg), Bijay Chaurasia, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0)
  - `hotel-national-stairway.jpg`: [Hotel National stairway, Moscow](https://commons.wikimedia.org/wiki/File:Moscow_Hotel_National_stairway_asv2018-09.jpg), A. Savin, [FAL](http://artlibre.org/licence/lal/en)
  - `le-havre-pier.jpg`: [Digue Nord pier, Le Havre](https://commons.wikimedia.org/wiki/File:Digue_N_-_Le_Havre_03.jpg) by Pedemann, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0)
  - `wroclaw-cathedral-1945-today.jpg`: Wrocław Cathedral nave in 1945 and today (collage): [1945](https://commons.wikimedia.org/wiki/File:Interior_of_the_main_Nave_of_Wroclaw_Cathedral.jpg) by unknown author, public domain; [today](https://commons.wikimedia.org/wiki/File:Wroc%C5%82aw_Cathedral.jpg) by Krigore, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0); the collage is shared under CC BY-SA 4.0
  - `puddle-reflection.jpg`: [Reflection of three people in a puddle](https://commons.wikimedia.org/wiki/File:Reflection_of_three_people_in_a_rainwater_puddle.jpg) by Gorillo.Chimpo, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0)
  - `flamingo-golden-hour.jpg`: [Flamingo in golden hour, Pulicat](https://commons.wikimedia.org/wiki/File:Flamingo_in_Golden_Hour.jpg) by BKadhiravan, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0)
  - `national-theatre-london.jpg`: [National Theatre, London](https://commons.wikimedia.org/wiki/File:National_Theatre_London_2026_01.jpg) by Julian Herzog, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0)
  - `everson-museum-stairs.jpg`: [Everson Museum of Art stairs, Syracuse](https://commons.wikimedia.org/wiki/File:Everson_Museum_of_Art,_Syracuse,_New_York,_1969,_currently_digitized.jpg) by Hartmut Schmidt Heidelberg, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0)
  - `christiania-signpost.jpg`: [Signpost in Christiania, Copenhagen](https://commons.wikimedia.org/wiki/File:Signpost_Christiania_Copenhagen.jpg) by Gzzz, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0)
  - `menhirs-a-coruna.jpg`: [Menhirs for Peace, A Coruña](https://commons.wikimedia.org/wiki/File:Menhires_pola_Paz_A_Coru%C3%B1a_Espa%C3%B1a.jpg) by Fischer1961, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0)
- `python -m app.check_app` checks that both models load and answer as expected.
