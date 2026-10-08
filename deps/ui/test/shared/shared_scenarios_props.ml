(* Property behavior scenarios — drive the shared properties
   implementation (Properties_data / Properties_value / Properties_select)
   in both runtimes.

   The scenarios lib sees only `lui` (+ contracts): the real modules are
   reached through the host record, which each entry wires to the actual
   implementation. What is asserted is observable behavior only — the ops
   the worker received, the endpoints invoked (with their repo arg), the
   mounted node tree, and the ordering/filtering of rows.

   Sync-only contract: worker invocations record their (name, repo)
   synchronously in invoke_log and apply-outliner-ops payloads in ops_log,
   so every check below resolves without draining promise microtasks. *)

module M = Drive.Model
module S = Drive.Session
module W = Wire

type ('m, 'a) host =
  { session : ('m, 'a) S.t
  ; check : string -> bool -> unit
  ; (* mount a bare Properties_value.view ctx row; returns its session *)
    mount_cell : block_uuid:string -> row:W.t -> ('m, 'a) S.t
  ; (* drive the real commit_date_text (date/datetime ghost input) *)
    commit_date : ident:string -> is_datetime:bool -> text:string -> unit
  ; (* serialized apply-outliner-ops payloads: "name|arg|arg|..." *)
    ops_log : unit -> string list
  ; (* serialized worker invokes: "name@repo" *)
    invoke_log : unit -> string list
  ; clear_logs : unit -> unit
  ; set_repo : string -> unit
  ; (* run f after n async hops — real promise microtasks on js,
       synchronous on native; write-path effects settle inside them *)
    after : int -> (unit -> unit) -> unit
  ; (* D.block_render_data uuid — resolution captured entry-side *)
    request_block_data : uuid:string -> unit
  ; (* run the pending batch flush now (D.flush_render_data) *)
    flush_pending : unit -> unit
  ; (* real delegates *)
    positioned_rows : W.t -> string -> W.t list
  ; split_display : W.t -> W.t list * W.t list
  ; filter_items : (string * string) list -> string -> string list
  }

(* ---------- helpers ---------- *)

let nodes_of (s : ('m, 'a) S.t) = M.all_nodes s.S.tree

let cls_of (n : M.node) =
  Option.value (M.string_prop n "style-class") ~default:""

let has_tok n tok =
  List.mem tok
    (List.filter (fun s -> s <> "") (String.split_on_char ' ' (cls_of n)))

let find_nodes s f = List.filter f (nodes_of s)
let kind s k = find_nodes s (fun n -> n.M.kind = k)

let contains hay needle =
  let hl = String.length hay and nl = String.length needle in
  let rec go i = i + nl <= hl && (String.sub hay i nl = needle || go (i + 1)) in
  nl <= hl && go 0

let has_op h needle =
  List.exists (fun op -> contains op needle) (h.ops_log ())

let has_invoke h needle =
  List.exists (fun l -> contains l needle) (h.invoke_log ())

let prop_row ~ident ~ty ?(value = W.Nil) ?(closed = []) ?(title = "P") ()
    : W.t =
  W.Map
    [ W.String "property-id", W.Keyword ident
    ; ( W.String "property"
      , W.Map
          ([ W.Keyword "logseq.property/type", W.Keyword ty
           ; W.Keyword "block/title", W.String title ]
          @ (match closed with
             | [] -> []
             | vs -> [ W.Keyword "property/closed-values", W.Array vs ]))
      )
    ; W.String "value", value
    ]

let row_ident w =
  match W.get w "property-id" with
  | Some (W.Keyword s) | Some (W.String s) -> s
  | _ -> "?"

let row_value w = Option.value (W.get w "value") ~default:W.Nil

let open_editor h (s : ('m, 'a) S.t) =
  match find_nodes s (fun n -> has_tok n "pv-scalar") with
  | b :: _ ->
      S.press s b.M.id;
      kind s "text-field"
  | [] ->
      h.check "value cell ghost button mounts" false;
      []

(* ---------- edits: accept paths ---------- *)

let scalar_edits h =
  h.clear_logs ();
  (* number cell: ghost press -> inline field -> submit commits Float *)
  let s =
    h.mount_cell ~block_uuid:"b1"
      ~row:(prop_row ~ident:"user.property/pn" ~ty:"number"
              ~value:(W.Int 3) ())
  in
  (match open_editor h s with
   | tf :: _ ->
       S.text_changed s tf.M.id "12.5";
       S.submit s tf.M.id
   | [] -> ());
  (* checkbox toggle writes Bool *)
  let s2 =
    h.mount_cell ~block_uuid:"b1"
      ~row:(prop_row ~ident:"user.property/pc" ~ty:"checkbox"
              ~value:(W.Bool false) ())
  in
  (match kind s2 "checkbox" with
   | cb :: _ -> S.toggle s2 cb.M.id true
   | [] -> h.check "checkbox cell mounts" false);
  (* worker invocations land on async hops — check after they settle *)
  h.after 5 (fun () ->
      h.check "number edit emits set-block-property 12.5"
        (has_op h "set-block-property"
         && has_op h "user.property/pn" && has_op h "12.5");
      h.check "checkbox emits set-block-property true"
        (has_op h "set-block-property"
         && has_op h "user.property/pc" && has_op h "true"))

(* ---------- edits: rejection paths ---------- *)

let journal_lookups h =
  List.length
    (List.filter (fun l -> contains l "get-journal-page-by-day")
       (h.invoke_log ()))

let rejections h =
  h.clear_logs ();
  (* invalid number input must emit no write *)
  let s =
    h.mount_cell ~block_uuid:"b1"
      ~row:(prop_row ~ident:"user.property/pnx" ~ty:"number"
              ~value:(W.Int 3) ())
  in
  (match open_editor h s with
   | tf :: _ ->
       S.text_changed s tf.M.id "abc";
       S.submit s tf.M.id
   | [] -> ());
  (* date text commit: garbage rejected, valid day hits the journal-page
     lookup endpoint — the lookup invoke fires inside commit itself *)
  h.commit_date ~ident:"user.property/pd" ~is_datetime:false
    ~text:"not-a-date";
  h.check "invalid date emits no journal lookup"
    (journal_lookups h = 0);
  h.commit_date ~ident:"user.property/pd" ~is_datetime:false
    ~text:"2026-10-08";
  h.check "valid date queries journal page" (journal_lookups h = 1);
  (* datetime garbage rejected as well *)
  h.commit_date ~ident:"user.property/pdt" ~is_datetime:true ~text:"xx";
  h.check "invalid datetime emits no lookup" (journal_lookups h = 1);
  (* writes ride the async hop — confirm nothing was emitted *)
  h.after 5 (fun () ->
      h.check "invalid number emits no write"
        (not (has_op h "user.property/pnx"));
      h.check "invalid datetime emits no write"
        (not (has_op h "user.property/pdt")))

(* ---------- sorting / filtering ---------- *)

let ordering h =
  let prop ident =
    W.Map
      [ W.Keyword "db/ident", W.Keyword ident
      ; W.Keyword "block/title", W.String ident ]
  in
  (* declared order must win, and value-entities unwrap to their scalar *)
  let block_w =
    W.Map
      [ ( W.Keyword "block.temp/positioned-properties"
        , W.Map
            [ ( W.Keyword "block-left"
              , W.Array
                  [ prop "user.property/second"; prop "user.property/first" ]
              ) ] )
      ; ( W.Keyword "user.property/second"
        , W.Map [ W.Keyword "logseq.property/value", W.Int 2 ] )
      ; W.Keyword "user.property/first", W.Int 1
      ]
  in
  let rows = h.positioned_rows block_w "block-left" in
  h.check "positioned rows keep declared order"
    (List.map row_ident rows
     = [ "user.property/second"; "user.property/first" ]);
  h.check "value-entity unwraps to scalar"
    (match rows with
     | r :: _ -> row_value r = W.Int 2
     | [] -> false);
  h.check "missing position yields no rows"
    (h.positioned_rows block_w "block-right" = []);
  (* hidden rows split out of the display list *)
  let disp_w =
    W.Map
      [ ( W.Keyword "full-properties"
        , W.Array [ prop "user.property/vis" ] )
      ; ( W.Keyword "hidden-properties"
        , W.Array [ prop "user.property/hid" ] )
      ]
  in
  let vis, hid = h.split_display disp_w in
  h.check "split_display separates hidden"
    (List.length vis = 1 && List.length hid = 1);
  (* search filtering: substring match + exact/prefix ranking *)
  let items = [ "alpha", "Alpha"; "beta", "Beta"; "alphabet", "Alphabet" ] in
  h.check "filter matches substring"
    (h.filter_items items "eta" = [ "Beta" ]);
  h.check "filter is case-insensitive"
    (h.filter_items items "ALPHA" <> []);
  h.check "prefix ranks before substring"
    (match h.filter_items items "alph" with
     | "Alpha" :: _ -> true
     | _ -> false);
  h.check "empty filter keeps all"
    (List.length (h.filter_items items "") = 3)

(* ---------- graph switch / stale response ---------- *)

let graph_switch h =
  h.clear_logs ();
  h.set_repo "graph-a";
  (* issue a batched render-data request, then switch graphs before the
     batch flushes — the request must bind the LIVE repo, not the one
     captured when it was enqueued *)
  h.request_block_data ~uuid:"u-stale";
  h.set_repo "graph-b";
  h.flush_pending ();
  h.check "batched get-blocks binds live repo"
    (has_invoke h "get-blocks@graph-b");
  h.check "no stale-repo request fired"
    (not (has_invoke h "get-blocks@graph-a"))

let all h =
  scalar_edits h;
  rejections h;
  ordering h;
  graph_switch h
