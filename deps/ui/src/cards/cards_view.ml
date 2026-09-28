(* Flashcards modal view — #cards-modal > selector row + card list.
   Mirrors cljs fsrs.cljs :div#cards-modal markup. *)

open Lui_elements
open Logseq_dom

let t_ (s : string) = s
let icon name = dom ~tag:"i" ~style_class:("ti ti-" ^ name) []

let opt_row st i label =
  dom ~key:("opt-" ^ string_of_int i) ~attrs:[ ("role", "option") ]
    ~events:"click"
    ~on_dom_event:(fun name _ ->
      if name = "click" then Cards_state.select_deck st i)
    [ text ~key:"l" ~value:label [] ]

let opts_box st =
  dyn ~equal:(fun (a : Cards_state.deck list * bool) b -> a = b)
    (fun (decks, opts_open) ->
      if not opts_open then dom ~key:"opts-closed" []
      else
        let options =
          opt_row st (-1) (t_ "All cards")
          :: List.mapi
               (fun i d -> opt_row st i d.Cards_state.deck_label)
               decks
        in
        dom ~key:"opts" ~attrs:[ ("role", "listbox") ]
          ~style_class:
            "absolute z-50 top-full left-0 w-full rounded-md border \
             bg-popover text-popover-foreground shadow-md"
          options)
    (Signal.map2 (fun a b -> (a, b)) (Signal.value st.Cards_state.decks)
       (Signal.value st.Cards_state.opts_open))

let selector_row st =
  dom ~key:"sel-row" ~style_class:"flex flex-row items-center gap-2"
    [ dom ~key:"combo"
        ~attrs:[ ("role", "combobox") ]
        ~events:"click"
        ~on_dom_event:(fun name _ ->
          if name = "click" then Cards_state.toggle_opts st)
        ~style_class:"!px-2 !py-0 !h-8 w-64 relative"
        [ opts_box st ]
    ; dom ~key:"add" ~tag:"button" ~id:"ls-cards-add"
        ~attrs:[ ("title", t_ "Add cards query") ]
        ~style_class:"!px-1 text-muted-foreground"
        ~events:"click"
        ~on_dom_event:(fun name _ ->
          if name = "click" then Cards_state.add_cards_block st)
        [ icon "plus" ]
    ; dyn ~equal:(fun (a : int * string list) b -> a = b)
        (fun (pos, cards) ->
          let n = List.length cards in
          let cur = if n = 0 then 0 else min (pos + 1) n in
          dom ~key:"prog" ~tag:"span"
            ~style_class:"text-sm opacity-50 whitespace-nowrap"
            [ text ~key:"t" ~value:(Printf.sprintf "%d/%d" cur n) [] ])
        (Signal.map2 (fun a b -> (a, b)) (Signal.value st.Cards_state.pos)
           (Signal.value st.Cards_state.cards))
    ]

let card_items cards =
  List.mapi
    (fun i title ->
      dom ~key:("card-" ^ string_of_int i)
        ~style_class:"ls-card content flex flex-col overflow-hidden"
        [ dom ~key:"scroll"
            ~style_class:
              "ls-card-scroll flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
            [ text ~key:"t" ~value:title [] ] ])
    cards

let cards_body st =
  dyn ~equal:(fun (a : string list) b -> a = b)
    (fun cards ->
      match cards with
      | [] ->
          dom ~key:"empty" ~style_class:"ls-card content ml-2"
            [ dom ~key:"h" ~tag:"h2" ~style_class:"font-medium"
                [ text ~key:"t" ~value:(t_ "No cards") [] ] ]
      | _ ->
          dom ~key:"cards" ~style_class:"flex flex-col flex-1 min-h-0"
            (card_items cards))
    (Signal.value st.Cards_state.cards)

let modal st =
  dom ~key:"cards-modal" ~id:"cards-modal"
    ~style_class:"flex flex-col gap-8 flex-1 min-h-0"
    [ selector_row st; cards_body st ]

let render (ms : Model.t Signal.signal) : t =
  let st = Cards_state.init ms in
  dyn ~equal:(fun a b -> a = b)
    (fun open_ -> if open_ then modal st else dom ~key:"cards-closed" [])
    (Signal.value st.Cards_state.open_)
