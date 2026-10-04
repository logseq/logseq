(** [logseq.api] calls through [page.evaluate], mirroring clj-e2e's [api.clj]. *)

let to_snake_case s =
  let buf = Buffer.create (String.length s) in
  String.iteri
    (fun i c ->
      if c = '-' || c = ' ' then Buffer.add_char buf '_'
      else if Char.code c >= Char.code 'A' && Char.code c <= Char.code 'Z' then (
        if i > 0 then Buffer.add_char buf '_';
        Buffer.add_char buf (Char.lowercase_ascii c))
      else Buffer.add_char buf c)
    s;
  (* collapse repeated underscores *)
  let raw = Buffer.contents buf in
  let out = Buffer.create (String.length raw) in
  String.iteri
    (fun i c ->
      if not (c = '_' && i > 0 && String.get raw (i - 1) = '_') then
        Buffer.add_char out c)
    raw;
  Buffer.contents out |> String.trim

external json_stringify : 'a -> string = "stringify" [@@mel.scope "JSON"]

external json_parse : string -> 'a = "parse" [@@mel.scope "JSON"]

(** [ls_api_call env "editor.getBlock" args] invokes
    [logseq.api.get_block(...args)] / [logseq.sdk.<ns>.<snake_name>(...args)]
    inside the page, like wally's [ls-api-call!]. *)
let ls_api_call env api_keyword args =
  let parts = String.split_on_char '.' api_keyword in
  let is_namespaced = List.length parts = 2 in
  let first = match parts with p :: _ -> p | [] -> "" in
  let inbuilt = List.mem first [ "app"; "editor" ] in
  let ns1 =
    String.lowercase_ascii
      (if is_namespaced && not inbuilt then "sdk." ^ first else "api")
  in
  let name1 =
    if is_namespaced then to_snake_case (List.nth parts 1) else api_keyword
  in
  (* Playwright's evaluate does not pass [arg] to string expressions, so the
     function is invoked inline with the JSON-encoded args literal. *)
  let estr =
    Printf.sprintf
      "(s => { const args = JSON.parse(s);const o=logseq.%s; return \
       o['%s']?.apply(null, args || []); })(%s)"
      ns1 name1 (json_stringify (json_stringify args))
  in
  Pw.eval_js env estr

(** JSON-field access on values returned by [ls_api_call], the [(get x k)]
    pattern. The return type is untyped like the JS object itself. *)
external get : 'a -> string -> 'b Js.Undefined.t = "" [@@mel.get_index]

let get_string o k = Js.Undefined.toOption (get o k)
let get_int o k = Option.map int_of_float (Js.Undefined.toOption (get o k))
let get_bool o k = Js.Undefined.toOption (get o k)
let get_list o k : 'a array option = Js.Undefined.toOption (get o k)
let get_uuid o _ = get_string o "uuid"
let get_id o _ = get_int o "id"
