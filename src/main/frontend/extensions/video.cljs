(ns frontend.extensions.video
  (:require [clojure.string :as string]))

(def bilibili-regex #"^((?:https?:)?//)?((?:www).)?((?:bilibili.com))(/(?:video/)?)([\w-]+)(\?p=(\d+))?(\S+)?$")
(def loom-regex #"^((?:https?:)?//)?((?:www).)?((?:loom.com))(/(?:share/|embed/))([\w-]+)(\S+)?$")
(def vimeo-regex #"^((?:https?:)?//)?((?:www).)?((?:player.vimeo.com|vimeo.com))(/(?:video/)?)([\w-]+)(\S+)?$")
(def youtube-regex #"^((?:https?:)?//)?((?:www|m).)?((?:youtube.com|youtu.be|y2u.be|youtube-nocookie.com))(/(?:shorts/|[\w-]+\?v=|embed/|v/)?)([\w-]+)([\S^\?]+)?$")
(def default-aspect-ratio [16 9])
(def youtube-providers #{"youtube.com" "youtu.be" "y2u.be"})

(defn get-matched-video
  [url]
  (when (not-empty url)
    (or (re-find youtube-regex url)
        (re-find bilibili-regex url)
        (re-find vimeo-regex url)
        (re-find loom-regex url))))

(defn matched-video-provider
  [match]
  (let [domain (nth match 3 nil)]
    (cond
      (= "youtube-nocookie.com" domain)
      :youtube-nocookie

      (contains? youtube-providers domain)
      :youtube

      (= "bilibili.com" domain)
      :bilibili

      (and (string? domain) (string/ends-with? domain "vimeo.com"))
      :vimeo

      (= "loom.com" domain)
      :loom

      :else
      nil)))

(defn- matched-video-id
  [match]
  (nth match 5 nil))

(defn- matched-video-page
  [match]
  (nth match 7 nil))

(defn- video-start
  [input]
  (some-> (re-find #"[?&]t=(\d+)" input) second))

(defn- input-video
  [input provider-hint]
  (when (string? input)
    (if-let [match (get-matched-video input)]
      {:provider (matched-video-provider match)
       :id (matched-video-id match)
       :page (matched-video-page match)
       :start (video-start input)}
      (when (or (and (= provider-hint :youtube) (= 11 (count input)))
                (and (= provider-hint :bilibili) (<= (count input) 15))
                (and (= provider-hint :vimeo) (re-matches #"\d+" input)))
        {:provider provider-hint
         :id input}))))

(defn matched-video-embed
  ([input]
   (matched-video-embed input nil))
  ([input provider-hint]
   (let [{:keys [provider id page start]} (input-video input provider-hint)]
     (when (and provider
                (not (string/blank? id)))
       (case provider
         :youtube
         (cond-> {:render :youtube-player
                  :id id
                  :aspect-ratio default-aspect-ratio}
           start
           (assoc :start start))

         :youtube-nocookie
         {:render :iframe
          :src (str "https://www.youtube-nocookie.com/embed/" id
                    (when start (str "?t=" start)))
          :aspect-ratio default-aspect-ratio}

         :bilibili
         {:render :iframe
          :src (str "https://player.bilibili.com/player.html?bvid=" id "&high_quality=1&autoplay=0"
                    (when page (str "&p=" page))
                    (when start (str "&t=" start)))
          :aspect-ratio default-aspect-ratio}

         :vimeo
         {:render :iframe
          :src (str "https://player.vimeo.com/video/" id)
          :aspect-ratio default-aspect-ratio}

         :loom
         {:render :iframe
          :src (str "https://www.loom.com/embed/" id)
          :aspect-ratio default-aspect-ratio}

         nil)))))
