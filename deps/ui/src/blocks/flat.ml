(* Flat row stream — the shared outliner pipeline for web and apple.

   The nested outliner tree (Model.block with block_children /
   block_embed_children) flattens into a depth-tagged row stream like
   chat's outliner_state.visible_rows: one array the virtualized list
   consumes directly. Collapse applies at flatten time — descendants of
   a collapsed block never reach the row array, so windowed renderers
   scroll a single flat stream instead of mounted nested DOM.

   Each row carries its ancestor uuid chain so the renderer can draw the
   indent guides and the per-group collapse strips the nested DOM had. *)

module S = Editor_state
module SSet = Stdlib.Set.Make (String)

type row =
  { block : Model.block
  ; uuid : string (* Tree.block_key *)
  ; depth : int (* 0 = top-level *)
  ; has_children : bool
  ; collapsed : bool (* effective collapsed at flatten time *)
  ; ancestors : string array (* ancestor uuids, outermost first *)
  }

let row_key (r : row) = r.uuid

let uuid_of (b : Model.block) =
  match b.block_uuid with
  | Some u -> u
  | None -> "block-" ^ string_of_int (Option.value b.block_db_id ~default:0)

let row_equal (a : row) (b : row) =
  a.block == b.block && a.depth = b.depth
  && a.has_children = b.has_children
  && a.collapsed = b.collapsed
  && a.ancestors = b.ancestors

let rows_equal (a : row array) (b : row array) =
  Array.length a = Array.length b
  &&
  (let rec go i = i >= Array.length a || row_equal a.(i) b.(i) && go (i + 1) in
   go 0)

(* DFS over the visible tree: emit the block, recurse only when it is not
   effectively collapsed. [st] is the Editor_state snapshot — collapse
   is decided by the same effective_collapsed_in the per-row attrs use,
   so a caret toggle and the row stream never disagree. *)
let flatten ~scope ~roots (st : S.t) : row array =
  let acc = ref [] in
  let rec go depth ancestors (b : Model.block) =
    let uuid = uuid_of b in
    let children = S.children_of b in
    let collapsed =
      S.effective_collapsed_in ~scope uuid b.Model.block_default_collapsed
        st
    in
    acc :=
      { block = b; uuid; depth
      ; has_children = children <> []
      ; collapsed; ancestors }
      :: !acc;
    if not collapsed then begin
      (* each level allocates once: ancestors for a node's children are
         that node's array + its uuid appended — siblings share it *)
      let ancestors' = Array.append ancestors [| uuid |] in
      List.iter (go (depth + 1) ancestors') children
    end
  in
  List.iter (go 0 [||]) roots;
  Array.of_list (List.rev !acc)

(* the collapse-relevant projection of Editor_state: republishes only
   when one of the four collapse/expand sets actually changes, so
   keystrokes, selection and editing-buffer publishes never reach the
   flatten below *)
let collapse_sets () =
  let open Signal in
  cutoff
    (fun (a, b, c, d) (a', b', c', d') ->
      SSet.equal a a' && SSet.equal b b' && SSet.equal c c'
      && SSet.equal d d')
    (map
       (fun (st : S.t) ->
         (st.S.collapsed, st.expanded, st.collapsed_ui, st.expanded_ui))
       (S.signal ()))

(* live flat rows over a block-list signal. Reflattens when the block
   spine changes (a splice produced a new list) or when the
   collapse-relevant sets in Editor_state change; rows_equal dedupes on
   real row identity so subscribers repaint only what moved. *)
let rows_sig ~scope (blocks_sig : Model.block list Signal.signal) :
    row array Signal.signal =
  (* Signal.scope shadows the parameter inside open Signal *)
  let sc = scope in
  let open Signal in
  let spine = cutoff ( == ) blocks_sig in
  cutoff rows_equal
    (map2
       (fun (roots : Model.block list) _collapse_sets ->
         flatten ~scope:sc ~roots (S.value ()))
       spine (collapse_sets ()))

(* journals is itself one flattened list (chat's outline stream model):
   not a virtual list of pages each nesting its own list, but a single
   stream of items — a day head, that day's visible block rows, then a
   day tail carrying the refs/add section. Pagination appends items;
   a delta-spliced day re-flattens into the same stream. *)
type item =
  | Row of row
  | Day_head of Model.page
  | Day_tail of Model.page * bool (* last page — separator drops *)

(* same day identity the runtime splices by *)
let day_key (p : Model.page) = Runtime.journal_item_key p

let item_key = function
  | Row r -> r.uuid
  | Day_head p -> "day-" ^ day_key p
  | Day_tail (p, last) -> "tail-" ^ day_key p ^ (if last then "-l" else "")

let item_equal (a : item) (b : item) =
  match a, b with
  | Row ra, Row rb -> row_equal ra rb
  | Day_head pa, Day_head pb -> pa == pb
  | Day_tail (pa, la), Day_tail (pb, lb) -> pa == pb && la = lb
  | _ -> false

let items_equal (a : item array) (b : item array) =
  Array.length a = Array.length b
  &&
  (let rec go i =
     i >= Array.length a || item_equal a.(i) b.(i) && go (i + 1)
   in
   go 0)

let journal_flatten ~scope (pages : Model.page array) (st : S.t) :
    item array =
  let acc = ref [] in
  let last_i = Array.length pages - 1 in
  Array.iteri
    (fun i (p : Model.page) ->
      acc := Day_tail (p, i = last_i) :: !acc;
      let rows = flatten ~scope ~roots:p.Model.page_blocks st in
      for j = Array.length rows - 1 downto 0 do
        acc := Row rows.(j) :: !acc
      done;
      acc := Day_head p :: !acc)
    pages;
  Array.of_list (List.rev !acc)

(* live journal stream over the outer days signal — same two triggers
   as rows_sig: the page array (splices, pagination) and the collapse
   sets *)
let journal_stream ~scope (pages_sig : Model.page array Signal.signal)
    : item array Signal.signal =
  let sc = scope in
  let open Signal in
  let spine = cutoff ( == ) pages_sig in
  cutoff items_equal
    (map2
       (fun (pages : Model.page array) _collapse_sets ->
         journal_flatten ~scope:sc pages (S.value ()))
       spine (collapse_sets ()))
