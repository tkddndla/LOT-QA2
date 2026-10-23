import re

with open("raw_gas.html", "r", encoding="utf-8") as f:
    text = f.read()

pos = text.find('{"html":"')
if pos != -1:
    end_pos = text.find('","ncc":', pos)
    if end_pos != -1:
        raw_str = text[pos + len('{"html":"') : end_pos]
        # decode hex escapes like \x3c and unicode escapes like \u003c
        # Replace \x.. with python recognizable escape or decode
        import codecs
        decoded = codecs.decode(raw_str, 'unicode_escape')
        with open("extracted_app.html", "w", encoding="utf-8") as out:
            out.write(decoded)
        print("Success! Extracted length:", len(decoded))
    else:
        print("Could not find ncc end pos")
else:
    print("Could not find html start")
