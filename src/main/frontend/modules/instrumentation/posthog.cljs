(ns frontend.modules.instrumentation.posthog
  (:require ["posthog-js" :as posthog]
            [cljs-bean.core :as bean]
            [frontend.config :as config]
            [frontend.mobile.util :as mobile-util]
            [frontend.util :as util]
            [frontend.version :refer [version]]))

(goog-define POSTHOG-TOKEN "")
(def ^:const masked "masked")

(defn register []
  (posthog/register
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
   :disable_session_recording true
   :mask_all_text true
   :mask_all_element_attributes true
   :loaded (fn [_] (register))})

(defn init []
  ;; Analytics disabled - PostHog initialization is a no-op
  nil)

(defn opt-out [opt-out?]
  ;; Analytics disabled - PostHog opt-out is a no-op
  nil)

(defn capture [id data]
  ;; Analytics disabled - PostHog capture is a no-op
  nil)

(comment
  (posthog/debug))
