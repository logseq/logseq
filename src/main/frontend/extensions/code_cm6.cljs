(ns frontend.extensions.code-cm6
  (:require ["@codemirror/state" :refer [EditorState]]
            ["@codemirror/view" :refer [EditorView]]
            [frontend.extensions.code-cm6.api :as api]
            [frontend.extensions.code-language-registry :as language-registry]))

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
  (let [^js view (:view context)]
    (.destroy view))
  context)

(defn create-context!
  [{:keys [parent initial-doc editor-id language-name on-change editable? block-uuid]
    :or {initial-doc ""
         editable? true}}]
  (assert-parent! parent)
  (let [language (resolve-language! (or language-name "plain-text"))
        *state (atom {:language language
                      :plugin-extensions {}
                      :plugin-languages {}})
        update-listener (.of (.-updateListener EditorView)
                             (fn [^js view-update]
                               (when (and (.-docChanged view-update) on-change)
                                 (on-change (.toString (.. view-update -state -doc))))))
        editable-extension (.of (.-editable EditorView) editable?)
        read-only-extension (.of (.-readOnly EditorState) (not editable?))
        state (EditorState.create
               #js {:doc initial-doc
                    :extensions #js [update-listener editable-extension read-only-extension]})
        view (EditorView. #js {:state state
                               :parent parent})
        context {:block-uuid block-uuid
                 :editor-id editor-id
                 :*state *state
                 :view view}]
    context))
