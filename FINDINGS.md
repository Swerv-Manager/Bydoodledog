# ByDoodleDog.dk — forudbestillingsprodukt vises som UDSOLGT

Produkt: `bjork-bilsaede-til-hunde-mork-brun` (`14881288880504`), variant `54928991027576`.
Live tema: `Shophelten | Størrelsesguide` (`178461311352`).

## Kort version

Årsagen er **ikke** fundet. Den afgørende måling — hvad Liquid faktisk ser — kunne ikke tages
fra dette miljø, fordi udgående netværk til `www.bydoodledog.dk` og
`doodle-dog-dk.myshopify.com` er blokeret af egress-policy (403 på CONNECT, både curl og
WebFetch). Proben er bygget og installeret, så målingen kan tages med ét klik.

Til gengæld er to af briefets slutninger falsificeret, og et af de foreslåede spor er
udelukket. Det ændrer hvor man skal lede.

## Verificeret fra Admin API (uafhængigt genmålt)

Alt på datasiden siger købbar. Intet fundet der modsiger det:

| Felt | Værdi |
|---|---|
| `status` | ACTIVE |
| `availableForSale` | true |
| `inventoryPolicy` | CONTINUE |
| `inventoryQuantity` | 0 (`on_hand` 3, `committed` 3) |
| Varianter | **1** — `Default Title` |
| Lokation | `Systemvej 4, hal 1` — `isActive` true, `fulfillsOnlineOrders` true |
| Publikationer | Webshop ✓, DK-markedskatalog (`194555740465`) ✓ |
| `sellingPlanGroupCount` | 0 |
| Markeder | DK (primært) og SE, begge enabled, begge ACTIVE katalog |

Kontrolproduktet `bjork-bilsaede-til-hunde-graa` er identisk på alt (samme skabelon,
samme publikationer, samme katalog) bortset fra DENY + lager 75. Der er altså ingen
markeds-, katalog-, lokations- eller publiceringsforskel at forklare fejlen med.

## Falsificeret: aria-label-argumentet

Briefet slutter af HTML'en

```html
<button ... aria-label="Tilføj til kurven " ... disabled="" data-add-to-cart="">
```

at `{%- elsif show_sold_out_button -%}`-grenen i Liquid må have kørt, fordi aria-label
stadig siger "Tilføj til kurven" mens teksten siger "Udsolgt".

Det holder ikke. `assets/variants.js` → `updateAddButton()` har tre grene:

- `!variant` → sætter `disabled` **og** overskriver `aria-label` til *unavailable*
- `variant.available` → fjerner `disabled`, sætter `aria-label` til *addToCart*
- **else (udsolgt) → sætter `disabled` og teksten til "Udsolgt", men rører aldrig `aria-label`**

Den tredje gren producerer nøjagtig den observerede HTML. Uoverensstemmelsen mellem
aria-label og synlig tekst skelner altså **ikke** mellem Liquid og JavaScript — begge
veje giver præcis samme resultat.

Dertil: `aria-haspopup="dialog"` findes ikke i `snippets/buy-buttons.liquid` (hele filen
er læst igennem). Den optræder kun på quick-add-knappen i `snippets/product-card.liquid`.
Enten er den observerede HTML aflæst efter JS har kørt, eller også er den kopieret fra et
produktkort og ikke fra sidens hovedknap. Det bør afklares — brug `view-source:`, ikke
DevTools' Elements-panel.

## Udelukket: JavaScript kan ikke være årsagen *på denne side*

`snippets/product-variant-picker.liquid` pakker hele variantvælgeren ind i:

```liquid
{%- unless product.has_only_default_variant -%}
  <variant-radios> / <variant-selects> ...
{%- endunless -%}
```

Produktet har kun `Default Title`. Derfor renderes `<variant-selects>` **ikke**,
`VariantSelects` instantieres aldrig, og `updateAddButton()` kører aldrig på
produktsiden. `disabled` kommer altså fra Liquid.

Det efterlader kun to muligheder, præcis som briefet formulerede dem — men nu med
JS-sporet lukket:

1. Liquid ser `variant.available == false`
2. Liquid ser `inventory_policy` som noget andet end `'continue'`

Bemærk: `/products/….js` **eksponerer ikke `inventory_policy`**. Briefets `CONTINUE`
kommer fra Admin API. Der findes derfor endnu ingen måling af hvad *Liquid* ser for det
felt. Det er hullet proben lukker.

## Gennemgået kode — alle fire veje er korrekte

Alle steder der kan skrive "Udsolgt" bruger `available`, ikke lagerantal:

| Fil | Logik | Vurdering |
|---|---|---|
| `snippets/buy-buttons.liquid` | `available == false or quantity_rule_soldout` | korrekt |
| `snippets/product-card.liquid` (badge-klasse) | `{% unless product.available %}` | korrekt |
| `snippets/product-card.liquid` (quick-add) | `available == false` | korrekt |
| `snippets/product-tags.liquid` (kort-badge) | `product.available == false` | korrekt |

Ingen af dem bruger `inventory_quantity <= 0` som udsolgt-kriterium. Det betyder at
"udsolgt alle steder på sitet" er **ét symptom med én årsag** — `available` er falsk i
Liquid — og ikke fire uafhængige fejl. `snippets/quick-shop-drawer.liquid` kalder
`{% render 'buy-buttons' %}`, altså isoleret scope, ingen variabellækage.

## Fundet undervejs: latent fejl i buy-buttons.liquid

`quantity_rule_soldout` initialiseres aldrig til `false`. `show_sold_out_button` og
`check_against_inventory` sættes eksplicit; `quantity_rule_soldout` tildeles kun i den
gren hvor den bliver sand. Ufarligt i dag, fordi `{% render %}` giver isoleret scope —
men det er en fælde hvis nogen skifter til `include`. Patch ligger i
`theme/snippets/buy-buttons.PATCH.md`.

## Næste skridt — kør proben

`templates/product.swervdebug.liquid` er installeret på det upublicerede tema
**`Kopi af Shophelten | Størrelsesguide` (`178706907512`)**, som er en byte-identisk
kopi af live (`buy-buttons.liquid` er 21.378 bytes begge steder).

Den kunne ikke lægges på live-temaet herfra: Shopify-MCP-laget blokkerer skrivning til
MAIN-temaet. Filen ligger i `theme/templates/product.swervdebug.liquid` og kan indsættes
i live via admin → Temaer → Rediger kode, hvis målingen skal tages på live.

Kør:

```
/products/bjork-bilsaede-til-hunde-mork-brun?view=swervdebug&preview_theme_id=178706907512
/products/bjork-bilsaede-til-hunde-graa?view=swervdebug&preview_theme_id=178706907512
```

Proben er inert: den renderer kun når `?view=swervdebug` skrives manuelt. Den viser
felterne i `[kantede parenteser]`, så efterstillede mellemrum og forkert casing er
synlige, og den renderer **den rigtige `buy-buttons`-snippet** og rapporterer
`RIGTIG_SNIPPET_SKRIVER_UDSOLGT=JA/NEJ`. Da `{%- layout none -%}` betyder at ingen
JavaScript kører, er det svar rent server-side facit.

### Sådan læses det

| Fund | Betydning | Handling |
|---|---|---|
| `variant_available=[false]` | Shopify anser selv varianten for utilgængelig trods CONTINUE | Datasiden — ikke temakoden. Alt Admin-synligt er allerede tjekket og rent, så det peger på noget kontekstafhængigt |
| `inventory_policy` ≠ `continue` | Liquid ser en anden policy end Admin API | Markeds-/katalogforhold |
| `RIGTIG_SNIPPET_SKRIVER_UDSOLGT=NEJ` | Serveren renderer knappen **tændt** | Så er "Udsolgt" påført af JavaScript eller en app efter load — ikke af temaets Liquid |
| Alt korrekt + `SHOW_SOLD_OUT_BUTTON=false` | Knappen kommer ikke fra denne kodesti | Find den rigtige renderingsvej |

## Oprydning, ikke udført

- `Swerv // DEBUG udsolgt 27-08-2026` (`178706973048`) kan slettes. **Ikke gjort** —
  MCP-laget blokkerer sletning af temaer. Gøres i admin → Temaer.
- `templates/product.swervdebug.liquid` slettes fra `178706907512` når målingen er taget.

## Sidebemærkning (uden for opgaven)

`theme.countdown_date` står til `2025-09-08T16:00:00Z`, knap et år tilbage i tiden, mens
produktsiden har en nedtællingsblok "☀️ Summer Sale Slutter Om". `product-card.liquid`
renderer kun nedtællingen når `show_countdown` er sat **og** metafeltet ikke er blankt —
den tjekker ikke om datoen er passeret. Bør efterses særskilt.
