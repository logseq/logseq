(ns frontend.common-keywords
  "There are some keywords scattered throughout the codebase."
  (:require [frontend.common.schema-register :include-macros true :as sr]))


(sr/defkeyword :block/uuid
  "block's uuid"
  :uuid)

(sr/defkeyword :block/name
  "block name, lowercase, only page-blocks have this attr"
  :string)

(sr/defkeyword :block/type
  "block type"
  [:enum "page" "property" "class" "whiteboard" "hidden"])

(sr/defkeyword :block/parent
  "page blocks don't have this attr")

(sr/defkeyword :block/order
  "
- page blocks don't have this attr
- some no-order blocks don't have this attr too,
  TODO: list these types")

(sr/defkeyword :block/title
  "Title or content string of the blocks.
in db-version, page-references(e.g. [[page-name]]) are stored as [[~^uuid]]."
  :string)

(sr/defkeyword :block/raw-title
  "like `:block/title`,
but when eval `(:block/raw-title block-entity)`, return raw title of this block"
  :string)

(sr/defkeyword :kv/value
  "Used to store key-value, the value could be anything, e.g. {:db/ident :logseq.kv/xxx :kv/value value}"
  :any)

(sr/defkeyword :class/parent
  "A class's parent class")

(sr/defkeyword :class/schema.properties
  "Class properties that all of its objects can use, notice that it's different from this class's own properties.")

(sr/defkeyword :block/closed-value-property
  "The property that this closed value (an Entity) belongs to.")

(sr/defkeyword :property/schema.classes
  "The classes that this property value must to sastify (being an object of a class)")
