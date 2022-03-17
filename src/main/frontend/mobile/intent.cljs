(ns frontend.mobile.intent
  (:require ["@capacitor/filesystem" :refer [Filesystem]]
            ["send-intent" :refer [^js SendIntent]]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]
            [clojure.string :as string]
            [frontend.db :as db]
            [frontend.handler.editor :as editor-handler]
            [frontend.state :as state]
            [frontend.date :as date]
            [frontend.util :as util]
            [frontend.config :as config]
            [frontend.format.mldoc :as mldoc]
            ["path" :as path]
            [frontend.mobile.util :as mobile-util]
            [frontend.handler.notification :as notification]
            [clojure.pprint :as pprint]))

(defn- handle-received-text [result]
  (let [{:keys [title url]} result
        page (or (state/get-current-page)
                 (string/lower-case (date/journal-name)))
        format (db/get-page-format page)
        time (date/get-current-time)
        [text url] (and url (if-not (mldoc/link? format url)
                              (string/split url "\"\n")
                              [nil url]))
        text (some-> text (string/replace #"^\"" ""))
        url (and url
                 (cond (or (string/includes? url "youtube.com")
                           (string/includes? url "youtu.be"))
                       (util/format "{{youtube %s}}" url)

                       (and (string/includes? url "twitter.com")
                            (string/includes? url "status"))
                       (util/format "{{twitter %s}}" url)

                       :else
                       (if (not= title "")
                         (config/link-format format title url)
                         url)))
        template (get-in (state/get-config)
                         [:quick-capture-template :text]
                         "**{time}** [[quick capture]]: {text} {url}")
        values (-> (string/replace template "{time}" time)
                   (string/replace "{text}" (or text ""))
                   (string/replace "{url}" (or url "")))]
    (if (state/get-edit-block)
      (state/append-current-edit-content! values)
      (editor-handler/api-insert-new-block! values {:page page}))))

(defn get-asset-path
  [filename]
  (p/let [[repo-dir assets-dir]
          (editor-handler/ensure-assets-dir! (state/get-current-repo))
          path (str repo-dir "/" assets-dir "/" filename)]
    (if (mobile-util/native-android?)
      path
      (js/encodeURI path))))

(defn- handle-received-media [result]
  (p/let [{:keys [title url]} result
          page (or (state/get-current-page)
                   (string/lower-case (date/journal-name)))
          format (db/get-page-format page)
          time (date/get-current-time)
          title (or title (path/basename url))
          path (get-asset-path title)
          _ (p/catch
                (.copy Filesystem (clj->js {:from url :to path}))
                (fn [error]
                  (log/error :copy-file-error {:error error})))
          url (config/link-format format title (util/format "../assets/%s" title))
          template (get-in (state/get-config)
                           [:quick-capture-template :image]
                           "**{time}** [[quick capture]]: {url}")
          values (-> (string/replace template "{time}" time)
                     (string/replace "{url}" (or url "")))]
    (if (state/get-edit-block)
      (state/append-current-edit-content! values)
      (editor-handler/api-insert-new-block! values {:page page}))))

(defn handle-received []
  (p/let [received (p/catch
                       (.checkSendIntentReceived SendIntent)
                       (fn [error]
                         (log/error :intent-received-error {:error error})))]
    (when received
      (let [result (js->clj received :keywordize-keys true)
            type (:type result)]
        (cond
          (string/starts-with? type "text/")
          (handle-received-text result)

          (or (string/starts-with? type "image/")
              (string/starts-with? type "video/")
              (string/starts-with? type "audio/"))
          (handle-received-media result)

          :else
          (notification/show!
           [:div
            "Parsing current shared content are not supported. Please report the following codes on "
            [:a {:href "https://github.com/logseq/logseq/issues"
                 :target "_blank"} "Github"]
            ". We will look into it soon."
            [:pre.code (with-out-str (pprint/pprint result))]] :warning false))))))
