(* Page export dialog state — mirrors cljs components/export.cljs
   export-blocks atoms: the active format tab plus the text-transform
   options persisted under :copy/export-block-text-* localStorage keys. *)

type fmt =
  | Text
  | Opml
  | Html
  | Png
  | Edn

type t =
  { page_uuid : string option
  ; page_db_id : int option
  ; block_uuids : string list
  ; has_top_level : bool
    (* cljs when-not (seq? top-level-uuids) gates the PNG tab *)
  ; fmt : fmt
  ; content : string option
  ; copied : bool
  ; indent_style : string
  ; remove_options : string list
  ; newline_after_block : bool
  ; open_blocks_only : bool
  ; level_lte : int option
  ; png : Webapi.Blob.t option
  ; png_url : string option
  ; png_transparent : bool
  }

let get = Platform.local_storage_get
let set = Platform.local_storage_set

let stored_or key dflt =
  match get key with Some v when v <> "" -> v | _ -> dflt

let stored_removals () =
  stored_or "copy/export-block-text-remove-options" ""
  |> String.split_on_char ','
  |> List.filter (fun s -> s <> "")

let stored_other () =
  let s = stored_or "copy/export-block-text-other-options" "" in
  let items = String.split_on_char ',' s in
  let find k =
    let p = k ^ "=" in
    let lp = String.length p in
    match
      List.find_opt
        (fun it ->
          String.length it > lp && String.sub it 0 lp = p)
        items
    with
    | Some it -> Some (String.sub it lp (String.length it - lp))
    | None -> None
  in
  ( find "newline-after-block" = Some "true"
  , find "open-blocks-only" = Some "true"
  , match find "keep-only-level<=N" with
    | Some "all" | None -> None
    | Some v -> ( match int_of_string_opt v with Some n -> Some n | None -> None)
  )

let defaults () =
  let nl, ob, lvl = stored_other () in
  { page_uuid = None
  ; page_db_id = None
  ; block_uuids = []
  ; has_top_level = false
  ; fmt = Text
  ; content = None
  ; copied = false
  ; indent_style = stored_or "copy/export-block-text-indent-style" "dashes"
  ; remove_options = stored_removals ()
  ; newline_after_block = nl
  ; open_blocks_only = ob
  ; level_lte = lvl
  ; png = None
  ; png_url = None
  ; png_transparent = false
  }

let persist st =
  set "copy/export-block-text-indent-style" st.indent_style;
  set "copy/export-block-text-remove-options"
    (String.concat "," st.remove_options);
  let lvl =
    match st.level_lte with None -> "all" | Some n -> string_of_int n
  in
  set "copy/export-block-text-other-options"
    (Printf.sprintf "newline-after-block=%b,open-blocks-only=%b,keep-only-level<=N=%s"
       st.newline_after_block st.open_blocks_only lvl)

(* Identity stashed by the opener when the dialog opens — page_menu
   arms a page, the block context menu arms block uuids (already
   filtered to top-level roots, cljs get-top-level-uuids). *)
type pending_target =
  | Pending_page of string * int option * bool
  | Pending_blocks of string list

let pending : pending_target option ref = ref None

let arm uuid db_id ~has_top_level =
  pending := Some (Pending_page (uuid, db_id, has_top_level))

let arm_blocks uuids = pending := Some (Pending_blocks uuids)

include State_cell.Make (struct
  type nonrec t = t
  let name = "export"
end)

let st ctx = get_or_init ctx.Lui_ui.ui_scheduler (defaults ())

(* synchronous mirror of the state cell — Signal.update only queues a
   publish, so Signal.get_state in the same tick (open_ -> regen, tab
   rows at mount, set_fmt -> regen) would read the pre-update record *)
let cur_ref : t option ref = ref None

let cur st =
  match !cur_ref with Some c -> c | None -> Signal.get_state st

let mutate st f =
  let next = f (cur st) in
  cur_ref := Some next;
  Signal.update st (fun _ -> next)

let open_ ctx =
  (* the opener arms `pending` before open_dialog; the dialog body may
     re-run after that first mount, so a consumed (None) pending must
     NOT reset the armed target — otherwise the dialog falls back to an
     empty export (PNG tab + blank preview) *)
  match !pending with
  | None -> ()
  | Some target ->
      pending := None;
      let st = st ctx in
      let uuid, db_id, block_uuids, has_top_level =
        match target with
        | Pending_page (u, d, tl) -> (Some u, d, [], tl)
        | Pending_blocks us -> (None, None, us, us <> [])
      in
      (match (cur st).png_url with
       | Some old -> Webapi.Url.revokeObjectURL old
       | None -> ());
      mutate st (fun s ->
          { s with
            page_uuid = uuid
          ; page_db_id = db_id
          ; block_uuids = block_uuids
          ; has_top_level
          ; fmt = Text
          ; content = None
          ; copied = false
          ; png = None
          ; png_url = None
          ; png_transparent = false });
      Runtime.flush ()
