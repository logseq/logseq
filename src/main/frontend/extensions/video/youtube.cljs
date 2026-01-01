(ns frontend.extensions.video.youtube
  (:require [cljs.core.async :refer [<! chan go] :as a]
            [clojure.string :as string]
            [frontend.components.svg :as svg]
            [frontend.handler.notification :as notification]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.util :as util]
            [goog.object :as gobj]
            [rum.core :as rum]))

(defn- load-yt-script []
  (js/console.log "load yt script")
  (let [tag              (js/document.createElement "script")
        first-script-tag (first (js/document.getElementsByTagName "script"))
        parent-node      (.-parentNode first-script-tag)]
    (set! (.-src tag) "https://www.youtube.com/iframe_api")
    (.insertBefore parent-node tag first-script-tag)))

(defn load-youtube-api []
  (let [c (chan)]
    (if js/window.YT
      (a/close! c)
      (do
        (set! js/window.onYouTubeIframeAPIReady #(a/close! c))
        (load-yt-script)))
    c))

(defn- use-youtube-wrapper? []
  (mobile-util/native-platform?))

(defn register-player [state]
  (try
    (let [id   (first (:rum/args state))
          node (rum/dom-node state)]
      (when node
        (let [*player (atom nil)
              player (js/window.YT.Player.
                      node
                      (clj->js
                       {:events
                        {"onReady"
                         (fn [_e]
                           (state/update-state! [:youtube/players]
                                                (fn [players]
                                                  (assoc players id @*player)))
                           (js/console.log id " ready"))}}))]
          (reset! *player player)
          player)))
    (catch :default _e
      nil)))

(rum/defcs youtube-video <
  rum/reactive
  (rum/local nil ::player)
  {:did-mount
   (fn [state]
     (when-not (use-youtube-wrapper?)
       (go
         (<! (load-youtube-api))
         (register-player state)))
     state)}
  [state id {:keys [width height start] :as _opts}]
  (let [width  (or width (min (- (util/get-width) 96)
                              560))
        height (or height (int (* width (/ 315 560))))
        origin (.. js/window -location -origin)
        origin-valid? (and (string? origin)
                           (re-matches #"^https?://.+" origin))
        base-url (str "https://www.youtube-nocookie.com/embed/"
                      (js/encodeURIComponent id)
                      "?enablejsapi=1"
                      (when origin-valid?
                        (str "&origin=" (js/encodeURIComponent origin))))
        direct-url (if start
                     (str base-url "&start=" start)
                     base-url)
        wrapper-url (str "https://logseq.com/youtube.html?v=" id "&enablejsapi=1")
        wrapper-url (if start
                      (str wrapper-url "&start=" start)
                      wrapper-url)
        url (if (use-youtube-wrapper?) wrapper-url direct-url)]
    [:iframe.aspect-video
     {:id                (str "youtube-player-" id)
      :allow-full-screen "allowfullscreen"
      :allow             "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      :referrer-policy   "strict-origin-when-cross-origin"
      :referer           "https://logseq.com"
      :frame-border      "0"
      :src               url
      :height            height
      :width             width}]))

(defn seconds->display [seconds]
  (let [seconds (int seconds)
        hours   (quot seconds 3600)
        minutes (mod (quot seconds 60) 60)
        seconds (mod seconds 60)]
    (->> [hours minutes seconds]
         (map (fn [v] (if (< v 10) (str "0" v) (str v))))
         (keep-indexed (fn [idx v]
                         (when (or (> idx 0)
                                   (not= v "00"))
                           v)))
         (string/join ":"))))

(defn dom-after-video-node? [video-node target]
  (not (zero?
        (bit-and
         (.compareDocumentPosition video-node target)
         js/Node.DOCUMENT_POSITION_FOLLOWING))))

(defn get-player [target]
  (when-not (use-youtube-wrapper?)
    (when-let [iframe (->> (js/document.getElementsByTagName "iframe")
                           (filter
                            (fn [node]
                              (let [src (gobj/get node "src" "")]
                                (or
                                 (string/includes? src "youtube-nocookie.com/embed")
                                 (string/includes? src "youtube.com/embed")
                                 (string/includes? src "youtube.com")))))
                           (filter #(dom-after-video-node? % target))
                           last)]
      (let [id (gobj/get iframe "id" "")
            id (string/replace-first id #"youtube-player-" "")]
        (get (get @state/state :youtube/players) id)))))

(defn- notify-timestamp-unavailable! []
  (notification/show!
   "YouTube timestamps aren't available on mobile yet."
   :warning
   false))

(defn- player-method [player method]
  (let [f (gobj/get player method)]
    (when (fn? f) f)))

(rum/defc timestamp
  [seconds]
  [:a.svg-small.youtube-timestamp
   {:on-click (fn [e]
                (util/stop e)
                (if (use-youtube-wrapper?)
                  (notify-timestamp-unavailable!)
                  (when-let [player (get-player (.-target e))]
                    (if-let [seek-to (player-method player "seekTo")]
                      (.call seek-to player seconds true)
                      (notification/show!
                       "YouTube player isn't ready yet."
                       :warning
                       false)))))}
   svg/clock
   (seconds->display seconds)])

(defn gen-youtube-ts-macro []
  (if (use-youtube-wrapper?)
    (do
      (notify-timestamp-unavailable!)
      nil)
    (if-let [player (get-player (state/get-input))]
      (if-let [get-current-time (player-method player "getCurrentTime")]
        (util/format "{{youtube-timestamp %s}}"
                     (Math/floor (.call get-current-time player)))
        (do
          (notification/show!
           "YouTube player isn't ready yet."
           :warning
           false)
          nil))
      (when (mobile-util/native-platform?)
        (notification/show!
         "Please embed a YouTube video at first, then use this icon.
Remember: You can paste a raw YouTube url as embedded video on mobile."
         :warning
         false)
        nil))))

(defn parse-timestamp [timestamp']
  (let [reg #"^(?:(\d+):)?([0-5]?\d):([0-5]?\d)$"
        reg-number #"^\d+$"
        timestamp'' (str timestamp')
        total-seconds (some-> (re-matches reg-number timestamp'')
                              util/safe-parse-int)
        [_ hours minutes seconds] (re-matches reg timestamp'')
        [hours minutes seconds] (map #(if (nil? %) 0 (util/safe-parse-int %)) [hours minutes seconds])]
    (cond
      total-seconds
      total-seconds

      (and minutes seconds)
      (+ (* 3600 hours) (* 60 minutes) seconds)

      :else
      nil)))

(comment
  ;; hh:mm:ss
  (re-matches #"^(?:(\d+):)?([0-5]?\d):([0-5]?\d)$" "123:22:23") ;; => ["123:22:23" "123" "22" "23"]
  (re-matches #"^(?:(\d+):)?([0-5]?\d):([0-5]?\d)$" "30:23") ;; => ["30:23" nil "30" "23"]

  (parse-timestamp "01:23")                                  ;; => 83

  (parse-timestamp "01:01:23")                               ;; => 3683

 ;; seconds->display
 ;; https://stackoverflow.com/questions/1322732/convert-seconds-to-hh-mm-ss-with-javascript
  (seconds->display 129600)                                  ;; => "36:00:00"
  (seconds->display 13545)                                   ;; => "03:45:45"
  (seconds->display 18)                                      ;; => "00:18"
  )
