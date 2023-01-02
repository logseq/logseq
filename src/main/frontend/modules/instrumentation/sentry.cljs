(ns frontend.modules.instrumentation.sentry
  (:require [frontend.version :refer [version]]
            [frontend.util :as util]
            [frontend.config :as config]
            ["@sentry/react" :as Sentry]
            [frontend.mobile.util :as mobile-util]))

(goog-define SENTRY-DSN "")

(def config
  {:dsn SENTRY-DSN
   :release (util/format "logseq%s@%s" (cond
                                         (mobile-util/native-android?) "-android"
                                         (mobile-util/native-ios?) "-ios"
                                         :else "")
                         version)
   :environment (if config/dev? "development" "production")
   :initialScope {:tags
                  (merge
                   (when (not-empty config/revison)
                     {:revision config/revison})
                   {:platform (cond
                                (util/electron?) "electron"
                                (mobile-util/native-platform?) "mobile"
                                :else "web")
                    :publishing config/publishing?})}
   ;; :integrations [(new posthog/SentryIntegration posthog "logseq" 5311485)
   ;;                (new BrowserTracing)]
   :debug config/dev?
   :tracesSampleRate 1.0
   :beforeSend (fn [^js event]
                 (try
                   (when-let [[_ _ query-and-fragment]
                              (re-matches #"file://.*?/(app/electron|static/index)\.html(.*)" (.. event -request -url))]
                     (set! (.. event -request -url) (str "http://localhost/electron.html" query-and-fragment)))
                   (doseq [value (.. event -exception -values)]
                     (doseq [frame (.. value -stacktrace -frames)]
                       (when (not-empty (.. frame -filename))
                         (when-let [[_ filename]
                                    (re-matches #"file://.*?/app/(js/.*\.js)" (.. frame -filename))]
                           (set! (.. frame -filename) (str "/static/" filename))
                           ;; NOTE: No idea of why there's a 2-line offset.
                           (set! (.. frame -lineno) (- (.. frame -lineno) 2))))))
                   (catch :default e
                     (js/console.error e)))
                 event)})

(defn init []
  (when (and (not config/dev?) (not-empty SENTRY-DSN))
    (let [config (clj->js config)]
      (Sentry/init config))))

(defn set-user!
  [id]
  (Sentry/configureScope (fn [scope]
                           (.setUser scope #js {:id id}))))
