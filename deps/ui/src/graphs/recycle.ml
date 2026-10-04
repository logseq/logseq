(* Recycle page content (.ls-recycle-page-content) — injected as an
   imperative sibling under #main-content-container when the route is
   #/page/Recycle (page.ml renders the page normally; we add the
   contract rows). Mirrors components/recycle.cljs:
   description + sections grouped by title, each root row with
   "Page deleted {ts}"/"Block deleted {ts}" + Restore/Delete buttons.
   Restore/delete go through apply-outliner-ops like the cljs flow. *)

open Promise_ext
module T = I18n
let repo () =
  match (Runtime.model ()).Model.repo with Some r -> r | None -> "logseq_db_Demo"

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
      match
        List.find_opt (fun (k, _) -> k = slot_key) slots
      with
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

(* generation guard: on_model re-fires show() on every model update while
   on the route; only the latest refresh may write rows into the host *)
let refresh_seq = ref 0

let outliner_op op uuid =
  Runtime.invoke3 "thread-api/apply-outliner-ops"
    (Wire.String (repo ()))
    (Wire.Array
       [ Wire.Array [ Wire.Keyword op; Wire.Array [ Wire.Uuid uuid ] ] ])
    (Wire.Map [])

let rec restore uuid title host =
  ignore
    (let* _ = (outliner_op "restore-recycled" uuid) in
    Toast.success (T.restored title);
    refresh host;
    Js.Promise.resolve ())

and delete_forever uuid title is_page host =
  let msg =
    if is_page then T.recycle_delete_confirm_page
    else T.recycle_delete_confirm_block
  in
  if Web_dom.win_confirm msg then
    ignore
      (let* _ = (outliner_op "recycle-delete-permanently" uuid) in
      Toast.success title;
      refresh host;
      Js.Promise.resolve ())

and ghost_btn label on_click =
  let b = Web_dom.create_element "button" in
  Web_dom.el_set_attr b "type" "button";
  Web_dom.el_set_class b "!py-0 !px-1 h-4";
  Web_dom.el_set_text_content b label;
  Web_dom.el_on b "click" (fun _ -> on_click ());
  b

and root_header root host =
  let uuid = uuid_of root and title = title_of root and page = is_page root in
  let hdr = Web_dom.create_element "div" in
  Web_dom.el_set_class hdr
    "flex items-center justify-between gap-4 text-xs \
     text-muted-foreground";
  let left = Web_dom.create_element "div" in
  Web_dom.el_set_class left "flex items-center gap-1 min-w-0 flex-1";
  let truncw = Web_dom.create_element "div" in
  Web_dom.el_set_class truncw "min-w-0";
  let txt = Web_dom.create_element "div" in
  Web_dom.el_set_class txt "truncate";
  Web_dom.el_set_text_content txt
    ((if page then T.recycle_page_deleted else T.recycle_block_deleted)
       (Platform.fmt_time (deleted_at root)));
  Web_dom.el_append_child truncw txt;
  Web_dom.el_append_child left truncw;
  let btns = Web_dom.create_element "div" in
  Web_dom.el_set_class btns "flex items-center gap-1";
  Web_dom.el_append_child btns (ghost_btn T.restore (fun () -> restore uuid title host));
  Web_dom.el_append_child btns
    (ghost_btn T.delete (fun () -> delete_forever uuid title page host));
  Web_dom.el_append_child hdr left;
  Web_dom.el_append_child hdr btns;
  hdr

and refresh (host : Web_dom.el) =
  incr refresh_seq;
  let my = !refresh_seq in
  ignore
    (let* w = (snapshots ()) in
    if !refresh_seq = my then render_roots host (roots_of w);
    Js.Promise.resolve ())

(* cljs groups roots under the deleted page's title — page roots group
   under their own title, blocks under their original page's *)
and group_title_of root =
  if is_page root then title_of root
  else
    match Wire.get root "logseq.property.recycle/original-page" with
    | Some m -> Option.value (Wire.map_get_string m "block/title") ~default:""
    | None -> ""

and groups_of roots =
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

(* cljs renders the recycled root through block-container — a text row
   carrying the title is what e2e reads back *)
and root_body root =
  let blk = Web_dom.create_element "div" in
  Web_dom.el_set_class blk "ls-block";
  let t = Web_dom.create_element "div" in
  Web_dom.el_set_class t "block-title-wrap";
  Web_dom.el_set_text_content t (title_of root);
  Web_dom.el_append_child blk t;
  blk

and render_roots host roots =
  (* clear inside the async callback — concurrent refreshes race
     otherwise and each append piles rows onto the previous paint *)
  Web_dom.el_set_text_content host "";
  let desc = Web_dom.create_element "div" in
  Web_dom.el_set_class desc "text-sm text-muted-foreground ls-recycle-page-description ml-1";
  Web_dom.el_set_text_content desc T.recycle_retention;
  Web_dom.el_append_child host desc;
  if roots = [] then (
    let e = Web_dom.create_element "div" in
    Web_dom.el_set_class e "text-sm text-muted-foreground";
    Web_dom.el_set_text_content e T.recycle_empty;
    Web_dom.el_append_child host e)
  else
    List.iter
      (fun (title, rs) ->
        let sec = Web_dom.create_element "section" in
        (if not (List.exists is_page rs) then (
           let h = Web_dom.create_element "h2" in
           Web_dom.el_set_class h "text-lg font-medium mb-3";
           Web_dom.el_set_text_content h title;
           Web_dom.el_append_child sec h));
        let col = Web_dom.create_element "div" in
        Web_dom.el_set_class col "flex flex-col";
        List.iter
          (fun root ->
            let row = Web_dom.create_element "div" in
            Web_dom.el_append_child row (root_header root host);
            (* deleted-root-outliner renders the block title — a plain
               title row is enough for the recycled contract (row text
               must carry the node title for has-text filters) *)
            let body = Web_dom.create_element "div" in
            Web_dom.el_set_class body "ls-block";
            Web_dom.el_set_text_content body (title_of root);
            Web_dom.el_append_child row body;
            Web_dom.el_append_child row (root_body root);
            Web_dom.el_append_child col row)
          rs;
        Web_dom.el_append_child sec col;
        Web_dom.el_append_child host sec)
      (groups_of roots)

let show () =
  match Web_dom.query_selector "#main-content-container" with
  | Some parent -> (
      match Web_dom.query_selector ".ls-recycle-page-content" with
      | Some host -> refresh host
      | None ->
          (* class the host before the async refresh so a second show
             before the promise resolves finds it instead of creating
             a duplicate container *)
          let host = Web_dom.create_element "div" in
          (* mark before the async refresh fills it so a second show()
             does not append a duplicate host *)
          Web_dom.el_set_class host "flex flex-col gap-8 ls-recycle-page-content";
          Web_dom.el_append_child parent host;
          refresh host)
  | None -> ()

let hide () =
  match Web_dom.query_selector ".ls-recycle-page-content" with
  | Some host -> Web_dom.el_remove host
  | None -> ()
