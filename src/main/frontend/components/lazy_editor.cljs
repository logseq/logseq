(ns frontend.components.lazy-editor
  (:require [clojure.string :as string]
            [frontend.config :as config]
            [frontend.handler.plugin :refer [hook-extensions-enhancers-by-key]]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [logseq.shui.hooks :as hooks]
            [promesa.core :as p]
            [io.factorhouse.hsx.core :as hsx]
            [shadow.loader :as loader]))

(defonce ^:private *editor (atom nil))
(defonce ^:private *load-promise (atom nil))
(defonce loaded? (atom false))

(defn register-editor!
  [editor]
  (when-not (fn? editor)
    (throw (ex-info "Invalid code editor component" {:editor editor})))
  (reset! *editor editor))

(defn- editor-placeholder-height
  [rect attr code]
  (let [estimated-height (* 23.2 (count (string/split-lines code)))]
    (or (some-> rect .-height)
        (if (= (:data-lang attr) "calc")
          estimated-height
          (min estimated-height 1024)))))

(defn load-code-editor!
  []
  (when-not util/node-test?
    (or @*load-promise
        (let [result
              (p/let [_ (loader/load :code-editor)
                      editor @*editor
                      _ (when-not (fn? editor)
                          (throw (ex-info "Code editor module did not register its component"
                                          {})))
                      _ (p/all
                         (when-let [enhancers
                                    (and config/lsp-enabled?
                                         (seq (hook-extensions-enhancers-by-key
                                               :codemirror)))]
                           (mapv (fn [{f :enhancer}]
                                   (when (fn? f)
                                     (f (. js/window -CodeMirror))))
                                 enhancers)))]
                (reset! loaded? true))]
          (reset! *load-promise result)
          result))))

(hsx/defc editor-aux
  [config id attr code options codemirror-loaded?]
  (let [^js state (ui/useInView #js {:rootMargin "0px"})
        in-view? (.-inView state)
        [set-size-ref rect] (hooks/use-bounding-client-rect)
        placeholder [:div
                     {:style {:height (editor-placeholder-height rect attr code)}}]]
    [:div {:ref (.-ref state)}
     [:div {:ref set-size-ref}
      (if (and codemirror-loaded? in-view?)
        (@*editor config id attr code options)
        placeholder)]]))

(hsx/defc editor
  [config id attr code options]
  (hooks/use-effect!
   (fn []
     (load-code-editor!)
     nil)
   [])
  (let [[loaded?'] (hooks/use-atom loaded?)
        code    (or code "")
        code    (string/replace-first code #"\n$" "")]      ;; See-also: #3410
    (editor-aux config id attr code options loaded?')))
