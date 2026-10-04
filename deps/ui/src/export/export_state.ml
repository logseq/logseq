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

(* Page identity stashed by page_menu when the dialog opens — mirrors
   cljs state/:*export-block-text properties. *)
let pending : (string * int option * bool) option ref = ref None

let arm uuid db_id ~has_top_level =
  pending := Some (uuid, db_id, has_top_level)

let st_ref : t Signal.state option ref = ref None

let st ctx =
  match !st_ref with
  | Some s -> s
  | None ->
      let s = Signal.state ctx.Lui_ui.ui_scheduler (defaults ()) in
      st_ref := Some s;
      s

let open_ ctx =
  let st = st ctx in
  let uuid, db_id, has_top_level =
    match !pending with
    | Some (u, d, tl) -> (Some u, d, tl)
    | None -> (None, None, false)
  in
  pending := None;
  (match (Signal.get_state st).png_url with
   | Some old -> Webapi.Url.revokeObjectURL old
   | None -> ());
  Signal.update st (fun s ->
      { s with
        page_uuid = uuid
      ; page_db_id = db_id
      ; has_top_level
      ; fmt = Text
      ; content = None
      ; copied = false
      ; png = None
      ; png_url = None
      ; png_transparent = false });
  Runtime.flush ()
