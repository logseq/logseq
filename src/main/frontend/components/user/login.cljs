(ns frontend.components.user.login
  (:require [io.factorhouse.hsx.core :as hsx]
            [logseq.shui.hooks :as hooks]
            [promesa.core :as p]
            [shadow.loader :as loader]))

(defonce ^:private implementation (atom nil))
(defonce ^:private load-promise (atom nil))

(defn register! [api]
  (reset! implementation api))

(defn- load! []
  (or @load-promise
      (let [result (p/let [_ (p/create
                                (fn [resolve reject]
                                  (let [deferred (loader/load :authentication #(resolve nil))]
                                    (.addErrback deferred reject))))]
                     (or @implementation
                         (throw (js/Error. "Authentication module did not register"))))]
        (reset! load-promise result)
        result)))

(defn sign-out! []
  (p/let [api (load!)] ((:sign-out! api))))

(defn open-login-modal! []
  (p/let [api (load!)] ((:open-modal! api))))

(hsx/defc page-impl []
  (let [[api] (hooks/use-atom implementation)
        [error set-error!] (hooks/use-state nil)]
    (hooks/use-effect!
     (fn [] (-> (load!) (p/catch set-error!)) nil)
     [])
    (when error (throw error))
    (when api [(:page-impl api)])))

(hsx/defc page []
  [:div.pt-10 (page-impl)])
