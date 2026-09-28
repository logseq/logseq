(* Line-based OPML/HTML export of the worker's exported block content —
   subset port of cljs handler/export/{opml,html}.cljs, which walk the
   mldoc AST. mldoc is native-only so it cannot link into the Melange
   UI; this walks the exported markdown text instead: each "- " bullet
   is an item and leading indentation gives the nesting level. *)

type node = {
  text : string;
  kids : node list;
}

let trim s =
  let n = String.length s in
  let a = ref 0 and b = ref (n - 1) in
  while !a < n && (s.[!a] = ' ' || s.[!a] = '\t') do incr a done;
  while !b >= !a && (s.[!b] = ' ' || s.[!b] = '\t') do decr b done;
  if !b < !a then "" else String.sub s !a (!b - !a + 1)

type item = {
  level : int;
  text : string;
}

let items_of_content ~indent_unit content =
  let u = String.length indent_unit in
  let flush cur items =
    match cur with
    | None -> items
    | Some (level, head, extra) ->
        { level; text = String.concat " " (head :: List.rev extra) }
        :: items
  in
  let go (items, cur) line =
    if trim line = "" then (items, cur)
    else
      let n = String.length line in
      let rec lvl i k =
        if i + u <= n && String.sub line i u = indent_unit then
          lvl (i + u) (k + 1)
        else k
      in
      let level = lvl 0 0 in
      let after = String.sub line (level * u) (n - level * u) in
      let la = String.length after in
      if la = 1 && after.[0] = '-' then
        (* bare "-" bullet = empty item *)
        ({ level; text = "" } :: flush cur items, None)
      else if la >= 2 && String.sub after 0 2 = "- " then
        ( flush cur items
        , Some (level, String.sub after 2 (la - 2), []) )
      else
        match cur with
        | Some (l, h, ex) -> (items, Some (l, h, trim after :: ex))
        | None -> (items, cur)
  in
  let items, cur =
    List.fold_left go ([], None) (String.split_on_char '\n' content)
  in
  List.rev (flush cur items)

(* nodes at depth >= [depth]; children picked up by the deeper call *)
let rec nodes_at depth items =
  match items with
  | [] -> ([], [])
  | it :: rest ->
      if it.level < depth then ([], items)
      else
        let kids, rest' = nodes_at (it.level + 1) rest in
        let siblings, rest'' = nodes_at depth rest' in
        (({ text = it.text; kids } : node) :: siblings, rest'')

let tree_of_content ~indent_unit content =
  fst (nodes_at 0 (items_of_content ~indent_unit content))

let esc_text b s =
  String.iter
    (function
      | '&' -> Buffer.add_string b "&amp;"
      | '<' -> Buffer.add_string b "&lt;"
      | '>' -> Buffer.add_string b "&gt;"
      | c -> Buffer.add_char b c)
    s

let esc_attr b s =
  String.iter
    (function
      | '&' -> Buffer.add_string b "&amp;"
      | '<' -> Buffer.add_string b "&lt;"
      | '>' -> Buffer.add_string b "&gt;"
      | '"' -> Buffer.add_string b "&quot;"
      | c -> Buffer.add_char b c)
    s

let pad b n = Buffer.add_string b (String.make (2 * n) ' ')

let opml ~title ~indent_unit content =
  let roots = tree_of_content ~indent_unit content in
  let b = Buffer.create 1024 in
  Buffer.add_string b
    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<opml version=\"2.0\">\n  <head>\n    <title>";
  esc_text b title;
  Buffer.add_string b "</title>\n  </head>\n  <body>\n";
  let rec node depth (n : node) =
    pad b depth;
    Buffer.add_string b "<outline text=\"";
    esc_attr b n.text;
    match n.kids with
    | [] -> Buffer.add_string b "\"/>\n"
    | kids ->
        Buffer.add_string b "\">\n";
        List.iter (node (depth + 1)) kids;
        pad b depth;
        Buffer.add_string b "</outline>\n"
  in
  List.iter (node 2) roots;
  Buffer.add_string b "  </body>\n</opml>\n";
  Buffer.contents b

(* Inline markdown-subset -> html, on already-escaped text — bold,
   italic, strike, mark, ins, code, links, page refs, tags, sub/sup,
   latex spans. Approximates cljs export-helper's mldoc inline walk. *)
let inline_html s =
  let n = String.length s in
  let b = Buffer.create (n + 64) in
  let has sub i =
    i + String.length sub <= n
    && String.sub s i (String.length sub) = sub
  in
  let find_from sub j =
    let ls = String.length sub in
    let rec go k =
      if k + ls > n then -1
      else if String.sub s k ls = sub then k
      else go (k + 1)
    in
    go j
  in
  let is_word c =
    (c >= 'a' && c <= 'z')
    || (c >= 'A' && c <= 'Z')
    || (c >= '0' && c <= '9')
    || c = '-' || c = '_'
  in
  let rec emit i =
    if i < n then begin
      (* try_wrapped open_ close ~raw: inner verbatim vs escaped *)
      let wrapped open_ close emit_inner =
        if has open_ i then begin
          let lo = String.length open_ in
          let j = find_from close (i + lo) in
          if j > i + lo then begin
            emit_inner (String.sub s (i + lo) (j - i - lo));
            emit (j + String.length close);
            true
          end
          else false
        end
        else false
      in
      let esc s = esc_text b s in
      let raw_tag open_ close pre post =
        wrapped open_ close (fun inner ->
            Buffer.add_string b pre;
            esc inner;
            Buffer.add_string b post)
      in
      let step =
        if has "$$" i then
          wrapped "$$" "$$" (fun inner ->
              Buffer.add_string b "<span>$$";
              esc inner;
              Buffer.add_string b "$$</span>")
        else if has "`" i then raw_tag "`" "`" "<code>" "</code>"
        else if has "**" i then raw_tag "**" "**" "<b>" "</b>"
        else if has "__" i then raw_tag "__" "__" "<b>" "</b>"
        else if has "~~" i then raw_tag "~~" "~~" "<del>" "</del>"
        else if has "++" i then raw_tag "++" "++" "<ins>" "</ins>"
        else if has "^^" i then raw_tag "^^" "^^" "<mark>" "</mark>"
        else if has "[[" i then
          wrapped "[[" "]]" (fun inner ->
              Buffer.add_string b "<a href=\"";
              esc inner;
              Buffer.add_string b "\">";
              esc inner;
              Buffer.add_string b "</a>")
        else if has "[`" i then false
        else if has "[[" i then false
        else if s.[i] = '[' then
          (* [label](url) *)
          let j = find_from "](" (i + 1) in
          if j > i + 1 then begin
            let k = find_from ")" (j + 2) in
            if k > j + 2 then begin
              Buffer.add_string b "<a href=\"";
              esc (String.sub s (j + 2) (k - j - 2));
              Buffer.add_string b "\">";
              esc (String.sub s (i + 1) (j - i - 1));
              Buffer.add_string b "</a>";
              emit (k + 1);
              true
            end
            else false
          end
          else false
        else if has "{{" i then
          wrapped "{{" "}}" (fun inner ->
              Buffer.add_string b "<code>{{";
              esc inner;
              Buffer.add_string b "}}</code>")
        else if has "_{" i then raw_tag "_{" "}" "<sub>" "</sub>"
        else if has "^{" i then raw_tag "^{" "}" "<sup>" "</sup>"
        else if s.[i] = '*' then raw_tag "*" "*" "<i>" "</i>"
        else if s.[i] = '_' then raw_tag "_" "_" "<i>" "</i>"
        else if s.[i] = '#' && i + 1 < n && is_word s.[i + 1] then begin
          let j = ref (i + 1) in
          while !j < n && is_word s.[!j] do incr j done;
          let tag = String.sub s (i + 1) (!j - i - 1) in
          Buffer.add_string b "<a class=\"tag\" data-ref=\"#";
          esc tag;
          Buffer.add_string b "\">#";
          esc tag;
          Buffer.add_string b "</a>";
          emit !j;
          true
        end
        else false
      in
      if not step then begin
        esc_text b (String.make 1 s.[i]);
        emit (i + 1)
      end
    end
  in
  emit 0;
  Buffer.contents b

let html ~indent_unit content =
  let roots = tree_of_content ~indent_unit content in
  let b = Buffer.create 1024 in
  Buffer.add_string b "<ul>\n";
  let rec node depth (n : node) =
    pad b depth;
    Buffer.add_string b "<li>";
    Buffer.add_string b (inline_html n.text);
    match n.kids with
    | [] -> Buffer.add_string b "</li>\n"
    | kids ->
        Buffer.add_char b '\n';
        pad b (depth + 1);
        Buffer.add_string b "<ul>\n";
        List.iter (node (depth + 2)) kids;
        pad b (depth + 1);
        Buffer.add_string b "</ul>\n";
        pad b depth;
        Buffer.add_string b "</li>\n"
  in
  List.iter (node 1) roots;
  Buffer.add_string b "</ul>\n";
  Buffer.contents b
