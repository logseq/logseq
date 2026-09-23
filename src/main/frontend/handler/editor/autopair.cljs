(ns ^:no-doc frontend.handler.editor.autopair
  (:require [frontend.commands :as commands]
            [frontend.context.i18n :refer [t]]
            [frontend.handler.notification :as notification]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.cursor :as cursor]
            [frontend.util.text :as text-util]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [logseq.common.util.block-ref :as block-ref]
            [logseq.common.util.page-ref :as page-ref]))

;; Editor should track some useful information, like editor modes.
;; For example:
;; 1. Which file format is it, markdown or org mode?
;; 2. Is it in the properties area? Then we can enable the ":" autopair
(def autopair-map
  {"[" "]"
   "{" "}"
   "(" ")"
   "`" "`"
   "~" "~"
   "*" "*"
   "_" "_"
   "$" "$"
   "^" "^"
   "=" "="
   "/" "/"
   "+" "+"})
;; ":" ":"                              ; TODO: only properties editing and org mode tag

(def reversed-autopair-map
  (zipmap (vals autopair-map)
          (keys autopair-map)))

(def autopair-when-selected
  #{"*" "^" "_" "=" "+" "/"})

(def delete-map
  (assoc autopair-map
         ":" ":"))

(defn autopair
  [input-id prefix _format _option]
  (let [suffix (get autopair-map prefix)
        selected (util/get-selected-text)
        postfix (str selected suffix)
        value (str prefix postfix)
        input (gdom/getElement input-id)]
    (when value
      (let [[prefix _pos] (commands/simple-replace! input-id value selected
                                                    {:backward-pos (count postfix)
                                                     :check-fn (fn [new-value prefix-pos]
                                                                 (when (>= prefix-pos 0)
                                                                   [(subs new-value prefix-pos (+ prefix-pos 2))
                                                                    (+ prefix-pos 2)]))})]
        (cond
          (= prefix page-ref/left-brackets)
          (do
            (commands/handle-step [:editor/search-page])
            (state/set-editor-action-data! {:pos (cursor/get-caret-pos input)
                                            :selected selected}))

          (= prefix block-ref/left-parens)
          (notification/show!
           (t :editor/reference-node-use-page-ref)
           :warning)

          (= prefix block-ref/left-parens)
          (do
            (commands/handle-step [:editor/search-block :reference])
            (state/set-editor-action-data! {:pos (cursor/get-caret-pos input)
                                            :selected selected})))))))

(defn surround-by?
  [input before end]
  (when input
    (let [value (gobj/get input "value")
          pos (cursor/pos input)]
      (text-util/surround-by? value pos before end))))

(defn autopair-left-paren?
  [input key]
  (and (= key "(")
       (or (surround-by? input :start "")
           (surround-by? input "\n" "")
           (surround-by? input " " "")
           (surround-by? input "]" "")
           (surround-by? input "(" ""))))

(defn wrapped-by?
  [input before end]
  (when input
    (let [value (gobj/get input "value")
          pos (cursor/pos input)]
      (when (>= pos 0)
        (text-util/wrapped-by? value pos before end)))))
