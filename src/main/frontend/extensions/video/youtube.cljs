(ns frontend.extensions.video.youtube
  (:require [rum.core :as rum]
            [cljs.core.async :refer [<! >! chan go go-loop] :as a]
            [frontend.components.svg :as svg]
            [frontend.state :as state]
            [frontend.util :as util]
            [goog.object :as gobj]
            [clojure.string :as str]))

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
  (let [id (first (:rum/args state))
        player (js/window.YT.Player.
                (rum/dom-node state)
                (clj->js
                 {:events
                  {"onReady" (fn [e] (js/console.log id " ready"))}}))]
    (state/update-state! [:youtube/players]
                         (fn [players]
                           (assoc players id player)))))

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
        minutes (Math/floor (/ seconds 60))
        remaining-seconds (- seconds (* 60 minutes))
        remaining-seconds (if (zero? remaining-seconds) "00" remaining-seconds)]
    (str minutes ":" remaining-seconds)))

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
  (when-let [player (get-player (state/get-input))]
    (util/format "{{youtube-timestamp %s}}" (Math/floor (.getCurrentTime ^js player)))))
