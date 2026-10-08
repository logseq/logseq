(* Shared view scenarios for the query/table implementations — the real
   Views_view mount driven through a scripted worker. Everything app-typed
   (Wire, Worker_client, Views_view, Runtime) stays at the entry; this
   file speaks Drive.Model + selector language only, so the same checks
   run under Melange (test/views_drive.ml, wired from test_main.ml) and
   natively (gpui/drive_test.ml).

   The entry's scripted worker understands these intents:
   - views: (uuid, title, type-ident) — serves the [:views owner feature]
     slot and the view entities get-blocks returns
   - rows: per view uuid, the (uuid, title) list the [:view-data] slot
     returns; get-blocks serves each uuid's {block/uuid, block/title}
   - query: the query block's source string and the [:query spec] slot
     result (row uuids, or an error message)
   - hold/release: park invokes by name and resolve them FIFO later —
     lets a scenario resolve responses out of order to prove stale
     writes cannot paint over newer context *)

open Drive
module M = Model
module S = Session
module SM = Lui_protocol.String_map
module Wv = Lui_protocol

type ('model, 'action) host =
  { check : string -> bool -> unit
  ; mount_table : unit -> ('model, 'action) S.t
  ; mount_query : uuid:string -> ('model, 'action) S.t
  ; after : int -> (unit -> unit) -> unit
  ; requests : unit -> string list (* invoke names, oldest first *)
  ; resources : unit -> string list
      (* serialized [:resource key] vectors, one per get-render-snapshots
         call — ctx assertions read the request, not the DOM *)
  ; clear_requests : unit -> unit
  ; set_views : (string * string * string) list -> unit
      (* uuid, title, view/type ident *)
  ; set_view_flags : string -> string list -> unit
      (* extra persisted state on the view entity: "sort" / "filters" *)
  ; set_rows : view:string -> (string * string) list -> unit
      (* (uuid, title) rows the [:view-data] slot + get-blocks serve *)
  ; set_query :
      uuid:string -> src:string -> rows:string list -> unit
  ; set_query_error : uuid:string -> msg:string -> unit
  ; hold : string -> unit
  ; release : string -> unit (* resolve oldest parked invoke of name *)
  ; pending : unit -> string list
  }

(* ---------- selector / tree helpers (mirrors the entry-side helpers,
   kept local so the file stays self-contained) ---------- *)

let sel (s : ('m, 'a) S.t) str =
  match M.selector_of_string str with
  | Some x -> M.find s.S.tree x
  | None -> []

let first s str = match sel s str with n :: _ -> Some n | [] -> None
let has s str = first s str <> None

let cls_of (n : M.node) =
  Option.value (M.string_prop n "style-class") ~default:""

let has_tok (n : M.node) tok =
  List.mem tok (String.split_on_char ' ' (cls_of n))

let find_tok s tok = List.filter (fun n -> has_tok n tok) (M.all_nodes s.S.tree)

let attr_id (n : M.node) = M.string_prop n "accessibility-identifier"

(* view-tab anchors are "view-tab-<inst>-<uuid>" — the inst id is dynamic,
   so match by suffix *)
let find_tab s uuid =
  List.find_opt
    (fun n ->
      match attr_id n with
      | Some id ->
          String.length id > 9
          && String.sub id 0 9 = "view-tab-"
          && String.length id >= String.length uuid
          && String.sub id (String.length id - String.length uuid)
               (String.length uuid)
             = uuid
      | None -> false)
    (M.all_nodes s.S.tree)

let contains_ic hay needle =
  let hay = String.lowercase_ascii hay in
  let needle = String.lowercase_ascii needle in
  let n = String.length needle in
  let rec go i = i + n <= String.length hay
                 && (String.sub hay i n = needle || go (i + 1)) in
  n <= String.length hay && go 0

let rec subtree_texts t (n : M.node) =
  let own = Option.value (M.string_prop n "text") ~default:"" in
  let rest =
    List.concat_map (subtree_texts t) (M.children t n.M.id)
  in
  (if own = "" then [] else [ own ]) @ rest

let row_texts s =
  List.map (fun n -> subtree_texts s.S.tree n) (find_tok s "ls-table-row")

let row_titles s =
  List.filter_map (fun ts -> match ts with t :: _ -> Some t | [] -> None)
    (row_texts s)

let click s (n : M.node) =
  if
    String.length n.M.kind > 10 && String.sub n.M.kind 0 10 = "extension:"
  then begin
    let fields = SM.add "name" (Wv.StringValue "click") SM.empty in
    let ident =
      String.sub n.M.kind 10 (String.length n.M.kind - 10)
    in
    S.extension_event s ~node:n.M.id ~identifier:ident ~name:"dom-event"
      ~fields
  end
  else S.press s n.M.id

let click_tab h s uuid =
  match find_tab s uuid with
  | Some n -> click s n
  | None -> h.check ("view tab for " ^ uuid) false

let requests_named h name =
  List.filter (fun n -> n = name) (h.requests ())

(* ---------- scenarios ---------- *)

let v1 = "11111111-2222-3333-4444-555555555555"
let v2 = "22222222-2222-3333-4444-555555555555"

let ru n = Printf.sprintf "aa000000-0000-4000-8000-00000000%04d" n
let qu n = Printf.sprintf "bb000000-0000-4000-8000-00000000%04d" n

(* mount -> initial view-data paints; switching tabs re-fetches and paints
   the other view's rows. Covers: results correctness, view config
   switch, per-view data isolation *)
let table_rows_and_switch (h : ('m, 'a) host) ~finish =
  h.set_views
    [ (v1, "All", "logseq.property.view/type.table")
    ; (v2, "List", "logseq.property.view/type.table") ];
  h.set_rows ~view:v1 [ (ru 1, "Alpha"); (ru 2, "Beta") ];
  h.set_rows ~view:v2 [ (ru 3, "Gamma"); (ru 4, "Delta") ];
  let s = h.mount_table () in
  h.after 40 (fun () ->
      h.check "views: table rendered" (find_tok s "ls-table" <> []);
      h.check "views: header cells" (find_tok s "ls-table-header-cell" <> []);
      h.check "views: rows painted in order"
        (row_titles s = [ "Alpha"; "Beta" ]);
      h.check "views: two tabs" (find_tab s v1 <> None && find_tab s v2 <> None);
      let snaps0 = List.length (requests_named h "thread-api/get-render-snapshots") in
      click_tab h s v2;
      h.after 40 (fun () ->
          h.check "views: switched rows painted in order"
            (row_titles s = [ "Gamma"; "Delta" ]);
          h.check "views: old rows gone" (not (has s "text:Alpha"));
          h.check "views: switch re-fetched"
            (List.length (requests_named h "thread-api/get-render-snapshots")
             > snaps0);
          finish ()))

(* persisted sorting + filters on the view entity must reach the next
   view-data request ctx, and the filters row must render — proves the
   wire -> vstate -> ctx pipeline on both runtimes without needing the
   (anchor-bound) menu widgets *)
let table_ctx_from_entity (h : ('m, 'a) host) ~finish =
  h.set_views [ (v1, "All", "logseq.property.view/type.table") ];
  h.set_view_flags v1 [ "sort"; "filters" ];
  h.set_rows ~view:v1 [ (ru 1, "Alpha") ];
  let s = h.mount_table () in
  h.after 40 (fun () ->
      h.check "views: table rendered" (find_tok s "ls-table" <> []);
      (match List.rev (h.resources ()) with
       | last :: _ ->
           h.check "views: sorting reaches request ctx"
             (contains_ic last "block/title");
           h.check "views: filters reach request ctx"
             (contains_ic last "filters")
       | [] -> h.check "views: snapshot requests seen" false);
      h.check "views: filter row rendered"
        (find_tok s "filters-row" <> []);
      finish ())

(* a response resolving after the view selection already moved on must
   not paint: v2's rows arriving after the user returned to v1 are stale
   and get dropped — the fresh v1 response still lands *)
let stale_view_data (h : ('m, 'a) host) ~finish =
  h.set_views
    [ (v1, "All", "logseq.property.view/type.table")
    ; (v2, "List", "logseq.property.view/type.table") ];
  h.set_view_flags v1 [];
  h.set_rows ~view:v1 [ (ru 1, "Alpha") ];
  h.set_rows ~view:v2 [ (ru 3, "Gamma") ];
  let s = h.mount_table () in
  h.after 40 (fun () ->
      h.check "views: initial rows" (row_titles s = [ "Alpha" ]);
      (* v1's next fetch serves different data — the distinguishing bit *)
      h.set_rows ~view:v1 [ (ru 5, "Epsilon") ];
      h.hold "thread-api/get-render-snapshots";
      click_tab h s v2;
      click_tab h s v1;
      h.check "views: two requests parked"
        (List.length (h.pending ()) >= 2);
      (* stale first: v2's response resolves while v1 is current *)
      h.release "thread-api/get-render-snapshots";
      h.after 20 (fun () ->
          (* v1's fresh fetch is still parked — the view shows its
             loading state; the one thing that must never paint is the
             stale view's row *)
          h.check "views: stale response did not paint"
            (not (has s "text:Gamma"));
          h.release "thread-api/get-render-snapshots";
          h.after 20 (fun () ->
              h.check "views: fresh response painted"
                (row_titles s = [ "Epsilon" ]);
              finish ())))

(* a {{query}} block: the query resource's row uuids drive the
   query-result table through the normal view-data pipeline *)
let query_results (h : ('m, 'a) host) ~finish =
  let qb = qu 1 in
  h.set_query ~uuid:qb
    ~src:"{:query [:find ?b :where [?b :block/title]]}"
    ~rows:[ ru 1; ru 2 ];
  h.set_rows ~view:qb [ (ru 1, "QA"); (ru 2, "QB") ];
  let s = h.mount_query ~uuid:qb in
  h.after 40 (fun () ->
      h.check "query: results table rendered"
        (find_tok s "ls-table" <> [] || find_tok s "query-result" <> []);
      h.check "query: rows painted" (row_titles s = [ "QA"; "QB" ]);
      finish ())

let query_error (h : ('m, 'a) host) ~finish =
  let qb = qu 2 in
  h.set_query ~uuid:qb
    ~src:"{:query [:find ?b :where [?b :block/title]]}" ~rows:[];
  h.set_query_error ~uuid:qb ~msg:"boom";
  let s = h.mount_query ~uuid:qb in
  h.after 40 (fun () ->
      h.check "query: error surfaced" (has s "text:boom");
      finish ())

let run (h : ('m, 'a) host) ~finish =
  table_rows_and_switch h ~finish:(fun () ->
      table_ctx_from_entity h ~finish:(fun () ->
          stale_view_data h ~finish:(fun () ->
              query_results h ~finish:(fun () ->
                  query_error h ~finish))))
