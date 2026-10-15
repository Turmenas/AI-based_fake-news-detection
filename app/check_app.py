# Greita patikra, ar modeliai kraunasi ir atsako kaip tikimasi. Paleisti is projekto saknies: python -m app.check_app
import base64, io

from PIL import Image

from app.models import HeadlineModel, PhotoModel, clean

assert clean("PD: Phoenix car thief gets instructions from YouTube video") == "pd phoenix car thief gets instructions from youtube video"  # poros is Fakeddit testo
assert clean("Manhattan explosion leaves 29 hurt; 2nd device probed") == "manhattan explosion leaves hurt nd device probed"

h = HeadlineModel().check("New Study Finds Most Of Earth's Oxygen Used For Complaining")  # The Onion antraste is testo duomenu
assert h["p_fake"] > .99 and max(h["types"], key=h["types"].get) == "satire/parody", h
assert max(h["words"], key=lambda w: w[1])[0] == "Study", h["words"]

buf = io.BytesIO(); Image.new("RGB", (640, 480), (90, 120, 160)).save(buf, "PNG")
p = PhotoModel().check("data:image/png;base64," + base64.b64encode(buf.getvalue()).decode())
assert 0 <= p["p_ai"] <= 1 and p["cut"] == .67, p
print("ok", round(h["p_fake"], 4), round(p["p_ai"], 3))
