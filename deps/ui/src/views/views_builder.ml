(* Query builder — the .cp__query-builder clause editor for dsl queries.
   Clause model: a tree of operators (and/or/not) wrapping named filter
   clauses; serialized to dsl text and saved into the
   logseq.property/query value block's title.

   Declarative: clause/group buttons are Lui_elements.t nodes carrying
   id anchors; the pickers they open are imperative popup overlays on
   document.body (ephemeral, dismissed by scrim) anchored to the button
   element resolved by id. *)

module V = Views_state
module W = Wire
module Wr = Views_wire
module I = I18n
module P = Views_popup
module Db = Views_db

open Lui_elements

type t = Lui_elements.t

type barg = { a_dsl : string; a_disp : string }

type clause =
  | COp of string * clause list
  | CItem of string * barg list
  | CText of string
  | CInvalid of string

type editor =
  { key : string
  ; disabled : bool
  ; active : unit -> bool
  ; ref_title : string -> string option
  ; property_title : string -> string option
  ; remember_ref : string -> string -> unit
  ; save : clause -> unit
  }

let filters =
  [ "tags"; "page reference"; "property"; "task"; "priority"; "page"
  ; "full text search"; "between"; "sample" ]

let operators = [ "and"; "or"; "not" ]

let is_op s = List.mem s operators

let refresh inst = (V.ops ()).V.o_refresh inst

(* ---------- dsl serialize ---------- *)

let rec to_dsl = function
  (* cljs ->dsl* unwraps [:page-ref x] to a bare [[x]] symbol *)
  | CText s -> Edn.to_string (W.String s)
  | CInvalid _ -> invalid_arg "Cannot save an invalid query"
  | CItem ("page-ref", [ a ]) ->
      (* cljs ->dsl* collapses [:page-ref v] to the bare [[v]] form *)
      a.a_dsl
  | CItem (f, args) ->
      let arg_str = List.map (fun a -> a.a_dsl) args |> String.concat " " in
      if args = [] then "(" ^ f ^ ")"
      else "(" ^ f ^ " " ^ arg_str ^ ")"
  | COp (op, xs) ->
      "(" ^ op ^ " " ^ String.concat " " (List.map to_dsl xs) ^ ")"

(* Keep untouched operator branches; an empty root is the blank query. *)
let rec simplify = function
  | COp ("and", []) -> None
  | COp (op, children) ->
      let children = List.map (fun child ->
          Option.value (simplify child) ~default:child) children in
      (match op, children with
       | ("and" | "or"), [ child ] -> Some child
       | _ -> Some (COp (op, children)))
  | c -> Some c

let tree_to_dsl (t : clause) : string =
  match simplify t with None -> "" | Some c -> to_dsl c

(* ---------- dsl parse (edn -> clause tree) ---------- *)

let is_ref s =
  let n = String.length s in
  n >= 4 && String.sub s 0 2 = "[[" && String.sub s (n - 2) 2 = "]]"

let unwrap s =
  let n = String.length s in
  if n >= 2 && s.[0] = '"' && s.[n - 1] = '"' then String.sub s 1 (n - 2)
  else s

(* Like the worker pre-transform, quote page references outside strings
   before reading EDN. Validate delimiters because the config reader also
   accepts partial input and intentionally reads only the first form. *)
let read_source src =
  let n = String.length src in
  let buf = Buffer.create n in
  let fail message = raise (Edn.Parse_error message) in
  let rec string_end i =
    if i >= n then fail "Unterminated query string"
    else match src.[i] with
    | '\\' when i + 1 < n && List.mem src.[i + 1] [ 'n'; 't'; 'r'; '"'; '\\' ] ->
        string_end (i + 2)
    | '\\' -> fail "Unsupported query string escape"
    | '"' -> i + 1
    | _ -> string_end (i + 1)
  in
  let rec ref_end i =
    if i + 1 >= n then fail "Unterminated page reference"
    else if src.[i] = ']' && src.[i + 1] = ']' then i + 2
    else ref_end (i + 1)
  in
  let rec scan i stack =
    if i = n then (if stack <> [] then fail "Unterminated query clause")
    else match src.[i] with
    | '"' ->
        let stop = string_end (i + 1) in
        Buffer.add_substring buf src i (stop - i);
        scan stop stack
    | ';' ->
        let stop = match String.index_from_opt src i '\n' with Some j -> j | None -> n in
        Buffer.add_substring buf src i (stop - i);
        scan stop stack
    | '[' when i + 1 < n && src.[i + 1] = '[' ->
        let stop = ref_end (i + 2) in
        Buffer.add_string buf (Edn.to_string (W.String (String.sub src i (stop - i))));
        scan stop stack
    | '#' when i + 1 < n && src.[i + 1] <> '{'
        && (i = 0 || Edn.is_delim src.[i - 1])
        && not (i + 5 <= n && String.sub src i 5 = "#uuid")
        && not (i + 5 <= n && String.sub src i 5 = "#inst") ->
        let start = i + 1 in
        let stop =
          if start + 1 < n && src.[start] = '[' && src.[start + 1] = '[' then ref_end (start + 2)
          else
            let rec token j = if j < n && not (Edn.is_delim src.[j]) then token (j + 1) else j in
            token start
        in
        let value = String.sub src start (stop - start) in
        if value = "" then fail "Empty query tag";
        Buffer.add_string buf (Edn.to_string (W.String (if is_ref value then value else "[[" ^ value ^ "]]")));
        scan stop stack
    | '{' when i = 0 || src.[i - 1] <> '#' -> fail "Unsupported query map"
    | ('(' | '[' | '{') as c ->
        Buffer.add_char buf c;
        scan (i + 1) (c :: stack)
    | (')' | ']' | '}') as c ->
        let expected = match c with ')' -> '(' | ']' -> '[' | _ -> '{' in
        (match stack with
        | head :: tail when head = expected -> Buffer.add_char buf c; scan (i + 1) tail
        | _ -> fail "Mismatched query delimiter")
    | c -> Buffer.add_char buf c; scan (i + 1) stack
  in
  scan 0 [];
  let text = Buffer.contents buf in
  let form, stop = Edn.parse_value text 0 in
  if Edn.skip_ws text stop <> String.length text then fail "Unexpected form after query";
  form

let arg_of_wire (w : W.t) : barg =
  match w with
  | W.Array [ W.Array [ inner ] ] | W.List [ W.List [ inner ] ] ->
      (* [[x]] page-ref *)
      let name =
        match inner with
        | W.String s | W.Symbol s | W.Keyword s -> s
        | other -> Edn.to_string other
      in
      { a_dsl = "[[" ^ name ^ "]]"; a_disp = name }
  | W.Array _ | W.List _ ->
      let s = Edn.to_string w in
      { a_dsl = s; a_disp = s }
  | W.String s -> { a_dsl = (if is_ref s then s else Edn.to_string w); a_disp = s }
  | W.Symbol s | W.Keyword s -> { a_dsl = Edn.to_string w; a_disp = s }
  | other ->
      let s = Edn.to_string other in
      { a_dsl = s; a_disp = s }

let rec clause_of_wire (w : W.t) : clause option =
  match w with
  | W.List (W.Symbol f :: args) | W.Array (W.Symbol f :: args) ->
      if is_op f then
        let children = List.map clause_of_wire args in
        if List.exists Option.is_none children then None
        else Some (COp (f, List.filter_map Fun.id children))
      else Some (CItem (f, List.map arg_of_wire args))
  | W.String s when is_ref s -> Some (CItem ("page-ref", [ arg_of_wire w ]))
  | W.String s -> Some (CText s)
  | W.Array [ W.Array _ ] | W.List [ W.List _ ] ->
      Some (CItem ("page-ref", [ arg_of_wire w ]))
  | _ -> None

let tree_of_src (src : string) : clause =
  let t = String.trim src in
  if t = "" then COp ("and", [])
  else try
    match clause_of_wire (read_source t) with
    | Some (COp _ as op) -> op
    | Some c -> COp ("and", [ c ])
    | None -> CInvalid src
  with Edn.Parse_error _ -> CInvalid src

(* ---------- tree surgery (cljs loc semantics: index includes the
   operator at position 0 of each group) ---------- *)

(* loc segments index the cljs query vector — 0 is the operator slot of
   each group, clauses start at 1. A leading 0 selects the group node
   itself, so descend through it. *)
let rec append_at t loc x =
  match loc, t with
  | [ 0 ], COp (op, cs) -> COp (op, cs @ [ x ])
  | 0 :: rest, _ -> append_at t rest x
  | i :: rest, COp (op, cs) when i >= 1 ->
      COp
        ( op
        , List.mapi
            (fun j c -> if j = i - 1 then append_at c rest x else c)
            cs )
  | _, _ -> t

let rec remove_at t loc =
  match loc, t with
  | [], _ | [ 0 ], _ -> COp ("and", [])
  | 0 :: rest, _ -> remove_at t rest
  | [ i ], COp (op, cs) ->
      COp (op, List.filteri (fun j _ -> j + 1 <> i) cs)
  | i :: rest, COp (op, cs) when i >= 1 ->
      COp
        ( op
        , List.mapi
            (fun j c -> if j = i - 1 then remove_at c rest else c)
            cs )
  | _, _ -> t

let rec replace_at t loc x =
  match loc, t with
  | [], _ | [ 0 ], _ -> x
  | 0 :: rest, _ -> replace_at t rest x
  | i :: rest, COp (op, cs) when i >= 1 ->
      COp
        ( op
        , List.mapi
            (fun j c -> if j = i - 1 then replace_at c rest x else c)
            cs )
  | _, _ -> t

let rec get_at t loc =
  match loc, t with
  | [], _ -> Some t
  | 0 :: rest, c -> get_at c rest
  | i :: rest, COp (_, cs) when i >= 1 ->
      if i - 1 < List.length cs then get_at (List.nth cs (i - 1)) rest
      else None
  | _, _ -> None

let wrap_op t loc op =
  match get_at t loc with
  | Some c -> replace_at t loc (COp (op, [ c ]))
  | None -> t

let unwrap_at t loc =
  match get_at t loc with
  | Some (COp (_, children)) ->
      let path = match List.rev loc with 0 :: rest -> List.rev rest | _ -> loc in
      let rec splice t = function
        | [] | [ 0 ] -> COp ("and", children)
        | 0 :: rest -> splice t rest
        | [ i ] -> (match t with
            | COp (op, clauses) -> COp (op, List.concat
                (List.mapi (fun j c -> if j = i - 1 then children else [ c ]) clauses))
            | _ -> t)
        | i :: rest -> (match t with
            | COp (op, clauses) -> COp (op, List.mapi
                (fun j c -> if j = i - 1 then splice c rest else c) clauses)
            | _ -> t)
      in
      splice t path
  | _ -> t

(* ---------- display ---------- *)

let strip_ref s =
  let n = String.length s in
  if n >= 4 && String.sub s 0 2 = "[[" && String.sub s (n - 2) 2 = "]]"
  then String.sub s 2 (n - 4)
  else s

(* stored sources keep [[uuid]] id-refs; display the page title like
   cljs' (page-title (second clause)) via the refs table refresh_block
   collects from the query value block *)
let disp_args inst args =
  List.map
    (fun a ->
      let d = strip_ref a.a_disp in
      match inst.ref_title d with
      | Some t -> t
      | None -> d)
    args

let clause_label inst (c : clause) : string =
  match c with
  | CText s -> I.builder_search s
  | CInvalid message -> message
  | CItem (f, args) -> (
      match f, disp_args inst args with
      | ("task" | "priority"), vs -> f ^ ": " ^ String.concat " | " vs
      | ("property" | "private-property"), k :: vs -> (
          let title =
            match inst.property_title k with
            | Some title -> title
            | None -> (
                match String.rindex_opt k '/' with
                | Some i ->
                    let t =
                      String.sub k (i + 1) (String.length k - i - 1)
                    in
                    String.make 1 (Char.uppercase_ascii t.[0]) ^ String.sub t 1 (String.length t - 1)
                | None -> k)
          in
          match vs with
          | [] -> title ^ ": " ^ (I.t "query.builder/all-values-label")
          | vs -> title ^ ": " ^ String.concat " " vs)
      | "page-ref", [ t ] -> "[[" ^ t ^ "]]"
      | "tags", [ t ] -> "#" ^ t
      | ("page" | "tags"), v :: _ -> f ^ ": " ^ v
      | "between", [ a; b ] -> I.builder_between_journal a b
      | "sample", [ n ] -> "sample: " ^ n
      | _ -> to_dsl c)
  | COp (op, _) -> String.uppercase_ascii op

(* ---------- pickers ---------- *)

let commit inst ~tree () =
  if inst.active () then inst.save !tree

(* value picker for a chosen property ident *)
let value_picker inst ~tree ~loc ~anchor ~head ident =
  let add_clause args =
    let clause = CItem (head, { a_dsl = ":" ^ ident; a_disp = ident } :: args) in
    tree := append_at !tree loc clause;
    commit inst ~tree ()
  in
  Db.get_closed_values ident (fun cvs -> if inst.active () then
      let items =
        if cvs <> [] then
          List.filter_map (fun cv ->
              Option.map (fun title -> W.String title)
                (W.map_get_string cv "block/title")) cvs
        else []
      in
      let open_select its =
        ignore
          (P.show_select ~anchor ~placeholder:ident
             ~wrap_cls:"query-builder-picker"
             ~items:
               (P.fixed_items
                ({ P.si_label = I.t "query.builder/all-values-label"
                 ; si_value = "all"; si_extra = None }
                :: List.mapi
                  (fun index value ->
                    { P.si_label = (arg_of_wire value).a_disp
                    ; si_value = "value-" ^ string_of_int index
                    ; si_extra = Some value
                    })
                  its))
             ~on_chosen:(fun it _ _ ->
               match it.P.si_extra with
               | None -> add_clause []
               | Some value -> add_clause [ arg_of_wire value ])
             ())
      in
      if cvs <> [] then open_select items
      else
        Db.get_property_values ident (fun vs -> if inst.active () then
            let its =
              List.filter_map
                (fun v -> match W.get v "label" with
                  | Some W.Nil | None -> None
                  | Some label -> Some label)
                (Wr.W.elems vs)
            in
            open_select its))

(* property picker: list of props + "Show built-in properties" toggle *)
let rec property_picker inst ~tree ~loc ~anchor ~include_builtin =
  Db.get_all_properties (fun props -> if inst.active () then
      let items =
        List.filter_map
          (fun p ->
            match
              Wr.ident_of_value
                (Option.value (W.get p "db/ident") ~default:W.Nil)
            with
            | Some ident when
                include_builtin
                || (String.length ident <= 7
                    || String.sub ident 0 7 <> "logseq.") ->
                Some
                  { P.si_label =
                      Option.value (W.map_get_string p "block/title")
                        ~default:ident
                  ; si_value = ident
                  ; si_extra = None
                  }
            | _ -> None)
          props
      in
      let head () =
        Some
          (row ~main:`space_between ~cross:`center ~gap:4 ~padding:4
             [ Ui_components.checkbox
                 ~label:(I.t "query.builder/show-built-in-properties")
                 ~text:(I.t "query.builder/show-built-in-properties")
                 ~checked:include_builtin
                 ~on_toggle:(function
                   | Lui_protocol.ToggleChanged (_, checked) ->
                       P.close_all ();
                       property_picker inst ~tree ~loc ~anchor ~include_builtin:checked
                   | _ -> ()) [] ])
      in
      ignore
        (P.show_select ~anchor ~placeholder:(I.t "select/default-prompt") ~items:(P.fixed_items items)
           ~extra:(fun () -> head ())
           ~wrap_cls:"query-builder-picker"
           ~on_chosen:(fun it _ _ ->
             value_picker inst ~tree ~loc ~anchor
               ~head:(if include_builtin then "private-property" else "property") it.P.si_value)
           ()))

let closed_value_multi inst ~tree ~loc ~anchor ident name =
  Db.get_closed_values ident (fun cvs -> if inst.active () then
      let items =
        List.filter_map
          (fun cv -> W.map_get_string cv "block/title")
          cvs
      in
      ignore
        (P.show_select ~anchor ~placeholder:(I.t "select/default-select-multiple") ~multiple:true
         ~wrap_cls:"query-builder-picker"
           ~items:
             (P.fixed_items (List.map
                (fun t ->
                  { P.si_label = t; si_value = t; si_extra = None })
                items))
           ~on_apply:(fun vs ->
             if vs <> [] then begin
               let args =
                 List.map
                   (fun v -> { a_dsl = Edn.to_string (W.String v); a_disp = v })
                   vs
               in
               tree := append_at !tree loc (CItem (name, args));
               commit inst ~tree ()
             end)
           ~on_chosen:(fun _ _ _ -> ())
           ()))

let page_picker inst ~tree ~loc ~anchor kind =
  Db.get_all_page_titles (fun titles -> if inst.active () then
      let items =
        List.map
          (fun t ->
            { P.si_label = t; si_value = t; si_extra = None })
          titles
      in
      ignore
        (P.show_select ~anchor ~placeholder:(I.t "select/default-prompt") ~items:(P.fixed_items items)
           ~wrap_cls:"query-builder-picker"
           ~on_chosen:(fun it _ _ ->
             let v = it.P.si_value in
             let clause =
               match kind with
               | "page" -> CItem ("page", [ { a_dsl = "[[" ^ v ^ "]]"; a_disp = v } ])
               | _ ->
                   CItem ("page-ref", [ { a_dsl = "[[" ^ v ^ "]]"; a_disp = v } ])
             in
             tree := append_at !tree loc clause;
             commit inst ~tree ())
           ()))

let tag_picker inst ~tree ~loc ~anchor =
  Db.get_all_classes (fun classes -> if inst.active () then
      let items =
        List.filter_map
          (fun c ->
            match
              ( W.map_get_string c "block/title"
              , W.map_get_uuid c "block/uuid" )
            with
            | Some t, Some u ->
                Some
                  { P.si_label = t; si_value = u; si_extra = None }
            | _ -> None)
          classes
      in
      ignore
        (P.show_select ~anchor ~placeholder:(I.t "select/default-prompt") ~items:(P.fixed_items items)
           ~wrap_cls:"query-builder-picker"
           ~on_chosen:(fun it _ _ ->
             (* seed uuid -> title so a re-parsed [[uuid]] clause still
                resolves before refresh_block re-reads the value block's
                block/refs (async) *)
             inst.remember_ref it.P.si_value it.si_label;
             tree :=
               append_at !tree loc
                 (CItem ("tags", [ { a_dsl = "[[" ^ it.P.si_value ^ "]]"; a_disp = it.si_label } ]));
             commit inst ~tree ())
           ()))

let between_picker inst ~tree ~loc ~anchor =
  let pick label on_pick =
    if inst.active () then
      ignore (P.show_custom ~anchor ~cls:"query-builder-picker"
        (column ~padding:8 ~gap:8
          [ text ~value:label []
          ; Ui_components.date_picker
              ~week_starts_on:(Sdk_config.calendar_week_starts_on ())
              ~month_label:I.calendar_month_label ~day_label:I.calendar_day_label
              ~translate:I.t
              ~on_pick:(fun ms ->
                P.close_top ();
                if inst.active () then on_pick (Dates.journal_title_of ms)) ]))
  in
  pick (I.t "query.builder/between-start-label") (fun start ->
    pick (I.t "query.builder/between-end-label") (fun finish ->
      let arg title = { a_dsl = "[[" ^ title ^ "]]"; a_disp = title } in
      tree := append_at !tree loc (CItem ("between", [ arg start; arg finish ]));
      commit inst ~tree ()))

let full_text_picker inst ~tree ~loc ~anchor =
  let value = ref "" in
  ignore
    (P.show_custom ~anchor ~cls:"query-builder-picker"
       (Ui_components.with_props
          [ Ui_components.Prop.font_size "0.875rem"
          ; Ui_components.Prop.line_height "1.25rem" ]
        (Ui_components.input ~style_class:"form-input"
          ~accessibility_identifier:"query-builder-search"
          ~placeholder:(I.t "view.filter/type-to-search") ~label:(I.t "view.filter/type-to-search")
          ~autofocus:true
          ~on_input:(function
            | Lui_protocol.TextChanged (_, s) -> value := s
            | _ -> ())
          ~on_submit:(fun _ ->
            let v = String.trim !value in
            if v <> "" then begin
              P.close_all ();
              tree := append_at !tree loc (CText v);
              commit inst ~tree ()
            end)
          [])))

let sample_picker inst ~tree ~loc ~anchor =
  ignore
    (P.show_select ~anchor ~placeholder:(I.t "select/default-prompt")
       ~items:
         (P.fixed_items (List.init 100 (fun i ->
              let n = string_of_int (i + 1) in
              { P.si_label = n; si_value = n; si_extra = None })))
       ~wrap_cls:"query-builder-picker"
       ~on_chosen:(fun it _ _ ->
         tree := append_at !tree loc (CItem ("sample", [ { a_dsl = it.P.si_value; a_disp = it.si_value } ]));
         commit inst ~tree ())
       ())

(* cljs filter-label — en.edn keys *)
let item_label = function
  | "tags" -> I.t "property.built-in/tags"
  | "page reference" -> I.t "query.builder/filter-page-reference-label"
  | "property" -> I.t "class.built-in/property"
  | "task" -> I.t "class.built-in/task"
  | "priority" -> I.t "property.built-in/priority"
  | "page" -> I.t "query.builder/filter-page-label"
  | "full text search" -> I.t "query.builder/filter-full-text-search-label"
  | "between" -> I.t "view.filter/operator-between"
  | "sample" -> I.t "query.builder/filter-sample-label"
  | "and" -> I.t "query.builder/operator-and-label"
  | "or" -> I.t "view.filter/or"
  | "not" -> I.t "query.builder/operator-not-label"
  | other -> other

(* first-level picker: filter names + operators *)
let picker inst ~tree ~loc ~anchor =
  let items =
    List.map
      (fun f -> { P.si_label = item_label f; si_value = f; si_extra = None })
      (filters @ operators)
  in
  ignore
    (P.show_select ~anchor ~placeholder:(I.t "query.builder/add-filter-or-operator-placeholder")
       ~items:(P.fixed_items items) ~wrap_cls:"query-builder-picker"
       ~on_chosen:(fun it _ _ ->
         match it.P.si_value with
         | op when is_op op ->
             tree := append_at !tree loc (COp (op, []));
             commit inst ~tree ()
         | "property" -> property_picker inst ~tree ~loc ~anchor ~include_builtin:false
         | "task" -> closed_value_multi inst ~tree ~loc ~anchor "logseq.property/status" "task"
         | "priority" -> closed_value_multi inst ~tree ~loc ~anchor "logseq.property/priority" "priority"
         | "page" -> page_picker inst ~tree ~loc ~anchor "page"
         | "page reference" -> page_picker inst ~tree ~loc ~anchor "page-ref"
         | "tags" -> tag_picker inst ~tree ~loc ~anchor
         | "full text search" -> full_text_picker inst ~tree ~loc ~anchor
         | "between" -> between_picker inst ~tree ~loc ~anchor
         | "sample" -> sample_picker inst ~tree ~loc ~anchor
         | _ -> ())
       ())

(* clause click popup: delete + wrap + unwrap/replace for operators *)
let clause_popup inst ~tree ~loc ~anchor ~is_op_clause =
  let items =
    [ P.MItem ((I.t "ui/delete"), fun () ->
          (* cljs: operator delete drops the trailing 0 (butlast loc) *)
          let loc' =
            if is_op_clause then
              match List.rev loc with _ :: rest -> List.rev rest | [] -> loc
            else loc
          in
          tree := remove_at !tree loc';
          commit inst ~tree ()) ]
    @ (if is_op_clause then
         [ P.MItem
             ( (I.t "query.builder/unwrap-operator")
             , fun () ->
                 tree := unwrap_at !tree loc;
                 commit inst ~tree ()) ]
       else [])
    @ [ P.MSub
          ( (I.t "query.builder/wrap-filter-with-label")
          , List.map
              (fun op ->
                P.MItem
                  ( String.uppercase_ascii op
                  , fun () ->
                      tree := wrap_op !tree loc op;
                      commit inst ~tree () ))
              operators )
      ]
  in
  let items =
    if is_op_clause then
      items @ [ P.MSub
        ( I.t "query.builder/replace-with-label"
        , List.map (fun op -> P.MItem (String.uppercase_ascii op, fun () ->
            match get_at !tree loc with
            | Some (COp (_, children)) ->
                tree := replace_at !tree loc (COp (op, children));
                commit inst ~tree ()
            | _ -> ())) operators ) ]
    else
      let replace () =
        let draft = ref (COp ("and", [])) in
        let editor = { inst with save = (fun value ->
            match value with
            | COp ("and", [ clause ]) ->
                tree := replace_at !tree loc clause;
                commit inst ~tree ()
            | _ -> invalid_arg "Query replacement requires one clause") } in
        picker editor ~tree:draft ~loc:[ 0 ] ~anchor
      in
      items @ [ P.MItem (I.t "query.builder/replace-with-label", replace) ]
  in
  ignore (P.show_menu ~anchor items)

(* ---------- clause tree rendering (declarative) ---------- *)

let loc_key loc =
  match loc with [] -> "0" | _ -> String.concat "-" (List.map string_of_int loc)

let clause_id inst loc = "qbc-" ^ inst.key ^ "-" ^ loc_key loc
let op_id inst loc = "qbo-" ^ inst.key ^ "-" ^ loc_key loc
let add_id inst loc = "qba-" ^ inst.key ^ "-" ^ loc_key loc

let rec clause_el inst ~tree ~loc (c : clause) : t =
  match c with
  | COp (op, xs) ->
      box ~key:("qc-" ^ loc_key loc)
        [ row ~key:"oc" ~cross:`center
            [ text ~key:"bl" ~value:"(" []
            ; clauses_group inst ~tree ~loc:(loc @ [ 0 ]) ~kind:op ~clauses:xs
            ; text ~key:"br" ~value:")" []
            ]
        ]
  | _ ->
      let id = clause_id inst loc in
      box ~key:("qc-" ^ loc_key loc)
        [ row ~key:"btn" ~gap:8 ~padding_horizontal:4 ~cross:`center
            ~border_width:1 ~corner_radius:4
           
            [ Ui_components.button ~variant:`ghost ~size:`sm ~height:24
                ~key:"a" ~accessibility_identifier:id ~disabled:inst.disabled
                ~style_class:"query-clause" ~text:(clause_label inst c)
                ~label:(clause_label inst c)
                ~on_press:(fun _ ->
                  match Ui_services.dom_by_id id with
                  | Some anchor ->
                      clause_popup inst ~tree ~loc ~anchor ~is_op_clause:false
                  | None -> ())
                []
            ]
        ]

and op_label_el inst ~tree ~loc kind : t =
  let id = op_id inst loc in
  Ui_components.button ~variant:`ghost ~size:`sm ~height:24
    ~key:("qbo-" ^ loc_key loc) ~accessibility_identifier:id ~disabled:inst.disabled
    ~style_class:"query-clause"
    ~text:(String.uppercase_ascii kind) ~label:(String.uppercase_ascii kind)
    ~on_press:(fun _ ->
      match Ui_services.dom_by_id id with
      | Some anchor -> clause_popup inst ~tree ~loc ~anchor ~is_op_clause:true
      | None -> ())
    []

and add_filter_btn inst ~tree ~loc ~with_label : t =
  let id = add_id inst loc in
  Ui_components.button ~variant:`ghost ~key:("qba-" ^ loc_key loc) ~accessibility_identifier:id
    ~disabled:inst.disabled
    ~icon:(`app "plus") ~size:`sm ~height:24 ~foreground:"muted-foreground"
    ~label:(I.t "view.filter/filter")
    ?text:(if with_label then Some (I.t "view.filter/filter") else None)
    ~grow:1. ~min_width:0
    ~style_class:"jtrigger"
    ~on_press:(fun _ ->
      match Ui_services.dom_by_id id with
      | Some anchor -> picker inst ~tree ~loc ~anchor
      | None -> ())
    []

and clauses_group inst ~tree ~loc ~kind ~clauses : t =
  let parens = loc = [ 0 ] && (kind <> "and" || List.length clauses > 1) in
  Ui_components.with_props [ Ui_components.Prop.flex_wrap `wrap ]
  (row ~key:("qg-" ^ loc_key loc) ~gap:4 ~cross:`center
    ( (if parens then
         [ text ~key:"pl" ~value:"(" [] ]
       else [])
    @ (if not (loc = [ 0 ] && kind = "and" && List.length clauses <= 1) then
         [ box ~key:"opl"
             [ op_label_el inst ~tree ~loc kind ]
         ]
       else [])
    @ List.mapi (fun i c -> clause_el inst ~tree ~loc:(loc @ [ i + 1 ]) c) clauses
    @ (if parens then
         [ text ~key:"pr" ~value:")" [] ]
       else [])
    @ (if loc <> [ 0 ] then
         [ add_filter_btn inst ~tree ~loc ~with_label:false ]
       else []) ))

let editor_el inst ~tree : t =
  match !tree with
  | CInvalid message ->
      column ~style_class:"cp__query-builder" ~gap:4
        [ text ~value:(I.t "query/error") []
        ; text ~value:message [] ]
  | _ ->
  column ~style_class:"cp__query-builder"
    [ column ~key:"f" ~gap:4
        ( (match !tree with
           | COp ("and", []) -> []
           | t ->
               let kind, clauses =
                 match t with
                 | COp (op, xs) -> (op, xs)
                 | c -> ("and", [ c ])
               in
               [ clauses_group inst ~tree ~loc:[ 0 ] ~kind ~clauses ])
        @ [ add_filter_btn inst ~tree ~loc:[ 0 ] ~with_label:true ] )
    ]

(* Views and query value blocks share the editor; only ownership and
   persistence differ. No synthetic Views instance is needed. *)
let editor_of_inst inst ~active =
    { key = "view-" ^ string_of_int inst.V.id
    ; disabled = false
    ; active
    ; ref_title = (fun uuid -> Hashtbl.find_opt (V.get inst).V.ref_titles uuid)
    ; property_title = (fun ident ->
        Option.bind (Hashtbl.find_opt (V.get inst).V.all_props ident)
          (fun p -> W.map_get_string p "block/title"))
    ; remember_ref = (fun uuid title ->
        let refs = Hashtbl.copy (V.get inst).V.ref_titles in
        Hashtbl.replace refs uuid title;
        V.update inst (fun s -> { s with V.ref_titles = refs }))
    ; save = (fun tree ->
        let qsrc = tree_to_dsl tree in
        let s = V.get inst in
        let uuid = if s.V.query_block_uuid <> "" then s.V.query_block_uuid
          else match inst.V.kind with V.KQuery { block_uuid } -> block_uuid
          | _ -> invalid_arg "Query builder requires a query value block" in
        V.update inst (fun s -> { s with V.qsrc });
        Db.save_block_title uuid qsrc (fun () -> refresh inst))
    }

let builder_el inst ~tree : t = fun context ->
  editor_el
    (editor_of_inst inst ~active:(fun () -> not (Signal.scope_is_disposed context.Lui_ui.ui_scope)))
    ~tree context

(* per-inst clause trees, re-parsed when the query source changed *)
let trees : (int, clause ref * string) Hashtbl.t = Hashtbl.create 8

let tree_for inst =
  let qsrc = (V.get inst).V.qsrc in
  match Hashtbl.find_opt trees inst.V.id with
  | Some (r, src) when src = qsrc -> r
  | _ ->
      let r = ref (tree_of_src qsrc) in
      Hashtbl.replace trees inst.V.id (r, qsrc);
      r

let drop_tree inst = Hashtbl.remove trees inst.V.id
