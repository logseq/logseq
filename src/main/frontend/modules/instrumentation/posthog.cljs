(ns frontend.modules.instrumentation.posthog
  (:require [frontend.config :as cfg]
            [frontend.util :as util]
            [frontend.version :refer [version]]
            ["posthog-js" :as posthog]))

(def ^:const token "qUumrWobEk2dKiKt1b32CMEZy8fgNS94rb_Bq4WutPA")
(def ^:const masked "masked")

(defn register []
  (posthog/register
   (clj->js
    {:app_type (if (util/electron?) "electron" "web")
     :app_env (if cfg/dev? "development" "production")
     :app_ver version
     :schema_ver 0
     ;; hack, did not find ways to hack data on-the-fly with posthog-js
     :$ip masked
     :$current_url masked})))

(def config
  {:api_host "https://app.posthog.com"
   :persistence "localStorage"
   :mask_all_text true
   :mask_all_element_attributes true
   :loaded (fn [_] (register))})

(defn init []
  (posthog/init token (clj->js config))
  (when cfg/dev?
    (posthog/debug)))

(defn opt-out [opt-out?]
  (if opt-out?
    (posthog/opt_out_capturing)
    (do
      (init)
      (posthog/opt_in_capturing))))
