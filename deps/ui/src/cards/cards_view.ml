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
        dom ~key:"opts" ~attrs:[ ("role", "listbox") ] options)
    (Signal.map2 (fun a b -> (a, b)) (Signal.value st.Cards_state.decks)
       (Signal.value st.Cards_state.opts_open))

let selector_row st =
  dom ~key:"sel-row" ~style_class:"flex flex-row items-center gap-2"
    [ dom ~key:"combo"
        ~attrs:[ ("role", "combobox") ]
        ~events:"click"
        ~on_dom_event:(fun name _ ->
          if name = "click" then Cards_state.toggle_opts st)
        ~style_class:"!px-2 !py-0 !h-8 w-64"
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

let rating_btn st rating =
  let label, id =
    match rating with
    | "again" -> (t_ "Again", "card-again")
    | "hard" -> (t_ "Hard", "card-hard")
    | "good" -> (t_ "Good", "card-good")
    | _ -> (t_ "Easy", "card-easy")
  in
  dom ~key:id ~tag:"button" ~id
    ~style_class:"ui__button !px-2 !py-1 border-primary opacity-90"
    ~events:"click"
    ~on_dom_event:(fun name _ -> if name = "click" then Cards_state.rate st)
    [ text ~key:"t" ~value:label [] ]

let rating_btns st =
  dom ~key:"ratings"
    ~style_class:"flex flex-row items-center gap-8 flex-wrap"
    (List.map (rating_btn st) [ "again"; "hard"; "good"; "easy" ])

(* cljs card-view: current card + "Show answers" (init) or the rating row
   (show-answer) *)
let current_card st =
  dyn ~equal:(fun (a : int * bool * string list) b -> a = b)
    (fun (pos, revealed, cards) ->
      match List.nth_opt cards pos with
      | None ->
          dom ~key:"empty" ~style_class:"ls-card content ml-2"
            [ dom ~key:"h" ~tag:"h2" ~style_class:"font-medium"
                [ text ~key:"t" ~value:(t_ "No cards") [] ] ]
      | Some title ->
          let actions =
            if revealed then rating_btns st
            else
              dom ~key:"reveal" ~tag:"button" ~id:"card-answers"
                ~style_class:"ui__button !px-2 !py-1"
                ~events:"click"
                ~on_dom_event:(fun name _ ->
                  if name = "click" then Cards_state.reveal st)
                [ text ~key:"t" ~value:(t_ "Show answers") [] ]
          in
          dom ~key:("card-" ^ string_of_int pos)
            ~style_class:"ls-card content flex flex-col overflow-hidden"
            [ dom ~key:"scroll"
                ~style_class:
                  "ls-card-scroll flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
                [ text ~key:"t" ~value:title [] ]
            ; dom ~key:"acts" ~style_class:"mt-8 pb-2 shrink-0" [ actions ]
            ])
    (Signal.map2
       (fun (a, b) c -> (a, b, c))
       (Signal.map2 (fun a b -> (a, b)) (Signal.value st.Cards_state.pos)
          (Signal.value st.Cards_state.revealed))
       (Signal.value st.Cards_state.cards))

let cards_body st =
  dom ~key:"cards" ~style_class:"flex flex-col flex-1 min-h-0"
    [ current_card st ]

let modal st =
  dom ~key:"cards-modal" ~id:"cards-modal"
    ~style_class:"flex flex-col gap-8 flex-1 min-h-0"
    [ selector_row st; cards_body st ]

let render (ms : Model.t Signal.signal) : t =
  let st = Cards_state.init ms in
  dyn ~equal:(fun a b -> a = b)
    (fun open_ -> if open_ then modal st else dom ~key:"cards-closed" [])
    (Signal.value st.Cards_state.open_)
