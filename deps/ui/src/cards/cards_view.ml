(* Flashcards modal view — #cards-modal > selector row + card list.
   Mirrors cljs fsrs.cljs :div#cards-modal markup. *)

open Lui_elements
open Logseq_dom

let t_ = I18n.t
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
          opt_row st (-1) (t_ "flashcard/all-cards")
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
  dom ~key:"sel-row" ~style_class:"ls-row ls-gap"
    [ dom ~key:"combo"
        ~attrs:[ ("role", "combobox") ]
        ~events:"click"
        ~on_dom_event:(fun name _ ->
          if name = "click" then Cards_state.toggle_opts st)
        ~style_class:"ls-cards-select"
        [ opts_box st ]
    ; dom ~key:"add" ~tag:"button" ~id:"ls-cards-add"
        ~attrs:[ ("title", t_ "flashcard/add-cards-query-tooltip") ]
        ~style_class:"ls-icon-btn"
        ~events:"click"
        ~on_dom_event:(fun name _ ->
          if name = "click" then Cards_state.add_cards_block st)
        [ icon "plus" ]
    ; dyn ~equal:(fun (a : int * string list) b -> a = b)
        (fun (pos, cards) ->
          let n = List.length cards in
          let cur = if n = 0 then 0 else min (pos + 1) n in
          dom ~key:"prog" ~tag:"span"
            ~style_class:"ls-desc ls-nowrap"
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
  dom ~key:"ratings" ~style_class:"ls-center"
    [ dom ~key:"row"
        ~style_class:"ls-ratings"
        [ rating_btn st "again" (t_ "flashcard.rating/again")
        ; rating_btn st "hard" (t_ "flashcard.rating/hard")
        ; rating_btn st "good" (t_ "flashcard.rating/good")
        ; rating_btn st "easy" (t_ "flashcard.rating/easy")
        ]
    ]

let card_view st _pos phase title =
  let cloze = has_cloze title in
  let np = next_phase cloze phase in
  dom ~key:"card-cur"
    ~style_class:"ls-card content"
    [ dom ~key:"scroll"
        ~style_class:
          "ls-card-scroll"
        [ text ~key:"t" ~value:title [] ]
    ; dom ~key:"actions" ~style_class:"ls-card-actions"
        [ (if np = "show-cloze" || np = "show-answer" then
             dom ~key:"answers" ~tag:"button" ~id:"card-answers"
               ~style_class:"ls-btn-pad"
               ~events:"click"
               ~on_dom_event:(fun n _ ->
                 if n = "click" then advance_phase st cloze)
               [ text ~key:"t"
                   ~value:
                     (if np = "show-answer" then t_ "flashcard.review/show-answers"
                      else if np = "show-cloze" then t_ "flashcard.review/show-clozes"
                      else t_ "flashcard.review/hide-answers")
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
          dom ~key:"empty" ~style_class:"ls-card content ls-ml"
            [ dom ~key:"h" ~tag:"h2" ~style_class:"ls-strong"
                [ text ~key:"t"
                    ~value:
                      (t_ "flashcard.review/finished")
                    [] ] ]
      | Some title ->
          dom ~key:"cards" ~style_class:"ls-cards-col"
            [ card_view st pos phase title ])
    (Signal.map2
       (fun (a, b) c -> (a, b, c))
       (Signal.map2
          (fun a b -> (a, b))
          (Signal.value st.Cards_state.cards)
          (Signal.value st.Cards_state.pos))
       (Signal.value st.Cards_state.phase))

(* overlay-click dismissal matches dialogs_view: the payload carries the
   click target's class list *)
let is_overlay_click payload =
  Option.fold ~none:false
    ~some:(fun p ->
      let tc = Platform.payload_str p "targetClass" in
      let needle = "ui__dialog-overlay" in
      let ln = String.length needle and lt = String.length tc in
      let rec go i =
        i + ln <= lt && (String.sub tc i ln = needle || go (i + 1))
      in
      go 0)
    payload

(* cljs :modal/show-cards -> shui/dialog-open! {:id :srs :label
   :flashcards__cp} — the deck lives inside the standard dialog chrome
   (.ui__dialog-overlay > .ui__dialog-content) so it stacks above the
   page instead of rendering inline *)
let modal st =
  dom ~key:"cards-ov"
    ~style_class:
      "ui__dialog-overlay fixed inset-0 z-50 bg-background/90 flex \
       justify-center items-center"
    ~events:"click"
    ~on_dom_event:(fun n p ->
      if n = "click" && is_overlay_click p then Cards_state.close st)
    [ dom ~key:"cards-ct"
        ~style_class:
          "ui__dialog-content fixed left-[50%] top-[50%] z-50 grid \
           w-full max-w-2xl lg:max-w-3xl gap-4 border sm:rounded-lg \
           bg-background p-6 shadow-lg ui__dialog-zoom-in"
        ~attrs:
          [ ("data-state", "open"); ("role", "dialog")
          ; ("label", "flashcards__cp")
          ; ("style", "transform: translate(-50%, -50%)") ]
        [ dom ~key:"cards-modal" ~id:"cards-modal"
            ~style_class:"ls-cards-stack"
            [ selector_row st; cards_body st ] ]
    ]

let render (ms : Model.t Signal.signal) : t =
  let st = Cards_state.init ms in
  dyn ~equal:(fun a b -> a = b)
    (fun open_ -> if open_ then modal st else Logseq_dom.nothing)
    (Signal.value st.Cards_state.open_)
