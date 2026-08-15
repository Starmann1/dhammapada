# Credits, Attribution & Copyright

This project combines original software written for **The Dhammapada** with third-party software, external services, fonts, images, and Buddhist textual resources. This file records the sources currently identified in the repository.

> **Important:** Acknowledging a source is not, by itself, a statement that every underlying work is freely redistributable. Where a third-party resource has its own copyright or licence terms, those terms remain applicable. Verify the upstream licence/permission before redistributing or republishing the corresponding material.

## 1. Project software

**The Dhammapada** is the software project contained in this repository.

Repository: https://github.com/Starmann1/dhammapada

The repository currently has **no GitHub licence declared**. Unless a licence is added to the repository, copyright in original project code remains with its respective copyright holder(s), subject to any rights that apply to third-party material included in the repository.

## 2. Buddhist textual and scholarly resources

The application identifies the following resources as sources for its Dhammapada content:

### SuttaCentral

Used/acknowledged for Pali source text and English translation material, including translations associated with Bhikkhu Sujato.

- Website: https://suttacentral.net/
- Project acknowledgement: `README.md` and `docs/tech_stack.md`
- Attribution note: consult SuttaCentral and the individual text/translation pages for the licence and attribution requirements applicable to each work. Do not assume that the licence of one SuttaCentral resource applies to every item hosted there.

### Ancient Buddhist Texts — Ānandajoti Bhikkhu

Used/acknowledged for interlinear word meanings and commentary-related material associated with *Dhammapada: Annotated Pali Text and Translation*.

- Website: https://ancient-buddhist-texts.net/
- Dhammapada collection: https://ancient-buddhist-texts.net/Texts-and-Translations/Dhammapada/index.htm
- Attribution: **Ānandajoti Bhikkhu**
- Licence/copyright: retain the upstream copyright and permission conditions stated by the source. Verify the exact terms for the particular text before redistribution.

### Tipitaka.net

Used/acknowledged as a source for the traditional *Dhammapada Atthakatha* stories/commentaries.

- Website: https://www.tipitaka.net/
- Attribution: **Tipitaka.net / underlying Dhammapada Atthakatha source material**
- Licence/copyright: verify the copyright and redistribution terms attached to the particular edition/content used. A website hosting an ancient work does not automatically make a particular digital edition public domain.

## 3. Fonts

The project documentation identifies these Google Fonts families:

- **Inter** — https://fonts.google.com/specimen/Inter
- **Crimson Text** — https://fonts.google.com/specimen/Crimson+Text
- **Playfair Display** — https://fonts.google.com/specimen/Playfair+Display

These fonts are distributed under open font licensing terms. Keep the applicable upstream licence notices when redistributing font files or other bundled font assets.

## 4. Software libraries and frameworks

The backend declares the following Python dependencies in `backend/requirements.txt`:

- **FastAPI** — https://github.com/fastapi/fastapi
- **Uvicorn** — https://github.com/encode/uvicorn
- **PyMongo** — https://github.com/mongodb/mongo-python-driver
- **python-dotenv** — https://github.com/theskumar/python-dotenv

The frontend uses standard web-platform technologies including HTML, CSS, JavaScript, SVG, and browser APIs. The project does not bundle a third-party frontend framework according to its current technology documentation.

Each dependency retains its own copyright and licence. The authoritative licence is the one distributed by the corresponding upstream project/version.

## 5. AI, database, hosting and developer services

The project documentation and source identify the following services/tools:

- **MongoDB / MongoDB Atlas** — https://www.mongodb.com/
- **Groq** — https://groq.com/
- **OpenAI API** (optional provider/configuration path) — https://openai.com/
- **Vercel** — https://vercel.com/
- **Git / GitHub** — https://git-scm.com/ and https://github.com/
- **Visual Studio Code** — https://code.visualstudio.com/
- **Postman / Thunder Client** — used for API testing during development, as documented in `docs/tech_stack.md`.
- **Python** — https://www.python.org/
- **Node.js** — https://nodejs.org/

These are tools/services used to build, run, test, deploy, or support the project. They are not being claimed as part of the original project software.

## 6. Images and visual assets

The repository contains:

- `assets/images/buddha.jpg`
- `assets/images/dharmachakra.png`

The current repository documentation does **not** establish the original creator, source URL, licence, or permission record for these two files. Their provenance should therefore be verified before public redistribution or reuse outside this project.

**Do not label these images as public-domain, Creative Commons, or otherwise freely licensed until their original sources and licences have been confirmed.**

Recommended next step: record the creator, source URL, licence, and attribution text for each image in this section once verified.

## 7. Dhammapada dataset

`data/dhammapada.json` is a substantial project data file containing the textual material used by the application. Its repository provenance is described in `README.md` and `docs/tech_stack.md`, but the JSON file itself does not currently contain machine-readable per-record source/licence metadata.

For responsible redistribution, individual records should ideally retain source/provider metadata and the applicable copyright/licence information. In particular, translations, commentaries, stories, and annotations may have different rights from the ancient underlying Pali text.

## 8. Citation policy for Dhamma AI

The Dhamma AI implementation is designed to cite Dhammapada references in generated answers and to pass source information alongside retrieved context. This is useful for traceability, but an application-generated citation is **not a substitute for the copyright/licence notice of the underlying source**.

When expanding the dataset or adding new translations/commentaries:

1. Record the exact source and edition.
2. Record the author/translator.
3. Record the source URL or bibliographic reference.
4. Record the applicable copyright/licence terms.
5. Preserve required attribution notices.
6. Do not combine separately licensed material under a single blanket licence without checking compatibility.

## 9. Suggested citation

For the software project itself, cite:

> Starmann1. *The Dhammapada*. GitHub repository, https://github.com/Starmann1/dhammapada.

For Buddhist textual material, cite the original source/edition rather than citing this repository as the primary scholarly authority.

## 10. Disclaimer

This file is an attribution and provenance record, not legal advice. Copyright and licence status can differ by translation, edition, dataset record, image, font file, and service. Upstream licence text and source-specific terms should be checked before commercial use, redistribution, republication, or creation of derivative datasets.
