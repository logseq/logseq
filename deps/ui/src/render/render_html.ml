(* @@html: fragment parser — parses a small HTML fragment ("<div
   id='x'>text</div>") into LUI elements. Unbalanced input renders as a
   literal text node so nothing is lost (cljs renders through an html
   template too). *)

open Lui_elements
module D = Logseq_el

type node =
  | Text of string
  | Elem of string * (string * string) list * node list

let is_ws c = c = ' ' || c = '\t' || c = '\n' || c = '\r'
let is_name_char c =
  (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')
  || (c >= '0' && c <= '9') || c = '-' || c = '_' || c = ':' || c = '.'

let skip_ws s i n =
  let rec go i = if i < n && is_ws s.[i] then go (i + 1) else i in
  go i

let read_name s i n =
  let rec go i = if i < n && is_name_char s.[i] then go (i + 1) else i in
  let j = go i in
  (String.sub s i (j - i), j)

(* attrs until '>' or '/>' *)
let read_attrs s i n =
  let rec loop i acc =
    let i = skip_ws s i n in
    if i >= n || s.[i] = '>' || (s.[i] = '/' && i + 1 < n && s.[i + 1] = '>')
    then (List.rev acc, i)
    else
      let name, i = read_name s i n in
      if name = "" then (List.rev acc, n)
      else
        let i = skip_ws s i n in
        if i < n && s.[i] = '=' then
          let i = skip_ws s (i + 1) n in
          if i < n && (s.[i] = '"' || s.[i] = '\'') then
            let q = s.[i] in
            let j =
              let rec find j =
                if j >= n then n else if s.[j] = q then j else find (j + 1)
              in
              find (i + 1)
            in
            loop (j + 1) ((name, String.sub s (i + 1) (j - i - 1)) :: acc)
          else
            let v, i = read_name s i n in
            loop i ((name, v) :: acc)
        else loop i ((name, "") :: acc)
  in
  loop i []

let void_tag = function
  | "br" | "hr" | "img" | "input" | "meta" | "link" -> true
  | _ -> false

let rec parse_nodes s i n acc =
  if i >= n then (List.rev acc, i)
  else if starts_closing s i n then (List.rev acc, i)
  else if s.[i] = '<' then
    let j = skip_ws s (i + 1) n in
    if j < n && s.[j] = '!' then
      (* comment / doctype: skip to '>' *)
      let rec find k = if k >= n then n else if s.[k] = '>' then k + 1 else find (k + 1) in
      parse_nodes s (find j) n acc
    else
      let tag, k = read_name s j n in
      if tag = "" then parse_nodes s (i + 1) n acc
      else
        let tag = String.lowercase_ascii tag in
        let attrs, k = read_attrs s k n in
        if k >= n then (List.rev (Elem (tag, attrs, []) :: acc), n)
        else if s.[k] = '/' then
          parse_nodes s (min n (k + 2)) n (Elem (tag, attrs, []) :: acc)
        else if void_tag tag then
          parse_nodes s (k + 1) n (Elem (tag, attrs, []) :: acc)
        else
          let kids, k2 = parse_nodes s (k + 1) n [] in
          (* skip </tag> *)
          let k3 =
            if starts_closing s k2 n then
              let _, e = read_name s (skip_ws s (k2 + 2) n) n in
              let rec find x = if x >= n then n else if s.[x] = '>' then x + 1 else find (x + 1) in
              find e
            else k2
          in
          parse_nodes s k3 n (Elem (tag, attrs, kids) :: acc)
  else
    let j =
      let rec find j = if j >= n || s.[j] = '<' then j else find (j + 1) in
      find i
    in
    parse_nodes s j n (Text (String.sub s i (j - i)) :: acc)

and starts_closing s i n =
  i + 1 < n && s.[i] = '<' && s.[i + 1] = '/'

let rec el_of_node = function
  | Text s ->
      if String.trim s = "" then [] else [ D.txt (decode_entities s) ]
  | Elem (tag, attrs, kids) ->
      (* TODO(component): @@html parses arbitrary tags/attrs — no
         fixed component kind maps a parsed fragment *)
      [ D.el ~tag ~attrs (List.concat_map el_of_node kids) ]

and decode_entities s =
  let b = Buffer.create (String.length s) in
  let n = String.length s in
  let rec go i =
    if i < n then begin
      if s.[i] = '&' then begin
        let rec find_semi j =
          if j >= n || j - i > 8 then -1
          else if s.[j] = ';' then j
          else find_semi (j + 1)
        in
        let j = find_semi (i + 1) in
        if j > 0 then
          match String.sub s (i + 1) (j - i - 1) with
          | "amp" -> Buffer.add_char b '&'; go (j + 1)
          | "lt" -> Buffer.add_char b '<'; go (j + 1)
          | "gt" -> Buffer.add_char b '>'; go (j + 1)
          | "quot" -> Buffer.add_char b '"'; go (j + 1)
          | "nbsp" -> Buffer.add_string b "\xc2\xa0"; go (j + 1)
          | _ -> Buffer.add_char b s.[i]; go (i + 1)
        else begin Buffer.add_char b s.[i]; go (i + 1) end
      end else begin Buffer.add_char b s.[i]; go (i + 1) end
    end
  in
  go 0;
  Buffer.contents b

let els_of_string frag : t list =
  let nodes, _ = parse_nodes frag 0 (String.length frag) [] in
  match nodes with
  | [] -> [ D.txt frag ]
  | _ -> List.concat_map el_of_node nodes

(* ---------- minimal markdown -> html (native plugin readmes) ----------
   window.marked does not exist off the browser; this covers the readme
   subset — atx headings, fenced code, lists, links/images, bold,
   italic, inline code, paragraphs. Not a full markdown parser —
   anything else renders as literal text inside its paragraph. *)
let md_escape s =
  let b = Buffer.create (String.length s) in
  String.iter
    (fun c ->
      match c with
      | '&' -> Buffer.add_string b "&amp;"
      | '<' -> Buffer.add_string b "&lt;"
      | '>' -> Buffer.add_string b "&gt;"
      | '"' -> Buffer.add_string b "&quot;"
      | c -> Buffer.add_char b c)
    s;
  Buffer.contents b

let md_inline (s : string) : string =
  let n = String.length s in
  let b = Buffer.create (n + 32) in
  let find_from ch i =
    let rec go j =
      if j >= n then -1 else if s.[j] = ch then j else go (j + 1)
    in
    go i
  in
  let rec emit i =
    if i >= n then ()
    else if i + 1 < n && s.[i] = '!' && s.[i + 1] = '[' then (
      match find_from ']' (i + 2) with
      | j when j >= 0 && j + 1 < n && s.[j + 1] = '(' -> (
          let k = find_from ')' (j + 2) in
          if k < 0 then begin
            Buffer.add_char b s.[i]; emit (i + 1)
          end
          else begin
            Buffer.add_string b "<img alt=\"";
            Buffer.add_string b (md_escape (String.sub s (i + 2) (j - i - 2)));
            Buffer.add_string b "\" src=\"";
            Buffer.add_string b (String.sub s (j + 2) (k - j - 2));
            Buffer.add_string b "\"/>";
            emit (k + 1)
          end)
      | _ -> begin Buffer.add_char b s.[i]; emit (i + 1) end)
    else if s.[i] = '[' then (
      match find_from ']' (i + 1) with
      | j when j >= 0 && j + 1 < n && s.[j + 1] = '(' -> (
          let k = find_from ')' (j + 2) in
          if k < 0 then begin
            Buffer.add_char b s.[i]; emit (i + 1)
          end
          else begin
            Buffer.add_string b "<a href=\"";
            Buffer.add_string b (String.sub s (j + 2) (k - j - 2));
            Buffer.add_string b "\">";
            Buffer.add_string b (md_escape (String.sub s (i + 1) (j - i - 1)));
            Buffer.add_string b "</a>";
            emit (k + 1)
          end)
      | _ -> begin Buffer.add_char b s.[i]; emit (i + 1) end)
    else if
      i + 1 < n && s.[i] = '*' && s.[i + 1] = '*'
    then (
      let k = find_from '*' (i + 2) in
      if k > 0 && k + 1 < n && s.[k + 1] = '*' then begin
        Buffer.add_string b "<strong>";
        Buffer.add_string b (md_escape (String.sub s (i + 2) (k - i - 2)));
        Buffer.add_string b "</strong>";
        emit (k + 2)
      end
      else begin Buffer.add_char b s.[i]; emit (i + 1) end)
    else if s.[i] = '`' then (
      let k = find_from '`' (i + 1) in
      if k > 0 then begin
        Buffer.add_string b "<code>";
        Buffer.add_string b (md_escape (String.sub s (i + 1) (k - i - 1)));
        Buffer.add_string b "</code>";
        emit (k + 1)
      end
      else begin Buffer.add_char b s.[i]; emit (i + 1) end)
    else begin Buffer.add_char b s.[i]; emit (i + 1) end
  in
  emit 0;
  Buffer.contents b

let markdown_to_html (s : string) : string =
  let b = Buffer.create (String.length s + 64) in
  let lines = String.split_on_char '\n' s in
  let in_code = ref false in
  let in_list = ref false in
  let para = Buffer.create 128 in
  let flush_para () =
    if String.trim (Buffer.contents para) <> "" then begin
      Buffer.add_string b "<p>";
      Buffer.add_string b (md_inline (String.trim (Buffer.contents para)));
      Buffer.add_string b "</p>";
      Buffer.clear para
    end
  in
  let close_list () =
    if !in_list then begin Buffer.add_string b "</ul>"; in_list := false end
  in
  List.iter
    (fun line ->
      let lt = String.trim line in
      if String.length lt >= 3 && String.sub lt 0 3 = "```" then begin
        flush_para ();
        close_list ();
        if !in_code then Buffer.add_string b "</code></pre>"
        else Buffer.add_string b "<pre><code>";
        in_code := not !in_code
      end
      else if !in_code then begin
        Buffer.add_string b (md_escape line);
        Buffer.add_char b '\n'
      end
      else if lt = "" then begin
        flush_para ();
        close_list ()
      end
      else if String.length lt >= 1 && lt.[0] = '#' then begin
        flush_para ();
        close_list ();
        let lvl =
          let rec count i =
            if i < String.length lt && lt.[i] = '#' then count (i + 1)
            else i
          in
          min 6 (count 0)
        in
        Buffer.add_string b (Printf.sprintf "<h%d>" lvl);
        Buffer.add_string b
          (md_inline (String.trim (String.sub lt lvl (String.length lt - lvl))));
        Buffer.add_string b (Printf.sprintf "</h%d>" lvl)
      end
      else if
        String.length lt >= 2
        && (lt.[0] = '-' || lt.[0] = '*') && is_ws lt.[1]
      then begin
        flush_para ();
        if not !in_list then begin
          Buffer.add_string b "<ul>";
          in_list := true
        end;
        Buffer.add_string b "<li>";
        Buffer.add_string b
          (md_inline (String.trim (String.sub lt 2 (String.length lt - 2))));
        Buffer.add_string b "</li>"
      end
      else begin
        close_list ();
        if Buffer.length para > 0 then Buffer.add_char para ' ';
        Buffer.add_string para lt
      end)
    lines;
  flush_para ();
  close_list ();
  if !in_code then Buffer.add_string b "</code></pre>";
  Buffer.contents b
