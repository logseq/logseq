(* frontend.worker.sync.const — RTC constants.
   ignore-attrs-when-syncing = built-in properties whose :rtc map has
   :rtc/ignore-attr-when-syncing (property.cljs);
   ignore-entities-when-init-upload = kv-entities with
   :rtc/ignore-entity-when-init-upload (kv_entity.cljs). *)

let ignore_attrs_when_syncing : string list =
  [ "logseq.property.view/gallery-card-size"
  ; "logseq.property.view/gallery-card-width"
  ; "logseq.property.view/gallery-card-height"
  ; "logseq.property.view/sort-groups-by-property"
  ; "logseq.property.view/sort-groups-desc?"
  ; "logseq.property.table/sorting"
  ; "logseq.property.asset/last-visit-page"
  ]

(* derived from kv-entity/kv-entities :rtc/ignore-entity-when-init-upload *)
let ignore_entities_when_init_upload : string list =
  List.filter_map
    (fun (kw, (c : Kv_entity.kv_config)) ->
      if c.Kv_entity.rtc_ignore_entity_when_init_upload then Some kw else None)
    Kv_entity.kv_entities

let encrypt_attr_set : string list = [ "block/title"; "block/name" ]

let is_ignored_attr a = List.mem a ignore_attrs_when_syncing

let is_ignored_entity ident = List.mem ident ignore_entities_when_init_upload

let is_encrypt_attr a = List.mem a encrypt_attr_set
