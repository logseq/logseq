(ns frontend.extensions.video.youtube
  (:require [rum.core :as rum]
            [cljs.core.async :refer [<! chan go] :as a]
            [frontend.components.svg :as svg]
            [frontend.state :as state]
            [frontend.util :as util]
            [goog.object :as gobj]
            [clojure.string :as str]
            [frontend.mobile.util :as mobile-util]
            [frontend.handler.notification :as notification]))

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

(defn register-player [state]
  (try
    (let [id (first (:rum/args state))
         node (rum/dom-node state)]
     (when node
       (let [player (js/window.YT.Player.
                     node
                     (clj->js
                      {:events
                       {"onReady" (fn [_e] (js/console.log id " ready"))}}))]
         (state/update-state! [:youtube/players]
                              (fn [players]
                                (assoc players id player))))))
    (catch :default _e
      nil)))

(rum/defcs youtube-video <
  rum/reactive
  (rum/local nil ::player)
  {:did-mount
   (fn [state]
     (go
       (<! (load-youtube-api))
       (register-player state))
     state)}
  [state id]
  (let [width  (min (- (util/get-width) 96)
                    560)
        height (int (* width (/ 315 560)))]
    [:iframe
     {:id                (str "youtube-player-" id)
      :allow-full-screen "allowfullscreen"
      :allow "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
      :frame-border      "0"
      :src               (str "https://www.youtube.com/embed/" id "?enablejsapi=1")
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
         (str/join ":"))))

(defn dom-after-video-node? [video-node target]
  (not (zero?
        (bit-and
         (.compareDocumentPosition video-node target)
         js/Node.DOCUMENT_POSITION_FOLLOWING))))

(defn get-player [target]
  (when-let [iframe (->> (js/document.getElementsByTagName "iframe")
                         (filter
                          (fn [node]
                            (let [src (gobj/get node "src" "")]
                              (str/includes? src "youtube.com"))))
                         (filter #(dom-after-video-node? % target))
                         last)]
    (let [id (gobj/get iframe "id" "")
          id (str/replace-first id #"youtube-player-" "")]
      (get (get @state/state :youtube/players) id))))


(rum/defc timestamp
  [seconds]
  [:a.svg-small.youtube-timestamp
   {:on-click (fn [e]
                (util/stop e)
                (when-let [player (get-player (.-target e))]
                  (.seekTo ^js player seconds true)))}
   svg/clock
   (seconds->display seconds)])

(defn gen-youtube-ts-macro []
  (if-let [player (get-player (state/get-input))]
    (util/format "{{youtube-timestamp %s}}" (Math/floor (.getCurrentTime ^js player)))
    (when (mobile-util/native-platform?)
      (notification/show!
       "Please embed a YouTube video at first, then use this icon.
Remember: You can paste a raw YouTube url as embedded video on mobile."
       :warning
       false)
      nil)))


(defn parse-timestamp [timestamp]
  (let [reg #"^(?:(\d+):)?([0-5]?\d):([0-5]?\d)$"
        reg-number #"^\d+$"
        timestamp (str timestamp)
        total-seconds (some-> (re-matches reg-number timestamp)
                              util/safe-parse-int)
        [_ hours minutes seconds] (re-matches reg timestamp)
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

  (parse-timestamp "01:23") ;; => 83

  (parse-timestamp "01:01:23") ;; => 3683

  ;; seconds->display
  ;; https://stackoverflow.com/questions/1322732/convert-seconds-to-hh-mm-ss-with-javascript
  (seconds->display 129600) ;; => "36:00:00"
  (seconds->display 13545) ;; => "03:45:45"
  (seconds->display 18) ;; => "00:18"
  )
