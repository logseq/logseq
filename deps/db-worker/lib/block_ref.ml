(* logseq.common.util.block-ref — `((uuid))` block reference helpers. *)

let open_char = "(("
let close_char = "))"

let wrap s = open_char ^ s ^ close_char

(* block-ref-re — re-matches anchors a full match *)
let block_ref_re =
  Regexp.compile
    "^\\(\\(([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})\\)\\)$"

let get_block_ref_id (s : string) : string option =
  match Regexp.exec block_ref_re s with
  | Some m -> m.groups.(1)
  | None -> None

let get_string_block_ref_id (s : string) : string =
  let n = String.length s in
  String.sub s 2 (n - 4)

let block_ref (s : string) : bool = get_block_ref_id s <> None

let string_block_ref (s : string) : bool =
  Common_util.str_starts_with s open_char
  && Common_util.str_ends_with s close_char

let to_block_ref (id : string) : string = wrap id
