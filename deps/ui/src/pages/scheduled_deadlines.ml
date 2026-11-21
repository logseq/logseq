(* Today's journal "Scheduled and Deadline" section — mirrors
   components/scheduled_deadlines.cljs:

   .scheduled-or-deadlines
     foldable (default collapsed; title-trigger)
       .scheduled-deadlines.references-blocks
         .references-blocks-wrap
           .references-blocks-item*  (grouped by source page)

   Data comes from thread-api/get-date-scheduled-or-deadlines over the
   local-midnight range [today, today + scheduled/future-days]. *)

open Promise_ext
open Lui_elements

type group = {
  page_title : string;
  page_uuid : string option;
  page_id : int option;
  blocks : Model.block list;
}

let disabled () =
  Settings_state.config_bool "feature/disable-scheduled-and-deadline-query?"
    ~default:false

let future_days () =
  match Settings_state.config_get "scheduled/future-days" with
  | Some (Wire.Int n) -> n
  | Some (Wire.Int64 n) -> Int64.to_int n
  | _ -> 7

(* date-time-util/journal-day-local-range-ms — both ends local midnight. *)
let journal_day_local_range_ms (day : int) (future : int) : float * float =
  let of_day d =
    let y = d / 10000 and m = d / 100 mod 100 and d = d mod 100 in
    Dates.to_ms (Dates.make ~year:y ~month:m ~day:d ())
  in
  let end_day =
    let y = day / 10000 and m = day / 100 mod 100 and d = day mod 100 in
    Dates.journal_day_of
      (Dates.shift_day (Dates.make ~year:y ~month:m ~day:d ()) future)
  in
  (of_day day, of_day end_day)

let open_depth () =
  match Settings_state.config_get "ref/default-open-blocks-level" with
  | Some (Wire.Int n) when n >= 0 -> min n 9
  | Some (Wire.Int _) -> 2
  | None -> 2
  | Some _ -> invalid_arg "Reference open depth must be an integer"

let with_ref_depth (blocks : Model.block list) : Model.block list =
  let limit = open_depth () in
  let rec go level (b : Model.block) =
    { b with
      Model.block_default_collapsed =
        b.block_default_collapsed || (level >= limit && b.block_children <> [])
    ; block_children = List.map (go (level + 1)) b.block_children
    }
  in
  List.map (go 1) blocks

let blocks_of_group_value w =
  with_ref_depth (Decode.blocks_of_wire w)

let group_of_page_blocks page blocks_w : group option =
  let blocks = blocks_of_group_value blocks_w in
  if blocks = [] then None
  else
    Some
      { page_title =
          Option.value (Wire.map_get_string page "block/title") ~default:""
      ; page_uuid = Wire.map_get_uuid page "block/uuid"
      ; page_id = Wire.map_get_int page "db/id"
      ; blocks
      }

let groups_of_wire (w : Wire.t) : group list =
  match w with
  | Wire.Map pairs ->
      List.filter_map
        (fun (page, blocks) ->
          match page with
          | Wire.Map _ -> group_of_page_blocks page blocks
          | _ -> None)
        pairs
  | Wire.Array _ | Wire.List _ | Wire.Set _ -> (
      match blocks_of_group_value w with
      | [] -> []
      | blocks ->
          [ { page_title = ""; page_uuid = None; page_id = None; blocks } ])
  | _ -> []

let fetch ~day (publish : group list -> unit) =
  match (Runtime.model ()).Model.repo with
  | None -> publish []
  | Some repo ->
      let start_ms, end_ms = journal_day_local_range_ms day (future_days ()) in
      ignore
        (let* w =
           Runtime.invoke3 "thread-api/get-date-scheduled-or-deadlines"
             (Wire.String repo)
             (Wire.Int64 (Int64.of_float start_ms))
             (Wire.Int64 (Int64.of_float end_ms))
         in
         publish (groups_of_wire w);
         Js.Promise.resolve ())

let page_href title uuid =
  match uuid with
  | Some u -> "#/page/" ^ Ui_services.uri_encode_component u
  | None when String.trim title <> "" ->
      "#/page/" ^ Ui_services.uri_encode_component title
  | None -> "#"

let block_rows ~scope_prefix (blocks : Model.block list) : t list =
  List.map
    (fun (b : Model.block) ->
      let uuid = Option.value b.Model.block_uuid ~default:"" in
      let b =
        if b.Model.block_is_page then { b with Model.block_children = [] }
        else b
      in
      Tree.block_row_static
        ~collapse_scope:(scope_prefix ^ ":" ^ uuid)
        ~persist_collapse:false b)
    blocks

(* Nested page group — cljs grouped-blocks-container:
   .references-blocks-item > foldable(page-cp) > blocks-container *)
let page_group ~scope_prefix (g : group) : t =
 fun ctx parent ->
  let collapsed = Signal.state ctx.Lui_ui.ui_scheduler false in
  let key =
    match g.page_id with
    | Some id -> "page-" ^ string_of_int id
    | None ->
        "page-"
        ^ Option.value g.page_uuid ~default:(String.trim g.page_title)
  in
  let title_el =
    if String.trim g.page_title = "" then Logseq_el.nothing
    else
      box ~key:(key ^ "-title") ~style_class:"with-foldable-page"
        [ link ~url:(page_href g.page_title g.page_uuid) ~target:`self_
            ~style_class:"page-ref" ~text:g.page_title []
        ]
  in
  let header =
    Ui_parts.pressable
      ~on_press:(fun _ ->
        Signal.set collapsed (not (Signal.get (Signal.value collapsed)));
        Runtime.flush ())
      (row ~key:(key ^ "-hdr") ~cross:`center ~gap:4
         ~style_class:"ls-foldable-header"
         [ Ui_components.foldable_control ~key:(key ^ "-ctrl")
             [ box ~key:"ch"
                 [ icon ~key:"caret" ~point_size:16
                     ~name:
                       (reactive
                          (fun c ->
                            `app
                              (if c then "rotating-arrow"
                               else "rotating-arrow-down"))
                          (Signal.value collapsed))
                     []
                 ]
             ]
         ; title_el
         ])
  in
  (column ~key ~style_class:"references-blocks-item" ~margin_vertical:8
     [ header
     ; if_ ~test:(reactive not (Signal.value collapsed))
         (column ~key:(key ^ "-body") ~style_class:"ls-foldable-content"
            [ column ~key:(key ^ "-blocks")
                (block_rows ~scope_prefix g.blocks) ])
     ])
    ctx parent

let body ~scope_prefix (groups : group list) : t =
  column ~key:"sched-body"
    ~style_class:"scheduled-deadlines references-blocks" ~margin_bottom:24
    [ column ~key:"sched-wrap" ~style_class:"references-blocks-wrap"
        (List.map (page_group ~scope_prefix) groups)
    ]

(* Outer section foldable — default collapsed, title is the trigger. *)
let section ~scope_prefix (groups : group list) : t =
 fun ctx parent ->
  let collapsed = Signal.state ctx.Lui_ui.ui_scheduler true in
  let toggle () =
    Signal.set collapsed (not (Signal.get (Signal.value collapsed)));
    Runtime.flush ()
  in
  let title =
    Ui_components.with_props
      [ Ui_components.Prop.font_size "0.875rem"
      ; Ui_components.Prop.font_weight 500
      ]
      (text ~key:"sched-title" ~value:(I18n.t "page/scheduled-and-deadline") [])
  in
  (column ~key:"scheduled-or-deadlines" ~style_class:"scheduled-or-deadlines"
     [ Ui_parts.pressable ~on_press:(fun _ -> toggle ())
         (row ~key:"sched-hdr" ~cross:`center ~gap:4
            ~style_class:"ls-foldable-header content"
            [ Ui_components.foldable_control ~key:"sched-ctrl"
                [ Ui_parts.class_signal (Signal.value collapsed)
                    (fun c -> if c then "" else "control-hide")
                    (box ~key:"ch"
                       [ icon ~key:"caret" ~point_size:16
                           ~name:
                             (reactive
                                (fun c ->
                                  `app
                                    (if c then "rotating-arrow"
                                     else "rotating-arrow-down"))
                                (Signal.value collapsed))
                           []
                       ])
                ]
            ; title
            ])
     ; if_ ~test:(reactive not (Signal.value collapsed))
         (box ~key:"sched-content" ~style_class:"ls-foldable-content"
            [ body ~scope_prefix groups ])
     ])
    ctx parent

(* cljs scheduled-and-deadlines: mounts for today's journal unless the
   feature flag disables it; empty results render nothing. *)
let view (page : Model.page) : t =
 fun ctx parent ->
  if disabled () then Logseq_el.nothing ctx parent
  else
    match page.Model.page_journal_day with
    | Some day when day = Dates.today_journal_day () ->
        let groups_st =
          Signal.state ctx.Lui_ui.ui_scheduler ([] : group list)
        in
        let scope_prefix =
          "agenda-"
          ^ Option.value page.Model.page_uuid ~default:(string_of_int day)
        in
        let seq = ref 0 in
        incr seq;
        let my = !seq in
        fetch ~day (fun groups ->
            if !seq = my then (
              Runtime.signal_set groups_st groups;
              Runtime.flush ()));
        (reactive
           (fun groups ->
             if groups = [] then Logseq_el.nothing
             else section ~scope_prefix groups)
           (Signal.value groups_st))
          ctx parent
    | _ -> Logseq_el.nothing ctx parent
