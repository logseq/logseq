(ns frontend.common-keywords
  "There are some keywords scattered throughout the codebase."
  (:require [frontend.schema-register :include-macros true :as sr]))


(sr/defkeyword :block/uuid
  "block's uuid"
  :uuid)

(sr/defkeyword :block/name
  "block name, lowercase, only page-blocks have this attr"
  :string)

(sr/defkeyword :block/original-name
  "like `:block/name`, but not unified into lowercase"
  :string)

(sr/defkeyword :block/type
  "block type"
  [:enum #{"property"} #{"class"} #{"whiteboard"} #{"hidden"}])

(sr/defkeyword :block/parent
  "page blocks don't have this attr")

(sr/defkeyword :block/order
  "
- page blocks don't have this attr
- some no-order blocks don't have this attr too,
  TODO: list these types")

(sr/defkeyword :block/content
  "content string of the blocks.
in db-version, page-references(e.g. [[page-name]]) are stored as [[~^uuid]]."
  :string)

(sr/defkeyword :block/raw-content
  "like `:block/content`,
but when eval `(:block/raw-content block-entity)`, return raw-content of this block"
  :string)
