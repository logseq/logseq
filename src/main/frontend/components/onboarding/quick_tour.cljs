(ns frontend.components.onboarding.quick-tour
  (:require [promesa.core :as p]
            [cljs-bean.core :as bean]
            [frontend.loader :refer [load]]
            [frontend.state :as state]
            [hiccups.runtime :as h]
            [dommy.core :as d]))

(defn js-load$
  [url]
  (p/create
    (fn [resolve]
      (load url resolve))))

(def JS_ROOT
  (if (= js/location.protocol "file:")
    "./js"
    "./static/js"))

(defn- load-base-assets$
  []
  (js-load$ (str JS_ROOT "/shepherd.min.js")))

(defn- open-left-sidebar! []
  (state/set-state! :ui/left-sidebar-open? true))

(defn- wait-target
  [fn-or-selector]
  (p/let [action (if (string? fn-or-selector)
                   #(d/sel1 fn-or-selector)
                   fn-or-selector)
          _      (action)
          _      (p/delay 200)]))

(defn- create-steps! [^js jsTour]
  [{:id       "nav-favorites"
    :text     (h/render-html [:strong "abc"])
    :attachTo {:element ".nav-content-item.favorites" :on "right"}
    :buttons  [{:text "Back" :action (.-next jsTour)}
               {:text "Next" :action (.-next jsTour)}]}

   {:id                "nav-help"
    :text              "help Text"
    :attachTo          {:element ".cp__sidebar-help-btn" :on "left"}
    :beforeShowPromise #(p/create (fn [resolve _reject] (resolve)))
    :buttons           [{:text "Next" :action (.-next jsTour)}]}])

(defn start
  []
  (prn "[debug quick tour]")
  (let [^js jsTour (js/Shepherd.Tour.
                     (bean/->js
                       {:useModalOverlay    true
                        :defaultStepOptions {:classes  "cp__onboarding-quick-tour"
                                             :scrollTo true}}))
        steps      (create-steps! jsTour)]

    (doseq [step steps]
      (.addStep jsTour (bean/->js step)))

    (.start jsTour)))

(def should-guide? true)

(defn init []
  (prn "[debug] hello onboarding quick tour :)")

  (when should-guide?
    (p/then (load-base-assets$) start)))