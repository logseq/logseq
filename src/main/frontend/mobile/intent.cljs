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
            [clojure.pprint :as pprint]
            [clojure.set :as set]))

(defn- handle-received-text [result]
  (let [{:keys [title url]} result
        page (or (state/get-current-page)
                 (string/lower-case (date/journal-name)))
        format (db/get-page-format page)
        time (date/get-current-time)
        url (if (and (mldoc/link? format title) (not url))
              title
              url)
        text (if (= url title) nil title)
        [text url] (if (or (mldoc/link? format url) (not url))
                     [text url]
                     (string/split url "\"\n"))
        text (some-> text (string/replace #"^\"" ""))
        url (and url
                 (cond (or (string/includes? url "youtube.com")
                           (string/includes? url "youtu.be"))
                       (util/format "{{youtube %s}}" url)

                       (and (string/includes? url "twitter.com")
                            (string/includes? url "status"))
                       (util/format "{{twitter %s}}" url)

                       :else
                       (if text
                         (config/link-format format text url)
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

(defn- embed-asset-file [url format]
  (p/let [basename (path/basename url)
          label (-> basename util/node-path.name)
          time (date/get-current-time)
          path (editor-handler/get-asset-path basename)
          _file (p/catch
                    (.copy Filesystem (clj->js {:from url :to path}))
                    (fn [error]
                      (log/error :copy-file-error {:error error})))
          url (util/format "../assets/%s" basename)
          url (editor-handler/get-asset-file-link format url label true)
          template (get-in (state/get-config)
                           [:quick-capture-template :media]
                           "**{time}** [[quick capture]]: {url}")]
    (-> (string/replace template "{time}" time)
        (string/replace "{url}" (or url "")))))

(defn- embed-text-file [url title]
  (p/let [time (date/get-current-time)
          title (some-> (or title (path/basename url))
                        js/decodeURIComponent
                        util/node-path.name)
          path (path/join (config/get-repo-dir (state/get-current-repo))
                          (config/get-pages-directory)
                          (path/basename url))
          _ (p/catch
                (.copy Filesystem (clj->js {:from url :to path}))
                (fn [error]
                  (log/error :copy-file-error {:error error})))
          url (util/format "[[%s]]" title)
          template (get-in (state/get-config)
                           [:quick-capture-template :text]
                           "**{time}** [[quick capture]]: {url}")]
    (-> (string/replace template "{time}" time)
        (string/replace "{url}" (or url "")))))

(defn- handle-received-media [result]
  (p/let [{:keys [url]} result
          page (or (state/get-current-page) (string/lower-case (date/journal-name)))
          format (db/get-page-format page)
          content (embed-asset-file url format)]
    (if (state/get-edit-block)
      (state/append-current-edit-content! content)
      (editor-handler/api-insert-new-block! content {:page page}))))

(defn- handle-received-application [result]
  (p/let [{:keys [title url type]} result
          page (or (state/get-current-page) (string/lower-case (date/journal-name)))
          format (db/get-page-format page)
          application-type (last (string/split type "/"))
          content (cond
                    (config/mldoc-support? application-type)
                    (embed-text-file url title)

                    (contains? (set/union #{:pdf} config/media-formats) (keyword application-type))
                    (embed-asset-file url format)

                    :else
                    (notification/show!
                     [:div
                      (str "Import " application-type " file has not been supported. You can report it on ")
                      [:a {:href "https://github.com/logseq/logseq/issues"
                           :target "_blank"} "Github"]
                      ". We will look into it soon."]
                     :warning false))]
    (if (state/get-edit-block)
      (state/append-current-edit-content! content)
      (editor-handler/api-insert-new-block! content {:page page}))))

(defn decode-received-result [m]
  (into {} (for [[k v] m]
             [k (cond (vector? v)
                      (vec (map decode-received-result v))

                      (string/blank? v)
                      nil

                      :else
                      (if (mobile-util/native-ios?)
                        (js/decodeURIComponent v)
                        v))])))

(defn handle-received []
  (p/let [received (p/catch
                    (.checkSendIntentReceived SendIntent)
                    (fn [error]
                      (log/error :intent-received-error {:error error})))]
    (when received
      (let [result (-> (js->clj received :keywordize-keys true)
                       decode-received-result)]
        (when-let [type (:type result)]
          (cond
            (string/starts-with? type "text/")
            (handle-received-text result)

            (or (string/starts-with? type "image/")
                (string/starts-with? type "video/")
                (string/starts-with? type "audio/"))
            (handle-received-media result)

            (string/starts-with? type "application/")
            (handle-received-application result)

            :else
            (notification/show!
             [:div
              "Parsing current shared content are not supported. Please report the following codes on "
              [:a {:href "https://github.com/logseq/logseq/issues"
                   :target "_blank"} "Github"]
              ". We will look into it soon."
              [:pre.code (with-out-str (pprint/pprint result))]] :warning false)))))))
