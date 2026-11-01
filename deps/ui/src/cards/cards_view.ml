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
    (Logseq_el.own ctx
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
  (* cljs header row: flex flex-row items-center gap-2 — the fixed 32px
     height keeps the select, + button and n/N text on one center line *)
  row ~key:"sel-row" ~style_class:"ls-row ls-gap" ~cross:`center
    ~height:32 ~gap:8
    [ Ui_components.with_props
        [ Ui_components.Prop.position `relative ]
        (box ~key:"combo" ~style_class:"ls-cards-select"
           ~display:`inline_flex
        [ (* cljs shui/select-trigger: the select kind already renders
             role=combobox + its own ::after chevron on web and a native
             picker on the native host — no icon child needed *)
          select ~key:"selv" ~style_class:"ls-cards-select-value"
            ~text:(reactive selected_label
                     (Signal.value st.Cards_state.sel)
                     (Signal.value st.Cards_state.decks))
            ~on_press:(fun _ -> Cards_state.toggle_opts st)
            []
        ; opts_box st ])
    ; Ui_components.with_props
        [ Ui_components.Prop.cursor `pointer ]
        (Ui_components.button ~key:"add" ~accessibility_identifier:"ls-cards-add"
           ~variant:`ghost ~size:`icon ~style_class:"ls-icon-btn"
           ~padding_horizontal:4
           ~foreground:
             "var(--ls-secondary-text-color, hsl(var(--muted-foreground)))"
           ~label:(t_ "flashcard/add-cards-query-tooltip")
           ~icon:(`app "plus")
           ~on_press:(fun _ -> Cards_state.add_cards_block st)
           [])
    ; text ~key:"prog" ~style_class:"ls-desc ls-nowrap"
        ~white_space:"nowrap"
        ~value:(reactive
                  (fun (pos : int) (cards : int list) ->
                    let n = List.length cards in
                    let cur = if n = 0 then 0 else min (pos + 1) n in
                    Printf.sprintf "%d/%d" cur n)
                  (Signal.value st.Cards_state.pos)
                  (Signal.value st.Cards_state.cards))
        []
    ]

(* cljs rating->shortcut / btn-with-shortcut colors *)
(* cljs per-rating classes set --primary (primary-red/purple/logseq/
   green); the native class dict lacks them, so the tint hexes are
   spelled out — bg = color @ 5%, border = neutral #ebeaeb like every
   other ui__button, fg stays dark *)
let ratings =
  [ ("again", "flashcard.rating/again", "1", "primary-red", "#e5484d")
  ; ("hard", "flashcard.rating/hard", "2", "primary-purple", "#8e4ec6")
  ; ("good", "flashcard.rating/good", "3", "primary-logseq", "#3b82f6")
  ; ("easy", "flashcard.rating/easy", "4", "primary-green", "#30a46c")
  ]

(* cljs btn-with-shortcut: outline sm button with per-rating --primary
   tint (bg-primary/5 border-primary), interior [label][kbd shortcut];
   ~label feeds aria (LUI renders ~text after children, so the visible
   order lives in the children) *)
let rating_btn st i (r, label_key, sc, style, hex) =
  let id = "card-" ^ r in
  row ~key:id ~style_class:"ls-row ls-gap" ~cross:`center
    [ Ui_components.button ~key:"b" ~accessibility_identifier:id
        ~padding_horizontal:8 ~padding_vertical:4
        ~background:(hex ^ "0d")
        ~border_color:"rgb(235,234,235)" ~border_width:1
        ~foreground:"rgb(23,23,23)"
        ~style_class:(id ^ " " ^ style)
        ~label:(t_ label_key)
        ~disabled:(reactive Fun.id (Signal.value st.Cards_state.grading))
        ~tooltip:(I18n.t1 "flashcard/shortcut-tooltip" sc)
        ~variant:`secondary ~size:`sm
        ~on_press:(fun _ -> Cards_state.rate st r)
        [ row ~key:"inner" ~gap:4 ~cross:`center
            [ text ~value:(t_ label_key) []
            ; kbd ~style_class:"shui-shortcut-key"
                ~data_attrs:[ ("style", "transform:scale(0.9)") ]
                ~value:sc [] ] ]
    ; text ~key:"due" ~style_class:"ls-desc"
        ~value:(reactive
                  (fun (ls : string list) ->
                    Option.value (List.nth_opt ls i) ~default:"")
                  (Signal.value st.Cards_state.due_labels))
        [] ]

(* the ⓘ descriptions popup — cljs rating-desc popup *)
let info_btn st =
  fun ctx parent ->
  (box ~key:"info-wrap"
     [ Ui_components.button ~key:"info" ~variant:`ghost ~size:`sm
         ~padding_horizontal:0 ~height:16
         ~foreground:"var(--ls-secondary-text-color, hsl(var(--muted-foreground)))"
         ~icon:(`app "info-circle") ~label:"rating info"
         ~on_press:(fun _ -> Cards_state.toggle_info st)
         []
     ; reactive
         (fun open_ ->
           if not open_ then spacer ~key:"i-closed" []
           else
             dropdown_menu ~key:"i-opts" ~anchor:`below
               ~anchor_alignment:`start
               ~on_dismiss:(fun _ -> Cards_state.toggle_info st)
               (List.map
                  (fun (_, label_key, _, _, _) ->
                    let desc_key = label_key ^ "-desc" in
                    column ~key:("info-" ^ label_key) ~padding:16
                      [ text ~font_weight:500
                          ~value:(t_ label_key) []
                      ; text ~value:(t_ desc_key) [] ])
                  ratings))
         (Signal.value st.Cards_state.info_open)
     ])
    ctx parent

let rating_buttons st =
  box ~key:"ratings" ~style_class:"ls-center"
    [ row ~key:"row" ~style_class:"ls-ratings"
        ~cross:`center ~gap:32 ~flex_wrap:`wrap
        (List.mapi (fun i r -> rating_btn st i r) ratings
         @ [ info_btn st ])
    ]

(* cljs phase-locked option map: :init/:show-cloze hide children,
   :show-answer shows them (plus ignore-block-collapsed? — Decode drops
   collapsed flags so LUI children are already expanded) *)
let rec card_view st b phase =
  let cloze = Cards_state.has_cloze b.Model.block_title in
  let np = Cards_state.next_phase cloze phase in
  let b' =
    if phase = "show-answer" then b
    else { b with Model.block_children = [] }
  in
  (* grow:1 fills #cards-modal so the scroll region expands and the
     action row pins to the dialog bottom (cljs flex-1 min-h-0);
     min-height 60vh like cljs .ls-card so the card area keeps its
     review size even when content is short *)
  column ~key:"card-cur" ~grow:1. ~style_class:"ls-card content"
    ~min_height:(int_of_float (0.6 *. Ui_services.dom_viewport_height ()))
    [ scroll ~key:"scroll" ~orientation:`vertical ~grow:1.
        ~min_height:0 ~style_class:"ls-card-scroll"
        [ (* scroll lays its children out in a single grid cell — the
             crumbs row and the card must sit in ONE column or they
             render on top of each other *)
          column ~key:"sc-body"
            [ (* cljs block-breadcrumb — text crumbs (no page links) *)
              reactive
                (fun crumbs ->
                  match crumbs with
                  | [] -> spacer ~key:"bc-none" []
                  | cs ->
                      row ~key:"bc" ~style_class:"breadcrumb ls-card-bc"
                        ~margin_bottom:16 ~margin_left:8
                        ~data_attrs:[ ("style", "font-size:0.875rem") ]
                        (List.concat_map
                           (fun c ->
                             [ Ui_components.with_props
                                 [ Ui_components.Prop.opacity 0.7
                                 ; Ui_components.Prop.hover_opacity 1. ]
                                 (text ~style_class:"breadcrumb-item"
                                    ~value:c [])
                             ; text ~value:"/" ~padding_horizontal:4 [] ])
                           cs))
                (Signal.value st.Cards_state.crumbs)
            ; (* remount per card+phase so clozes take the right initial
                 revealed state (cloze_reveal_all is read at mount) *)
              keyed_card st b'
            ]
        ]
    ; row ~key:"actions" ~style_class:"ls-card-actions"
        ~margin_top:32 ~main:`center ~cross:`start
        ~data_attrs:[ ("style", "padding-bottom:0.5rem;flex-shrink:0") ]
        [ (if np = "show-cloze" || np = "show-answer" then
             (* cljs card-answers is a compact secondary sm button with
                a kbd shortcut hint — no accent fill/border *)
             Ui_components.button ~key:"answers" ~accessibility_identifier:"card-answers"
               ~padding_horizontal:8 ~padding_vertical:4
               ~style_class:"card-answers"
               ~variant:`secondary ~size:`sm
               ~label:(if np = "show-answer" then t_ "flashcard.review/show-answers"
                       else t_ "flashcard.review/show-clozes")
               ~tooltip:(I18n.t1 "flashcard/shortcut-tooltip" "s")
               ~on_press:(fun _ -> Cards_state.advance_phase st)
               [ row ~key:"inner" ~gap:4 ~cross:`center
                   [ text ~value:(if np = "show-answer"
                                  then t_ "flashcard.review/show-answers"
                                  else t_ "flashcard.review/show-clozes") []
                   ; kbd ~style_class:"shui-shortcut-key"
                       ~data_attrs:[ ("style", "transform:scale(0.9)") ]
                       ~value:"s" [] ] ]
           else rating_buttons st)
        ]
    ]

(* the card subtree keyed on (eid, phase) — a fresh mount re-reads
   Render_inline.cloze_reveal_all for the new phase *)
and keyed_card st b : t =
 fun ctx parent ->
  let item_sig =
    Logseq_el.own ctx
      (Signal.map (fun ph -> [ (b, ph) ]) (Signal.value st.Cards_state.phase))
  in
  Lui_elements.keyed ~source:item_sig
    ~key:(fun (bb, ph) ->
      Printf.sprintf "%d-%s"
        (Option.value bb.Model.block_db_id ~default:0)
        ph)
    ~cmp:String.compare
    ~mount:(fun item_sig ->
      Tree.block_row ~scope:"cards" ~editable:false ~library:false
        (fst (Signal.get item_sig)))
    ctx parent

let practice_again_btn st =
  Ui_components.button ~key:"again" ~variant:`outline ~size:`sm
    ~accessibility_identifier:"card-practice-again"
    ~text:(t_ "flashcard.review/practice-again")
    ~on_press:(fun _ -> Cards_state.practice_again st)
    []

let cards_body st =
 fun ctx parent ->
  (* each map level owns its upstream subscription on the shared cells *)
  let cp_sig =
    Logseq_el.own ctx
      (Signal.map2 (fun a b -> (a, b))
         (Signal.value st.Cards_state.cards)
         (Signal.value st.Cards_state.pos))
  in
  let all_sig =
    Logseq_el.own ctx (Signal.value st.Cards_state.all_cards)
  in
  (reactive
    (fun (cards, pos, phase, cur, all) ->
      match List.nth_opt cards pos, cur with
      | Some _, Some b ->
          column ~key:"cards" ~style_class:"ls-cards-col" ~grow:1.
            [ card_view st b phase ]
      | Some _, None -> spacer ~key:"loading" []
      | None, _ ->
          (* cljs: (empty? block-ids) -> no-due (or create-a-card when the
             scope has no cards at all); a consumed list -> finished *)
          if List.length cards = 0 && all = [] then
            column ~key:"empty" ~style_class:"ls-card content ls-ml"
              ~margin_left:8
              ~min_height:(int_of_float (0.6 *. Ui_services.dom_viewport_height ()))
              [ heading ~key:"h" ~level:2
                  ~value:(t_ "flashcard.empty/title") []
              ; paragraph ~key:"d"
                  ~value:(I18n.t1 "flashcard.empty/desc" "#Card")
                  [] ]
          else if List.length cards = 0 then
            column ~key:"nodue" ~style_class:"ls-card content ls-ml"
              ~margin_left:8
              ~min_height:(int_of_float (0.6 *. Ui_services.dom_viewport_height ()))
              [ heading ~key:"h" ~level:2
                  ~value:(t_ "flashcard.empty/no-due-title") []
              ; paragraph ~key:"d"
                  ~value:(t_ "flashcard.empty/no-due-desc") []
              ; box ~key:"btns" ~margin_top:16
                  [ practice_again_btn st ] ]
          else
            column ~key:"fin" ~style_class:"ls-card content ls-ml"
              ~margin_left:8
              ~min_height:(int_of_float (0.6 *. Ui_services.dom_viewport_height ()))
              [ paragraph ~key:"d"
                  ~value:(t_ "flashcard.review/finished") []
              ; box ~key:"btns" ~margin_top:16
                  [ practice_again_btn st ] ])
    (Logseq_el.own ctx
       (Signal.map2
          (fun (a, b) (phase, cur, all) -> (a, b, phase, cur, all))
          cp_sig
          (Logseq_el.own ctx
             (Signal.map2
                (fun (a, b) c -> (a, b, c))
                (Logseq_el.own ctx
                   (Signal.map2 (fun x y -> (x, y))
                      (Signal.value st.Cards_state.phase)
                      (Signal.value st.Cards_state.cur)))
                all_sig)))))
    ctx parent

(* cljs :modal/show-cards -> shui/dialog-open! {:id :srs :label
   :flashcards__cp} — scrim and dialog content are SIBLINGS here, like
   cmdk: the native backend hoists each fillsOverlay element into the
   window overlay layer, and a nested content would render inside its
   parent's overlay copy instead of being its own layer. The shared
   parent is a plain box — fragment can't be returned from a reactive
   branch (it has no parent to mount into). *)
let modal st =
  (* The scrim mounts while the opening gesture is still in flight: its
     mouseup lands on the overlay and would instantly re-close the modal.
     Ignore overlay presses for a short grace window after mount. The
     scrim has no children, so every press on it is an overlay press —
     no payload target-class check needed. *)
  let opened_at = Ui_services.time_now () in
  (* cp__overlay-layer/cp__dialog-shell are inert on web; on the
     native host the
     registered class dictionary makes the shell a window-sized layer
     and centers the content by flex alignment. On web the dialog kind
     portals itself out — the shell mounts empty there. *)
  box ~key:"cards-shell" ~style_class:"cp__overlay-layer cp__dialog-shell"
    [ (* dialog kind owns scrim, centering, focus trap and
         outside/Escape dismiss; ls-dialog-flashcards keeps the
         per-dialog CSS hooks. The opening click's 400ms debounce
         guards the modal from the same-press dismiss. *)
      (* Flashcards use the standard card below the desktop breakpoint. *)
      Ui_components.dialog ~key:"cards-dlg" ~style_class:"ls-dialog-flashcards"
        ~width:(fun viewport -> if viewport >= 820. then Float.max 800. (Float.min 980. (viewport *. 0.85)) else Ui_components.dialog_width viewport)
        ~padding:24 ~padding_horizontal:20 ~padding_bottom:16
        ~on_dismiss:(fun _ ->
          if Ui_services.time_now () -. opened_at > 400. then
            Cards_state.close st)
        [ (* no ~grow on the main column — the dialog hugs its
             content height instead of filling the window *)
          column ~key:"cards-main"
            [ column ~key:"cards-modal"
                ~accessibility_identifier:"cards-modal"
                ~style_class:"ls-cards-stack" ~grow:1.
                [ selector_row st; cards_body st ] ]
        ; Ui_components.dialog_close ~key:"cards-close"
            ~label:(t_ "ui/close")
            ~on_press:(fun _ -> Cards_state.close st)
        ]
    ]

let render (ms : Model.t Signal.signal) : t =
  let st = Cards_state.init ms in
  reactive
    (fun open_ -> if open_ then modal st else Logseq_el.nothing)
    (Signal.value st.Cards_state.open_)
