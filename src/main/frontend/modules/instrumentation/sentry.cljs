(ns frontend.modules.instrumentation.sentry
  (:require ["@sentry/react" :as Sentry]
            [frontend.config :as config]
            [frontend.mobile.util :as mobile-util]
            [frontend.util :as util]
            [frontend.version :refer [version]]))

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
                  (cond->
                   {:platform (cond
                                (util/electron?) "electron"
                                (mobile-util/native-platform?) "mobile"
                                :else "web")
                    :publishing config/publishing?}
                    (not-empty config/revision)
                    (assoc :revision config/revision))}
   ;; :integrations [(new posthog/SentryIntegration posthog "logseq" 5311485)
   ;;                (new BrowserTracing)]
   :ignoreErrors ["ResizeObserver loop limit exceeded"
                  "ResizeObserver loop completed with undelivered notifications"]
   :debug config/dev?
   :tracesSampleRate 1.0
   :beforeSend (fn [^js event]
                 (try
                   (when-let [[_ _ query-and-fragment]
                              (re-matches #"file://.*?/(app/index|static/index)\.html(.*)" (.. event -request -url))]
                     (set! (.. event -request -url) (str "http://localhost/index.html" query-and-fragment)))

                   ;; (let [*filtered (volatile! [])
                   ;;       ^js values (.. event -exception -values)]
                   ;;   (doseq [value (medley/indexed values)]
                   ;;     ;; (let [mf (some-> value (.. -mechanism -data -function))]
                   ;;     ;;   (when (contains? #{"setInterval"} mf)
                   ;;     ;;     (vswap! *filtered conj idx)))

                   ;;     (doseq [frame (.. value -stacktrace -frames)]
                   ;;       (when (not-empty (.. frame -filename))
                   ;;         (when-let [[_ filename]
                   ;;                    (re-matches #"file://.*?/app/(js/.*\.js)" (.. frame -filename))]
                   ;;           (set! (.. frame -filename) (str "/static/" filename))
                   ;;             ;; NOTE: No idea of why there's a 2-line offset.
                   ;;           (set! (.. frame -lineno) (- (.. frame -lineno) 2))))))

                   ;;   ;; remove filtered events
                   ;;   (when-let [filtered (seq @*filtered)]
                   ;;     (doseq [k filtered]
                   ;;       (js-delete values k))))
                   (catch :default e
                     (js/console.error e)))
                 event)})

(defn init []
  ;; Analytics disabled - Sentry initialization is a no-op
  nil)

(defn set-user!
  [id]
  ;; Analytics disabled - Sentry user setting is a no-op
  nil)
