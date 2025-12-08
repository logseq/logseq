;; Auto-generated via `bb libs:generate-cljs-sdk`
(ns com.logseq.ui
  (:require [com.logseq.core :as core]))

(def api-proxy (aget js/logseq "UI"))

(defn- show-msg-impl
  [content status opts]
  (let [method (aget api-proxy "showMsg")
        args [content status opts]]
    (core/call-method api-proxy method args)))

(defn show-msg
  ([content]
   (show-msg-impl content nil nil))
  ([content status]
   (show-msg-impl content status nil))
  ([content status opts]
   (show-msg-impl content status opts)))

(defn close-msg
  [key]
  (let [method (aget api-proxy "closeMsg")
        args [key]]
    (core/call-method api-proxy method args)))

(defn query-element-rect
  [selector]
  (let [method (aget api-proxy "queryElementRect")
        args [selector]]
    (core/call-method api-proxy method args)))

(defn query-element-by-id
  [id]
  (let [method (aget api-proxy "queryElementById")
        args [id]]
    (core/call-method api-proxy method args)))

(defn check-slot-valid
  [slot]
  (let [method (aget api-proxy "checkSlotValid")
        args [slot]]
    (core/call-method api-proxy method args)))

(defn resolve-theme-css-props-vals
  [props]
  (let [method (aget api-proxy "resolveThemeCssPropsVals")
        args [props]]
    (core/call-method api-proxy method args)))
