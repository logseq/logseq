(ns frontend.extensions.code-cm6
  (:require ["@codemirror/state" :refer [EditorState]]
            ["@codemirror/view" :refer [EditorView]]
            [frontend.extensions.code-cm6.api :as api]
            [frontend.extensions.code-language-registry :as language-registry]
            [goog.object :as gobj]))

(def context-property "__logseqCodeEditorContext")

(defn- assert-parent!
  [parent]
  (when-not parent
    (throw (ex-info "CodeMirror 6 parent element is required" {}))))

(defn- editor-doc
  [^js view]
  (.. view -state -doc))

(defn- doc-length
  [^js view]
  (.-length (editor-doc view)))

(defn- clamp-offset
  [view offset]
  (max 0 (min (or offset 0) (doc-length view))))

(defn- resolve-language!
  [language-name]
  (or (language-registry/language-by-name language-name)
      (language-registry/language-by-extension language-name)
      (throw (ex-info "Unsupported CodeMirror 6 language"
                      {:language language-name}))))

(defn get-value
  [context]
  (.toString (editor-doc (:view context))))

(defn default-value
  [context]
  (:default-value @(:*state context)))

(defn set-default-value!
  [context value]
  (swap! (:*state context) assoc :default-value value)
  context)

(defn set-value!
  [context value]
  (let [^js view (:view context)]
    (.dispatch view
               #js {:changes #js {:from 0
                                   :to (doc-length view)
                                   :insert (or value "")}})
    context))

(defn focus!
  [context]
  (let [^js view (:view context)]
    (.focus view))
  context)

(defn has-focus?
  [context]
  (let [^js view (:view context)]
    (true? (.-hasFocus view))))

(defn line-count
  [context]
  (.-lines (editor-doc (:view context))))

(defn last-line
  [context]
  (dec (line-count context)))

(defn line-ch->offset
  [context {:keys [line ch]}]
  (let [^js view (:view context)
        text-doc (editor-doc view)
        line-number (inc (max 0 (or line 0)))
        line' (.line text-doc (min line-number (.-lines text-doc)))
        line-start (.-from line')
        line-end (.-to line')]
    (+ line-start (max 0 (min (or ch 0) (- line-end line-start))))))

(defn offset->line-ch
  [context offset]
  (let [^js view (:view context)
        text-doc (editor-doc view)
        offset' (clamp-offset view offset)
        line' (.lineAt text-doc offset')]
    {:line (dec (.-number line'))
     :ch (- offset' (.-from line'))}))

(defn selection-range
  [context]
  (let [^js view (:view context)
        main (.. view -state -selection -main)]
    {:start (offset->line-ch context (.-from main))
     :end (offset->line-ch context (.-to main))}))

(defn line-text
  [context line]
  (let [^js view (:view context)
        text-doc (editor-doc view)
        line-number (inc (max 0 (or line 0)))
        line' (.line text-doc (min line-number (.-lines text-doc)))]
    (.-text line')))

(defn set-selection-by-offset!
  [context offset]
  (let [^js view (:view context)
        offset' (clamp-offset view offset)]
    (.dispatch view #js {:selection #js {:anchor offset'}})
    context))

(defn set-cursor!
  [context cursor]
  (set-selection-by-offset! context (line-ch->offset context cursor)))

(defn set-language!
  [context language-name]
  (let [language (resolve-language! language-name)]
    (swap! (:*state context) assoc :language language)
    language))

(defn register-extension!
  [context key extension]
  (when-not key
    (throw (ex-info "CodeMirror 6 extension key is required" {})))
  (swap! (:*state context) assoc-in [:plugin-extensions key] extension)
  context)

(defn register-language!
  [context descriptor]
  (when-not (language-registry/valid-language-descriptor? descriptor)
    (throw (ex-info "Invalid CodeMirror 6 language descriptor"
                    {:descriptor descriptor})))
  (swap! (:*state context) assoc-in [:plugin-languages (:id descriptor)] descriptor)
  context)

(defn enhancer-payload
  [context]
  (let [^js view (:view context)]
    (api/make-enhancer-payload
     {:editor-id (:editor-id context)
      :view view
      :state (.-state view)
      :language (:language @(:*state context))
      :get-language language-registry/language-by-name
      :register-extension! #(register-extension! context %1 %2)
      :register-language! #(register-language! context %)})))

(defn destroy!
  [context]
  (let [^js view (:view context)
        ^js parent (:parent context)]
    (when parent
      (gobj/remove parent context-property))
    (some-> view .-dom (gobj/remove context-property))
    (.destroy view))
  context)

(defn create-context!
  [{:keys [parent initial-doc editor-id language-name on-change on-selection-change editable? block-uuid]
    :or {initial-doc ""
         editable? true}}]
  (assert-parent! parent)
  (let [language (or (language-registry/language-by-name language-name)
                     (language-registry/language-by-extension language-name)
                     (language-registry/plain-text-language))
        *state (atom {:default-value initial-doc
                      :language language
                      :plugin-extensions {}
                      :plugin-languages {}})
        update-listener (.of (.-updateListener EditorView)
                             (fn [^js view-update]
                               (when (and (.-docChanged view-update) on-change)
                                 (on-change (.toString (.. view-update -state -doc))))
                               (when (and (.-selectionSet view-update) on-selection-change)
                                 (on-selection-change))))
        editable-extension (.of (.-editable EditorView) editable?)
        read-only-extension (.of (.-readOnly EditorState) (not editable?))
        state (EditorState.create
               #js {:doc initial-doc
                    :extensions #js [update-listener editable-extension read-only-extension]})
        view (EditorView. #js {:state state
                               :parent parent})
        context {:block-uuid block-uuid
                 :editor-id editor-id
                 :parent parent
                 :*state *state
                 :view view}]
    (gobj/set parent context-property context)
    (gobj/set (.-dom view) context-property context)
    context))
