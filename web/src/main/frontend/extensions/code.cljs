(ns frontend.extensions.code
  (:require [rum.core :as rum]
            [frontend.loader :as loader]
            [frontend.config :as config]
            [frontend.util :as util]
            [frontend.mixins :as mixins]
            [goog.dom :as gdom]
            [goog.object :as gobj]))

;; codemirror

;; TODO: extracted to a rum mixin
(defn loaded? []
  js/window.CodeMirror)

(defonce *loading? (atom true))

(defn highlight!
  [state]
  (let [[id attr] (:rum/args state)]
    (when (:data-lang attr)
      (when-let [element (js/document.getElementById id)]
        (js/hljs.highlightBlock element)))))

(rum/defcs highlight < rum/reactive
  {:did-mount (fn [state]
                (highlight! state)
                state)}
  [state id attr code]
  [:pre.code.pre-wrap-white-space
   [:code (assoc attr :id id)
    code]])

(defn render!
  [state]
  (let [[config id attr] (:rum/args state)
        mode (get attr :data-lang "javascript")
        textarea (gdom/getElement id)
        editor (js/CodeMirror.fromTextArea textarea
                                           #js {:mode mode
                                                :lineNumbers true})
        element (.getWrapperElement editor)]
    (.on editor "blur" (fn []
                         (.save editor)
                         (prn (gobj/get textarea "value"))
                         ;; save block
                         ))
    (.addEventListener element "click"
                       (fn [e]
                         (util/stop e)))
    (.save editor)))

(defn- load-and-render!
  [state]
  (if (loaded?)
    (do
      (reset! *loading? false)
      (render! state))
    (do
      (reset! *loading? true)
      (loader/load
       (config/asset-uri "/static/js/codemirror.min.js")
       (fn []
         (reset! *loading? false)
         (render! state)))))
  state)

(rum/defcs editor < rum/reactive
  {:did-mount load-and-render!
   :did-update load-and-render!}
  [state config id attr code]
  [:textarea (merge {:id id
                     :on-mouse-down (fn [e]
                                      (prn "mouse down")
                                      (util/stop e))
                     :on-click (fn [e]
                                 (prn "on click")
                                 (util/stop e))
                     :default-value code} attr)])

(defn html-export
  [attr code]
  [:pre.pre-wrap-white-space
   [:code attr
    code]])
