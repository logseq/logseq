(* Platform PDF document access for the self-drawn viewer. macOS uses
   PDFKit offscreen; other platforms use the same OCaml contract once
   their PDFium adapter is linked. *)

type document = nativeint

external open_document : string -> document = "logseq_pdf_open"
external close_document : document -> unit = "logseq_pdf_close"
external count_pages : document -> int = "logseq_pdf_page_count"
external size_of_page : document -> int -> float * float = "logseq_pdf_page_size"
external render_page_ppm : document -> int -> float -> Bytes.t = "logseq_pdf_render_ppm"
external select_json : document -> int -> float -> float -> float -> float -> string = "logseq_pdf_selection_json_bytecode" "logseq_pdf_selection_json"

type entry = { document : document; mutable refs : int }

let mutex = Mutex.create ()
let documents : (string, entry) Hashtbl.t = Hashtbl.create 8

let path_of_url_or_path path =
  if String.length path > 7 && String.sub path 0 7 = "file://" then
    let uri = Uri.of_string path in
    Uri.pct_decode (Uri.path uri)
  else path

let with_document path f =
  let path = path_of_url_or_path path in
  Mutex.lock mutex;
  Fun.protect ~finally:(fun () -> Mutex.unlock mutex) (fun () ->
    let entry =
      match Hashtbl.find_opt documents path with
      | Some entry -> entry
      | None ->
          let document = open_document path in
          if document = Nativeint.zero then invalid_arg ("PDF document is unavailable: " ^ path);
          let entry = { document; refs = 0 } in
          Hashtbl.replace documents path entry;
          entry
    in
    f entry.document)

let page_count path = with_document path count_pages

let page_size path page =
  if page < 1 then invalid_arg "PDF page must be positive";
  with_document path (fun document -> size_of_page document (page - 1))

let render_ppm path page scale =
  if page < 1 then invalid_arg "PDF page must be positive";
  if not (Float.is_finite scale) || scale <= 0. then invalid_arg "PDF scale must be positive";
  with_document path (fun document -> render_page_ppm document (page - 1) scale)

let selection_json path page x1 y1 x2 y2 =
  if page < 1 then invalid_arg "PDF page must be positive";
  let finite value = Float.is_finite value in
  if not (List.for_all finite [ x1; y1; x2; y2 ]) then invalid_arg "PDF selection coordinates must be finite";
  with_document path (fun document ->
    select_json document (page - 1) x1 y1 x2 y2)

let reset_for_tests () =
  Mutex.lock mutex;
  Fun.protect ~finally:(fun () -> Mutex.unlock mutex) (fun () ->
    Hashtbl.iter (fun _ entry -> close_document entry.document) documents;
    Hashtbl.reset documents)
