(ns frontend.extensions.code
  "CodeMirror 6 editor accessors shared between the lazy :code-editor module
   (frontend.extensions.code.editor, which owns EditorView creation) and the
   main bundle (save/focus/plugin call sites). This namespace intentionally
   has no npm dependencies so requiring it from the main bundle does not pull
   CodeMirror into the eagerly loaded code."
  (:require [goog.object :as gobj]))

(def context-property "__logseqCodeEditorContext")

;; Heavy implementations (EditorView creation, language reconfiguration) live
;; in frontend.extensions.code.editor and register themselves here on module
;; load, so main-bundle callers can invoke them through the thin facade.
(defonce ^:private *impls (atom {}))

(defn register-impl!
  "Called by frontend.extensions.code.editor when the :code-editor module loads."
  [impls]
  (swap! *impls merge impls))

(defn- impl
  [k]
  (or (get @*impls k)
      (throw (ex-info "CodeMirror 6 implementation is not loaded"
                      {:impl k}))))

(defn- editor-doc
  [^js view]
  (.. view -state -doc))

(defn- doc-length
  [^js view]
  (.-length (editor-doc view)))

(defn- clamp-offset
  [view offset]
  (max 0 (min (or offset 0) (doc-length view))))

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
  "Registers `f` called with the new doc string on every doc change.
   Returns a function that removes the listener."
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

(defn request-measure!
  "Asks the editor to re-measure its DOM, e.g. after the container resized."
  [context]
  (some-> ^js (:view context) (.requestMeasure))
  context)

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
    (.dispatch view #js {:selection #js {:anchor offset'}
                         :scrollIntoView true})
    context))

(defn set-cursor!
  [context cursor]
  (set-selection-by-offset! context (line-ch->offset context cursor)))

(defn set-language!
  "Reconfigures the editor's language support for `language-name` (a name,
   alias, or file extension from the language registry)."
  [context language-name]
  ((impl :set-language!) context language-name))

(defn destroy!
  [context]
  (let [^js view (:view context)
        ^js parent (:parent context)]
    (doseq [dispose! (:dispose-fns @(:*state context))]
      (dispose!))
    (swap! (:*state context) assoc :dispose-fns [])
    (when parent
      (gobj/remove parent context-property))
    (some-> view .-dom (gobj/remove context-property))
    (when view
      (.destroy view)))
  context)
