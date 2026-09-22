(* Uniform access over datascript entities and pulled maps — cljs
   reads (:attr node) polymorphically on both `d/entity` results and
   `d/pull*` maps, which behave differently for attrs the pull did not
   select (entity: materialized from db; pulled map: nil). Mirroring
   that exactly is what makes hidden?/breadcrumb/class-instance?
   behave identically on both.

   Port of the entity-util/db/class helpers the worker search code
   path touches. *)

open Datascript

type node =
  | E of entity
  | P of pulled_entity

let of_entity e = E e
let of_pulled p = P p

(* db/id — cljs (:db/id node). Entities always have an id; pulled maps
   carry {:db/id} only when pulled (pull_api always includes it). *)
let db_id = function
  | E e -> Some e.id
  | P p -> Some p.pulled_id

(* Pulled stub for a bare-ref value, matching pull_api/pulled_id_stub
   (cljs yields {:db/id n} for a bare ref pull). *)
let pulled_stub id =
  { pulled_id = id
  ; pulled_attrs =
      [ (Keyword "db/id", Pulled_scalar (Int id)) ]
  }

let pulled_values (p : pulled_entity) (a : attr) : pulled_value option =
  List.find_map
    (fun (k, v) ->
       match k with
       | Keyword ka when String.equal ka a -> Some v
       | String ka when String.equal ka a -> Some v
       | _ -> None)
    p.pulled_attrs

(* scalar values of an attr — entity materializes refs (Ref ids);
   pulled scalars pass through; pulled entities surface as Ref. *)
let values (n : node) (a : attr) : value list =
  match n with
  | E e -> Ldb.values e a
  | P p ->
      (match pulled_values p a with
       | None -> []
       | Some (Pulled_scalar v) -> [ v ]
       | Some (Pulled_entity pe) -> [ Ref pe.pulled_id ]
       | Some (Pulled_many vs) ->
           List.filter_map
             (fun v ->
                match v with
                | Pulled_scalar v -> Some v
                | Pulled_entity pe -> Some (Ref pe.pulled_id)
                | Pulled_many _ -> None)
             vs)

let value (n : node) (a : attr) : value option =
  match values n a with v :: _ -> Some v | [] -> None

(* (:attr node) resolved to child nodes — entities materialize refs
   via the db; pulled entities stay pulled (deeper access sees only
   what the pull selected), bare refs become id-only stubs. *)
let ref_nodes (n : node) (a : attr) : node list =
  match n with
  | E e -> List.map of_entity (Ldb.ref_ents e a)
  | P p ->
      (match pulled_values p a with
       | None -> []
       | Some (Pulled_entity pe) -> [ P pe ]
       | Some (Pulled_many vs) ->
           List.filter_map
             (fun v ->
                match v with
                | Pulled_entity pe -> Some (P pe)
                | Pulled_scalar (Ref id) -> Some (P (pulled_stub id))
                | _ -> None)
             vs
       | Some (Pulled_scalar (Ref id)) -> [ P (pulled_stub id) ]
       | Some (Pulled_scalar (Int id)) -> [ P (pulled_stub id) ]
       | Some (Pulled_scalar _) -> [])

let ref_node (n : node) (a : attr) : node option =
  match ref_nodes n a with x :: _ -> Some x | [] -> None

let string_value (n : node) (a : attr) : string option =
  match value n a with Some (String s) -> Some s | _ -> None

let int_value (n : node) (a : attr) : int option =
  match value n a with Some (Int i) -> Some i | _ -> None

let keyword_value (n : node) (a : attr) : string option =
  match value n a with Some (Keyword s) -> Some s | _ -> None

let truthy v = Ldb.truthy v

let title (n : node) : string option = string_value n "block/title"
let uuid (n : node) : string option =
  match value n "block/uuid" with Some (Uuid s) -> Some s | Some (String s) -> Some s | _ -> None
let ident (n : node) : string option = keyword_value n "db/ident"

(* ---------- entity-util predicates on nodes ---------- *)

(* entity-util/has-tag? *)
let has_tag (n : node) (tag_ident : string) : bool =
  List.exists (fun t -> ident t = Some tag_ident) (ref_nodes n "block/tags")

let internal_page (n : node) = has_tag n "logseq.class/Page"
let is_class (n : node) = has_tag n "logseq.class/Tag"
let is_property (n : node) = has_tag n "logseq.class/Property"
let is_journal (n : node) = has_tag n "logseq.class/Journal"
let closed_value (n : node) = Option.is_some (value n "block/closed-value-property")
let asset (n : node) = Option.is_some (value n "logseq.property.asset/type")

let is_page (n : node) =
  internal_page n || is_journal n || is_class n || is_property n

(* entity-util/hidden? — own flags or any ancestor's, cycle-safe. *)
let hidden (page : node) : bool =
  let rec hidden_parent (parent : node option) seen =
    match parent with
    | Some e ->
        (match db_id e with
         | Some id when not (List.mem id seen) ->
             truthy (value e "logseq.property/hide?")
             || truthy (value e "logseq.property/deleted-at")
             || hidden_parent (ref_node e "block/parent") (id :: seen)
         | _ -> false)
    | None -> false
  in
  truthy (value page "logseq.property/hide?")
  || truthy (value page "logseq.property/deleted-at")
  || hidden_parent (ref_node page "block/parent") []

(* entity-util/object? *)
let object_ (n : node) = ref_nodes n "block/tags" <> []

(* db-property/public-built-in-property? *)
let public_built_in_property (n : node) =
  truthy (value n "logseq.property/public?")

(* db-db/private-built-in-page? *)
let private_built_in_page (n : node) : bool =
  if is_property n then not (public_built_in_property n)
  else if is_class n || internal_page n then false
  else true

let built_in (n : node) = truthy (value n "logseq.property/built-in?")

(* ---------- db.cljs / class.cljs helpers ---------- *)

(* class.cljs get-class-extends — BFS over
   :logseq.property.class/extends, distinct, order-preserving. *)
let get_class_extends (class_ : node) : node list =
  (* cljs loop: extends=(:extends class), result=[]; recur (mapcat
     :extends) (into result extends); end (reverse (distinct result)).
     distinct keeps the first occurrence of each id. *)
  let rec collect frontier result =
    if frontier = [] then result
    else
      let next =
        List.concat_map
          (fun c -> ref_nodes c "logseq.property.class/extends")
          frontier
      in
      collect next (result @ frontier)
  in
  match ref_nodes class_ "logseq.property.class/extends" with
  | [] -> []
  | extends ->
      let result = collect extends [] in
      let seen = Hashtbl.create 17 in
      result
      |> List.filter (fun n ->
             match db_id n with
             | Some id when not (Hashtbl.mem seen id) ->
                 Hashtbl.replace seen id ();
                 true
             | _ -> false)
      |> List.rev

(* db.cljs get-classes-parents — extends of all class tags. *)
let get_classes_parents (tags : node list) : node list =
  let classes = List.filter is_class tags in
  let all = List.concat_map get_class_extends classes in
  let seen = Hashtbl.create 17 in
  List.filter
    (fun n ->
       match db_id n with
       | Some id when not (Hashtbl.mem seen id) ->
           Hashtbl.replace seen id ();
           true
       | _ -> false)
    all

(* db.cljs class-instance? *)
let class_instance (class_ : node) (obj : node) : bool =
  match db_id class_ with
  | None -> false
  | Some class_id ->
      let tags = ref_nodes obj "block/tags" in
      let tags_ids =
        List.filter_map db_id tags
      in
      List.mem class_id tags_ids
      ||
      let parent_ids =
        get_classes_parents tags |> List.filter_map db_id
      in
      List.mem class_id parent_ids

(* db.cljs get-page-parents — :block/parent chain minus cycles. *)
let get_page_parents (n : node) : node list =
  match ref_node n "block/parent" with
  | None -> []
  | Some parent ->
      let seen = Hashtbl.create 7 in
      let rec walk cur acc =
        match cur with
        | Some p ->
            (match db_id p with
             | Some id when Hashtbl.mem seen id -> acc
             | Some id ->
                 Hashtbl.replace seen id ();
                 walk (ref_node p "block/parent") (p :: acc)
             | None -> acc)
        | None -> acc
      in
      List.rev (walk (Some parent) [])

let library_page_name = "Library" (* common-config/library-page-name *)
let quick_add_page_name = "Quick add" (* common-config/quick-add-page-name *)

(* db.cljs library? *)
let library (page : node) : bool =
  built_in page && title page = Some library_page_name

(* db.cljs get-class-title-with-extends *)
let get_class_title_with_extends (n : node) : string option =
  match title n with
  | None -> None
  | Some t ->
      let extends =
        ref_nodes n "logseq.property.class/extends"
        |> List.filter (fun ex -> not (built_in ex) && title ex <> Some t)
      in
      (match extends with
       | [] -> Some t
       | [ single ] ->
           Some (Option.value (title single) ~default:"" ^ "/" ^ t)
       | _ ->
           let titles =
             extends
             |> List.filteri (fun i _ -> i < 2)
             |> List.map (fun ex -> Option.value (title ex) ~default:"")
           in
           Some (String.concat " | " titles ^ "/" ^ t))

(* db.cljs get-title-with-parents *)
let get_title_with_parents (n : node) : string option =
  if is_class n then get_class_title_with_extends n
  else if is_page n then
    let parents =
      get_page_parents n
      |> List.filter (fun e -> not (built_in e && title e = Some library_page_name))
    in
    match title n with
    | None -> None
    | Some _ ->
        let names = List.filter_map title (parents @ [ n ]) in
        Some (String.concat "/" names)
  else title n

(* db.cljs inline-tag? — raw-title contains "#" + [[uuid]] ref. *)
let inline_tag (block_raw_title : string) (tag : node) : bool =
  match uuid tag with
  | Some u ->
      let pat = "#" ^ Page_ref.to_page_ref u in
      let rec find i =
        i + String.length pat <= String.length block_raw_title
        && (String.sub block_raw_title i (String.length pat) = pat || find (i + 1))
      in
      find 0
  | None -> false

(* db.cljs page-in-library? — db needed to resolve the Library page. *)
let page_in_library (db : db) (page : node) : bool =
  if not (is_page page) then false
  else
    match Ldb.get_built_in_page db library_page_name with
    | None -> false
    | Some library_ent ->
        let lib_id = library_ent.id in
        let rec loop parent =
          match parent with
          | None -> false
          | Some p ->
              (match db_id p with
               | Some id when id = lib_id -> true
               | Some _ -> loop (ref_node p "block/parent")
               | None -> false)
        in
        loop (ref_node page "block/parent")
