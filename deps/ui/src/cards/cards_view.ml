(* Flashcards modal view — #cards-modal > selector row + card list.
   Mirrors cljs fsrs.cljs :div#cards-modal markup. *)

open Lui_elements

let t_ = I18n.t

let opt_row st i label =
  menu_item ~key:("opt-" ^ string_of_int i) ~text:label
    ~on_press:(fun _ -> Cards_state.select_deck st i)
    []

(* the deck picker is a select trigger + anchored dropdown_menu —
   mounted = presented on every host; on_dismiss covers outside-tap *)
let opts_box st =
 fun ctx parent ->
  (reactive
    (fun (opts_open, decks) ->
      if not opts_open then spacer ~key:"opts-closed" []
      else
        let options =
          opt_row st (-1) (t_ "flashcard/all-cards")
          :: List.mapi
               (fun i d -> opt_row st i d.Cards_state.deck_label)
               decks
        in
        dropdown_menu ~key:"opts" ~anchor:`below ~anchor_alignment:`start
          ~on_dismiss:(fun _ -> Cards_state.toggle_opts st)
          options)
    (Logseq_dom.own ctx
       (Signal.map2 (fun a b -> (a, b))
          (Signal.value st.Cards_state.opts_open)
          (Signal.value st.Cards_state.decks))))
    ctx parent

let selected_label sel decks =
  if sel < 0 then t_ "flashcard/all-cards"
  else
    match List.nth_opt decks sel with
    | Some d -> d.Cards_state.deck_label
    | None -> t_ "flashcard/all-cards"

let selector_row st =
  row ~key:"sel-row" ~style_class:"ls-row ls-gap" ~cross:`center
    [ box ~key:"combo" ~style_class:"ls-cards-select"
        [ (* cljs shui/select-trigger: current deck label + chevron —
             select renders role=combobox on web, a native picker on
             Apple/GPUI *)
          select ~key:"selv" ~style_class:"ls-cards-select-value"
            ~text:(reactive selected_label
                     (Signal.value st.Cards_state.sel)
                     (Signal.value st.Cards_state.decks))
            ~on_press:(fun _ -> Cards_state.toggle_opts st)
            [ icon ~key:"chev" ~name:`chevron_down
                ~style_class:"ls-icon-sm" [] ]
        ; opts_box st ]
    ; button ~key:"add" ~accessibility_identifier:"ls-cards-add"
        ~variant:`ghost ~size:`icon ~style_class:"ls-icon-btn"
        ~label:(t_ "flashcard/add-cards-query-tooltip")
        ~icon:`plus
        ~on_press:(fun _ -> Cards_state.add_cards_block st)
        []
    ; text ~key:"prog" ~style_class:"ls-desc ls-nowrap"
        ~value:(reactive
                  (fun (pos : int) (cards : string list) ->
                    let n = List.length cards in
                    let cur = if n = 0 then 0 else min (pos + 1) n in
                    Printf.sprintf "%d/%d" cur n)
                  (Signal.value st.Cards_state.pos)
                  (Signal.value st.Cards_state.cards))
        []
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
  button ~key:id ~accessibility_identifier:id ~style_class:id
    ~text:label
    ~on_press:(fun _ -> rate st rating)
    []

let rating_buttons st =
  box ~key:"ratings" ~style_class:"ls-center"
    [ row ~key:"row" ~style_class:"ls-ratings"
        [ rating_btn st "again" (t_ "flashcard.rating/again")
        ; rating_btn st "hard" (t_ "flashcard.rating/hard")
        ; rating_btn st "good" (t_ "flashcard.rating/good")
        ; rating_btn st "easy" (t_ "flashcard.rating/easy")
        ]
    ]

let card_view st _pos phase title =
  let cloze = has_cloze title in
  let np = next_phase cloze phase in
  column ~key:"card-cur"
    ~style_class:"ls-card content"
    [ scroll ~key:"scroll" ~orientation:`vertical ~grow:1.
        ~style_class:"ls-card-scroll"
        [ text ~key:"t" ~value:title [] ]
    ; box ~key:"actions" ~style_class:"ls-card-actions"
        [ (if np = "show-cloze" || np = "show-answer" then
             button ~key:"answers" ~accessibility_identifier:"card-answers"
               ~style_class:"ls-btn-pad"
               ~text:(if np = "show-answer" then t_ "flashcard.review/show-answers"
                      else if np = "show-cloze" then t_ "flashcard.review/show-clozes"
                      else t_ "flashcard.review/hide-answers")
               ~on_press:(fun _ -> advance_phase st cloze)
               []
           else rating_buttons st)
        ]
    ]

let cards_body st =
 fun ctx parent ->
  (* each map level owns its upstream subscription on the shared cells *)
  let cp_sig =
    Logseq_dom.own ctx
      (Signal.map2 (fun a b -> (a, b))
         (Signal.value st.Cards_state.cards)
         (Signal.value st.Cards_state.pos))
  in
  (reactive
    (fun (cards, pos, phase) ->
      match List.nth_opt cards pos with
      | None ->
          (* cljs: (empty? all-block-ids) -> "Time to create a card!" + the
             "#Card"/cloze hint, not the review-finished message *)
          column ~key:"empty" ~style_class:"ls-card content ls-ml"
            [ heading ~key:"h" ~level:2
                ~value:(t_ "flashcard.empty/title") []
            ; paragraph ~key:"d"
                ~value:(I18n.t1 "flashcard.empty/desc" "#Card")
                [] ]
      | Some title ->
          column ~key:"cards" ~style_class:"ls-cards-col" ~grow:1.
            [ card_view st pos phase title ])
    (Logseq_dom.own ctx
       (Signal.map2
          (fun (a, b) c -> (a, b, c))
          cp_sig
          (Signal.value st.Cards_state.phase))))
    ctx parent

(* cljs :modal/show-cards -> shui/dialog-open! {:id :srs :label
   :flashcards__cp} — scrim and dialog content are SIBLINGS here, like
   cmdk: the native backend hoists each fillsOverlay element into the
   window overlay layer, and a nested content would render inside its
   parent's overlay copy instead of being its own layer. *)
let modal st =
  (* The scrim mounts while the opening gesture is still in flight: its
     mouseup lands on the overlay and would instantly re-close the modal.
     Ignore overlay presses for a short grace window after mount. The
     scrim has no children, so every press on it is an overlay press —
     no payload target-class check needed. *)
  let opened_at = Platform.date_now_ms () in
  Logseq_dom.fragment
    [ Ui_parts.pressable
        ~on_press:(fun _ ->
          if Platform.date_now_ms () -. opened_at > 400. then
            Cards_state.close st)
        (box ~key:"cards-ov" ~style_class:"ui__dialog-overlay" [])
    ; (* label="flashcards__cp" follows the dialogs_view convention:
         ls-dialog-flashcards class + class-selector twins in
         lui-overlay.css; the base .ui__dialog-content rule already
         centers via left/top + translate *)
      column ~key:"cards-ct"
        ~style_class:
          "ui__dialog-content ls-dialog-flashcards grid w-full \
           max-w-2xl lg:max-w-3xl gap-4 border sm:rounded-lg \
           bg-background p-6 shadow-lg ui__dialog-zoom-in"
        ~data_attrs:
          [ ("data-state", "open"); ("role", "dialog") ]
        [ box ~key:"cards-main" ~style_class:"ui__dialog-main-content"
            [ column ~key:"cards-modal"
                ~accessibility_identifier:"cards-modal"
                ~style_class:"ls-cards-stack" ~grow:1.
                [ selector_row st; cards_body st ] ]
        ; button ~key:"cards-close" ~variant:`ghost ~size:`icon
            ~style_class:"ui__dialog-close"
            ~label:(t_ "ui/close")
            ~icon:`x
            ~on_press:(fun _ -> Cards_state.close st)
            [] ] ]

let render (ms : Model.t Signal.signal) : t =
  let st = Cards_state.init ms in
  reactive
    (fun open_ -> if open_ then modal st else Logseq_dom.nothing)
    (Signal.value st.Cards_state.open_)
