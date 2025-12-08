;; Auto-generated via `bb libs:generate-cljs-sdk`
(ns com.logseq.editor
  (:require [com.logseq.core :as core]))

(def api-proxy (aget js/logseq "Editor"))

(defn register-slash-command
  "register a custom command which will be added to the Logseq slash command list"
  [tag action]
  (let [method (aget api-proxy "registerSlashCommand")
        args [tag action]]
    (core/call-method api-proxy method args)))

(defn register-block-context-menu-item
  "register a custom command in the block context menu (triggered by right-clicking the block dot)"
  [label action]
  (let [method (aget api-proxy "registerBlockContextMenuItem")
        args [label action]]
    (core/call-method api-proxy method args)))

(defn- register-highlight-context-menu-item-impl
  [label action opts]
  (let [method (aget api-proxy "registerHighlightContextMenuItem")
        args [label action opts]]
    (core/call-method api-proxy method args)))

(defn register-highlight-context-menu-item
  "Current it's only available for pdf viewer"
  ([label action]
   (register-highlight-context-menu-item-impl label action nil))
  ([label action opts]
   (register-highlight-context-menu-item-impl label action opts)))

(defn check-editing
  []
  (let [method (aget api-proxy "checkEditing")
        args []]
    (core/call-method api-proxy method args)))

(defn insert-at-editing-cursor
  [content]
  (let [method (aget api-proxy "insertAtEditingCursor")
        args [content]]
    (core/call-method api-proxy method args)))

(defn restore-editing-cursor
  []
  (let [method (aget api-proxy "restoreEditingCursor")
        args []]
    (core/call-method api-proxy method args)))

(defn- exit-editing-mode-impl
  [select-block]
  (let [method (aget api-proxy "exitEditingMode")
        args [select-block]]
    (core/call-method api-proxy method args)))

(defn exit-editing-mode
  ([]
   (exit-editing-mode-impl nil))
  ([select-block]
   (exit-editing-mode-impl select-block)))

(defn get-editing-cursor-position
  []
  (let [method (aget api-proxy "getEditingCursorPosition")
        args []]
    (core/call-method api-proxy method args)))

(defn get-editing-block-content
  []
  (let [method (aget api-proxy "getEditingBlockContent")
        args []]
    (core/call-method api-proxy method args)))

(defn get-current-page
  []
  (let [method (aget api-proxy "getCurrentPage")
        args []]
    (core/call-method api-proxy method args)))

(defn get-current-block
  []
  (let [method (aget api-proxy "getCurrentBlock")
        args []]
    (core/call-method api-proxy method args)))

(defn get-selected-blocks
  []
  (let [method (aget api-proxy "getSelectedBlocks")
        args []]
    (core/call-method api-proxy method args)))

(defn clear-selected-blocks
  []
  (let [method (aget api-proxy "clearSelectedBlocks")
        args []]
    (core/call-method api-proxy method args)))

(defn get-current-page-blocks-tree
  "get all blocks of the current page as a tree structure"
  []
  (let [method (aget api-proxy "getCurrentPageBlocksTree")
        args []]
    (core/call-method api-proxy method args)))

(defn get-page-blocks-tree
  "get all blocks for the specified page"
  [src-page]
  (let [method (aget api-proxy "getPageBlocksTree")
        args [src-page]]
    (core/call-method api-proxy method args)))

(defn get-page-linked-references
  "get all page/block linked references"
  [src-page]
  (let [method (aget api-proxy "getPageLinkedReferences")
        args [src-page]]
    (core/call-method api-proxy method args)))

(defn get-pages-from-namespace
  "get flatten pages from top namespace"
  [namespace]
  (let [method (aget api-proxy "getPagesFromNamespace")
        args [namespace]]
    (core/call-method api-proxy method args)))

(defn get-pages-tree-from-namespace
  "construct pages tree from namespace pages"
  [namespace]
  (let [method (aget api-proxy "getPagesTreeFromNamespace")
        args [namespace]]
    (core/call-method api-proxy method args)))

(defn new-block-uuid
  "Create a unique UUID string which can then be assigned to a block."
  []
  (let [method (aget api-proxy "newBlockUUID")
        args []]
    (core/call-method api-proxy method args)))

(defn is-page-block
  [block]
  (let [method (aget api-proxy "isPageBlock")
        args [block]]
    (core/call-method api-proxy method args)))

(defn- insert-block-impl
  [src-block content opts]
  (let [method (aget api-proxy "insertBlock")
        args [src-block content opts]]
    (core/call-method api-proxy method args)))

(defn insert-block
  ([src-block content]
   (insert-block-impl src-block content nil))
  ([src-block content opts]
   (insert-block-impl src-block content opts)))

(defn- insert-batch-block-impl
  [src-block batch opts]
  (let [method (aget api-proxy "insertBatchBlock")
        args [src-block batch opts]]
    (core/call-method api-proxy method args)))

(defn insert-batch-block
  ([src-block batch]
   (insert-batch-block-impl src-block batch nil))
  ([src-block batch opts]
   (insert-batch-block-impl src-block batch opts)))

(defn- update-block-impl
  [src-block content opts]
  (let [method (aget api-proxy "updateBlock")
        args [src-block content opts]]
    (core/call-method api-proxy method args)))

(defn update-block
  ([src-block content]
   (update-block-impl src-block content nil))
  ([src-block content opts]
   (update-block-impl src-block content opts)))

(defn remove-block
  [src-block]
  (let [method (aget api-proxy "removeBlock")
        args [src-block]]
    (core/call-method api-proxy method args)))

(defn- get-block-impl
  [src-block opts]
  (let [method (aget api-proxy "getBlock")
        args [src-block opts]]
    (core/call-method api-proxy method args)))

(defn get-block
  ([src-block]
   (get-block-impl src-block nil))
  ([src-block opts]
   (get-block-impl src-block opts)))

(defn set-block-collapsed
  [uuid opts]
  (let [method (aget api-proxy "setBlockCollapsed")
        args [uuid opts]]
    (core/call-method api-proxy method args)))

(defn- get-page-impl
  [src-page opts]
  (let [method (aget api-proxy "getPage")
        args [src-page opts]]
    (core/call-method api-proxy method args)))

(defn get-page
  ([src-page]
   (get-page-impl src-page nil))
  ([src-page opts]
   (get-page-impl src-page opts)))

(defn- create-page-impl
  [page-name properties opts]
  (let [method (aget api-proxy "createPage")
        args [page-name properties opts]]
    (core/call-method api-proxy method args)))

(defn create-page
  ([page-name]
   (create-page-impl page-name nil nil))
  ([page-name properties]
   (create-page-impl page-name properties nil))
  ([page-name properties opts]
   (create-page-impl page-name properties opts)))

(defn create-journal-page
  [date]
  (let [method (aget api-proxy "createJournalPage")
        args [date]]
    (core/call-method api-proxy method args)))

(defn delete-page
  [page-name]
  (let [method (aget api-proxy "deletePage")
        args [page-name]]
    (core/call-method api-proxy method args)))

(defn rename-page
  [old-name new-name]
  (let [method (aget api-proxy "renamePage")
        args [old-name new-name]]
    (core/call-method api-proxy method args)))

(defn- get-all-pages-impl
  [repo]
  (let [method (aget api-proxy "getAllPages")
        args [repo]]
    (core/call-method api-proxy method args)))

(defn get-all-pages
  ([]
   (get-all-pages-impl nil))
  ([repo]
   (get-all-pages-impl repo)))

(defn get-all-tags
  []
  (let [method (aget api-proxy "getAllTags")
        args []]
    (core/call-method api-proxy method args)))

(defn get-all-properties
  []
  (let [method (aget api-proxy "getAllProperties")
        args []]
    (core/call-method api-proxy method args)))

(defn get-tag-objects
  [page-identity]
  (let [method (aget api-proxy "getTagObjects")
        args [page-identity]]
    (core/call-method api-proxy method args)))

(defn- prepend-block-in-page-impl
  [page content opts]
  (let [method (aget api-proxy "prependBlockInPage")
        args [page content opts]]
    (core/call-method api-proxy method args)))

(defn prepend-block-in-page
  ([page content]
   (prepend-block-in-page-impl page content nil))
  ([page content opts]
   (prepend-block-in-page-impl page content opts)))

(defn- append-block-in-page-impl
  [page content opts]
  (let [method (aget api-proxy "appendBlockInPage")
        args [page content opts]]
    (core/call-method api-proxy method args)))

(defn append-block-in-page
  ([page content]
   (append-block-in-page-impl page content nil))
  ([page content opts]
   (append-block-in-page-impl page content opts)))

(defn get-previous-sibling-block
  [src-block]
  (let [method (aget api-proxy "getPreviousSiblingBlock")
        args [src-block]]
    (core/call-method api-proxy method args)))

(defn get-next-sibling-block
  [src-block]
  (let [method (aget api-proxy "getNextSiblingBlock")
        args [src-block]]
    (core/call-method api-proxy method args)))

(defn- move-block-impl
  [src-block target-block opts]
  (let [method (aget api-proxy "moveBlock")
        args [src-block target-block opts]]
    (core/call-method api-proxy method args)))

(defn move-block
  ([src-block target-block]
   (move-block-impl src-block target-block nil))
  ([src-block target-block opts]
   (move-block-impl src-block target-block opts)))

(defn- edit-block-impl
  [src-block opts]
  (let [method (aget api-proxy "editBlock")
        args [src-block opts]]
    (core/call-method api-proxy method args)))

(defn edit-block
  ([src-block]
   (edit-block-impl src-block nil))
  ([src-block opts]
   (edit-block-impl src-block opts)))

(defn select-block
  [src-block]
  (let [method (aget api-proxy "selectBlock")
        args [src-block]]
    (core/call-method api-proxy method args)))

(defn save-focused-code-editor-content
  []
  (let [method (aget api-proxy "saveFocusedCodeEditorContent")
        args []]
    (core/call-method api-proxy method args)))

(defn get-property
  [key]
  (let [method (aget api-proxy "getProperty")
        args [key]]
    (core/call-method api-proxy method args)))

(defn- upsert-property-impl
  [key schema opts]
  (let [method (aget api-proxy "upsertProperty")
        args [key schema opts]]
    (core/call-method api-proxy method args)))

(defn upsert-property
  ([key]
   (upsert-property-impl key nil nil))
  ([key schema]
   (upsert-property-impl key schema nil))
  ([key schema opts]
   (upsert-property-impl key schema opts)))

(defn remove-property
  [key]
  (let [method (aget api-proxy "removeProperty")
        args [key]]
    (core/call-method api-proxy method args)))

(defn upsert-block-property
  [block key value]
  (let [method (aget api-proxy "upsertBlockProperty")
        args [block key value]]
    (core/call-method api-proxy method args)))

(defn remove-block-property
  [block key]
  (let [method (aget api-proxy "removeBlockProperty")
        args [block key]]
    (core/call-method api-proxy method args)))

(defn get-block-property
  [block key]
  (let [method (aget api-proxy "getBlockProperty")
        args [block key]]
    (core/call-method api-proxy method args)))

(defn get-block-properties
  [block]
  (let [method (aget api-proxy "getBlockProperties")
        args [block]]
    (core/call-method api-proxy method args)))

(defn get-page-properties
  [page]
  (let [method (aget api-proxy "getPageProperties")
        args [page]]
    (core/call-method api-proxy method args)))

(defn- scroll-to-block-in-page-impl
  [page-name block-id opts]
  (let [method (aget api-proxy "scrollToBlockInPage")
        args [page-name block-id opts]]
    (core/call-method api-proxy method args)))

(defn scroll-to-block-in-page
  ([page-name block-id]
   (scroll-to-block-in-page-impl page-name block-id nil))
  ([page-name block-id opts]
   (scroll-to-block-in-page-impl page-name block-id opts)))

(defn open-in-right-sidebar
  [id]
  (let [method (aget api-proxy "openInRightSidebar")
        args [id]]
    (core/call-method api-proxy method args)))

(defn on-input-selection-end
  [callback]
  (let [method (aget api-proxy "onInputSelectionEnd")
        args [callback]]
    (core/call-method api-proxy method args)))
