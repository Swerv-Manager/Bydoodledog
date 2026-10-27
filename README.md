# bydoodledog-theme

Shopify-tema-repo til **ByDoodleDog** (Swerv Digital ApS) – Black Month 2026.

## Hvad er det her?
Et snapshot af de **LIVE** Shopify-temaer (taget 27.10.2026) som udgangspunkt for Black Month-implementeringen. Spec og portal-mockups ligger i `docs/`.

## Branches (én pr. marked)
| Branch | Marked | Udgangspunkt (live-tema) | Indhold |
|---|---|---|---|
| `main` | – | – | Kun `README.md` + `docs/` (spec, portal-mockups). Ingen tema-filer. |
| `black-month-dk` | bydoodledog.dk (DKK) | "Swerv \| Doodle15 \| DK \| 02.10.2026", tema-id 178844926328 (opdateret 21.10.2026) | Fuldt DK-tema i repo-roden + `docs/` |
| `black-month-se` | bydoodledog.se (SEK) | "Swerv \| Doodle15 \| SE \| 02.10.2026", tema-id 207454732625 (opdateret 21.10.2026) | Fuldt SE-tema i repo-roden + `docs/` |

Hver branch har sin egen historik (første commit: "Live theme snapshot 2026-10-27"). Tema-filer ligger i repo-roden (`assets/ config/ layout/ locales/ sections/ snippets/ templates/`), som Shopifys GitHub-integration forventer. `docs/` ligger udenfor Shopifys mapper og ignoreres af temaet.

## Sådan bruges det (GitHub ↔ Shopify)
1. Duplikér det live tema i Shopify (så app-embeds og indstillinger følger med) → det duplikat forbindes til GitHub: *Online Store → Themes → Add theme → Connect from GitHub* → repo `bydoodledog-theme`, branch `black-month-dk` (DK-butikken) hhv. `black-month-se` (SE-butikken).
2. Det forbundne tema skal være **IKKE-publiceret**. Kodeagenten arbejder kun i branchen; commits synkroniseres til det upublicerede tema.
3. Læs `docs/SPEC.md` (scope §10, SE-copy §11, Definition of done §12) og mockups i `docs/portal/web/` (r73 er gældende).

## Regler
* **Intet publiceres, ingen live-tema ændres, ingen rabatter/Klaviyo/apps skrives uden Frederiks eksplicitte ok.** Frederik publicerer selv.
* Ingen hemmeligheder i repoet (ingen API-nøgler/tokens).
* Nye filer får præfikset `bm-`; ændringer i eksisterende filer holdes minimale (se `docs/SPEC.md` §7).

## Om eksporten
Temaerne er eksporteret read-only via Shopify Admin API (alle filer inkl. binære assets; ikke-JSON-filer er checksum-verificeret mod Shopifys MD5). JSON-filer leveres af API'et normaliseret med en autogenereret `/* IMPORTANT … */`-kommentar-header (Shopify accepterer den; den er bevaret). `checksumMd5` for JSON kan derfor ikke genskabes bytevist.
