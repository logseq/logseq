(ns frontend.modules.instrumentation.posthog
  (:require ["posthog-js" :default posthog]
            [cljs-bean.core :as bean]
            [frontend.config :as config]
            [frontend.mobile.util :as mobile-util]
            [frontend.util :as util]
            [frontend.version :refer [version]]))

(goog-define POSTHOG-TOKEN "")
(def ^:const masked "masked")

(defn register []
  (.register posthog
   (clj->js
    {:app_type (let [platform (mobile-util/platform)]
                 (cond
                   (util/electron?)
                   "electron"

                   platform
                   platform

                   :else
                   "web"))
     :app_env (if config/dev? "development" "production")
     :app_ver version
     :schema_ver 0
     ;; hack, did not find ways to hack data on-the-fly with posthog-js
     :$current_url masked
     :$pathname masked})))

(def config
  {:api_host "https://app.posthog.com"
   :persistence "localStorage"
   :autocapture false
   :advanced_disable_feature_flags true
   :disable_session_recording true
   :disable_surveys true
   :mask_all_text true
   :mask_all_element_attributes true
   :loaded (fn [_] (register))})

(defn init []
  (when (and (not config/dev?) (not-empty POSTHOG-TOKEN))
    (.init posthog POSTHOG-TOKEN (clj->js config))))

(defn opt-out [opt-out?]
  (if opt-out?
    (.opt_out_capturing posthog)
    (do
      (init)
      (.opt_in_capturing posthog))))

(defn capture [id data]
  (try
    (.capture posthog (str id) (bean/->js data))
    (catch :default e
      (js/console.error e)
      ;; opt out or network issues
      nil)))

(comment
  (.debug posthog))
