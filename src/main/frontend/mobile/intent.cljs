(ns frontend.mobile.intent
  (:require ["@capacitor/filesystem" :refer [Filesystem]]
            ["@capacitor/share" :refer [^js Share]]
            ["@capacitor/action-sheet" :refer [ActionSheet]]
            ["path" :as node-path]
            ["send-intent" :refer [^js SendIntent]]
            [clojure.pprint :as pprint]
            [clojure.set :as set]
            [clojure.string :as string]
            [frontend.config :as config]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.handler.assets :as assets-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.notification :as notification]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.fs :as fs-util]
            [goog.string :as gstring]
            [lambdaisland.glogi :as log]
            [logseq.graph-parser.config :as gp-config]
            [logseq.graph-parser.util :as gp-util]
            [logseq.graph-parser.util.page-ref :as page-ref]
            [promesa.core :as p]))

(defn open-or-share-file
  "Share file to mobile platform"
  [uri]
  (p/let [options [{:title "Open"
                    :style "DEFAULT"}
                   {:title "Share"}
                   {:title "Cancel"
                    :style "CANCEL"}]
          result (.showActions ActionSheet (clj->js {:title "File Options"
                                                     :message "Select an option to perform"
                                                     :options options}))
          index (.-index result)]

    (when (not= index 2)
      (if (and (= index 0) (mobile-util/native-android?))
        (.openFile mobile-util/folder-picker (clj->js {:uri uri}))
        (.share Share (clj->js {:url uri
                                :dialogTitle "Open file with your favorite app"
                                :title "Open file with your favorite app"}))))))

(defn- is-link
  [url]
  (when (not-empty url)
    (re-matches #"^[a-zA-Z0-9]+://.*$" url)))

(defn- extract-highlight
  "Extract highlighted text and url from mobile browser intent share.
   - url can be prefixed with the highlighted text.
   - url can be highlighted text only in some cases."
  [url]
  (let [[_ link] (re-find #"\s+([a-zA-Z0-9]+://[\S]*)$" url)
        highlight (when (not-empty link)
                    (let [quoted (string/replace url link "")
                          quoted (gstring/trimRight quoted)]
                      (gstring/stripQuotes quoted "\"")))]
    (cond
      (not-empty highlight)
      [highlight link]

      (is-link url)
      [nil url]

      :else
      [url nil])))

(defn- transform-args
  [args]
  (let [{:keys [url]} args]
    (if (is-link url)
      args
      (let [[highlight url'] (extract-highlight url)]
        (assoc args :url url' :content highlight)))))

(defn- handle-received-text [args]
  ;; Keys: :title :type :url
  ;; :content is added if there's highlighted text
  (let [args (transform-args args)]
    (state/pub-event! [:editor/quick-capture args])))


(defn- embed-asset-file [url format]
  (p/let [basename (node-path/basename url)
          label (-> basename util/node-path.name)
          time (date/get-current-time)
          date-ref-name (date/today)
          path (editor-handler/get-asset-path basename)
          _file (p/catch
                 (.copy Filesystem (clj->js {:from url :to path}))
                 (fn [error]
                   (log/error :copy-file-error {:error error})))
          url (util/format "../assets/%s" basename)
          url (assets-handler/get-asset-file-link format url label true)
          template (get-in (state/get-config)
                           [:quick-capture-templates :media]
                           "**{time}** [[quick capture]]: {url}")]
    (-> template
        (string/replace "{time}" time)
        (string/replace "{date}" date-ref-name)
        (string/replace "{text}" "")
        (string/replace "{url}" (or url "")))))

(defn- embed-text-file
  "Store external content with url into Logseq repo"
  [url title]
  (p/let [time (date/get-current-time)
          date-ref-name (date/today)
          title (some-> (or title (node-path/basename url))
                        gp-util/safe-decode-uri-component
                        util/node-path.name
                        ;; make the title more user friendly
                        gp-util/page-name-sanity)
          path (node-path/join (config/get-repo-dir (state/get-current-repo))
                               (config/get-pages-directory)
                               (str (js/encodeURI (fs-util/file-name-sanity title)) (node-path/extname url)))
          _ (p/catch
             (.copy Filesystem (clj->js {:from url :to path}))
             (fn [error]
               (log/error :copy-file-error {:error error})))
          url (page-ref/->page-ref title)
          template (get-in (state/get-config)
                           [:quick-capture-templates :text]
                           "**{time}** [[quick capture]]: {url}")]
    (-> template
        (string/replace "{time}" time)
        (string/replace "{date}" date-ref-name)
        (string/replace "{text}" "")
        (string/replace "{url}" (or url "")))))

(defn- handle-received-media [result]
  (p/let [{:keys [url]} result
          page (or (state/get-current-page) (string/lower-case (date/journal-name)))
          format (db/get-page-format page)
          content (embed-asset-file url format)]
    (if (state/get-edit-block)
      (editor-handler/insert content)
      (editor-handler/api-insert-new-block! content {:page page
                                                     :edit-block? false
                                                     :replace-empty-target? true}))))

(defn- handle-received-application [result]
  (p/let [{:keys [title url type]} result
          page (or (state/get-current-page) (string/lower-case (date/journal-name)))
          format (db/get-page-format page)
          application-type (last (string/split type "/"))
          content (cond
                    (gp-config/mldoc-support? application-type)
                    (embed-text-file url title)

                    (contains? (set/union config/doc-formats config/media-formats)
                               (keyword application-type))
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
      (editor-handler/insert content)
      (editor-handler/api-insert-new-block! content {:page page
                                                     :edit-block? false
                                                     :replace-empty-target? true}))))

(defn decode-received-result [m]
  (into {} (for [[k v] m]
             [k (cond (vector? v)
                      (vec (map decode-received-result v))

                      (string/blank? v)
                      nil

                      :else
                      (if (mobile-util/native-ios?)
                        (gp-util/safe-decode-uri-component v)
                        v))])))

(defn- handle-asset-file [url format]
  (p/let [basename (node-path/basename url)
          label (-> basename util/node-path.name)
          path (editor-handler/get-asset-path basename)
          _file (p/catch
                 (.copy Filesystem (clj->js {:from url :to path}))
                 (fn [error]
                   (log/error :copy-file-error {:error error})))
          url (util/format "../assets/%s" basename)
          url-link (assets-handler/get-asset-file-link format url label true)]
    url-link))

(defn- handle-payload-resource
  [{:keys [type name ext url] :as resource} format]
  (if url
    (cond
      (contains? (set/union config/doc-formats config/media-formats)
                 (keyword ext))
      (handle-asset-file url format)

      :else
      (notification/show!
       [:div
        "Parsing current shared content are not supported. Please report the following codes on "
        [:a {:href "https://github.com/logseq/logseq/issues/new?labels=from:in-app&template=bug_report.yaml"
             :target "_blank"} "Github"]
        ". We will look into it soon."
        [:pre.code (with-out-str (pprint/pprint resource))]] :warning false))

    (cond
      (= type "text/plain")
      name

      :else
      (notification/show!
       [:div
        "Parsing current shared content are not supported. Please report the following codes on "
        [:a {:href "https://github.com/logseq/logseq/issues/new?labels=from:in-app&template=bug_report.yaml"
             :target "_blank"} "Github"]
        ". We will look into it soon."
        [:pre.code (with-out-str (pprint/pprint resource))]] :warning false))))

(defn handle-payload
  "Mobile share intent handler v2, use complex payload to support more types of content."
  [payload]
  ;; use :text template, use {url} as rich text placeholder
  (p/let [page (or (state/get-current-page) (string/lower-case (date/journal-name)))
          format (db/get-page-format page)

          template (get-in (state/get-config)
                           [:quick-capture-templates :text]
                           "**{time}** [[quick capture]]: {text} {url}")
          {:keys [text resources]} payload
          text (or text "")
          rich-content (-> (p/all (map (fn [resource]
                                         (handle-payload-resource resource format))
                                       resources))
                           (p/then (partial string/join "\n")))]
    (when (or (not-empty text) (not-empty rich-content))
      (let [time (date/get-current-time)
            date-ref-name (date/today)
            content (-> template
                        (string/replace "{time}" time)
                        (string/replace "{date}" date-ref-name)
                        (string/replace "{text}" text)
                        (string/replace "{url}" rich-content))
            edit-content (state/get-edit-content)
            edit-content-blank? (string/blank? edit-content)
            edit-content-include-capture? (and (not-empty edit-content)
                                               (string/includes? edit-content "[[quick capture]]"))]
        (if (and (state/editing?) (not edit-content-include-capture?))
          (if edit-content-blank?
            (editor-handler/insert content)
            (editor-handler/insert (str "\n" content)))

          (do
            (editor-handler/escape-editing)
            (js/setTimeout #(editor-handler/api-insert-new-block! content {:page page
                                                                           :edit-block? true
                                                                           :replace-empty-target? true})
                           100)))))))


(defn handle-result
  "Mobile share intent handler v1, legacy. Only for Android"
  [result]
  (let [result (decode-received-result result)]
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
          [:a {:href "https://github.com/logseq/logseq/issues/new?labels=from:in-app&template=bug_report.yaml"
               :target "_blank"} "Github"]
          ". We will look into it soon."
          [:pre.code (with-out-str (pprint/pprint result))]] :warning false)))))

(defn handle-received []
  (p/let [received (p/catch
                    (.checkSendIntentReceived SendIntent)
                    (fn [error]
                      (prn :intent-received-error {:error error})))]
    (when received
      (let [result (js->clj received :keywordize-keys true)]
        (handle-result result)))))
