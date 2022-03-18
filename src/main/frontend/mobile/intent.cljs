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

(defn get-asset-path
  [filename]
  (p/let [[repo-dir assets-dir]
          (editor-handler/ensure-assets-dir! (state/get-current-repo))
          path (str repo-dir "/" assets-dir "/" filename)]
    (if (mobile-util/native-android?)
      path
      (js/encodeURI (js/decodeURI path)))))

;;;; iOS
;; 1. Gallery: {:type "image/jpg", :additionalItems [], :title "IMG_4638.jpg", :url "file:///private/var/mobile/Containers/Shared/AppGroup/B0AC24C1-FA18-4EBD-B3A3-86B8113169AF//IMG_4638.jpg", :description nil}
;; 2. Bilibili: {:title "screenshot", :description nil, :type "image/png", :additionalItems [{:description nil, :title "《mens FUDGE》欧洲日常穿搭 2022年3月号 男性休闲时尚杂志", :type "text/plain", :url nil} {:url "https://b23.tv/91NwwKb", :title "https://b23.tv/91NwwKb", :description nil, :type "text/plain"}], :url "file:///private/var/mobile/Containers/Shared/AppGroup/B0AC24C1-FA18-4EBD-B3A3-86B8113169AF//screenshot.png"}
;; 5. Screenshot: {:description nil, :additionalItems [], :url "file:///private/var/mobile/Containers/Shared/AppGroup/B0AC24C1-FA18-4EBD-B3A3-86B8113169AF//screenshot.png", :type "image/png", :title "screenshot"}
;; 6. AppStore: {:title "screenshot", :type "image/png", :url "file:///private/var/mobile/Containers/Shared/AppGroup/B0AC24C1-FA18-4EBD-B3A3-86B8113169AF//screenshot.png", :description nil, :additionalItems [{:description nil, :type "text/plain", :title "https://apps.apple.com/cn/app/%E6%8A%96%E9%9F%B3/id1142110895", :url "https://apps.apple.com/cn/app/%E6%8A%96%E9%9F%B3/id1142110895"}]}
(defn- handle-received-media [result]
  (p/let [{:keys [title url]} result
          page (or (state/get-current-page)
                   (string/lower-case (date/journal-name)))
          format (db/get-page-format page)
          time (date/get-current-time)
          label (-> (or title (path/basename url))
                    util/node-path.name)
          path (get-asset-path title)
          _ (prn :from url :to path)
          _ (p/catch
             (.copy Filesystem (clj->js {:from url :to path}))
             (fn [error]
               (log/error :copy-file-error {:error error})))
          url (util/format "../assets/%s" title)
          url (editor-handler/get-asset-file-link format url label true)
          template (get-in (state/get-config)
                           [:quick-capture-template :image]
                           "**{time}** [[quick capture]]: {url}")
          values (-> (string/replace template "{time}" time)
                     (string/replace "{url}" (or url "")))]
    (if (state/get-edit-block)
      (state/append-current-edit-content! values)
      (editor-handler/api-insert-new-block! values {:page page}))))

;; Files: {:title "2021_10_17.org", :url "file:///private/var/mobile/Containers/Shared/AppGroup/B0AC24C1-FA18-4EBD-B3A3-86B8113169AF//2021_10_17.org", :additionalItems [], :type "application/org", :description nil}
;; Obsidian: {:description nil, :type "application/md", :url "file:///private/var/mobile/Containers/Shared/AppGroup/B0AC24C1-FA18-4EBD-B3A3-86B8113169AF//Untitled%202.md", :additionalItems [], :title "Untitled 2.md"}
;; Bear: {:url "file:///private/var/mobile/Containers/Shared/AppGroup/B0AC24C1-FA18-4EBD-B3A3-86B8113169AF//%E5%93%88%E5%93%88%E5%93%88%F0%9F%98%86.txt", :additionalItems [], :type "application/txt", :title "哈哈哈😆.txt", :description nil}
(defn- handle-received-application [result]
  (let [{:keys [title url]} result
        page (or (state/get-current-page) (string/lower-case (date/journal-name)))
        time (date/get-current-time)
        title (some-> (or title (path/basename url))
                      js/decodeURIComponent
                      util/node-path.name)
        path (and url (path/join (config/get-repo-dir (state/get-current-repo))
                                 (config/get-pages-directory)
                                 (path/basename url)))
        _ (prn :path path :title title)
        _ (p/catch
              (.copy Filesystem (clj->js {:from url :to path}))
              (fn [error]
                (log/error :copy-file-error {:error error})))
        url (util/format "[[%s]]" title)
        template (get-in (state/get-config)
                         [:quick-capture-template :image]
                         "**{time}** [[quick capture]]: {url}")
        values (-> (string/replace template "{time}" time)
                   (string/replace "{url}" (or url "")))]
    (if (state/get-edit-block)
      (state/append-current-edit-content! values)
      (editor-handler/api-insert-new-block! values {:page page}))))

(defn decode-received-result [m]
  (into {} (for [[k v] m]
             [k (cond (vector? v)
                      (vec (map decode-received-result v))

                      (string/blank? v)
                      nil
                      
                      :else
                      (js/decodeURIComponent v))])))

(defn handle-received []
  (p/let [received (p/catch
                    (.checkSendIntentReceived SendIntent)
                    (fn [error]
                      (log/error :intent-received-error {:error error})))]
    (when received
      (let [result (-> (js->clj received :keywordize-keys true)
                       decode-received-result)
            _ (prn :result result)
            type (:type result)]
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
            [:pre.code (with-out-str (pprint/pprint result))]] :warning false))))))
