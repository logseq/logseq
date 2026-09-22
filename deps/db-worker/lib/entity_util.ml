(* logseq.db.frontend.entity-util — entity predicate helpers operating on
   `entity` values. *)

open Datascript

let internal_page (e : entity) = Ldb.internal_page e
let is_class (e : entity) = Ldb.is_class e
let is_property (e : entity) = Ldb.is_property e

let closed_value (e : entity) : bool =
  Ldb.ref_ent e "block/closed-value-property" <> None

(* entity-util/journal? — page entity (or entity-like map) with a
   :block/journal-day or the Journal tag *)
let journal (e : entity) : bool =
  Ldb.is_journal e || Ldb.value e "block/journal-day" <> None

(* entity-util/page? — internal-page or journal or has block/name and not a
   class/property *)
let page (e : entity) : bool =
  internal_page e || journal e
  || (Ldb.value e "block/name" <> None
      && not (is_class e || is_property e))

let asset (e : entity) : bool =
  Ldb.value e "logseq.property.asset/type" <> None

let recycled (e : entity) = Ldb.recycled e

let hidden (e : entity) : bool =
  let rec hidden_parent (p : entity) (seen : int list) : bool =
    if List.mem p.id seen then false
    else
      (Clj_value.truthy (Option.value ~default:Nil (Ldb.value p "logseq.property/hide?"))
       || Ldb.value p "logseq.property/deleted-at" <> None)
      ||
      (match Ldb.ref_ent p "block/parent" with
       | Some pp -> hidden_parent pp (p.id :: seen)
       | None -> false)
  in
  Clj_value.truthy (Option.value ~default:Nil (Ldb.value e "logseq.property/hide?"))
  || Ldb.value e "logseq.property/deleted-at" <> None
  ||
  (match Ldb.ref_ent e "block/parent" with
   | Some p -> hidden_parent p []
   | None -> false)

let object_ (e : entity) : bool =
  not (internal_page e || journal e || is_class e || is_property e)
  && Ldb.value e "block/parent" <> None

let built_in (e : entity) = Ldb.built_in e

let get_pages_by_name (db : db) (page_name : string) : datom list =
  Ldb.pages_by_name db page_name
