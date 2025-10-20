;; Auto-generated via `bb libs:generate-cljs-sdk`
(ns logseq.ui
  (:require ["@logseq/libs" :as logseq]
            [logseq.core :as core]))

(defn- show-msg-impl
  [content status opts]
  (let [method (aget (aget logseq "UI") "showMsg")
        arg-content content
        arg-status status
        arg-opts (core/convert-arg {:bean-to-js true} opts)
        args [arg-content arg-status arg-opts]]
    (core/call-method method args)))

(defn show-msg
  ([content]
   (show-msg-impl content nil nil))
  ([content status]
   (show-msg-impl content status nil))
  ([content status opts]
   (show-msg-impl content status opts)))

(defn close-msg
  [key]
  (let [method (aget (aget logseq "UI") "closeMsg")
        arg-key key
        args [arg-key]]
    (core/call-method method args)))

(defn query-element-rect
  [selector]
  (let [method (aget (aget logseq "UI") "queryElementRect")
        arg-selector selector
        args [arg-selector]]
    (core/call-method method args)))

(defn query-element-by-id
  [id]
  (let [method (aget (aget logseq "UI") "queryElementById")
        arg-id id
        args [arg-id]]
    (core/call-method method args)))

(defn check-slot-valid
  [slot]
  (let [method (aget (aget logseq "UI") "checkSlotValid")
        arg-slot slot
        args [arg-slot]]
    (core/call-method method args)))

(defn resolve-theme-css-props-vals
  [props]
  (let [method (aget (aget logseq "UI") "resolveThemeCssPropsVals")
        arg-props props
        args [arg-props]]
    (core/call-method method args)))
