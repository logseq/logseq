(ns frontend.components.lazy-editor
  (:require [clojure.string :as string]
            [rum.core :as rum]
            [shadow.lazy :as lazy]
            [frontend.ui :as ui]
            [frontend.state :as state]))

;; TODO: Why does shadow fail when code is required
#_:clj-kondo/ignore
(def lazy-editor (lazy/loadable frontend.extensions.code/editor))
#_:clj-kondo/ignore
(def lazy-mermaid (lazy/loadable frontend.extensions.mermaid/mermaid-renderer))

(defonce *editor-loaded? (atom false))
(defonce *mermaid-loaded? (atom false))

(rum/defcs editor < rum/reactive
  (rum/local false ::show-mermaid?)
  {:will-mount (fn [state]
                 (let [[_ _ attr] (:rum/args state)
                       mode (:data-lang attr)
                       mermaid? (= mode "mermaid")
                       *show-mermaid? (::show-mermaid? state)]
                   (when mermaid?
                     (reset! *show-mermaid? true)
                     (lazy/load lazy-mermaid
                                (fn []
                                  (reset! *mermaid-loaded? true))))
                   (lazy/load lazy-editor
                              (fn []
                                (reset! *editor-loaded? true))))
                 state)}

  [state config id attr code options]
  (let [editor-loaded? (rum/react *editor-loaded?)
        mermaid-loaded? (rum/react *mermaid-loaded?)
        *show-mermaid? (::show-mermaid? state)
        theme (state/sub :ui/theme)
        code (or code "")
        code (string/replace-first code #"\n$" "")] ;; See-also: #3410
    (if @*show-mermaid?
      (if mermaid-loaded?
        (@lazy-mermaid id code #(reset! *show-mermaid? false))
        (ui/loading "Mermaid"))
      (if editor-loaded?
        (@lazy-editor config id attr code theme options)
        (ui/loading "CodeMirror")))))
