(* Recycle page content (.ls-recycle-page-content) — a LUI view mounted
   by Page.region for Model.Page "Recycle". Mirrors
   components/recycle.cljs: description + sections grouped by title,
   each root row with "Page deleted {ts}"/"Block deleted {ts}" +
   Restore/Delete buttons. Restore/delete go through apply-outliner-ops
   like the cljs flow. *)

open Promise_ext
open Lui_elements
module T = I18n

let repo () =
  match (Runtime.model ()).Model.repo with
  | Some r -> r
  | None -> "logseq_db_Demo"

let snapshots () =
  Runtime.invoke2 "thread-api/get-render-snapshots"
    (Wire.String (repo ()))
    (Wire.Map
       [ ( Wire.kw "resources"
         , Wire.Array [ Wire.Array [ Wire.kw "recycle-roots" ] ] )
       ; (Wire.kw "blocks", Wire.Array [])
       ; (Wire.kw "children", Wire.Array [])
       ])

let slot_key =
  Wire.Array [ Wire.kw "resource"; Wire.Array [ Wire.kw "recycle-roots" ] ]

let roots_of w =
  match Wire.get w "slots" with
  | Some (Wire.Map slots) -> (
      match List.find_opt (fun (k, _) -> k = slot_key) slots with
      | Some (_, Wire.Map kv) -> (
          match Wire.get (Wire.Map kv) "value" with
          | Some (Wire.Array roots) -> roots
          | _ -> [])
      | _ -> [])
  | _ -> []

let uuid_of w = Wire.map_get_uuid w "block/uuid" |> Option.value ~default:""

let title_of w =
  Wire.map_get_string w "block/title" |> Option.value ~default:""

(* pages carry :block/name; plain blocks don't *)
let is_page w = Wire.map_get_string w "block/name" <> None

let deleted_at w =
  match Wire.get w "logseq.property/deleted-at" with
  | Some (Wire.Int64 n) -> Int64.to_float n
  | Some (Wire.Int n) -> float_of_int n
  | _ -> 0.

let outliner_op op uuid =
  Runtime.invoke3 "thread-api/apply-outliner-ops"
    (Wire.String (repo ()))
    (Wire.Array
       [ Wire.Array [ Wire.Keyword op; Wire.Array [ Wire.Uuid uuid ] ] ])
    (Wire.Map [])

(* cljs groups roots under the deleted page's title — page roots group
   under their own title, blocks under their original page's *)
let group_title_of root =
  if is_page root then title_of root
  else
    match Wire.get root "logseq.property.recycle/original-page" with
    | Some m ->
        Option.value (Wire.map_get_string m "block/title") ~default:""
    | None -> ""

let groups_of roots =
  let rec insert acc root =
    let gt = group_title_of root in
    match acc with
    | [] -> [ (gt, [ root ]) ]
    | (g, rs) :: rest when g = gt -> (g, root :: rs) :: rest
    | x :: rest -> x :: insert rest root
  in
  List.fold_left insert [] roots
  |> List.map (fun (g, rs) -> (g, List.rev rs))
  |> List.sort (fun (_, a) (_, b) ->
         compare (deleted_at (List.hd b)) (deleted_at (List.hd a)))

let ghost_btn ~key label on_click =
  button ~key ~variant:`ghost ~size:`sm ~text:label
    ~on_press:(fun _ -> on_click ())
    []

let root_header ~restore ~delete_forever root : t =
  let uuid = uuid_of root
  and title = title_of root
  and page = is_page root in
  row ~key:("rh-" ^ uuid) ~main:`space_between ~cross:`center ~gap:16
    [ row ~key:("rhl-" ^ uuid) ~cross:`center ~gap:4 ~grow:1.
        [ text ~key:("rht-" ^ uuid) ~as_:`Small
            ~foreground:"var(--ls-secondary-text-color)"
            ~value:
              ((if page then T.recycle_page_deleted
                else T.recycle_block_deleted)
                 (Ui_services.time_fmt_date (deleted_at root)))
            []
        ]
    ; row ~key:("rhb-" ^ uuid) ~cross:`center ~gap:4
        [ ghost_btn ~key:("rhr-" ^ uuid) T.restore (fun () ->
              restore uuid title)
        ; ghost_btn ~key:("rhd-" ^ uuid) T.delete (fun () ->
              delete_forever uuid title page)
        ]
    ]

(* cljs renders the recycled root through block-container — a text row
   carrying the title is what e2e reads back (row text must carry the
   node title for has-text filters) *)
let root_body root : t =
  let uuid = uuid_of root in
  column ~key:("rb-" ^ uuid) ~style_class:"ls-block"
    [ text ~key:("rbt-" ^ uuid) ~style_class:"block-title-wrap"
        ~value:(title_of root) []
    ]

let root_title root : t =
  column ~key:("rbn-" ^ uuid_of root) ~style_class:"ls-block"
    [ text ~key:("rbnt-" ^ uuid_of root) ~value:(title_of root) [] ]

let render_roots ~restore ~delete_forever roots : t =
  column ~key:"roots" ~gap:32
    (text ~key:"desc"
       ~style_class:"ls-recycle-page-description"
       ~as_:`Small
       ~foreground:"var(--ls-secondary-text-color)"
       ~value:T.recycle_retention []
    :: (if roots = [] then
          [ text ~key:"empty" ~as_:`Small
              ~foreground:"var(--ls-secondary-text-color)"
              ~value:T.recycle_empty []
          ]
        else
          List.map
            (fun (title, rs) ->
              column ~key:("sec-" ^ title)
                ((if not (List.exists is_page rs) then
                    [ heading ~key:("seh-" ^ title) ~level:2
                        ~value:title []
                    ]
                  else [])
                @ [ column ~key:("secb-" ^ title)
                      (List.concat_map
                         (fun root ->
                           [ root_header ~restore ~delete_forever root
                           ; root_title root
                           ; root_body root
                           ])
                         rs)
                  ]))
            (groups_of roots)))

let view (_ms : Model.t Signal.signal) : t =
 fun ctx parent ->
  let roots_st =
    Signal.state ctx.Lui_ui.ui_scheduler ([] : Wire.t list)
  in
  (* generation guard: only the latest refresh may publish — stale
     snapshot resolves drop instead of clobbering newer rows *)
  let refresh_seq = ref 0 in
  let refresh () =
    incr refresh_seq;
    let my = !refresh_seq in
    ignore
      (let* w = snapshots () in
       if !refresh_seq = my then
         Runtime.signal_set roots_st (roots_of w);
       Js.Promise.resolve ())
  in
  let restore uuid title =
    ignore
      (let* _ = outliner_op "restore-recycled" uuid in
       Toast.success (T.restored title);
       refresh ();
       Js.Promise.resolve ())
  in
  let delete_forever uuid title is_page =
    let msg =
      if is_page then T.recycle_delete_confirm_page
      else T.recycle_delete_confirm_block
    in
    if Ui_services.dom_confirm msg then
      ignore
        (let* _ = outliner_op "recycle-delete-permanently" uuid in
         Toast.success title;
         refresh ();
         Js.Promise.resolve ())
  in
  refresh ();
  column ~key:"recycle" ~gap:32
    ~style_class:"ls-recycle-page-content"
    [ reactive
        (render_roots ~restore ~delete_forever)
        (Signal.value roots_st)
    ]
    ctx parent
