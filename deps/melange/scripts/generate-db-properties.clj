(ns generate-db-properties
  "Generate the typed OCaml built-in property catalog from its frozen EDN oracle."
  (:require [clojure.edn :as edn]
            [clojure.java.io :as io]
            [clojure.string :as string]))

(def oracle
  (edn/read-string (slurp (io/file "test/fixtures/db_properties.edn"))))

(defn ocaml-string
  [value]
  (pr-str value))

(defn keyword-text
  [value]
  (subs (str value) 1))

(defn option
  [render value]
  (if (nil? value)
    "None"
    (str "(Some (" (render value) "))")))

(defn present-option
  [m key render]
  (if (contains? m key)
    (option render (get m key))
    "None"))

(defn vector-expression
  [render values]
  (str "(vector [|"
       (string/join "; " (map render values))
       "|])"))

(defn scalar-expression
  [value]
  (cond
    (keyword? value) (str "Keyword " (ocaml-string (keyword-text value)))
    (string? value) (str "String_literal " (ocaml-string value))
    (boolean? value) (str "Bool " value)
    (integer? value) (str "Int " value)
    :else (throw (ex-info "Unsupported property scalar" {:value value}))))

(defn icon-expression
  [icon]
  (option
   (fn [value]
     (str "{ icon_type = " (ocaml-string (keyword-text (:type value)))
          "; id = " (ocaml-string (:id value)) " }"))
   icon))

(defn closed-properties-expression
  [closed-value]
  (if-not (contains? closed-value :properties)
    "Absent"
    (if-let [properties (:properties closed-value)]
      (str "(Checkbox " (:logseq.property/choice-checkbox-state properties) ")")
      "Nil")))

(defn closed-value-expression
  [closed-value]
  (str "make_closed_value "
       (ocaml-string (keyword-text (:db-ident closed-value))) " "
       (ocaml-string (:value closed-value)) " "
       (ocaml-string (str (:uuid closed-value))) " "
       (icon-expression (:icon closed-value)) " "
       (closed-properties-expression closed-value)))

(defn schema-expression
  [schema]
  (str "(make_schema "
       (ocaml-string (keyword-text (:type schema))) " "
       (present-option schema :cardinality #(ocaml-string (keyword-text %))) " "
       (present-option schema :hide? str) " "
       (present-option schema :public? str) " "
       (present-option schema :view-context #(ocaml-string (keyword-text %))) " "
       (present-option schema :ui-position #(ocaml-string (keyword-text %))) " "
       (vector-expression #(ocaml-string (keyword-text %)) (:classes schema))
       ")"))

(defn property-expression
  [[property value]]
  (str "(" (ocaml-string (keyword-text property)) ", "
       (scalar-expression value) ")"))

(defn entry-expression
  [[ident config]]
  (str "make_entry "
       (ocaml-string (keyword-text ident)) " "
       (present-option config :title ocaml-string) " "
       (present-option config :attribute #(ocaml-string (keyword-text %))) " "
       (schema-expression (:schema config)) " "
       (present-option config :queryable? str) " "
       (vector-expression property-expression (:properties config)) " "
       (vector-expression closed-value-expression (:closed-values config)) " "
       (str (true? (get-in config [:rtc :rtc/ignore-attr-when-syncing])))))

(defn keyword-vector
  [key]
  (vector-expression #(ocaml-string (keyword-text %)) (get oracle key)))

(println
 "type scalar =
  | Keyword of string
  | String_literal of string
  | Bool of bool
  | Int of int

type icon = {
  icon_type : string;
  id : string;
}

type closed_value_properties =
  | Absent
  | Nil
  | Checkbox of bool

type closed_value = {
  closed_value_ident : string;
  closed_value_value : string;
  closed_value_uuid : string;
  closed_value_icon : icon option;
  closed_value_properties : closed_value_properties;
}

type schema = {
  property_type : string;
  cardinality : string option;
  hide : bool option;
  public_ : bool option;
  view_context : string option;
  ui_position : string option;
  classes : string Rrbvec.t;
}

type entry = {
  ident : string;
  title : string option;
  attribute : string option;
  schema : schema;
  queryable : bool option;
  properties : (string * scalar) Rrbvec.t;
  closed_values : closed_value Rrbvec.t;
  rtc_ignore_attr_when_syncing : bool;
}

let ident entry = entry.ident
let title entry = entry.title
let attribute entry = entry.attribute
let schema entry = entry.schema
let queryable entry = entry.queryable
let properties entry = entry.properties
let closed_values entry = entry.closed_values
let rtc_ignore_attr_when_syncing entry = entry.rtc_ignore_attr_when_syncing
let schema_property_type schema = schema.property_type
let schema_cardinality schema = schema.cardinality
let schema_hide schema = schema.hide
let schema_public schema = schema.public_
let schema_view_context schema = schema.view_context
let schema_ui_position schema = schema.ui_position
let schema_classes schema = schema.classes
let closed_value_ident value = value.closed_value_ident
let closed_value_value value = value.closed_value_value
let closed_value_uuid value = value.closed_value_uuid
let closed_value_icon value = value.closed_value_icon
let closed_value_properties value = value.closed_value_properties
let vector = Rrbvec.of_array

let make_schema property_type cardinality hide public_ view_context ui_position
    classes =
  { property_type; cardinality; hide; public_; view_context; ui_position; classes }

let make_closed_value closed_value_ident closed_value_value closed_value_uuid
    closed_value_icon closed_value_properties =
  {
    closed_value_ident;
    closed_value_value;
    closed_value_uuid;
    closed_value_icon;
    closed_value_properties;
  }

let make_entry ident title attribute schema queryable properties closed_values
    rtc_ignore_attr_when_syncing =
  {
    ident;
    title;
    attribute;
    schema;
    queryable;
    properties;
    closed_values;
    rtc_ignore_attr_when_syncing;
  }")

(println "\nlet entries =")
(println
 (vector-expression entry-expression (:built-in-properties oracle)))

(doseq [[name key]
        [["public_built_in_properties" :public-built-in-properties]
         ["db_attribute_properties" :db-attribute-properties]
         ["private_db_attribute_properties" :private-db-attribute-properties]
         ["public_db_attribute_properties" :public-db-attribute-properties]
         ["read_only_properties" :read-only-properties]
         ["schema_properties" :schema-properties]
         ["logseq_property_namespaces" :logseq-property-namespaces]]]
  (println (str "\nlet " name " ="))
  (println
   (if (= key :logseq-property-namespaces)
     (vector-expression ocaml-string (get oracle key))
     (keyword-vector key)))
  (when (= key :schema-properties)
    (println
     "\nlet schema_entries ~ident_of entries =\n  Rrbvec.filter\n    (fun (key, _value) -> Rrbvec.mem (ident_of key) schema_properties)\n    entries")))

(println "\nlet schema_properties_map =")
(println
 (vector-expression
  (fn [[key value]]
    (str "(" (ocaml-string (name key)) ", "
         (ocaml-string (keyword-text value)) ")"))
  (:schema-properties-map oracle)))
