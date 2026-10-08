(* Deferred/reordered geometry scenarios for the NATIVE editor adapter
   (native/logseq_editor.ml). Native-only: the reply stores and the
   Host.dom_op request channel live in the native services layer and do
   not exist in the web runtime.

   Locked behavior:
   - a pending caret/point query answers None until a valid measurement
     reply lands (the host promise-deferral contract — measured only
     after the host replies)
   - malformed or other-block replies never satisfy a query
   - KNOWN DEFECT (Task 5): replies are stored keyed only by
     (block-id, query args) — no text/layout revision — so a reply
     captured for the OLD text answers the same-offset query after an
     edit, and a reply landing after the surface is gone leaks into a
     remount for a reused block-id. Those cases are marked expected-
     failure: the stale result is never asserted as correct output. *)

open Test_check
module EI = Edit_input
module Le = Logseq_editor
module Json = Js.Json

let dom_ops : (string * string) list ref = ref []

let install_host_op () =
  dom_ops := [];
  Host.set_host_op (fun name payload ->
      dom_ops := !dom_ops @ [ (name, payload) ])

let reset_stores () =
  Hashtbl.reset Le.caret_rects;
  Hashtbl.reset Le.offset_ats;
  Hashtbl.reset Le.line_ranges_store;
  Hashtbl.reset Le.scroll_heights

let num n = Json.JNumber (Float.of_int n)

let caret_reply block_id off ~x ~y ~h =
  Json.JObject
    [ "block-id", Json.JString block_id
    ; "offset", num off
    ; "x", num x
    ; "y", num y
    ; "h", num h
    ]

let ranges_reply block_id ranges =
  Json.JObject
    [ "block-id", Json.JString block_id
    ; "ranges", Json.JString ranges
    ]

let offset_reply block_id ~x ~y ~off =
  Json.JObject
    [ "block-id", Json.JString block_id
    ; "x", num x
    ; "y", num y
    ; "offset", num off
    ]

(* did any dom-op carry this request name *)
let issued name =
  List.exists
    (fun (op, payload) ->
      op = "dom-op" && String.starts_with ~prefix:(name ^ "\n") payload)
    !dom_ops

let conduit () =
  match Le.conduit "blk-1" with
  | Some c -> c
  | None -> failwith "native conduit must exist"

(* ---------- passing scenarios ---------- *)

(* a pending query reports nothing and issues the host request; after a
   valid reply the same query completes *)
let test_pending_then_complete () =
  install_host_op ();
  reset_stores ();
  let c = conduit () in
  check "caret query pending -> None" (c.EI.caret_rect 5 = None);
  check "caret query issued request" (issued "caret-rect");
  Le.note_measurement "caret-rect" (caret_reply "blk-1" 5 ~x:40 ~y:8 ~h:16);
  check "caret query completes after reply" (c.EI.caret_rect 5 <> None);
  check "caret query stable on second read" (c.EI.caret_rect 5 <> None);
  (* point query behaves the same *)
  check "offset-at pending -> None" (c.EI.offset_at ~x:9 ~y:3 = None);
  check "offset-at issued request" (issued "offset-at");
  Le.note_measurement "offset-at" (offset_reply "blk-1" ~x:9 ~y:3 ~off:2);
  check "offset-at completes after reply" (c.EI.offset_at ~x:9 ~y:3 = Some 2);
  (* line ranges: empty until a reply, then populated *)
  check "line-ranges pending -> []" (c.EI.line_ranges () = []);
  Le.note_measurement "line-ranges" (ranges_reply "blk-1" "0,6;7,13");
  check "line-ranges completes after reply"
    (c.EI.line_ranges () = [ (0, 6); (7, 13) ])

(* malformed or foreign replies never satisfy a query *)
let test_ignored_replies () =
  install_host_op ();
  reset_stores ();
  let c = conduit () in
  (* missing fields -> dropped by the reply parser *)
  Le.note_measurement "caret-rect"
    (Json.JObject [ "block-id", Json.JString "blk-1"; "offset", num 5 ]);
  check "incomplete caret reply dropped" (c.EI.caret_rect 5 = None);
  Le.note_measurement "caret-rect" (Json.JObject [ "x", num 4; "offset", num 5 ]);
  check "block-less caret reply dropped" (c.EI.caret_rect 5 = None);
  Le.note_measurement "line-ranges" (ranges_reply "blk-1" "bogus");
  check "unparseable ranges reply dropped" (c.EI.line_ranges () = []);
  (* another block's reply does not answer this block's query *)
  Le.note_measurement "caret-rect" (caret_reply "blk-other" 5 ~x:40 ~y:8 ~h:16);
  check "other-block reply isolated" (c.EI.caret_rect 5 = None)

(* ---------- known-defect scenarios (expected-failure) ---------- *)

(* a reply for the OLD text answers the identical query after an edit —
   the store has no text/layout revision. Same block, same offset. *)
let test_stale_reply_after_edit () =
  install_host_op ();
  reset_stores ();
  let c = conduit () in
  ignore (c.EI.caret_rect 2);
  Le.note_measurement "caret-rect" (caret_reply "blk-1" 2 ~x:20 ~y:8 ~h:16);
  (* user types into the block — the reply above was measured against
     the pre-edit text and must no longer answer *)
  xfail
    "same block+offset query after edit rejects stale reply \
     (Task 5 defect)"
    (c.EI.caret_rect 2 = None)

(* line ranges measured for old layout answer post-edit reads *)
let test_stale_line_ranges_after_edit () =
  install_host_op ();
  reset_stores ();
  let c = conduit () in
  Le.note_measurement "line-ranges" (ranges_reply "blk-1" "0,6");
  xfail
    "line ranges after edit reject stale reply (Task 5 defect)"
    (c.EI.line_ranges () = [])

(* a reply landing after the surface was disposed still satisfies a
   fresh conduit for the reused block-id — no session/invalidation key *)
let test_reply_after_disposal () =
  install_host_op ();
  reset_stores ();
  let c = conduit () in
  ignore (c.EI.caret_rect 3);
  (* surface disposed — no invalidation hook exists on the stores *)
  Le.note_measurement "caret-rect" (caret_reply "blk-1" 3 ~x:33 ~y:9 ~h:16);
  let c' = Le.conduit "blk-1" |> Option.get in
  xfail
    "late reply after disposal cannot answer remounted query \
     (Task 5 defect)"
    (c'.EI.caret_rect 3 = None)

let run () =
  test_pending_then_complete ();
  test_ignored_replies ();
  test_stale_reply_after_edit ();
  test_stale_line_ranges_after_edit ();
  test_reply_after_disposal ()
