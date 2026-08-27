# Patch: snippets/buy-buttons.liquid

Gælder live-temaet **Shophelten | Størrelsesguide** (`178461311352`) og dets kopi
`178706907512`. Filen er 21.378 bytes; kun `{% liquid %}`-blokken i toppen ændres.

## Hvorfor

`quantity_rule_soldout` bliver **aldrig initialiseret til `false`**. `show_sold_out_button`
og `check_against_inventory` sættes begge eksplicit, men `quantity_rule_soldout` tildeles
kun i den gren hvor den bliver sand. I dag er det ufarligt, fordi `{% render %}` giver
isoleret scope, så variablen starter som `nil` ved hvert kald. Det holder kun så længe
ingen skifter `render` ud med `include` — så lækker en sand værdi fra ét produkt videre
til det næste på samme side.

Anden del af patchen gør `available` til eneste autoritet for udsolgt, som briefet beder om.
En mængderegel skal ikke kunne overrule et produkt Shopify selv anser for købbart.

## Find (linje ~36-49, i `{% liquid %}`-blokken)

```liquid
  assign show_sold_out_button = false
  assign check_against_inventory = true
  if product.selected_or_first_available_variant.inventory_management != 'shopify' or product.selected_or_first_available_variant.inventory_policy == 'continue'
    assign check_against_inventory = false
  endif
  if product.selected_or_first_available_variant.quantity_rule.min > product.selected_or_first_available_variant.inventory_quantity and check_against_inventory
    assign quantity_rule_soldout = true
  endif

  if product.selected_or_first_available_variant.available == false or quantity_rule_soldout
    assign show_sold_out_button = true
  endif
```

## Erstat med

```liquid
  assign show_sold_out_button = false
  assign check_against_inventory = true
  assign quantity_rule_soldout = false
  if product.selected_or_first_available_variant.inventory_management != 'shopify' or product.selected_or_first_available_variant.inventory_policy == 'continue'
    assign check_against_inventory = false
  endif
  if product.selected_or_first_available_variant.quantity_rule.min > product.selected_or_first_available_variant.inventory_quantity and check_against_inventory
    assign quantity_rule_soldout = true
  endif

  comment
    available er eneste autoritet for udsolgt. Et forudbestillingsprodukt med
    inventory_policy 'continue' er koebbart selv ved lager 0, og en maengderegel
    maa ikke kunne overrule det.
  endcomment
  if product.selected_or_first_available_variant.available == false
    assign show_sold_out_button = true
  endif
```

Ændringer: én tilføjet `assign quantity_rule_soldout = false`, og `or quantity_rule_soldout`
fjernet fra den afgørende `if`. `quantity_rule_soldout` bevares og sættes stadig, så
mængderegler kan bruges andetsteds uden at kunne spærre en købbar vare.

## Vigtigt før den lægges på

Denne patch **fjerner ikke årsagen**. Den er hærdning. Hvis probens måling viser
`variant_available=[false]`, ligger fejlen i data/kontekst, ikke i temaet, og så gør
patchen ingen forskel på symptomet. Kør målingen først.

Temaet ejes af Shophelten. Ændrer vi deres kode, overtager vi ejerskabet, og deres næste
opdatering kan overskrive det. Overvej at sende dem probens output i stedet.
