;; Auto-generated via `bb libs:generate-cljs-sdk`
(ns logseq.editor
  (:require ["@logseq/libs" :as logseq]
            [logseq.core :as core]))

(defn register-slash-command
  "register a custom command which will be added to the Logseq slash command list"
  [tag action]
  (let [method (aget (aget logseq "Editor") "registerSlashCommand")
        arg-tag tag
        arg-action (core/convert-arg {:bean-to-js true} action)
        args [arg-tag arg-action]]
    (core/call-method method args)))

(defn register-block-context-menu-item
  "register a custom command in the block context menu (triggered by right-clicking the block dot)"
  [label action]
  (let [method (aget (aget logseq "Editor") "registerBlockContextMenuItem")
        arg-label label
        arg-action action
        args [arg-label arg-action]]
    (core/call-method method args)))

(defn- register-highlight-context-menu-item-impl
  [label action opts]
  (let [method (aget (aget logseq "Editor") "registerHighlightContextMenuItem")
        arg-label label
        arg-action (core/convert-arg {:bean-to-js true} action)
        arg-opts opts
        args [arg-label arg-action arg-opts]]
    (core/call-method method args)))

(defn register-highlight-context-menu-item
  "Current it's only available for pdf viewer"
  ([label action]
   (register-highlight-context-menu-item-impl label action nil))
  ([label action opts]
   (register-highlight-context-menu-item-impl label action opts)))

(defn check-editing
  []
  (let [method (aget (aget logseq "Editor") "checkEditing")
        args []]
    (core/call-method method args)))

(defn insert-at-editing-cursor
  [content]
  (let [method (aget (aget logseq "Editor") "insertAtEditingCursor")
        arg-content content
        args [arg-content]]
    (core/call-method method args)))

(defn restore-editing-cursor
  []
  (let [method (aget (aget logseq "Editor") "restoreEditingCursor")
        args []]
    (core/call-method method args)))

(defn- exit-editing-mode-impl
  [select-block]
  (let [method (aget (aget logseq "Editor") "exitEditingMode")
        arg-select-block select-block
        args [arg-select-block]]
    (core/call-method method args)))

(defn exit-editing-mode
  ([]
   (exit-editing-mode-impl nil))
  ([select-block]
   (exit-editing-mode-impl select-block)))

(defn get-editing-cursor-position
  []
  (let [method (aget (aget logseq "Editor") "getEditingCursorPosition")
        args []]
    (core/call-method method args)))

(defn get-editing-block-content
  []
  (let [method (aget (aget logseq "Editor") "getEditingBlockContent")
        args []]
    (core/call-method method args)))

(defn get-current-page
  []
  (let [method (aget (aget logseq "Editor") "getCurrentPage")
        args []]
    (core/call-method method args)))

(defn get-current-block
  []
  (let [method (aget (aget logseq "Editor") "getCurrentBlock")
        args []]
    (core/call-method method args)))

(defn get-selected-blocks
  []
  (let [method (aget (aget logseq "Editor") "getSelectedBlocks")
        args []]
    (core/call-method method args)))

(defn clear-selected-blocks
  []
  (let [method (aget (aget logseq "Editor") "clearSelectedBlocks")
        args []]
    (core/call-method method args)))

(defn get-current-page-blocks-tree
  "get all blocks of the current page as a tree structure"
  []
  (let [method (aget (aget logseq "Editor") "getCurrentPageBlocksTree")
        args []]
    (core/call-method method args)))

(defn get-page-blocks-tree
  "get all blocks for the specified page"
  [src-page]
  (let [method (aget (aget logseq "Editor") "getPageBlocksTree")
        arg-src-page src-page
        args [arg-src-page]]
    (core/call-method method args)))

(defn get-page-linked-references
  "get all page/block linked references"
  [src-page]
  (let [method (aget (aget logseq "Editor") "getPageLinkedReferences")
        arg-src-page src-page
        args [arg-src-page]]
    (core/call-method method args)))

(defn get-pages-from-namespace
  "get flatten pages from top namespace"
  [namespace]
  (let [method (aget (aget logseq "Editor") "getPagesFromNamespace")
        arg-namespace namespace
        args [arg-namespace]]
    (core/call-method method args)))

(defn get-pages-tree-from-namespace
  "construct pages tree from namespace pages"
  [namespace]
  (let [method (aget (aget logseq "Editor") "getPagesTreeFromNamespace")
        arg-namespace namespace
        args [arg-namespace]]
    (core/call-method method args)))

(defn new-block-uuid
  "Create a unique UUID string which can then be assigned to a block."
  []
  (let [method (aget (aget logseq "Editor") "newBlockUUID")
        args []]
    (core/call-method method args)))

(defn is-page-block
  [block]
  (let [method (aget (aget logseq "Editor") "isPageBlock")
        arg-block (core/convert-arg {:bean-to-js true} block)
        args [arg-block]]
    (core/call-method method args)))

(defn- insert-block-impl
  [src-block content opts]
  (let [method (aget (aget logseq "Editor") "insertBlock")
        arg-src-block src-block
        arg-content content
        arg-opts (core/convert-arg {:bean-to-js true} opts)
        args [arg-src-block arg-content arg-opts]]
    (core/call-method method args)))

(defn insert-block
  ([src-block content]
   (insert-block-impl src-block content nil))
  ([src-block content opts]
   (insert-block-impl src-block content opts)))

(defn- insert-batch-block-impl
  [src-block batch opts]
  (let [method (aget (aget logseq "Editor") "insertBatchBlock")
        arg-src-block src-block
        arg-batch batch
        arg-opts (core/convert-arg {:bean-to-js true} opts)
        args [arg-src-block arg-batch arg-opts]]
    (core/call-method method args)))

(defn insert-batch-block
  ([src-block batch]
   (insert-batch-block-impl src-block batch nil))
  ([src-block batch opts]
   (insert-batch-block-impl src-block batch opts)))

(defn- update-block-impl
  [src-block content opts]
  (let [method (aget (aget logseq "Editor") "updateBlock")
        arg-src-block src-block
        arg-content content
        arg-opts (core/convert-arg {:bean-to-js true} opts)
        args [arg-src-block arg-content arg-opts]]
    (core/call-method method args)))

(defn update-block
  ([src-block content]
   (update-block-impl src-block content nil))
  ([src-block content opts]
   (update-block-impl src-block content opts)))

(defn remove-block
  [src-block]
  (let [method (aget (aget logseq "Editor") "removeBlock")
        arg-src-block src-block
        args [arg-src-block]]
    (core/call-method method args)))

(defn- get-block-impl
  [src-block opts]
  (let [method (aget (aget logseq "Editor") "getBlock")
        arg-src-block src-block
        arg-opts (core/convert-arg {:bean-to-js true} opts)
        args [arg-src-block arg-opts]]
    (core/call-method method args)))

(defn get-block
  ([src-block]
   (get-block-impl src-block nil))
  ([src-block opts]
   (get-block-impl src-block opts)))

(defn set-block-collapsed
  [uuid opts]
  (let [method (aget (aget logseq "Editor") "setBlockCollapsed")
        arg-uuid uuid
        arg-opts opts
        args [arg-uuid arg-opts]]
    (core/call-method method args)))

(defn- get-page-impl
  [src-page opts]
  (let [method (aget (aget logseq "Editor") "getPage")
        arg-src-page src-page
        arg-opts (core/convert-arg {:bean-to-js true} opts)
        args [arg-src-page arg-opts]]
    (core/call-method method args)))

(defn get-page
  ([src-page]
   (get-page-impl src-page nil))
  ([src-page opts]
   (get-page-impl src-page opts)))

(defn- create-page-impl
  [page-name properties opts]
  (let [method (aget (aget logseq "Editor") "createPage")
        arg-page-name page-name
        arg-properties properties
        arg-opts (core/convert-arg {:bean-to-js true} opts)
        args [arg-page-name arg-properties arg-opts]]
    (core/call-method method args)))

(defn create-page
  ([page-name]
   (create-page-impl page-name nil nil))
  ([page-name properties]
   (create-page-impl page-name properties nil))
  ([page-name properties opts]
   (create-page-impl page-name properties opts)))

(defn create-journal-page
  [date]
  (let [method (aget (aget logseq "Editor") "createJournalPage")
        arg-date date
        args [arg-date]]
    (core/call-method method args)))

(defn delete-page
  [page-name]
  (let [method (aget (aget logseq "Editor") "deletePage")
        arg-page-name page-name
        args [arg-page-name]]
    (core/call-method method args)))

(defn rename-page
  [old-name new-name]
  (let [method (aget (aget logseq "Editor") "renamePage")
        arg-old-name old-name
        arg-new-name new-name
        args [arg-old-name arg-new-name]]
    (core/call-method method args)))

(defn- get-all-pages-impl
  [repo]
  (let [method (aget (aget logseq "Editor") "getAllPages")
        arg-repo repo
        args [arg-repo]]
    (core/call-method method args)))

(defn get-all-pages
  ([]
   (get-all-pages-impl nil))
  ([repo]
   (get-all-pages-impl repo)))

(defn- prepend-block-in-page-impl
  [page content opts]
  (let [method (aget (aget logseq "Editor") "prependBlockInPage")
        arg-page page
        arg-content content
        arg-opts (core/convert-arg {:bean-to-js true} opts)
        args [arg-page arg-content arg-opts]]
    (core/call-method method args)))

(defn prepend-block-in-page
  ([page content]
   (prepend-block-in-page-impl page content nil))
  ([page content opts]
   (prepend-block-in-page-impl page content opts)))

(defn- append-block-in-page-impl
  [page content opts]
  (let [method (aget (aget logseq "Editor") "appendBlockInPage")
        arg-page page
        arg-content content
        arg-opts (core/convert-arg {:bean-to-js true} opts)
        args [arg-page arg-content arg-opts]]
    (core/call-method method args)))

(defn append-block-in-page
  ([page content]
   (append-block-in-page-impl page content nil))
  ([page content opts]
   (append-block-in-page-impl page content opts)))

(defn get-previous-sibling-block
  [src-block]
  (let [method (aget (aget logseq "Editor") "getPreviousSiblingBlock")
        arg-src-block src-block
        args [arg-src-block]]
    (core/call-method method args)))

(defn get-next-sibling-block
  [src-block]
  (let [method (aget (aget logseq "Editor") "getNextSiblingBlock")
        arg-src-block src-block
        args [arg-src-block]]
    (core/call-method method args)))

(defn- move-block-impl
  [src-block target-block opts]
  (let [method (aget (aget logseq "Editor") "moveBlock")
        arg-src-block src-block
        arg-target-block target-block
        arg-opts (core/convert-arg {:bean-to-js true} opts)
        args [arg-src-block arg-target-block arg-opts]]
    (core/call-method method args)))

(defn move-block
  ([src-block target-block]
   (move-block-impl src-block target-block nil))
  ([src-block target-block opts]
   (move-block-impl src-block target-block opts)))

(defn- edit-block-impl
  [src-block opts]
  (let [method (aget (aget logseq "Editor") "editBlock")
        arg-src-block src-block
        arg-opts opts
        args [arg-src-block arg-opts]]
    (core/call-method method args)))

(defn edit-block
  ([src-block]
   (edit-block-impl src-block nil))
  ([src-block opts]
   (edit-block-impl src-block opts)))

(defn select-block
  [src-block]
  (let [method (aget (aget logseq "Editor") "selectBlock")
        arg-src-block src-block
        args [arg-src-block]]
    (core/call-method method args)))

(defn save-focused-code-editor-content
  []
  (let [method (aget (aget logseq "Editor") "saveFocusedCodeEditorContent")
        args []]
    (core/call-method method args)))

(defn get-property
  [key]
  (let [method (aget (aget logseq "Editor") "getProperty")
        arg-key key
        args [arg-key]]
    (core/call-method method args)))

(defn- upsert-property-impl
  [key schema opts]
  (let [method (aget (aget logseq "Editor") "upsertProperty")
        arg-key key
        arg-schema (core/convert-arg {:bean-to-js true} schema)
        arg-opts opts
        args [arg-key arg-schema arg-opts]]
    (core/call-method method args)))

(defn upsert-property
  ([key]
   (upsert-property-impl key nil nil))
  ([key schema]
   (upsert-property-impl key schema nil))
  ([key schema opts]
   (upsert-property-impl key schema opts)))

(defn remove-property
  [key]
  (let [method (aget (aget logseq "Editor") "removeProperty")
        arg-key key
        args [arg-key]]
    (core/call-method method args)))

(defn upsert-block-property
  [block key value]
  (let [method (aget (aget logseq "Editor") "upsertBlockProperty")
        arg-block block
        arg-key key
        arg-value (core/convert-arg {:bean-to-js true} value)
        args [arg-block arg-key arg-value]]
    (core/call-method method args)))

(defn remove-block-property
  [block key]
  (let [method (aget (aget logseq "Editor") "removeBlockProperty")
        arg-block block
        arg-key key
        args [arg-block arg-key]]
    (core/call-method method args)))

(defn get-block-property
  [block key]
  (let [method (aget (aget logseq "Editor") "getBlockProperty")
        arg-block block
        arg-key key
        args [arg-block arg-key]]
    (core/call-method method args)))

(defn get-block-properties
  [block]
  (let [method (aget (aget logseq "Editor") "getBlockProperties")
        arg-block block
        args [arg-block]]
    (core/call-method method args)))

(defn get-page-properties
  [page]
  (let [method (aget (aget logseq "Editor") "getPageProperties")
        arg-page page
        args [arg-page]]
    (core/call-method method args)))

(defn- scroll-to-block-in-page-impl
  [page-name block-id opts]
  (let [method (aget (aget logseq "Editor") "scrollToBlockInPage")
        arg-page-name page-name
        arg-block-id block-id
        arg-opts opts
        args [arg-page-name arg-block-id arg-opts]]
    (core/call-method method args)))

(defn scroll-to-block-in-page
  ([page-name block-id]
   (scroll-to-block-in-page-impl page-name block-id nil))
  ([page-name block-id opts]
   (scroll-to-block-in-page-impl page-name block-id opts)))

(defn open-in-right-sidebar
  [id]
  (let [method (aget (aget logseq "Editor") "openInRightSidebar")
        arg-id id
        args [arg-id]]
    (core/call-method method args)))

(defn on-input-selection-end
  [callback]
  (let [method (aget (aget logseq "Editor") "onInputSelectionEnd")
        arg-callback (core/convert-arg {:bean-to-js true} callback)
        args [arg-callback]]
    (core/call-method method args)))
