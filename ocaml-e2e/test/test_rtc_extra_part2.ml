(** Port of rtc_extra_part2_test.clj. *)

open Fest.Promise

module B = Block
module Page = Ls_page
module K = Keyboard
module Assert = E2e_assert
module Loc = Ls_locator
module Rtc = Rtc

external read_file_sync : string -> string -> string = "readFileSync"
  [@@mel.module "fs"]

let read_utf8 path = read_file_sync path "utf8"

external process_env : string Js.Dict.t = "process.env"

let env_int k default =
  match Js.Dict.get process_env k with
  | None -> default
  | Some s -> (
      match int_of_string_opt (String.trim s) with
      | Some n -> n
      | None -> default)

let pages = Fixtures.shared_2_pages ()

let ready : (Env.t * Env.t * string) Js.Promise.t Lazy.t =
  lazy
    (let* env1, env2 = pages in
     let graph_name = "rtc-extra-part2-test-graph-" ^ Fixtures.inst_string () in
     let* _ =
       Js.Promise.all2
         ( Env.with_page env1 (Env.page env1) (fun () ->
               let* _ = Settings.developer_mode env1 in
               let* _ = Settings.refresh_test_env env1 in
               Util.login_test_account env1)
         , Env.with_page env2 (Env.page env2) (fun () ->
               let* _ = Settings.developer_mode env2 in
               let* _ = Settings.refresh_test_env env2 in
               Util.login_test_account env2) )
     in
     let* () =
       Env.with_page env1 (Env.page env1) (fun () ->
           Graph.new_graph env1 graph_name ~enable_sync:true
             ~graph_e2ee:false ())
     in
     let* () =
       Env.with_page env2 (Env.page env2) (fun () ->
           let* () = Graph.wait_for_remote_graph env2 graph_name in
           let* _ =
             Graph.switch_graph env2 graph_name ~wait_sync:true
               ~need_input_password:true
           in
           Js.Promise.resolve ())
     in
     (* browsers may already be closed when this hook runs (after-hooks are
        FIFO and the shared pages' close is registered first): removing the
        remote graph is best-effort teardown *)
     Fixtures.after (fun () ->
         Js.Promise.catch
           (fun e ->
             ignore e;
             Js.Promise.resolve ())
           (Env.with_page env2 (Env.page env2) (fun () ->
                let* _ = Graph.remove_remote_graph env2 graph_name in
                Js.Promise.resolve ())));
     Js.Promise.resolve (env1, env2, graph_name))

let new_rtc_page env p1 p2 = Fixtures.new_logseq_page_in_rtc env p1 p2 ()

let stress_default_rounds = 1
let stress_default_ops_per_client = 50
let stress_default_seed_blocks = 20
let stress_default_seed = 20260330
let stress_max_seed_depth = 4

let severe_sync_log_patterns =
  [ "db-sync/checksum-mismatch"; "db-sync/tx-rejected"
  ; "db-sync/apply-remote-txs-failed"; "db-sync/remote-tx-apply-failed" ]

let rec iter_seq f = function
  | [] -> Js.Promise.resolve ()
  | x :: rest ->
      let* () = f x in
      iter_seq f rest

let contains_sub hay needle =
  let hl = String.length hay and nl = String.length needle in
  let rec go i =
    if i + nl > hl then false
    else if String.sub hay i nl = needle then true
    else go (i + 1)
  in
  nl = 0 || go 0

let recent_console_logs env1 env2 =
  Env.console_logs env1 @ Env.console_logs env2

let assert_no_severe_sync_errors env1 env2 =
  let matched =
    List.filter
      (fun line ->
        List.exists (fun pat -> contains_sub line pat)
          severe_sync_log_patterns)
      (recent_console_logs env1 env2)
  in
  let tail =
    let rec last n = function
      | [] -> []
      | l ->
          if List.length l <= n then l
          else last n (List.tl l)
    in
    last 20 matched
  in
  Fest.deep_equal matched [] Fest.expect;
  if matched <> [] then Js.log2 "severe sync errors" tail

let page_sync_state env p =
  Env.with_page env p (fun () ->
      let* () = Util.exit_edit env in
      let* tx = Rtc.get_rtc_tx env in
      let* blocks = Util.settled_page_blocks_contents env in
      Js.Promise.resolve (tx, Array.to_list blocks))

(* Failure diagnostic: dump each page's uuid -> (block/order, parent
   uuid) map from the frontend datascript state so a block-list
   divergence can be classified as order-value vs parent-membership
   without inspecting DOM positions. *)
let order_map env p =
  Env.with_page env p (fun () ->
      Pw.eval_js env
        "(async () => { \
         const q = globalThis.logseq && logseq.api && \
         logseq.api.datascript_query; if (!q) return {err:'no-q'}; const q1 = '[:find ?u ?o ?pe \
         :where [?b :block/uuid ?u] [(get-else $ ?b :block/order \"\") \
         ?o] [(get-else $ ?b :block/parent -1) ?pe]]'; const q2 = \
         '[:find ?e ?u :where [?e :block/uuid ?u]]'; const rows = await \
         q(q1); const eids = await q(q2); const e2u = new \
         Map(eids.map(r => [r[0], r[1]])); const m = {}; for (const \
         [u,o,pe] of rows) m[u] = [o, e2u.get(pe) ?? String(pe)]; return \
         m; })()")

let order_map_diff m1 m2 =
  match Js.Json.decodeObject m1, Js.Json.decodeObject m2 with
  | Some d1, Some d2 ->
      Js.Dict.entries d1
      |> Array.to_list
      |> List.filter_map (fun (u, v1) ->
             match Js.Dict.get d2 u with
             | None -> Some (Printf.sprintf "%s only-in-p1=%s" u (Js.Json.stringify v1))
             | Some v2 ->
                 if Js.Json.stringify v1 = Js.Json.stringify v2 then None
                 else
                   Some
                     (Printf.sprintf "%s p1=%s p2=%s" u
                        (Js.Json.stringify v1) (Js.Json.stringify v2)))
      |> (fun diffs ->
      Printf.sprintf "%d diffs: %s" (List.length diffs)
        (String.concat "; " (List.filteri (fun i _ -> i < 8) diffs)))
  | _ -> "order-map undecodable"

(* Per-page render report: rebuild the expected document order from the
   frontend datascript state (parent links + order sort at each level)
   and locate the first position where the actual .ls-block sequence
   diverges from it — a mismatch means the DOM is stale relative to the
   page's own db rather than a cross-client data divergence. *)
let render_report env p =
  Env.with_page env p (fun () ->
      Pw.eval_js env
        "(async () => { \
         const q = globalThis.logseq && logseq.api && \
         logseq.api.datascript_query; if (!q) return {err:'no-q'}; \
         const q1 = '[:find ?u ?o ?pe ?t :where [?b :block/uuid ?u] \
         [(get-else $ ?b :block/order \"\") ?o] \
         [(get-else $ ?b :block/parent -1) ?pe] \
         [(get-else $ ?b :block/title \"\") ?t]]'; \
         const q2 = '[:find ?e ?u :where [?e :block/uuid ?u]]'; \
         const rows = await q(q1); const eids = await q(q2); \
         const e2u = new Map(eids.map(r => [r[0], r[1]])); \
         const titles = new Map(rows.map(r => [r[0], r[3]])); \
         const kids = new Map(); \
         for (const [u,o,pe] of rows) { \
           const pu = e2u.get(pe) ?? 'ROOT'; \
           if (!kids.has(pu)) kids.set(pu, []); \
           kids.get(pu).push([u, String(o)]); } \
         for (const [, l] of kids) l.sort((a,b) => a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0); \
         const exp = []; const seen = new Set(); \
         const dfs = (pu) => { for (const [u] of (kids.get(pu) || [])) { \
           if (seen.has(u)) continue; seen.add(u); exp.push(u); dfs(u); } }; \
         dfs('ROOT'); \
         const dom = [...document.querySelectorAll('.ls-page-blocks \
         .ls-block[blockid]')].map(el => el.getAttribute('blockid')); \
         let idx = -1; const n = Math.max(dom.length, exp.length); \
         for (let i = 0; i < n; i++) if (dom[i] !== exp[i]) { idx = i; break; } \
         const w = (arr, i) => arr.slice(Math.max(0, i-2), i+5).map(u => \
           (titles.get(u) || '?') + '|' + String(u).slice(0,8)); \
         return { nDom: dom.length, nExp: exp.length, idx, \
                  dom: idx < 0 ? [] : w(dom, idx), \
                  exp: idx < 0 ? [] : w(exp, idx) }; })()")

let render_report_str json =
  match Js.Json.decodeObject json with
  | None -> "render-report undecodable"
  | Some o ->
      let s k =
        match Js.Dict.get o k with
        | Some v -> Js.Json.stringify v
        | None -> "?"
      in
      Printf.sprintf "nDom=%s nExp=%s idx=%s dom=%s exp=%s" (s "nDom")
        (s "nExp") (s "idx") (s "dom") (s "exp")

let dom_uuids env p =
  Env.with_page env p (fun () ->
      let* j =
        Pw.eval_js env
          "JSON.stringify([...document.querySelectorAll('.ls-page-blocks \
           .ls-block[blockid]')].map(el => el.getAttribute('blockid')))"
      in
      Js.Promise.resolve
        (match Js.Json.decodeArray j with
         | Some a ->
             Array.to_list a
             |> List.filter_map Js.Json.decodeString
         | None -> []))

(* The DOM block list is virtualized — long pages mount only a ~13-row
   window and each client sits at a different scroll offset, so comparing
   rendered rows is meaningless. The sync contract is on the data both
   clients render from: rebuild the full expected document tree (parent
   links + order sort, depth-first) from each page's frontend datascript
   state and compare uuid|title sequences — strict, scroll-independent. *)
let expected_tree env p =
  Env.with_page env p (fun () ->
      let* j =
        Pw.eval_js env
          "(async () => { \
           const q = globalThis.logseq && logseq.api && \
           logseq.api.datascript_query; if (!q) return ['NO-QUERY']; \
           const q1 = '[:find ?u ?o ?pe ?t :where [?b :block/uuid ?u] \
           [(get-else $ ?b :block/order \"\") ?o] \
           [(get-else $ ?b :block/parent -1) ?pe] \
           [(get-else $ ?b :block/title \"\") ?t]]'; \
           const q2 = '[:find ?e ?u :where [?e :block/uuid ?u]]'; \
           const rows = await q(q1); const eids = await q(q2); \
           const e2u = new Map(eids.map(r => [r[0], r[1]])); \
           const titles = new Map(rows.map(r => [r[0], r[3]])); \
           const kids = new Map(); \
           for (const [u,o,pe] of rows) { \
             const pu = e2u.get(pe) ?? 'ROOT'; \
             if (!kids.has(pu)) kids.set(pu, []); \
             kids.get(pu).push([u, String(o)]); } \
           for (const [, l] of kids) l.sort((a,b) => a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0); \
           const exp = []; const seen = new Set(); \
           const dfs = (pu) => { for (const [u] of (kids.get(pu) || [])) { \
             if (seen.has(u)) continue; seen.add(u); \
             exp.push(String(u) + '|' + (titles.get(u) || '')); dfs(u); } }; \
           dfs('ROOT'); \
           return JSON.stringify(exp); })()"
      in
      Js.Promise.resolve
        (match Js.Json.decodeArray j with
         | Some a ->
             Array.to_list a |> List.filter_map Js.Json.decodeString
         | None -> [ "UNDECODABLE" ]))

let assert_two_pages_synced env p1 p2 =
  let* tx1, blocks1 = page_sync_state env p1 in
  let* tx2, blocks2 = page_sync_state env p2 in
  let* tree1 = expected_tree env p1 in
  let* tree2 = expected_tree env p2 in
  (* slot patches are computed on the worker display conn and can trail the
     datoms shipped in the same delta; give the sync loop a bounded window
     to flush before comparing (clj gets this slack from JVM latency). *)
  let rec converge n t1 t2 =
    if t1 = t2 then Js.Promise.resolve (t1, t2)
    else if n <= 0 then Js.Promise.resolve (t1, t2)
    else
      let* () =
        Env.with_page env p1 (fun () ->
            Pw.catch_timeout (Rtc.wait_idle env) (fun () ->
                Js.Promise.resolve ()))
      in
      let* () =
        Env.with_page env p2 (fun () ->
            Pw.catch_timeout (Rtc.wait_idle env) (fun () ->
                Js.Promise.resolve ()))
      in
      let* () = Util.wait_timeout env 500. in
      let* t1' = expected_tree env p1 in
      let* t2' = expected_tree env p2 in
      converge (n - 1) t1' t2'
  in
  let* tree1, tree2 = converge 16 tree1 tree2 in
  let* () =
    Js.Promise.catch
      (fun _ ->
         let* m1 = order_map env p1 in
         let* m2 = order_map env p2 in
         let* r1 = render_report env p1 in
         let* r2 = render_report env p2 in
         let first_diff a b =
           let rec go i a b =
             match (a, b) with
             | x :: xs, y :: ys -> if x <> y then i else go (i + 1) xs ys
             | [], [] -> -1
             | _ -> i
           in
           go 0 a b
         in
         let window i xs =
           xs |> List.mapi (fun j x -> (j, x))
           |> List.filter (fun (j, _) -> j >= i - 2 && j <= i + 4)
           |> List.map (fun (j, x) -> Printf.sprintf "%d:%s" j x)
         in
         let d = first_diff tree1 tree2 in
         let w xs = "[" ^ String.concat "; " (window d xs) ^ "]" in
         let d2 = first_diff blocks1 blocks2 in
         let w2 xs = "[" ^ String.concat "; " (window d2 xs) ^ "]" in
         let _ =
           Js.log
             (Printf.sprintf
                "order-map-diff: %s\nrender-p1: %s\nrender-p2: %s\ntree-diff: i=%d n1=%d n2=%d p1=%s p2=%s\ndom-blocks-diff: i=%d n1=%d n2=%d p1=%s p2=%s"
                (order_map_diff m1 m2) (render_report_str r1)
                (render_report_str r2) d
                (List.length tree1) (List.length tree2) (w tree1)
                (w tree2) d2 (List.length blocks1) (List.length blocks2)
                (w2 blocks1) (w2 blocks2))
         in
         Fest.deep_equal tree1 tree2 Fest.expect;
         Js.Promise.resolve ())
      (Js.Promise.then_
         (fun () ->
            Fest.deep_equal tree1 tree2 Fest.expect;
            Js.Promise.resolve ())
         (Js.Promise.resolve ()))
  in
  Fest.deep_equal tx1.Rtc.local_tx tx1.Rtc.remote_tx Fest.expect;
  Fest.deep_equal tx2.Rtc.local_tx tx2.Rtc.remote_tx Fest.expect;
  Js.Promise.resolve ()

let try_indent env =
  let* editor = Util.get_editor env in
  match editor with
  | None -> Js.Promise.resolve false
  | Some ed -> (
      let* x1, _ = Pw.bounding_xy_l ed in
      let* () = K.tab env in
      let* editor' = Util.get_editor env in
      match editor' with
      | Some ed' ->
          let* x2, _ = Pw.bounding_xy_l ed' in
          Js.Promise.resolve (x2 > x1)
      | None -> Js.Promise.resolve false)

let try_outdent env =
  let* editor = Util.get_editor env in
  match editor with
  | None -> Js.Promise.resolve false
  | Some ed -> (
      let* x1, _ = Pw.bounding_xy_l ed in
      let* () = K.shift_tab env in
      let* editor' = Util.get_editor env in
      match editor' with
      | Some ed' ->
          let* x2, _ = Pw.bounding_xy_l ed' in
          Js.Promise.resolve (x1 > x2)
      | None -> Js.Promise.resolve false)

let rec align_depth env depth target =
  if depth < target then
    let* ok = try_indent env in
    if ok then align_depth env (depth + 1) target
    else Js.Promise.resolve depth
  else if depth > target then
    let* ok = try_outdent env in
    if ok then align_depth env (depth - 1) target
    else Js.Promise.resolve depth
  else Js.Promise.resolve depth

let new_block_safe env title =
  let last_err = ref "" in
  let rec loop attempt =
    let* created =
      Js.Promise.catch
        (fun e ->
          (match Js.Json.stringifyAny (Obj.magic e) with
           | Some s ->
               last_err :=
                 String.sub s 0 (min 160 (String.length s))
           | None -> last_err := "nonstr-err");
          Js.Promise.resolve false)
        (* B.new_block already creates the block and types the title into
           the live editor with db-level verification — save_block on top
           would just be a second editor session doing the same commit *)
        (let* () = B.new_block env title in
         Js.Promise.resolve true)
    in
    if created then Js.Promise.resolve ()
    else if attempt = 0 then
      let* probe =
        Js.Promise.catch
          (fun _ -> Js.Promise.resolve (Js.Json.string "ERR"))
          (Pw.eval_js env
             "JSON.stringify({editors: \
              document.querySelectorAll('.editor-wrapper textarea').length, \
              blocks: document.querySelectorAll('.ls-page-blocks .ls-block')\
              .length, addBtns: \
              document.querySelectorAll('.ls-page-blocks .block-add-button')\
              .length, url: location.href})")
      in
      Js.Promise.reject
        (Failure
           (Printf.sprintf "new-block-safe failed: %s probe=%s err=%s"
              title
              (Option.value ~default:"null" (Js.Json.decodeString probe))
              !last_err))
    else
      let* () = Util.exit_edit env in
      let* () = Util.wait_timeout env 80. in
      let* _ =
        Js.Promise.catch
          (fun _ -> Js.Promise.resolve ())
          (B.open_last_block env)
      in
      let* () = Util.wait_timeout env 80. in
      loop (attempt - 1)
  in
  loop 4

let rec max_of = function
  | [] -> 0
  | x :: tl -> max x (max_of tl)

(** sync-by-trigger: first ensure both pages observed all checkpoint txs,
    then create a trigger block on p1 and wait it on both. *)
let sync_by_trigger env p1 p2 tag checkpoints =
  let target_tx = max_of checkpoints in
  let* () =
    if target_tx > 0 then
      let* () =
        Env.with_page env p1 (fun () ->
            let* _ = Rtc.wait_tx_update_to env target_tx in
            Js.Promise.resolve ())
      in
      Env.with_page env p2 (fun () ->
          let* _ = Rtc.wait_tx_update_to env target_tx in
          Js.Promise.resolve ())
    else Js.Promise.resolve ()
  in
  let* tx =
    Env.with_page env p1 (fun () ->
        Rtc.with_wait_tx_updated env (fun () ->
            new_block_safe env ("sync-trigger-" ^ tag)))
  in
  let remote = Option.value ~default:0 tx.Rtc.remote_tx in
  let* () =
    Env.with_page env p1 (fun () ->
        let* _ = Rtc.wait_tx_update_to env remote in
        Js.Promise.resolve ())
  in
  Env.with_page env p2 (fun () ->
      let* _ = Rtc.wait_tx_update_to env remote in
      Js.Promise.resolve ())

(* java.util.Random-compatible RNG — the clj test draws its action stream
   with java.util.Random, so this reproduces the exact op sequence clj runs
   for a given seed. *)
type rng = { mutable seed : int64 }

let rng_mask = 0xFFFF_FFFF_FFFFL (* 2^48 - 1 *)

let rng_make seed =
  { seed =
      Int64.logand
        (Int64.logxor (Int64.of_int seed) 0x5DEECE66DL)
        rng_mask
  }

let rng_next rng bits =
  rng.seed <-
    Int64.logand
      (Int64.add (Int64.mul rng.seed 0x5DEECE66DL) 0xBL)
      rng_mask;
  Int64.to_int (Int64.shift_right_logical rng.seed (48 - bits))

let rng_int rng bound =
  if bound <= 0 then invalid_arg "rng_int"
  else if bound land (bound - 1) = 0 then
    Int64.to_int
      (Int64.shift_right
         (Int64.mul (Int64.of_int bound) (Int64.of_int (rng_next rng 31)))
         31)
  else
    let rec go () =
      let bits = rng_next rng 31 in
      let v = bits mod bound in
      if bits - v + (bound - 1) <= 0x7FFFFFFF then v else go ()
    in
    go ()

external frame_url : 'a -> string = "url" [@@mel.send]

let seed_long_nested_page env p1 p2 (seed : int) =
  let seed_blocks =
    max 20
      (env_int "DB_SYNC_E2E_STRESS_SEED_BLOCKS" stress_default_seed_blocks)
  in
  let rng = rng_make (seed + 97) in
  let* titles =
    Env.with_page env p1 (fun () ->
        let* () = Util.exit_edit env in
        let rec loop i depth titles =
          if i < seed_blocks then
            let title = Printf.sprintf "seed-r%d-%03d" seed i in
            let target_depth = rng_int rng (stress_max_seed_depth + 1) in
            let* () = new_block_safe env title in
            let* depth' = align_depth env depth target_depth in
            loop (i + 1) depth' (title :: titles)
          else
            let* () = Util.exit_edit env in
            Js.Promise.resolve titles
        in
        loop 0 0 [])
  in
  let* () = sync_by_trigger env p1 p2 ("seed-" ^ string_of_int seed) [] in
  Js.Promise.resolve titles

let delete_existing_random_block env rng known_titles =
  let rec loop attempt =
    if attempt = 0 then Js.Promise.resolve 0
    else
      match !known_titles with
      | [] -> Js.Promise.resolve 0
      | titles ->
          let title = List.nth titles (rng_int rng (List.length titles)) in
          let* deleted =
            Js.Promise.catch
              (fun _ -> Js.Promise.resolve false)
              (let* () = B.jump_to_block env title in
               let* () = B.delete_blocks env in
               Js.Promise.resolve true)
          in
          if deleted then (
            known_titles := List.filter (fun t -> t <> title) !known_titles;
            Js.Promise.resolve 1)
          else loop (attempt - 1)
  in
  loop 8

type action = New | Save | Indent_outdent | Delete_existing | Undo | Redo

let random_edit_actions =
  [| New; Save; Indent_outdent; Delete_existing; Undo; Redo |]

let random_edit_op env rng known_titles client_prefix round op_idx =
  let base = Printf.sprintf "%s-r%d-op%d" client_prefix round op_idx in
  let pick = random_edit_actions.(rng_int rng (Array.length random_edit_actions)) in
  match pick with
  | New ->
      let title = base ^ "-new" in
      let* () = new_block_safe env title in
      known_titles := title :: !known_titles;
      Js.Promise.resolve 1
  | Save ->
      let save_title = base ^ "-save-updated" in
      let* () = new_block_safe env (base ^ "-save") in
      let* () = B.save_block env save_title in
      known_titles := save_title :: !known_titles;
      Js.Promise.resolve 2
  | Indent_outdent ->
      let title = base ^ "-nest" in
      let* () = new_block_safe env title in
      known_titles := title :: !known_titles;
      let* i = try_indent env in
      let* o = try_outdent env in
      Js.Promise.resolve
        (1 + (if i then 1 else 0) + (if o then 1 else 0))
  | Delete_existing -> delete_existing_random_block env rng known_titles
  | Undo ->
      let* () = B.undo env in
      Js.Promise.resolve 0
  | Redo ->
      let* () = B.redo env in
      Js.Promise.resolve 0

(* Wait until at most one editor textarea is mounted — the previous
   op's editor unmount is async, and the next click otherwise races
   into a transient 2-editor DOM (strict-mode violation). *)
let wait_editor_settled env =
  let rec poll n =
    let* n_editors =
      Pw.eval_js env
        "document.querySelectorAll('.editor-wrapper textarea').length"
    in
    match Js.Json.decodeNumber n_editors with
    | Some v when v <= 1. -> Js.Promise.resolve ()
    | _ ->
        if n <= 0 then Js.Promise.resolve ()
        else
          let* () = Util.wait_timeout env 50. in
          poll (n - 1)
  in
  poll 60

let local_random_edit_batch env rng known_titles client_prefix round =
  let ops =
    max 1
      (env_int "DB_SYNC_E2E_STRESS_OPS_PER_CLIENT"
         stress_default_ops_per_client)
  in
  let rec loop i undo_steps =
    if i < ops then
      let* () = wait_editor_settled env in
      let* steps =
        random_edit_op env rng known_titles client_prefix round i
      in
      loop (i + 1) (undo_steps + steps)
    else
      let* () = Util.exit_edit env in
      Js.Promise.resolve undo_steps
  in
  loop 0 0

let local_undo_redo_batch env undo_steps =
  let steps = max 1 undo_steps in
  let* () = B.open_last_block env in
  let rec times n f =
    if n <= 0 then Js.Promise.resolve ()
    else
      let* () = f () in
      times (n - 1) f
  in
  let* () = times steps (fun () -> B.undo env) in
  let* () = times steps (fun () -> B.redo env) in
  Util.exit_edit env

let () =
  if Util.is_main "test_rtc_extra_part2.js" then
  Fest.Promise.test "online-two-clients-undo-redo-stress-test" (fun () ->
    let* env1, env2, _graph_name = Lazy.force ready in
    let env = env1 in
    let p1 = Env.page env1 in
    let p2 = Env.page env2 in
    let* () = new_rtc_page env p1 p2 in
    let rounds =
      max 1 (env_int "DB_SYNC_E2E_STRESS_ROUNDS" stress_default_rounds)
    in
    let seed = env_int "DB_SYNC_E2E_STRESS_SEED" stress_default_seed in
    let p1_rng = rng_make (seed + 101) in
    let p2_rng = rng_make (seed + 202) in
    let t0 = Js.Date.now () in
    let phase name =
      Js.log2 "[phase]"
        (Printf.sprintf "%s t=+%.0fs" name ((Js.Date.now () -. t0) /. 1000.))
    in
    let () = phase "rtc-page" in
    let* titles = seed_long_nested_page env p1 p2 seed in
    let () = phase "seeded" in
    let known_titles = ref titles in
    let rec round_loop round =
      if round < rounds then (
        let () = phase (Printf.sprintf "round%d-begin" round) in
        (* Phase 1: random edits on both clients without forced sync *)
        let* p1_steps, p2_steps =
          Js.Promise.all2
            ( Env.with_page env1 p1 (fun () ->
                  local_random_edit_batch env1 p1_rng known_titles "p1"
                    round), Env.with_page env2 p2 (fun () ->
                  local_random_edit_batch env2 p2_rng known_titles "p2"
                    round) )
        in
        let* p1_edit_tx =
          Env.with_page env p1 (fun () ->
              let* tx = Rtc.get_rtc_tx env in
              Js.Promise.resolve
                (Option.value ~default:0 tx.Rtc.local_tx))
        in
        let* p2_edit_tx =
          Env.with_page env p2 (fun () ->
              let* tx = Rtc.get_rtc_tx env in
              Js.Promise.resolve
                (Option.value ~default:0 tx.Rtc.local_tx))
        in
        (* Phase 2: undo+redo both clients *)
        let* (), () =
          Js.Promise.all2
            ( Env.with_page env1 p1 (fun () ->
                  local_undo_redo_batch env1 p1_steps), Env.with_page
                env2 p2 (fun () ->
                  local_undo_redo_batch env2 p2_steps) )
        in
        let* p1_undo_tx =
          Env.with_page env p1 (fun () ->
              let* tx = Rtc.get_rtc_tx env in
              Js.Promise.resolve
                (Option.value ~default:0 tx.Rtc.local_tx))
        in
        let* p2_undo_tx =
          Env.with_page env p2 (fun () ->
              let* tx = Rtc.get_rtc_tx env in
              Js.Promise.resolve
                (Option.value ~default:0 tx.Rtc.local_tx))
        in
        let () = phase (Printf.sprintf "round%d-edits-done" round) in
        let* () =
          sync_by_trigger env p1 p2 (string_of_int round)
            [ p1_edit_tx; p2_edit_tx; p1_undo_tx; p2_undo_tx ]
        in
        let () = phase (Printf.sprintf "round%d-synced" round) in
        let* () = assert_two_pages_synced env p1 p2 in
        let () = phase (Printf.sprintf "round%d-asserted" round) in
        assert_no_severe_sync_errors env1 env2;
        round_loop (round + 1))
      else Js.Promise.resolve ()
    in
    round_loop 0)

let () =
  if Util.is_main "test_rtc_extra_part2.js" then
  Fest.Promise.test "issue-651-block-title-double-transit-encoded-test"
    (fun () ->
    let* env1, env2, _graph_name = Lazy.force ready in
    let env = env1 in
    let p1 = Env.page env1 in
    let p2 = Env.page env2 in
    let* () = new_rtc_page env p1 p2 in
    let* () =
      Env.with_page env p1 (fun () ->
          let* () = Page.new_page env "aaa" in
          let* () = Page.convert_to_tag env "aaa" in
          let* () = Page.new_page env "bbb" in
          let* () = Page.convert_to_tag env ~extends:[ "aaa" ] "bbb" in
          let* () = Page.new_page env "ccc" in
          let* () = B.new_block env "" in
          let* () = Util.input_command env "query" in
          let* () = Pw.click_l (Util.query_last env "button:text('filter')") in
          let* () = Util.input env "tags" in
          let* () = Pw.click env "a.menu-link:has-text('tags')" in
          let* () = Pw.click env "a.menu-link:has-text('bbb')" in
          (* as described in the issue *)
          Util.wait_timeout env 5000.)
    in
    let* tx =
      Env.with_page env p1 (fun () ->
          Rtc.with_wait_tx_updated env (fun () -> B.new_block env "done"))
    in
    let* () =
      Env.with_page env p2 (fun () ->
          let* _ =
            Rtc.wait_tx_update_to env
              (Option.value ~default:0 tx.Rtc.remote_tx)
          in
          Js.Promise.resolve ())
    in
    let* () =
      Env.with_page env p1 (fun () -> Page.goto_page env "bbb")
    in
    let* () =
      Env.with_page env p2 (fun () -> Page.goto_page env "bbb")
    in
    Rtc.validate_graphs_in_2_pages env p1 p2)

let () =
  if Util.is_main "test_rtc_extra_part2.js" then
  Fest.Promise.test "paste-multiple-blocks-test" (fun () ->
    let* env1, env2, _graph_name = Lazy.force ready in
    let env = env1 in
    let p1 = Env.page env1 in
    let p2 = Env.page env2 in
    let* () = new_rtc_page env p1 p2 in
    let* () =
      Env.with_page env p1 (fun () ->
          let* () = B.new_blocks env [ "block1"; "block2"; "block3" ] in
          let* () = Util.exit_edit env in
          let* () = B.select_blocks env 2 in
          let* () = B.copy env in
          let* () = B.jump_to_block env "block3" in
          Util.repeat_keyboard env 1 "Enter")
    in
    let rec paste_n n =
      if n <= 0 then Js.Promise.resolve ()
      else
        let* tx =
          Env.with_page env p1 (fun () ->
              Rtc.with_wait_tx_updated env (fun () -> B.paste env))
        in
        let* () =
          Env.with_page env p2 (fun () ->
              let* _ =
                Rtc.wait_tx_update_to env
                  (Option.value ~default:0 tx.Rtc.remote_tx)
              in
              Js.Promise.resolve ())
        in
        paste_n (n - 1)
    in
    let* () = paste_n 5 in
    let* tx =
      Env.with_page env p1 (fun () ->
          Rtc.with_wait_tx_updated env (fun () ->
              B.new_block env "sync-trigger"))
    in
    let* () =
      Env.with_page env p2 (fun () ->
          let* _ =
            Rtc.wait_tx_update_to env
              (Option.value ~default:0 tx.Rtc.remote_tx)
          in
          Js.Promise.resolve ())
    in
    let expected =
      let one = [ "block1"; "block2"; "block3" ] in
      one
      @ List.concat (List.init 5 (fun _ -> one))
      @ [ "sync-trigger" ]
    in
    let* () =
      Env.with_page env p1 (fun () ->
          let* () = Util.exit_edit env in
          let* contents = Util.settled_page_blocks_contents env in
          Fest.deep_equal (Array.to_list contents) expected Fest.expect;
          Js.Promise.resolve ())
    in
    let* () =
      Env.with_page env p2 (fun () ->
          let* () = Util.exit_edit env in
          let* contents = Util.settled_page_blocks_contents env in
          Fest.deep_equal (Array.to_list contents) expected Fest.expect;
          Js.Promise.resolve ())
    in
    Rtc.validate_graphs_in_2_pages env p1 p2)

let () =
  if Util.is_main "test_rtc_extra_part2.js" then
  Fest.Promise.test "asset-blocks-validate-after-init-downloaded-test"
    (fun () ->
    let* env1, env2, graph_name = Lazy.force ready in
    let env = env1 in
    let p1 = Env.page env1 in
    let p2 = Env.page env2 in
    let* () = new_rtc_page env p1 p2 in
    let* page_title =
      Env.with_page env p1 (fun () -> Page.get_page_name env)
    in
    let* () =
      Env.with_page env p1 (fun () ->
          Playwright.on_event (Env.page env) "filechooser"
            (fun fc ->
              ignore
                (Playwright.file_chooser_set_files fc
                   [| "../assets/icon.png" |]));
          let* () = B.new_block env "asset block" in
          let* () = Util.input_command env "Upload an asset" in
          Pw.wait_for env ".ls-block img")
    in
    let* tx =
      Env.with_page env p1 (fun () ->
          Rtc.with_wait_tx_updated env (fun () ->
              B.new_block env "sync done"))
    in
    let* () =
      Env.with_page env p2 (fun () ->
          let* _ =
            Rtc.wait_tx_update_to env
              (Option.value ~default:0 tx.Rtc.remote_tx)
          in
          Js.Promise.resolve ())
    in
    let* () =
      Env.with_page env p2 (fun () ->
          let* () =
            Graph.remove_local_graph env graph_name
          in
          let* () =
            Graph.wait_for_remote_graph env graph_name
          in
          let* _ =
            Graph.switch_graph env graph_name ~wait_sync:true
              ~need_input_password:false
          in
          let* () = Page.goto_page env page_title in
          let* () = Pw.wait_for env ".ls-block img" in
          let* src = Pw.attr env ".ls-block img" "src" in
          Fest.deep_equal (src <> None) true Fest.expect;
          Js.Promise.resolve ())
    in
    Rtc.validate_graphs_in_2_pages env p1 p2)

let () =
  if Util.is_main "test_rtc_extra_part2.js" then
  Fest.Promise.test "issue-683-paste-large-block-test" (fun () ->
    let* env1, env2, _graph_name = Lazy.force ready in
    let env = env1 in
    let p1 = Env.page env1 in
    let p2 = Env.page env2 in
    let* () = new_rtc_page env p1 p2 in
    let large_text = read_utf8 "resources/large_text.txt" in
    let* () =
      Env.with_page env p1 (fun () ->
          let* () =
            Pw.eval_js env
              ("navigator.clipboard.writeText("
              ^ Pw.json_stringify large_text
              ^ ")")
          in
          Js.Promise.resolve ())
    in
    let* tx =
      Env.with_page env p1 (fun () ->
          Rtc.with_wait_tx_updated env (fun () ->
              let* () = B.new_block env "" in
              B.paste env))
    in
    let* () =
      Env.with_page env p2 (fun () ->
          let* _ =
            Rtc.wait_tx_update_to env
              (Option.value ~default:0 tx.Rtc.remote_tx)
          in
          Js.Promise.resolve ())
    in
    Rtc.validate_graphs_in_2_pages env p1 p2)
