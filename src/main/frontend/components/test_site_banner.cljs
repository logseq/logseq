(ns frontend.components.test-site-banner
  "Banner shown only on the test.logseq.com web deployment."
  (:require [clojure.string :as string]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.mobile.util :as mobile-util]
            [frontend.spec.storage :as storage-spec]
            [frontend.storage :as storage]
            [frontend.util :as util]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [io.factorhouse.hsx.core :as hsx]))

(def test-web-hostname "test.logseq.com")

(def stable-web-app-url "https://app.logseq.com")

(def dismiss-storage-key ::storage-spec/test-site-banner-dismissed)

(defn test-web-host?
  "True when `hostname` is the test/nightly web deployment."
  [hostname]
  (boolean
   (and (string? hostname)
        (= test-web-hostname (string/lower-case hostname)))))

(defn show-test-site-banner?
  "Whether the test-site banner should render.
   Electron, native mobile, publishing, other hosts, and a persisted dismissal
   never show it."
  [{:keys [hostname dismissed? electron? native-platform? publishing?]}]
  (boolean
   (and (not dismissed?)
        (not electron?)
        (not native-platform?)
        (not publishing?)
        (test-web-host? hostname))))

(defn- current-hostname
  []
  (when (and (not util/node-test?)
             (exists? js/location))
    (.-hostname js/location)))

(defn- banner-dismissed?
  []
  (true? (storage/get dismiss-storage-key)))

(defn- dismiss!
  []
  (storage/set dismiss-storage-key true))

(defn- banner-runtime
  []
  {:hostname (current-hostname)
   :dismissed? (banner-dismissed?)
   :electron? (boolean (util/electron?))
   :native-platform? (boolean (and (not util/node-test?)
                                   (mobile-util/native-platform?)))
   :publishing? (boolean config/publishing?)})

(hsx/defc banner
  []
  (let [[dismissed? set-dismissed!] (hooks/use-state (banner-dismissed?))
        visible? (show-test-site-banner?
                  (assoc (banner-runtime) :dismissed? dismissed?))]
    (when visible?
      (shui/alert
       {:role "status"
        :class "test-site-banner"}
       (shui/tabler-icon "alert-triangle" {:size 18})
       [:div.test-site-banner__content
        (shui/alert-description
         (t :web.test-site/warning))
        [:div.test-site-banner__actions
         [:a.test-site-banner__open
          {:href stable-web-app-url}
          (t :web.test-site/open-app)]
         (shui/button
          {:variant :ghost
           :size :sm
           :class "test-site-banner__dismiss"
           :on-click (fn []
                       (dismiss!)
                       (set-dismissed! true))}
          (t :web.test-site/help-test))]]))))
