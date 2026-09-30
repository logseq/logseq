(* Splice a worker outliner-op delta ({rev, blocks, deleted, children})
   into the route page's block tree — the OCaml mirror of cljs
   subs.cljs apply-delta!: canonical block rows replace fields,
   tombstones drop nodes, and per-parent membership patches remove /
   reorder / move children. Untouched subtrees keep their identity so
   the keyed reconcile only repaints the changed rows. *)

open Promise_ext
module SMap = Stdlib.Map.Make (String)
module SSet = Stdlib.Set.Make (String)
module ISet = Stdlib.Set.Make (Int)

type patch =
  { base_rev : int
  ; remove : SSet.t
  ; upsert : (string * string) list (* uuid, order — pre-sorted by worker *)
  }

type parsed =
  { rev : int
  ; canon : Wire.t SMap.t
  ; deleted : SSet.t
  ; patches : patch SMap.t
  }

let uuid_pairs (w : Wire.t) : (string * Wire.t) list =
  match w with
  | Wire.Map kvs ->
      List.filter_map
        (fun (k, v) ->
          match k with
          | Wire.Uuid u | Wire.String u -> Some (u, v)
          | _ -> None)
        kvs
  | _ -> []

(* ordered_operations items: [uuid order] pairs *)
let pair_items (w : Wire.t) : (string * string) list =
  List.filter_map
    (fun item ->
      match Wire.elems item with
      | [ u; o ] -> (
          match (Wire.as_uuid u, Decode.order_str_of_wire o) with
          | Some uuid, Some order -> Some (uuid, order)
          | _ -> None)
      | _ -> None)
    (Wire.elems w)

let parse (delta : Wire.t) : parsed option =
  match
    ( Wire.map_get_int delta "rev"
    , Wire.get delta "blocks"
    , Wire.get delta "deleted"
    , Wire.get delta "children" )
  with
  | Some rev, Some blocks_w, Some deleted_w, Some children_w ->
      let canon =
        List.fold_left
          (fun m (u, w) -> SMap.add u w m)
          SMap.empty (uuid_pairs blocks_w)
      in
      let deleted =
        List.fold_left
          (fun s (u, _) -> SSet.add u s)
          SSet.empty (uuid_pairs deleted_w)
      in
      let patches =
        List.fold_left
          (fun m (parent, pw) ->
            match Wire.map_get_int pw "base-rev" with
            | Some base_rev ->
                SMap.add parent
                  { base_rev
                  ; remove =
                      SSet.of_list
                        (List.map fst
                           (pair_items
                              (Option.value (Wire.get pw "remove")
                                 ~default:Wire.Nil)))
                  ; upsert =
                      pair_items
                        (Option.value (Wire.get pw "upsert")
                           ~default:Wire.Nil)
                  }
                  m
            | None -> m)
          SMap.empty (uuid_pairs children_w)
      in
      Some { rev; canon; deleted; patches }
  | _ -> None

(* rev of the tx that produced the current materialized page state —
   children patches carry the base-rev they were computed against and
   can only splice onto a state at exactly that rev *)
let basis : int option ref = ref None
let applied : ISet.t ref = ref ISet.empty

(* op responses skipped while an editor is open — their deltas stay
   queued so the next refresh (or broadcast) merges the saves they
   carried before committing a stale model *)
let deferred : Wire.t list ref = ref []

let stash_deferred (d : Wire.t) = deferred := !deferred @ [ d ]

let drain_deferred () =
  let ds = !deferred in
  deferred := [];
  ds

let reset () =
  basis := None;
  applied := ISet.empty;
  deferred := []

let already_applied rev = ISet.mem rev !applied

let note_applied rev =
  applied := ISet.add rev !applied;
  (* bound the set — a long session of ops would otherwise grow it *)
  if ISet.cardinal !applied > 128 then
    applied := ISet.remove (ISet.min_elt !applied) !applied;
  basis := Some rev

(* contiguous structural splice: every membership patch must build on
   the state we hold; a base-rev gap means a missed tx — the caller
   falls back to a full reload *)
let structural_ok (p : parsed) =
  SMap.for_all
    (fun _ (pt : patch) -> !basis = Some pt.base_rev)
    p.patches

(* [f] applied over [xs], keeping the original cons cells (and the whole
   list's identity) when every element maps to itself — the sharing the
   keyed reconcile depends on *)
let map_share (f : 'a -> 'a) (xs : 'a list) : 'a list =
  let rec go (rest : 'a list) : 'a list =
    match rest with
    | [] -> []
    | x :: tl ->
        let y = f x in
        let tl' = go tl in
        if y == x && tl' == tl then rest else y :: tl'
  in
  go xs

(* helpers the applier needs from the editor layer, injected so this
   module stays below outliner_ops *)
type helpers =
  { resolve : Model.block list -> Model.block list Js.Promise.t
      (** batch tag title/ident resolution (Outliner_ops.resolve_block_tags) *)
  ; fill_embeds : Model.block list -> Model.block list Js.Promise.t
      (** block_embed_children fetch for :block/link nodes *)
  ; merge_collapsed : SSet.t -> SSet.t -> unit
      (** (added, removed) :block/collapsed? uuids into editor state *)
  ; refresh_page_fields : Model.page -> Model.page Js.Promise.t
      (** re-resolve the page entity's own fields (tag chips live on the
          page row, outside page_blocks) when its canon row changed *)
  }


(* 1-based level among siblings; top-level page children are level 1 *)
let set_level lvl (b : Model.block) : Model.block =
  if b.Model.block_level = lvl then b
  else { b with Model.block_level = lvl }

(* ordered-list numbering — Decode.assign_order_indices, but on decoded
   blocks so a patched sibling list can renumber without the wire *)
let renumber (bs : Model.block list) : Model.block list =
  let rec go prev_t prev_i acc = function
    | [] -> List.rev acc
    | b :: rest ->
        let idx =
          match b.Model.block_order_list with
          | None -> None
          | Some t -> (
              match (prev_t, prev_i) with
              | Some pt, Some i when pt = t -> Some (i + 1)
              | _ -> Some 1)
        in
        let b =
          if b.Model.block_order_index = idx then b
          else { b with Model.block_order_index = idx }
        in
        go b.Model.block_order_list idx (b :: acc) rest
  in
  go None None [] bs

(* assign positional indices on every sibling list in the tree — canon
   rows carry no index and only membership-patched lists pass through
   [renumber] inside the splice, so property-only changes (e.g. 'number
   children') would leave fresh indices unset *)
let rec renumber_tree (bs : Model.block list) : Model.block list =
  let bs = renumber bs in
  map_share
    (fun (b : Model.block) ->
      let children' = renumber_tree b.Model.block_children in
      let embed' = renumber_tree b.Model.block_embed_children in
      let b =
        if children' == b.Model.block_children then b
        else { b with Model.block_children = children' }
      in
      if embed' == b.Model.block_embed_children then b
      else { b with Model.block_embed_children = embed' })
    bs

type env =
  { p : parsed
  ; idx_nodes : (string, Model.block) Hashtbl.t
  ; canon_nodes : (string, Model.block) Hashtbl.t
      (** canon wires decoded + tag/embed filled — keyed by uuid *)
  ; consumed : (string, unit) Hashtbl.t
      (** patch parents the splice actually visited — a patch left
          unconsumed means it targeted a subtree outside the model
          (embed page roots, foreign pages) and must refetch *)
  ; mutable failed : bool
  }

(* freshest node for [uuid]: canonical fields merged over the existing
   children/embeds (canonical wires carry neither), else the live node *)
let node_for env uuid : Model.block option =
  match Hashtbl.find_opt env.canon_nodes uuid with
  | Some n -> (
      match Hashtbl.find_opt env.idx_nodes uuid with
      | Some old ->
          Some
            { n with
              Model.block_children = old.Model.block_children
            ; block_embed_children = old.Model.block_embed_children
            }
      | None -> Some n)
  | None -> Hashtbl.find_opt env.idx_nodes uuid

(* upserted children must be renderable — membership patches include
   closed-value/property-created blocks that never paint *)
let renderable env uuid (n : Model.block) : bool =
  match SMap.find_opt uuid env.p.canon with
  | Some w -> Decode.renderable_child w
  | None -> (
      match n.Model.block_uuid with
      | Some _ -> true (* already on the page *)
      | None -> false)

(* rebuild the children list under [parent_key] — [parent_key] is the
   parent block's uuid, or the page uuid for the top-level list *)
let rec splice_children env parent_key (cur : Model.block list)
    (child_level : int) : Model.block list =
  let cur =
    match
      Option.bind parent_key (fun k -> SMap.find_opt k env.p.patches)
    with
    | Some pt ->
        (match parent_key with
         | Some k -> Hashtbl.replace env.consumed k ()
         | None -> ());
        let upsert_uuids = SSet.of_list (List.map fst pt.upsert) in
        let kept =
          List.filter
            (fun (c : Model.block) ->
              match c.Model.block_uuid with
              | Some u ->
                  not
                    (SSet.mem u env.p.deleted || SSet.mem u pt.remove
                    || SSet.mem u upsert_uuids)
              | None -> true)
            cur
        in
        (* cljs patch-items: items minus removed/upserted, concat upserts,
           sort by (str order) then uuid *)
        let items =
          List.map
            (fun (c : Model.block) ->
              ( Option.value c.Model.block_uuid ~default:""
              , Option.value c.Model.block_order ~default:""
              , `Old c ))
            kept
          @ List.map (fun (u, o) -> (u, o, `Up u)) pt.upsert
        in
        List.stable_sort
          (fun (u1, o1, _) (u2, o2, _) ->
            let c = String.compare o1 o2 in
            if c <> 0 then c else String.compare u1 u2)
          items
        |> List.filter_map (fun (_, _, src) ->
               match src with
               | `Old c -> Some c
               | `Up u -> (
                   match node_for env u with
                   | Some n when renderable env u n -> Some n
                   | Some _ -> None
                   | None ->
                       env.failed <- true;
                       None))
    | None -> cur
  in
  (* content update in place + recurse — map_share keeps list/node
     identity so untouched subtrees survive the rebuild *)
  map_share
    (fun (c : Model.block) ->
      let c =
        match c.Model.block_uuid with
        | Some u -> (
            match Hashtbl.find_opt env.canon_nodes u with
            | Some n when n != c ->
                (* keep the positionally-assigned index — the canon wire
                   carries none and decode defaults it to 1, so swapping
                   blindly makes every touched sibling render "1." *)
                { n with
                  Model.block_children = c.Model.block_children
                ; block_embed_children = c.Model.block_embed_children
                ; block_order_index = c.Model.block_order_index
                }
            | _ -> c)
        | None -> c
      in
      let children' =
        match c.Model.block_uuid with
        | Some u ->
            splice_children env (Some u) c.Model.block_children
              (c.Model.block_level + 1)
        | None -> c.Model.block_children
      in
      (* embed children render the linked page's blocks — membership
         patches inside them key on their own real parents, so the
         splice descends with no parent_key rather than consuming this
         row's own patch a second time *)
      let embed_children' =
        splice_children env None c.Model.block_embed_children
          (c.Model.block_level + 1)
      in
      let c =
        if children' == c.Model.block_children then c
        else { c with Model.block_children = children' }
      in
      let c =
        if embed_children' == c.Model.block_embed_children then c
        else { c with Model.block_embed_children = embed_children' }
      in
      set_level child_level c)
    cur

(* collect uuids whose :block/collapsed? the canon wires assert, and
   uuids whose flag was retracted — merge both into editor state *)
let collapsed_sets (p : parsed) : SSet.t * SSet.t =
  SMap.fold
    (fun u w (add, rem) ->
      match Wire.get w "block/collapsed?" with
      | Some (Wire.Bool true) -> (SSet.add u add, rem)
      | _ -> (add, SSet.add u rem))
    p.canon (SSet.empty, SSet.empty)

(* page records produced by our own splices — Runtime.track tells a
   delta-committed Page_loaded (basis already noted) from a fresh
   full-fetch load (basis unknown) *)
let own_commit : Model.page option ref = ref None

let is_own_commit (page : Model.page) : bool =
  match !own_commit with
  | Some p when p == page ->
      own_commit := None;
      true
  | _ -> false

(* optimistic local commits (e.g. indent/outdent) don't change the
   materialized rev — mark them so their Page_loaded doesn't reset the
   delta basis/applied/deferred state the next splice relies on *)
let mark_own_commit (page : Model.page) = own_commit := Some page

(* the broadcast echo of a tx we already spliced via the op response —
   callers use this to skip a redundant refresh pass *)
let delta_already_applied (delta : Wire.t) : bool =
  match parse delta with Some p -> already_applied p.rev | None -> false

(* uuids the delta touches (canonical rows + tombstones) — selective
   pull-cache invalidation *)
let delta_uuids (delta : Wire.t) : string list =
  match parse delta with
  | Some p ->
      SMap.fold (fun u _ acc -> u :: acc) p.canon
        (SSet.fold (fun u acc -> u :: acc) p.deleted [])
  | None -> []

(* apply [delta] to [page]; Some merged page on success, None when the
   delta can't splice onto the current tree (caller refetches).
   [~strict] (broadcast path) requires every membership patch to be
   contiguous with our materialized rev; the op-response path passes
   ~strict:false — its patches are absolute set-ops from a tx we just
   ran, and a non-contiguous base self-heals through the next broadcast
   reload *)
let apply_to_page ?(strict = true) (h : helpers) (page : Model.page)
    (delta : Wire.t) : Model.page option Js.Promise.t =
  match parse delta with
  | None -> Js.Promise.resolve None
  | Some p -> (
      if already_applied p.rev then Js.Promise.resolve (Some page)
      else if strict && not (structural_ok p) then
        Js.Promise.resolve None
      else
        (* decode + enrich the canonical rows up front — tag titles and
           embed children need worker roundtrips *)
        let canon_list = SMap.bindings p.canon in
        let decoded =
          List.map
            (fun (u, w) -> (u, Decode.block_of_wire w))
            canon_list
        in
        let* filled =
          h.resolve (List.map snd decoded)
        in
        let* filled = h.fill_embeds filled in
        let canon_nodes = Hashtbl.create (List.length filled) in
        List.iter2
          (fun (u, _) n -> Hashtbl.replace canon_nodes u n)
          decoded filled;
        let idx_nodes = Hashtbl.create 256 in
        let rec idx (b : Model.block) =
          (match b.Model.block_uuid with
           | Some u -> Hashtbl.replace idx_nodes u b
           | None -> ());
          List.iter idx b.Model.block_children;
          List.iter idx b.Model.block_embed_children
        in
        List.iter idx page.Model.page_blocks;
        let env =
          { p; idx_nodes; canon_nodes; consumed = Hashtbl.create 16
          ; failed = false
          }
        in
        (* a membership patch keyed by the page entity's uuid targets the
           top-level list — except under block zoom, where page_uuid IS
           the zoomed block (its children get patched, not the root row) *)
        let root_key =
          match page.Model.page_uuid with
          | Some u when not (Hashtbl.mem idx_nodes u) -> Some u
          | _ -> None
        in
        let top =
          renumber_tree
            (splice_children env root_key page.Model.page_blocks 1)
        in
        let unconsumed =
          SMap.exists
            (fun k _ -> not (Hashtbl.mem env.consumed k))
            p.patches
        in
        if env.failed || unconsumed then Js.Promise.resolve None
        else (
          let add_c, rem_c = collapsed_sets p in
          if not (SSet.is_empty add_c && SSet.is_empty rem_c) then
            h.merge_collapsed add_c rem_c;
          note_applied p.rev;
          let page' = { page with Model.page_blocks = top } in
          let* page' =
            match page.Model.page_uuid with
            | Some u when SMap.mem u p.canon ->
                h.refresh_page_fields page'
            | _ -> Js.Promise.resolve page'
          in
          own_commit := Some page';
          Js.Promise.resolve (Some page')))
