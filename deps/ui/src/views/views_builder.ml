(* Query builder — the .cp__query-builder clause editor for dsl queries.
   Clause model: a tree of operators (and/or/not) wrapping named filter
   clauses; serialized to dsl text and saved into the
   logseq.property/query value block's title. *)

module D = Views_dom
module V = Views_state
module W = Wire
module Wr = Views_wire
module I = I18n
module P = Views_popup
module Db = Views_db

type barg = { a_dsl : string; a_disp : string }

type clause =
  | COp of string * clause list
  | CItem of string * barg list
  | CText of string

let filters =
  [ "tags"; "page reference"; "property"; "task"; "priority"; "page"
  ; "full text search"; "between"; "sample" ]

let operators = [ "and"; "or"; "not" ]

let is_op s = List.mem s operators

(* ---------- dsl serialize ---------- *)

let rec to_dsl = function
  (* cljs ->dsl* unwraps [:page-ref x] to a bare [[x]] symbol *)
  | CText s -> "\"" ^ s ^ "\""
  | CItem ("page-ref", [ a ]) ->
      (* cljs ->dsl* collapses [:page-ref v] to the bare [[v]] form *)
      a.a_dsl
  | CItem (f, args) ->
      let arg_str = List.map (fun a -> a.a_dsl) args |> String.concat " " in
      if args = [] then "(" ^ f ^ ")"
      else "(" ^ f ^ " " ^ arg_str ^ ")"
  | COp (op, xs) ->
      "(" ^ op ^ " " ^ String.concat " " (List.map to_dsl xs) ^ ")"

(* simplify: [:and x] -> x, empty ops collapse *)
let rec simplify = function
  | COp (op, xs) -> (
      let xs' = List.filter_map simplify_arg xs in
      match op, xs' with
      | "and", [] -> None
      | _, [] -> None
      | ("and" | "or"), [ x ] -> Some x
      | _ -> Some (COp (op, xs')))
  | c -> Some c
and simplify_arg c = simplify c

let tree_to_dsl (t : clause) : string =
  match simplify t with
  | None -> ""
  | Some c -> to_dsl c

(* ---------- dsl parse (edn -> clause tree) ---------- *)

let unwrap s =
  let n = String.length s in
  if n >= 2 && s.[0] = '"' && s.[n - 1] = '"' then String.sub s 1 (n - 2)
  else s

let arg_of_wire (w : W.t) : barg =
  match w with
  | W.Array [ W.Array (inner :: _) ] | W.List [ W.List (inner :: _) ] ->
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
  | W.String s -> { a_dsl = "\"" ^ s ^ "\""; a_disp = s }
  | W.Symbol s | W.Keyword s -> { a_dsl = ":" ^ s; a_disp = s }
  | other ->
      let s = Edn.to_string other in
      { a_dsl = s; a_disp = s }

let rec clause_of_wire (w : W.t) : clause option =
  match w with
  | W.List (W.Symbol f :: args) | W.List (W.Keyword f :: args)
  | W.Array (W.Symbol f :: args) | W.Array (W.Keyword f :: args) ->
      if is_op f then
        Some (COp (f, List.filter_map clause_of_wire args))
      else Some (CItem (f, List.map arg_of_wire args))
  | W.String s -> Some (CText s)
  | W.Array [ W.Array _ ] | W.List [ W.List _ ] ->
      Some (CItem ("page-ref", [ arg_of_wire w ]))
  | _ -> None

let tree_of_src (src : string) : clause =
  let t = String.trim src in
  match (try Some (Edn.parse t) with _ -> None) with
  | Some w -> (
      match clause_of_wire w with
      | Some (COp _ as op) -> op
      | Some c -> COp ("and", [ c ])
      | None -> COp ("and", []))
  | None -> COp ("and", [])

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
  | [ 0 ], _ -> x
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
      match Hashtbl.find_opt inst.V.ref_titles d with
      | Some t -> t
      | None -> d)
    args

let clause_label inst (c : clause) : string =
  match c with
  | CText s -> I.builder_search s
  | CItem (f, args) -> (
      match f, disp_args inst args with
      | ("task" | "priority"), vs -> f ^ ": " ^ String.concat " | " vs
      | ("property" | "private-property"), k :: vs -> (
          let title =
            match Hashtbl.find_opt inst.V.all_props k with
            | Some p ->
                Option.value (W.map_get_string p "block/title") ~default:k
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
          | [] -> title ^ ": " ^ I.builder_all_values
          | vs -> title ^ ": " ^ String.concat " " vs)
      | "page-ref", [ t ] -> "[[" ^ t ^ "]]"
      | "tags", [ t ] -> "#" ^ t
      | ("page" | "tags"), v :: _ -> f ^ ": " ^ v
      | "between", [ a; b ] -> I.builder_between_journal a b
      | "sample", [ n ] -> "sample: " ^ n
      | _ -> to_dsl c)
  | COp (op, _) -> String.uppercase_ascii op

(* ---------- pickers ---------- *)

let commit inst ~tree ~refresh () =
  inst.V.qsrc <- tree_to_dsl !tree;
  let buuid =
    if inst.V.query_block_uuid <> "" then inst.V.query_block_uuid
    else
      match inst.V.kind with
      | V.KQuery { block_uuid } -> block_uuid
      | _ -> ""
  in
  Db.save_block_title buuid inst.V.qsrc (fun () -> refresh inst)

(* value picker for a chosen property ident *)
let value_picker inst ~tree ~loc ~anchor ident ~refresh =
  let add_clause v =
    let clause = CItem ("property", [ { a_dsl = ":" ^ ident; a_disp = ident }; v ]) in
    tree := append_at !tree loc clause;
    commit inst ~tree ~refresh ()
  in
  Db.get_closed_values ident (fun cvs ->
      let items, extra_vals =
        if cvs <> [] then
          ( List.filter_map
              (fun cv -> W.map_get_string cv "block/title")
              cvs
          , true )
        else ([], false)
      in
      let open_select its =
        ignore
          (P.show_select ~anchor ~placeholder:ident
             ~wrap_cls:"query-builder-picker"
             ~items:
               (List.map
                  (fun t ->
                    { P.si_label = t
                    ; si_value = t
                    ; si_extra = None
                    })
                  its)
             ~on_chosen:(fun it _ ->
               add_clause { a_dsl = "\"" ^ it.P.si_value ^ "\""; a_disp = it.si_value })
             ())
      in
      if extra_vals then open_select items
      else
        Db.get_property_values ident (fun vs ->
            let its =
              List.filter_map
                (fun v -> W.map_get_string v "label")
                (Wr.W.elems vs)
            in
            open_select its))

(* property picker: list of props + "Show built-in properties" toggle *)
let rec property_picker inst ~tree ~loc ~anchor ~refresh ~include_builtin =
  Db.get_all_properties (fun props ->
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
        let cb = D.h ~tag:"input" ~attrs:[ ("id", "built-in"); ("type", "checkbox") ] () in
        let lab =
          D.h ~tag:"label"
            ~cls:"opacity-50 cursor-pointer select-none text-sm"
            ~attrs:[ ("for", "built-in") ]
            ~text:I.builder_show_builtin ()
        in
        let row =
          D.h
            ~cls:"flex flex-row justify-between gap-1 items-center px-1 pb-1 border-b"
            ~children:[ lab; cb ] ()
        in
        D.el_add_listener cb "change" (fun _ ->
            property_picker inst ~tree ~loc ~anchor ~refresh
              ~include_builtin:(D.el_checked cb));
        if include_builtin then D.el_set_checked cb true;
        Some row
      in
      ignore
        (P.show_select ~anchor ~placeholder:I.select_prompt ~items
           ~extra:(fun () -> head ())
           ~wrap_cls:"query-builder-picker"
           ~on_chosen:(fun it _ ->
             value_picker inst ~tree ~loc ~anchor it.P.si_value ~refresh)
           ()))

let closed_value_multi inst ~tree ~loc ~anchor ident name ~refresh =
  Db.get_closed_values ident (fun cvs ->
      let items =
        List.filter_map
          (fun cv -> W.map_get_string cv "block/title")
          cvs
      in
      ignore
        (P.show_select ~anchor ~placeholder:I.select_multi_prompt ~multiple:true
         ~wrap_cls:"query-builder-picker"
           ~items:
             (List.map
                (fun t ->
                  { P.si_label = t; si_value = t; si_extra = None })
                items)
           ~on_apply:(fun vs ->
             if vs <> [] then begin
               let args =
                 List.map
                   (fun v -> { a_dsl = "\"" ^ v ^ "\""; a_disp = v })
                   vs
               in
               tree := append_at !tree loc (CItem (name, args));
               commit inst ~tree ~refresh ()
             end)
           ~on_chosen:(fun _ _ -> ())
           ()))

let page_picker inst ~tree ~loc ~anchor kind ~refresh =
  Db.get_all_page_titles (fun titles ->
      let items =
        List.map
          (fun t ->
            { P.si_label = t; si_value = t; si_extra = None })
          titles
      in
      ignore
        (P.show_select ~anchor ~placeholder:I.select_prompt ~items
           ~wrap_cls:"query-builder-picker"
           ~on_chosen:(fun it _ ->
             let v = it.P.si_value in
             let clause =
               match kind with
               | "page" -> CItem ("page", [ { a_dsl = "[[" ^ v ^ "]]"; a_disp = v } ])
               | _ ->
                   CItem ("page-ref", [ { a_dsl = "[[" ^ v ^ "]]"; a_disp = v } ])
             in
             tree := append_at !tree loc clause;
             commit inst ~tree ~refresh ())
           ()))

let tag_picker inst ~tree ~loc ~anchor ~refresh =
  Db.get_all_classes (fun classes ->
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
        (P.show_select ~anchor ~placeholder:I.select_prompt ~items
           ~wrap_cls:"query-builder-picker"
           ~on_chosen:(fun it _ ->
             (* seed uuid -> title so a re-parsed [[uuid]] clause still
                resolves before refresh_block re-reads the value block's
                block/refs (async) *)
             Hashtbl.replace inst.V.ref_titles it.P.si_value it.si_label;
             tree :=
               append_at !tree loc
                 (CItem ("tags", [ { a_dsl = "[[" ^ it.P.si_value ^ "]]"; a_disp = it.si_label } ]));
             commit inst ~tree ~refresh ())
           ()))

let between_picker inst ~tree ~loc ~anchor ~refresh =
  Db.get_all_page_titles (fun titles ->
      let pick start_label on_done =
        ignore
          (P.show_select ~anchor ~placeholder:start_label
             ~items:
               (List.map
                  (fun t ->
                    { P.si_label = t; si_value = t; si_extra = None })
                  titles)
             ~wrap_cls:"query-builder-picker" ~on_chosen:on_done ())
      in
      pick I.builder_between_start (fun s _ ->
          pick I.builder_between_end (fun e _ ->
              tree :=
                append_at !tree loc
                  (CItem
                     ( "between"
                     , [ { a_dsl = "[[" ^ s.P.si_value ^ "]]"; a_disp = s.si_value }
                       ; { a_dsl = "[[" ^ e.P.si_value ^ "]]"; a_disp = e.si_value }
                       ] ));
              commit inst ~tree ~refresh ())))

let full_text_picker inst ~tree ~loc ~anchor:_ ~refresh =
  let input =
    D.h ~tag:"input"
      ~cls:"form-input block sm:text-sm sm:leading-5"
      ~attrs:
        [ ("id", "query-builder-search")
        ; ("placeholder", I.type_to_search)
        ; ("aria-label", I.type_to_search)
        ]
      ()
  in
  let wrap = D.h ~cls:"query-builder-picker" ~children:[ input ] () in
  D.el_append_child D.document_body wrap;
  P.push_popup wrap;
  D.el_add_listener input "keydown" (fun ev ->
      match Editor_dom.ev_key ev with
      | "Enter" ->
          let v = String.trim (Editor_dom.el_value input) in
          if v <> "" then begin
            P.close_all ();
            tree := append_at !tree loc (CText v);
            commit inst ~tree ~refresh ()
          end
      | "Escape" -> P.close_all ()
      | _ -> ());
  Editor_dom.set_timeout (fun () -> Editor_dom.el_focus input) 0

let sample_picker inst ~tree ~loc ~anchor ~refresh =
  ignore
    (P.show_select ~anchor ~placeholder:I.select_prompt
       ~items:
         (List.init 100 (fun i ->
              let n = string_of_int (i + 1) in
              { P.si_label = n; si_value = n; si_extra = None }))
       ~wrap_cls:"query-builder-picker"
       ~on_chosen:(fun it _ ->
         tree := append_at !tree loc (CItem ("sample", [ { a_dsl = it.P.si_value; a_disp = it.si_value } ]));
         commit inst ~tree ~refresh ())
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
let picker inst ~tree ~loc ~anchor ~refresh =
  let items =
    List.map
      (fun f -> { P.si_label = item_label f; si_value = f; si_extra = None })
      (filters @ operators)
  in
  ignore
    (P.show_select ~anchor ~placeholder:I.builder_add_filter_placeholder
       ~items ~wrap_cls:"query-builder-picker"
       ~on_chosen:(fun it _ ->
         match it.P.si_value with
         | op when is_op op ->
             tree := append_at !tree loc (COp (op, []));
             commit inst ~tree ~refresh ()
         | "property" -> property_picker inst ~tree ~loc ~anchor ~refresh ~include_builtin:false
         | "task" -> closed_value_multi inst ~tree ~loc ~anchor "logseq.property/status" "task" ~refresh
         | "priority" -> closed_value_multi inst ~tree ~loc ~anchor "logseq.property/priority" "priority" ~refresh
         | "page" -> page_picker inst ~tree ~loc ~anchor "page" ~refresh
         | "page reference" -> page_picker inst ~tree ~loc ~anchor "page-ref" ~refresh
         | "tags" -> tag_picker inst ~tree ~loc ~anchor ~refresh
         | "full text search" -> full_text_picker inst ~tree ~loc ~anchor ~refresh
         | "between" -> between_picker inst ~tree ~loc ~anchor ~refresh
         | "sample" -> sample_picker inst ~tree ~loc ~anchor ~refresh
         | _ -> ())
       ())

(* clause click popup: delete + wrap + unwrap/replace for operators *)
let clause_popup inst ~tree ~loc ~anchor ~is_op_clause ~refresh =
  let items =
    [ P.MItem (I.delete, fun () ->
          (* cljs: operator delete drops the trailing 0 (butlast loc) *)
          let loc' =
            if is_op_clause then
              match List.rev loc with _ :: rest -> List.rev rest | [] -> loc
            else loc
          in
          tree := remove_at !tree loc';
          commit inst ~tree ~refresh ()) ]
    @ (if is_op_clause then
         [ P.MItem
             ( I.builder_unwrap
             , fun () ->
                 (match get_at !tree loc with
                  | Some (COp (_, [ single ])) ->
                      tree := replace_at !tree loc single;
                      commit inst ~tree ~refresh ()
                  | Some (COp (_, xs)) ->
                      (* unwrap: splice children into the group *)
                      let c = COp ("and", xs) in
                      tree := replace_at !tree loc c;
                      commit inst ~tree ~refresh ()
                  | _ -> ())) ]
       else [])
    @ [ P.MSub
          ( I.builder_wrap_label
          , List.map
              (fun op ->
                P.MItem
                  ( String.uppercase_ascii op
                  , fun () ->
                      tree := wrap_op !tree loc op;
                      commit inst ~tree ~refresh () ))
              operators )
      ]
  in
  ignore (P.show_menu ~anchor items)

(* ---------- clause tree rendering ---------- *)

let rec clause_el inst ~tree ~loc ~refresh (c : clause) : D.el =
  let wrap = D.h ~cls:"query-builder-clause" () in
  (match c with
   | COp (op, xs) ->
       let inner = D.h ~cls:"operator-clause flex flex-row items-center" () in
       D.el_append_child inner (D.h ~cls:"clause-bracket" ~text:"(" ());
       D.el_append_child inner
         (clauses_group inst ~tree ~loc:(loc @ [ 0 ]) ~kind:op ~clauses:xs
            ~refresh);
       D.el_append_child inner (D.h ~cls:"clause-bracket" ~text:")" ());
       D.el_append_child wrap inner
   | _ ->
       let btn = D.h ~cls:"query-builder-clause-btn flex flex-row items-center gap-2 px-1 rounded border" () in
       let a =
         D.h ~tag:"a" ~cls:"flex query-clause"
           ~text:(clause_label inst c) ()
       in
       D.el_add_listener a "click" (fun _ ->
           clause_popup inst ~tree ~loc ~anchor:a ~is_op_clause:false ~refresh);
       D.el_append_child btn a;
       D.el_append_child wrap btn);
  wrap

and op_label_el inst ~tree ~loc ~refresh kind : D.el =
  let a =
    D.h ~tag:"a" ~cls:"flex text-sm query-clause"
      ~text:(String.uppercase_ascii kind) ()
  in
  D.el_add_listener a "click" (fun _ ->
      clause_popup inst ~tree ~loc ~anchor:a ~is_op_clause:true ~refresh);
  a

and add_filter_btn inst ~tree ~loc ~refresh ~with_label : D.el =
  let b =
    D.h ~tag:"button"
      ~cls:"jtrigger !px-1 h-6 add-filter text-muted-foreground"
      ~attrs:[ ("type", "button") ]
      ~children:[ D.icon "plus" ] ()
  in
  (* cljs emits the "filter" label as a direct text node — playwright
     :text() only matches own text, not descendant elements *)
  if with_label then
    D.el_append_child b (Editor_dom.create_text_node I.filter);
  D.el_add_listener b "mousedown" (fun ev -> Editor_dom.stop_propagation ev);
  D.el_add_listener b "click" (fun _ ->
      picker inst ~tree ~loc ~anchor:b ~refresh);
  b

and clauses_group inst ~tree ~loc ~kind ~clauses ~refresh : D.el =
  let g = D.h ~cls:"clauses-group" () in
  let parens = loc = [ 0 ] && (kind <> "and" || List.length clauses > 1) in
  if parens then D.el_append_child g (D.h ~cls:"clause-bracket" ~text:"(" ());
  (if not (loc = [ 0 ] && kind = "and" && List.length clauses <= 1) then
     D.el_append_child g
       (D.h ~cls:"query-builder-clause"
          ~children:[ op_label_el inst ~tree ~loc ~refresh kind ] ()));
  List.iteri
    (fun i c ->
      D.el_append_child g
        (clause_el inst ~tree ~loc:(loc @ [ i + 1 ]) ~refresh c))
    clauses;
  if parens then D.el_append_child g (D.h ~cls:"clause-bracket" ~text:")" ());
  if loc <> [ 0 ] then
    D.el_append_child g
      (add_filter_btn inst ~tree ~loc ~refresh ~with_label:false);
  g

(* the builder panel rendered inside .custom-query-results for dsl queries *)
let builder_el inst ~tree ~refresh : D.el =
  let root = D.h ~cls:"cp__query-builder" () in
  let filter = D.h ~cls:"cp__query-builder-filter" () in
  (match !tree with
   | COp ("and", []) -> ()
   | t ->
       let kind, clauses =
         match t with
         | COp (op, xs) -> (op, xs)
         | c -> ("and", [ c ])
       in
       D.el_append_child filter
         (clauses_group inst ~tree ~loc:[ 0 ] ~kind ~clauses ~refresh));
  D.el_append_child filter
    (add_filter_btn inst ~tree ~loc:[ 0 ] ~refresh ~with_label:true);
  D.el_append_child root filter;
  root

(* per-inst clause trees, re-parsed when the query source changed *)
let trees : (int, clause ref * string) Hashtbl.t = Hashtbl.create 8

let tree_for inst =
  match Hashtbl.find_opt trees inst.V.id with
  | Some (r, src) when src = inst.V.qsrc -> r
  | _ ->
      let r = ref (tree_of_src inst.V.qsrc) in
      Hashtbl.replace trees inst.V.id (r, inst.V.qsrc);
      r

let drop_tree inst = Hashtbl.remove trees inst.V.id
