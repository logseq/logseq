(* dict_gen — build-time generator for i18n dicts.

   Reads src/resources/dicts/*.edn (cljs tongue dicts) and emits
   src/dicts_gen.ml: one `(string * string) array` per locale plus a
   `dicts` list keyed by locale name (en, zh-CN, ...).

   Only string-valued entries are emitted. cljs fn-valued entries
   (plural/rich templates like :graph/node-count) are skipped — their OCaml
   call sites keep literal functions in i18n.ml. *)

let die fmt = Printf.ksprintf (fun s -> prerr_endline s; exit 1) fmt

(* ---- minimal EDN reader: top-level { :kw value ... } ------------- *)

type input = { s : string ; mutable i : int ; len : int }

let ws inp =
  let rec go () =
    if inp.i < inp.len then
      match inp.s.[inp.i] with
      | ' ' | '\t' | '\n' | '\r' | ',' -> inp.i <- inp.i + 1; go ()
      | ';' ->
          while inp.i < inp.len && inp.s.[inp.i] <> '\n' do
            inp.i <- inp.i + 1
          done;
          go ()
      | _ -> ()
  in
  go ()

let peek inp = if inp.i < inp.len then Some inp.s.[inp.i] else None
let next inp = let c = inp.s.[inp.i] in inp.i <- inp.i + 1; c

let hex4 s i =
  try int_of_string ("0x" ^ String.sub s i 4) with _ -> 0

(* read a string literal, returning its decoded contents *)
let read_string inp =
  ignore (next inp); (* opening quote *)
  let b = Buffer.create 64 in
  let buf_utf8 b n =
    if n < 0x80 then Buffer.add_char b (Char.chr n)
    else if n < 0x800 then (
      Buffer.add_char b (Char.chr (0xC0 lor (n lsr 6)));
      Buffer.add_char b (Char.chr (0x80 lor (n land 0x3F))))
    else (
      Buffer.add_char b (Char.chr (0xE0 lor (n lsr 12)));
      Buffer.add_char b (Char.chr (0x80 lor ((n lsr 6) land 0x3F)));
      Buffer.add_char b (Char.chr (0x80 lor (n land 0x3F))))
  in
  let rec go () =
    match next inp with
    | '"' -> Buffer.contents b
    | '\\' ->
        (match next inp with
         | 'n' -> Buffer.add_char b '\n'
         | 't' -> Buffer.add_char b '\t'
         | 'r' -> Buffer.add_char b '\r'
         | 'b' -> Buffer.add_char b '\b'
         | 'f' -> Buffer.add_char b '\012'
         | 'u' ->
             let n = hex4 inp.s inp.i in
             inp.i <- inp.i + 4;
             buf_utf8 b n
         | c -> Buffer.add_char b c);
        go ()
    | c -> Buffer.add_char b c; go ()
    | exception _ -> die "unterminated string"
  in
  go ()

(* read an atom token (keyword, symbol, number, nil, ...) *)
let read_token inp =
  let start = inp.i in
  let rec go () =
    match peek inp with
    | Some (' ' | '\t' | '\n' | '\r' | ',' | '"' | '(' | ')' | '[' | ']'
           | '{' | '}' | ';') -> ()
    | Some _ -> inp.i <- inp.i + 1; go ()
    | None -> ()
  in
  go ();
  String.sub inp.s start (inp.i - start)

(* skip a balanced form: ( [ { and # dispatch prefixes *)
let rec skip_form inp =
  ws inp;
  match peek inp with
  | None -> ()
  | Some '"' -> ignore (read_string inp)
  | Some '#' ->
      ignore (next inp);
      (match peek inp with
       | Some ('{' | '(' | '[') -> skip_form inp
       | _ -> ignore (read_token inp))
  | Some ('(' | '[' | '{') ->
      let close =
        match next inp with
        | '(' -> ')' | '[' -> ']' | _ -> '}'
      in
      let rec until () =
        ws inp;
        match peek inp with
        | None -> ()
        | Some c when c = close -> ignore (next inp)
        | Some _ -> skip_form inp; until ()
      in
      until ()
  | Some c ->
      if c = ')' || c = ']' || c = '}' then
        die "unexpected '%c' at %d" c inp.i;
      ignore (read_token inp)

(* parse a dict file -> (key, value) list, keeping only string values *)
let parse_file path =
  let ic = open_in_bin path in
  let n = in_channel_length ic in
  let s = really_input_string ic n in
  close_in ic;
  let inp = { s; i = 0; len = n } in
  ws inp;
  if next inp <> '{' then die "%s: expected top-level map" path;
  let acc = ref [] in
  let rec go () =
    ws inp;
    match peek inp with
    | None | Some '}' -> ()
    | Some ':' ->
        let key = read_token inp in
        let key =
          if String.length key > 0 && key.[0] = ':' then
            String.sub key 1 (String.length key - 1)
          else key
        in
        ws inp;
        (match peek inp with
         | Some '"' ->
             let v = read_string inp in
             acc := (key, v) :: !acc
         | _ -> skip_form inp);
        go ()
    | Some c -> die "%s: unexpected '%c' at %d" path c inp.i
  in
  go ();
  List.rev !acc

(* ---- locale naming (cljs dicts.cljc filename -> :preferred-language) --- *)

let locale_of_file f =
  match Filename.basename f with
  | "zh-cn.edn" -> "zh-CN"
  | "zh-hant.edn" -> "zh-Hant"
  | "nb-no.edn" -> "nb-NO"
  | "pt-br.edn" -> "pt-BR"
  | "pt-pt.edn" -> "pt-PT"
  | f -> Filename.chop_extension f

let ident_of_locale l =
  String.map (fun c -> if c = '-' then '_' else c) l

(* ---- emit ------------------------------------------------------------- *)

let emit_string b s =
  Buffer.add_char b '"';
  String.iter
    (fun c ->
      match c with
      | '"' -> Buffer.add_string b "\\\""
      | '\\' -> Buffer.add_string b "\\\\"
      | '\n' -> Buffer.add_string b "\\n"
      | '\t' -> Buffer.add_string b "\\t"
      | '\r' -> Buffer.add_string b "\\r"
      | c -> Buffer.add_char b c)
    s;
  Buffer.add_char b '"'

let () =
  match Sys.argv with
  | [| _; dicts_dir; out_path |] ->
      let files =
        Sys.readdir dicts_dir
        |> Array.to_list
        |> List.filter (fun f -> Filename.check_suffix f ".edn")
        |> List.sort compare
      in
      let b = Buffer.create (1 lsl 20) in
      Buffer.add_string b
        "(* generated by tools/dict_gen.exe from src/resources/dicts — do \
         not edit *)\n\n";
      let emit_dict loc entries =
        Buffer.add_string b
          (Printf.sprintf "let %s = [|\n" (ident_of_locale loc));
        List.iter
          (fun (k, v) ->
            Buffer.add_string b "  (";
            emit_string b k;
            Buffer.add_string b ", ";
            emit_string b v;
            Buffer.add_string b ");\n")
          entries;
        Buffer.add_string b "|]\n\n"
      in
      let locales =
        List.map
          (fun f ->
            let loc = locale_of_file f in
            let entries = parse_file (Filename.concat dicts_dir f) in
            emit_dict loc entries;
            loc)
          files
      in
      Buffer.add_string b
        "let dicts : (string * (string * string) array) list = [\n";
      List.iter
        (fun loc ->
          Buffer.add_string b
            (Printf.sprintf "  (%S, %s);\n" loc (ident_of_locale loc)))
        locales;
      Buffer.add_string b "]\n";
      let oc = open_out_bin out_path in
      Buffer.output_buffer oc b;
      close_out oc
  | _ -> die "usage: dict_gen <dicts-dir> <out-file>"
