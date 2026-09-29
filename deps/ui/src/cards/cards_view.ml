(* Flashcards modal view — #cards-modal > selector row + card list.
   Mirrors cljs fsrs.cljs :div#cards-modal markup. *)

open Lui_elements
open Logseq_dom

let t_ (s : string) = s
let icon name = Icons.icon name

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

(* fsrs.cljs has-cloze? *)
let has_cloze (s : string) =
  let needle = "{{cloze " in
  let ls = String.length s and ln = String.length needle in
  let rec go i =
    i + ln <= ls && (String.sub s i ln = needle || go (i + 1))
  in
  go 0

(* fsrs.cljs phase->next-phase *)
let next_phase cloze phase =
  match phase with
  | "init" -> if cloze then "show-cloze" else "show-answer"
  | "show-cloze" -> if cloze then "show-answer" else "init"
  | _ -> "init"

let advance_phase st cloze =
  Runtime.signal_set st.Cards_state.phase
    (next_phase cloze (Signal.get_state st.Cards_state.phase))

let rate st rating =
  (* cljs rate-card! persists fsrs/state+due via repeat-card! — the fsrs
     scheduler library is not ported, so only the index/phase advance is;
     see migrate-report.md *)
  ignore rating;
  Runtime.signal_set st.Cards_state.phase "init";
  Runtime.signal_set st.Cards_state.pos
    (Signal.get_state st.Cards_state.pos + 1)

let rating_btn st rating label =
  let id = "card-" ^ rating in
  dom ~key:id ~tag:"button" ~id
    ~style_class:
      (id
       ^ " !px-2 !py-1 bg-primary/5 hover:bg-primary/10 border-primary \
          opacity-90 hover:opacity-100")
    ~events:"click"
    ~on_dom_event:(fun n _ -> if n = "click" then rate st rating)
    [ text ~key:"t" ~value:label [] ]

let rating_buttons st =
  dom ~key:"ratings" ~style_class:"flex justify-center"
    [ dom ~key:"row"
        ~style_class:"flex flex-row items-center gap-8 flex-wrap"
        [ rating_btn st "again" "Again"
        ; rating_btn st "hard" "Hard"
        ; rating_btn st "good" "Good"
        ; rating_btn st "easy" "Easy"
        ]
    ]

let card_view st _pos phase title =
  let cloze = has_cloze title in
  let np = next_phase cloze phase in
  dom ~key:"card-cur"
    ~style_class:"ls-card content flex flex-col overflow-hidden"
    [ dom ~key:"scroll"
        ~style_class:
          "ls-card-scroll flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
        [ text ~key:"t" ~value:title [] ]
    ; dom ~key:"actions" ~style_class:"mt-8 pb-2 shrink-0"
        [ (if np = "show-cloze" || np = "show-answer" then
             dom ~key:"answers" ~tag:"button" ~id:"card-answers"
               ~style_class:"!px-2 !py-1"
               ~events:"click"
               ~on_dom_event:(fun n _ ->
                 if n = "click" then advance_phase st cloze)
               [ text ~key:"t"
                   ~value:
                     (if np = "show-answer" then t_ "Show answers"
                      else if np = "show-cloze" then t_ "Show clozes"
                      else t_ "Hide answers")
                 [] ]
           else rating_buttons st)
        ]
    ]

let cards_body st =
  dyn
    ~equal:(fun (a : string list * int * string) b -> a = b)
    (fun (cards, pos, phase) ->
      match List.nth_opt cards pos with
      | None ->
          dom ~key:"empty" ~style_class:"ls-card content ml-2"
            [ dom ~key:"h" ~tag:"h2" ~style_class:"font-medium"
                [ text ~key:"t"
                    ~value:
                      (t_
                         "Congrats, you've reviewed all the cards for \
                          this query, see you next time!")
                    [] ] ]
      | Some title ->
          dom ~key:"cards" ~style_class:"flex flex-col flex-1 min-h-0"
            [ card_view st pos phase title ])
    (Signal.map2
       (fun (a, b) c -> (a, b, c))
       (Signal.map2
          (fun a b -> (a, b))
          (Signal.value st.Cards_state.cards)
          (Signal.value st.Cards_state.pos))
       (Signal.value st.Cards_state.phase))

let modal st =
  dom ~key:"cards-modal" ~id:"cards-modal"
    ~style_class:"flex flex-col gap-8 flex-1 min-h-0"
    [ selector_row st; cards_body st ]

let render (ms : Model.t Signal.signal) : t =
  let st = Cards_state.init ms in
  dyn ~equal:(fun a b -> a = b)
    (fun open_ -> if open_ then modal st else Logseq_dom.nothing)
    (Signal.value st.Cards_state.open_)
