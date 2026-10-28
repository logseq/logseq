(ns frontend.components.lazy-settings
  (:require [io.factorhouse.hsx.core :as hsx]
            [logseq.shui.hooks :as hooks]
            [frontend.state :as state]
            [promesa.core :as p]
            [shadow.loader :as loader]))

(defonce ^:private implementation (atom nil))
(defonce ^:private loading (atom nil))

(defn register! [api]
  (reset! implementation api))

(defn- load! []
  (or @loading
      (let [result (p/let [_ (p/create
                              (fn [resolve reject]
                                (let [deferred (loader/load :settings #(resolve nil))]
                                  (.addErrback deferred reject))))]
                     (or @implementation
                         (throw (js/Error. "Settings module did not register"))))]
        (reset! loading result)
        result)))

(hsx/defc settings-component [kind arguments]
  (let [[api] (hooks/use-atom implementation)
        [error set-error!] (hooks/use-state nil)]
    (hooks/use-effect! (fn [] (-> (load!) (p/catch set-error!)) nil) [])
    (when error (throw error))
    (when-let [component (get api kind)]
      (into [component] arguments))))

(hsx/defc settings [& arguments]
  (hooks/use-effect! (fn [] #(state/close-settings!)) [])
  (settings-component :settings arguments))
(hsx/defc appearance []
  (settings-component :appearance []))
(hsx/defc settings-collaboration []
  (settings-component :collaboration []))
(hsx/defc sync-server-url-settings-container []
  (settings-component :sync-server []))
(hsx/defc publish-server-url-settings-container []
  (settings-component :publish-server []))
