(ns frontend.extensions.code
  (:require [clojure.string :as string]
            ["@codemirror/state" :refer [EditorState StateEffect]]
            ["@codemirror/view" :refer [EditorView lineNumbers]]
            [frontend.extensions.code.api :as api]
            [frontend.extensions.code.language-registry :as language-registry]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]))

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

(defn- normalize-language-lookup
  [language-name]
  (some-> language-name str string/lower-case string/trim))

(defn- plugin-language-by-name
  [context language-name]
  (let [lookup-key (normalize-language-lookup language-name)]
    (some
     (fn [descriptor]
       (when (or (= lookup-key (api/external-name (:id descriptor)))
                 (contains? (:names descriptor) lookup-key))
         descriptor))
     (vals (:plugin-languages @(:*state context))))))

(defn- language-by-name
  [context language-name]
  (or (plugin-language-by-name context language-name)
      (language-registry/language-by-name language-name)))

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

(defn add-change-listener!
  [context f]
  (when-not (fn? f)
    (throw (ex-info "CodeMirror 6 change listener must be a function" {})))
  (let [listener-id (random-uuid)]
    (swap! (:*state context) assoc-in [:change-listeners listener-id] f)
    #(swap! (:*state context) update :change-listeners dissoc listener-id)))

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
  (let [language (or (plugin-language-by-name context language-name)
                     (resolve-language! language-name))]
    (swap! (:*state context) assoc :language language)
    language))

(declare enhancer-payload)

(defn- js-enhancer-payload
  [context]
  (api/enhancer-payload->js (enhancer-payload context)))

(defn- resolve-extension
  [context extension]
  (if (fn? extension)
    (extension (js-enhancer-payload context))
    extension))

(defn register-extension!
  [context key extension]
  (when-not key
    (throw (ex-info "CodeMirror 6 extension key is required" {})))
  (let [extension (resolve-extension context extension)]
    (swap! (:*state context) assoc-in [:plugin-extensions key] extension)
    (when-let [^js view (:view context)]
      (when (and extension (fn? (.-dispatch view)))
        (.dispatch view #js {:effects (.of (.-appendConfig StateEffect) extension)}))))
  context)

(defn register-language!
  [context descriptor]
  (let [descriptor (api/normalize-language-descriptor descriptor)]
    (when-not (language-registry/valid-language-descriptor? descriptor)
      (throw (ex-info "Invalid CodeMirror 6 language descriptor"
                      {:descriptor descriptor})))
    (swap! (:*state context) assoc-in [:plugin-languages (:id descriptor)] descriptor))
  context)

(defn apply-enhancers!
  [context enhancers]
  (let [payload (js-enhancer-payload context)]
    (doseq [{:keys [key type enhancer]} enhancers]
      (cond
        (= api/legacy-enhancer-type type)
        (log/error :code-editor/legacy-codemirror-enhancer
                   {:key key
                    :message "Legacy CodeMirror enhancer is not supported by the CodeMirror 6 editor"})

        (fn? enhancer)
        (enhancer payload))))
  context)

(defn enhancer-payload
  [context]
  (when-let [^js view (:view context)]
    (api/make-enhancer-payload
     {:editor-id (:editor-id context)
      :view view
      :state (.-state view)
      :dispatch! #(.dispatch view %)
      :language (:language @(:*state context))
      :get-language #(language-by-name context %)
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

(defn- user-option-extensions
  [options]
  (cond-> []
    (:line-numbers? options)
    (conj (lineNumbers))

    (:line-wrapping? options)
    (conj (.-lineWrapping EditorView))))

(defn create-context!
  [{:keys [parent initial-doc editor-id language-name on-change on-selection-change editable? block-uuid user-options]
    :or {initial-doc ""
         editable? true}}]
  (assert-parent! parent)
  (let [user-options (merge api/default-user-options
                            (api/validate-user-options! user-options))
        language (or (language-registry/language-by-name language-name)
                     (language-registry/language-by-extension language-name)
                     (language-registry/plain-text-language))
        *state (atom {:default-value initial-doc
                      :change-listeners {}
                      :language language
                      :plugin-extensions {}
                      :plugin-languages {}})
        update-listener (.of (.-updateListener EditorView)
                             (fn [^js view-update]
                               (when (.-docChanged view-update)
                                 (let [new-value (.toString (.. view-update -state -doc))]
                                   (when on-change
                                     (on-change new-value))
                                   (doseq [listener (vals (:change-listeners @*state))]
                                     (listener new-value))))
                               (when (and (.-selectionSet view-update) on-selection-change)
                                 (on-selection-change))))
        editable-extension (.of (.-editable EditorView) editable?)
        read-only-extension (.of (.-readOnly EditorState) (not editable?))
        user-extensions (user-option-extensions user-options)
        state (EditorState.create
               #js {:doc initial-doc
                    :extensions (to-array (into [update-listener editable-extension read-only-extension]
                                                user-extensions))})
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
