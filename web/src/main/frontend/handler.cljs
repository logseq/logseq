(ns frontend.handler
  (:refer-clojure :exclude [clone load-file])
  (:require [frontend.git :as git]
            [frontend.fs :as fs]
            [frontend.state :as state]
            [frontend.db :as db]
            [frontend.storage :as storage]
            [frontend.search :as search]
            [frontend.util :as util :refer-macros [profile]]
            [frontend.config :as config]
            [frontend.diff :as diff]
            [frontend.github :as github]
            [clojure.walk :as walk]
            [clojure.string :as string]
            [promesa.core :as p]
            [cljs-bean.core :as bean]
            [reitit.frontend.easy :as rfe]
            [reitit.frontend.history :as rfh]
            [goog.crypt.base64 :as b64]
            [goog.object :as gobj]
            [goog.dom :as gdom]
            [goog.dom.classes :as gdom-classes]
            [rum.core :as rum]
            [datascript.core :as d]
            [dommy.core :as dom]
            [frontend.utf8 :as utf8]
            [frontend.image :as image]
            [clojure.set :as set]
            [cljs-bean.core :as bean]
            [frontend.format :as format]
            [frontend.format.protocol :as protocol]
            [frontend.format.block :as block]
            [frontend.date :as date]
            [frontend.commands :as commands]
            [frontend.encrypt :as encrypt]
            [cljs-time.local :as tl]
            [cljs-time.core :as t]
            [cljs-time.coerce :as tc]
            [frontend.history :as history]
            ["/frontend/utils" :as utils]
            [cljs.reader :as reader])
  (:import [goog.events EventHandler]
           [goog.format EmailAddress]))

;; TODO: replace all util/p-handle with p/let
;; TODO: separate git status for push-failed, pull-failed, etc
;; TODO: Support more storage options (dropbox, google drive), git logic should be
;; moved to another namespace, better there should be a `protocol`.
(defn set-state-kv!
  [key value]
  (swap! state/state assoc key value))

(defn show-notification!
  [content status]
  (swap! state/state assoc
         :notification/show? true
         :notification/content content
         :notification/status status)
  (js/setTimeout #(swap! state/state assoc
                         :notification/show? false
                         :notification/content nil
                         :notification/status nil)
                 5000))

(defn get-github-token
  []
  (get-in @state/state [:me :access-token]))

(defn load-file
  [repo-url path]
  (->
   (p/let [content (fs/read-file (util/get-repo-dir repo-url) path)]
     content)
   (p/catch
       (fn [e]
         ;; (prn "load file failed, " e)
         ))))

(defn load-multiple-files
  [repo-url paths]
  (let [repo-dir (util/get-repo-dir repo-url)]
    (doall (mapv #(fs/read-file repo-dir %) paths))))

(defn redirect!
  "If `push` is truthy, previous page will be left in history."
  [{:keys [to path-params query-params push]
    :or {push true}}]
  (if push
    (rfe/push-state to path-params query-params)
    (rfe/replace-state to path-params query-params)))

(defn redirect-with-fragment!
  [path]
  (.pushState js/window.history nil "" path)
  (rfh/-on-navigate @rfe/history path))

(defn- hidden?
  [path patterns]
  (some (fn [pattern]
          (or
           (= path pattern)
           (and (string/starts-with? pattern "/")
                (= (str "/" (first (string/split path #"/")))
                   pattern)))) patterns))

(defn- keep-formats
  [files formats]
  (filter
   (fn [file]
     (let [format (format/get-format file)]
       (contains? formats format)))
   files))

(defn- only-text-formats
  [files]
  (keep-formats files (config/text-formats)))

(defn- only-html-render-formats
  [files]
  (keep-formats files config/html-render-formats))

(defn- only-supported-formats
  [files]
  (keep-formats files (config/supported-formats)))

(defn- only-parsed-formats
  [files]
  (keep-formats files config/hiccup-support-formats))

;; TODO: no atom version
(defn load-files
  [repo-url]
  (state/set-cloning? false)
  (set-state-kv! :repo/loading-files? true)
  (p/let [files (git/list-files repo-url)
          files (bean/->clj files)
          config-content (load-file repo-url (str config/app-name "/" config/config-file))
          files (if config-content
                  (let [config (db/reset-config! repo-url config-content)]
                    (if-let [patterns (seq (:hidden config))]
                      (remove (fn [path] (hidden? path patterns)) files)
                      files))
                  files)]
    (only-supported-formats files)))

(defn- set-latest-commit!
  [repo-url hash]
  (db/set-key-value repo-url :git/latest-commit hash))

(defn- set-git-status!
  [repo-url value]
  (db/set-key-value repo-url :git/status value)
  (state/set-git-status! repo-url value))

(defn- set-git-last-pulled-at!
  [repo-url]
  (db/set-key-value repo-url :git/last-pulled-at
                    (date/get-date-time-string (tl/local-now))))

(defn- set-git-error!
  [repo-url value]
  (db/set-key-value repo-url :git/error (if value (str value))))

(defn git-add
  [repo-url file]
  (p/let [result (git/add repo-url file)]
    (set-git-status! repo-url :should-push)))

;; journals

;; Something like `* May 1st, 2020`
(defn default-month-journal-content
  [format]
  (let [{:keys [year month day]} (date/get-date)
        last-day (date/get-month-last-day)]
    (->> (map
           (fn [day]
             (util/format
              "%s %s\n"
              (config/get-heading-pattern format)
              (date/format (t/date-time year month day))))
           (range 1 (inc last-day)))
         (apply str))))

(defn re-render-root!
  []
  (when-let [component (state/get-root-component)]
    (db/clear-query-state!)
    (rum/request-render component)
    (doseq [component (state/get-custom-query-components)]
      (rum/request-render component))))

(defn create-month-journal-if-not-exists
  [repo-url]
  (let [repo-dir (util/get-repo-dir repo-url)
        format (state/get-preferred-format)
        path (date/current-journal-path format)
        file-path (str "/" path)
        default-content (default-month-journal-content format)]
    (p/let [_ (-> (fs/mkdir (str repo-dir "/journals"))
                  (p/catch (fn [_e])))
            file-exists? (fs/create-if-not-exists repo-dir file-path default-content)]
      (when-not file-exists?
        (db/reset-file! repo-url path default-content)
        (re-render-root!)
        (git-add repo-url path)))))

;; And metadata file
(defn create-config-file-if-not-exists
  [repo-url]
  (let [repo-dir (util/get-repo-dir repo-url)
        app-dir config/app-name
        dir (str repo-dir "/" app-dir)]
    (p/let [_ (-> (fs/mkdir dir)
                  (p/catch (fn [_e])))]
      (let [default-content "{}"]
        (p/let [file-exists? (fs/create-if-not-exists repo-dir (str app-dir "/" config/config-file) default-content)]
          (let [path (str app-dir "/" config/config-file)]
            (when-not file-exists?
              (db/reset-file! repo-url path default-content)
              (git-add repo-url path))))
        (p/let [file-exists? (fs/create-if-not-exists repo-dir (str app-dir "/" config/metadata-file) default-content)]
          (let [path (str app-dir "/" config/metadata-file)]
            (when-not file-exists?
              (db/reset-file! repo-url path "{:tx-data []}")
              (git-add repo-url path))))))))

(defn load-files-contents!
  [repo-url files ok-handler]
  (let [files (only-text-formats files)]
    (-> (p/all (load-multiple-files repo-url files))
        (p/then (fn [contents]
                  (ok-handler
                   (zipmap files contents))))
        (p/catch (fn [error]
                   (println "load files failed: ")
                   (js/console.dir error))))))

(defn load-repo-to-db!
  [repo-url diffs first-clone?]
  (let [load-contents (fn [files delete-files delete-headings re-render?]
                        (load-files-contents!
                         repo-url
                         files
                         (fn [contents]
                           (set-state-kv! :repo/loading-files? false)
                           (set-state-kv! :repo/importing-to-db? true)
                           (let [parsed-files (filter
                                               (fn [[file _]]
                                                 (let [format (format/get-format file)]
                                                   (contains? config/hiccup-support-formats format)))
                                               contents)
                                 headings-pages (if (seq parsed-files)
                                                  (db/extract-all-headings-pages parsed-files)
                                                  [])]
                             (db/reset-contents-and-headings! repo-url contents headings-pages delete-files delete-headings)
                             (let [metadata-file (str config/app-name "/" config/metadata-file)]
                               (when (contains? (set files) metadata-file)
                                 (when-let [content (get contents metadata-file)]
                                   (let [{:keys [tx-data]} (reader/read-string content)]
                                     (db/transact! repo-url tx-data)))))
                             (set-state-kv! :repo/importing-to-db? false)
                             (when re-render?
                               (re-render-root!))))))]
    (if first-clone?
      (->
       (p/let [files (load-files repo-url)]
         (load-contents files nil nil false))
       (p/catch (fn [error]
                  (println "loading files failed: ")
                  (js/console.dir error)
                  (set-state-kv! :repo/loading-files? false))))
      (when (seq diffs)
        (let [filter-diffs (fn [type] (->> (filter (fn [f] (= type (:type f))) diffs)
                                           (map :path)))
              remove-files (filter-diffs "remove")
              modify-files (filter-diffs "modify")
              add-files (filter-diffs "add")
              delete-files (if (seq remove-files)
                             (db/delete-files remove-files))
              delete-headings (db/delete-headings repo-url (concat remove-files modify-files))
              add-or-modify-files (util/remove-nils (concat add-files modify-files))]
          (load-contents add-or-modify-files delete-files delete-headings true))))))

(defn journal-file-changed?
  [repo-url diffs]
  (contains? (set (map :path diffs))
             (db/get-current-journal-path)))

(defn create-default-files!
  [repo-url]
  (when-let [name (get-in @state/state [:me :name])]
    (github/get-repo-permission
     (get-github-token)
     repo-url
     name
     (fn [permission]
       (let [permission (:permission permission)
             write-permission (contains? #{"admin" "write"} permission)]
         (create-month-journal-if-not-exists repo-url)
         (create-config-file-if-not-exists repo-url)
         (db/set-key-value repo-url :git/write-permission? write-permission)))
     (fn []))))

(defn load-db-and-journals!
  [repo-url diffs first-clone?]
  (when (or diffs first-clone?)
    (p/let [_ (load-repo-to-db! repo-url diffs first-clone?)]
      (when first-clone?
        (create-default-files! repo-url))

      (history/clear-specific-history! [:git/repo repo-url])
      (history/add-history!
       [:git/repo repo-url]
       {:db (d/db (db/get-conn repo-url false))
        :files-db (d/db (db/get-files-conn repo-url))}))))



(defn pull
  [repo-url token]
  (when (db/get-conn repo-url true)
    (let [status (db/get-key-value repo-url :git/status)]
      (when (and (not (state/get-edit-input-id))
                 (not (state/in-draw-mode?)))
        (set-git-status! repo-url :pulling)
        (let [latest-commit (db/get-key-value repo-url :git/latest-commit)]
          (p/let [result (git/fetch repo-url token)]
            (let [{:keys [fetchHead]} (bean/->clj result)]
              (set-latest-commit! repo-url fetchHead)
              (-> (git/merge repo-url)
                  (p/then (fn [result]
                            (-> (git/checkout repo-url)
                                (p/then (fn [result]
                                          (set-git-status! repo-url nil)
                                          (set-git-last-pulled-at! repo-url)
                                          (when (and latest-commit fetchHead
                                                     (not= latest-commit fetchHead))
                                            (p/let [diffs (git/get-diffs repo-url latest-commit fetchHead)]
                                              (load-db-and-journals! repo-url diffs false)))))
                                (p/catch (fn [error]
                                           (set-git-status! repo-url :checkout-failed)
                                           (set-git-error! repo-url error))))))
                  (p/catch (fn [error]
                             (set-git-status! repo-url :merge-failed)
                             (set-git-error! repo-url error)
                             (show-notification!
                              [:p.content
                               "Failed to merge, please "
                               [:span.text-gray-700.font-bold
                                "resolve any diffs first."]]
                              :error)
                             (redirect! {:to :diff})
                             ))))))))))

(defn pull-current-repo
  []
  (when-let [repo (state/get-current-repo)]
    (when-let [token (get-github-token)]
      (pull repo token))))

(defn periodically-pull
  [repo-url pull-now?]
  (when-let [token (get-github-token)]
    (when pull-now? (pull repo-url token))
    (js/setInterval #(pull repo-url token)
                    (* (config/git-pull-secs) 1000))))

(defn get-latest-commit
  ([repo-url handler]
   (get-latest-commit repo-url handler 1))
  ([repo-url handler length]
   (-> (p/let [commits (git/log repo-url
                                (get-github-token)
                                length)]
         (handler (if (= length 1)
                    (first commits)
                    commits)))
       (p/catch (fn [error]
                  (println "get latest commit failed: " error)
                  (js/console.log (.-stack error))
                  ;; TODO: safe check
                  (println "It might be an empty repo"))))))

(defn set-latest-commit-if-exists! [repo-url]
  (get-latest-commit
   repo-url
   (fn [commit]
     (when-let [hash (gobj/get commit "oid")]
       (set-latest-commit! repo-url hash)))))

;; TODO: update latest commit
(defn push
  [repo-url]
  (when (and
         (db/get-key-value repo-url :git/write-permission?)
         (not (state/get-edit-input-id))
         (= :should-push (db/get-key-value repo-url :git/status)))
    ;; auto commit if there are any un-committed changes
    (p/let [changed-files (git/get-status-matrix repo-url)]
      (when (seq (flatten (vals changed-files)))
        ;; (prn {:changed-files changed-files})
        (p/let [_commit-result (git/commit repo-url "Logseq auto save")]
          (set-git-status! repo-url :pushing)
          (let [token (get-github-token)]
            (util/p-handle
             (git/push repo-url token)
             (fn []
               (set-git-status! repo-url nil)
               (set-git-error! repo-url nil)
               (set-latest-commit-if-exists! repo-url))
             (fn [error]
               (prn "Failed to push, error: " error)
               (set-git-status! repo-url :push-failed)
               (set-git-error! repo-url error)
               (show-notification!
                [:p.content
                 "Failed to push, please "
                 [:span.text-gray-700.font-bold
                  "resolve any diffs first."]]
                :error)
               (p/let [result (git/fetch repo-url (get-github-token))
                       {:keys [fetchHead]} (bean/->clj result)
                       _ (set-latest-commit! repo-url fetchHead)]
                 (redirect! {:to :diff}))))))))))

(defn commit-and-force-push!
  [commit-message pushing?]
  (let [repo (frontend.state/get-current-repo)]
    (p/let [changes (git/get-status-matrix repo)]
      (let [changes (seq (flatten (concat (vals changes))))]
        (p/let [commit-oid (if changes (git/commit repo commit-message))
                _ (if changes (git/write-ref! repo commit-oid))
                _ (git/push repo
                            (get-github-token)
                            true)]
          (reset! pushing? false)
          (redirect! {:to :home}))))))

(defn db-listen-to-tx!
  [repo db-conn]
  (when-let [files-conn (db/get-files-conn repo)]
    (d/listen! files-conn :persistence
               (fn [tx-report]
                 (when (seq (:tx-data tx-report))
                   (when-let [db (:db-after tx-report)]
                     (js/setTimeout #(db/persist repo db true) 0))))))
  (d/listen! db-conn :persistence
             (fn [tx-report]
               (when (seq (:tx-data tx-report))
                 (when-let [db (:db-after tx-report)]
                   (js/setTimeout #(db/persist repo db false) 0))))))

(defn clone
  [repo-url]
  (let [token (get-github-token)]
    (util/p-handle
     (do
       (state/set-cloning? true)
       (git/clone repo-url token))
     (fn []
       (state/set-git-clone-repo! "")
       (state/set-current-repo! repo-url)
       (db/start-db-conn! (:me @state/state)
                          repo-url
                          db-listen-to-tx!)
       (db/mark-repo-as-cloned repo-url)
       (set-latest-commit-if-exists! repo-url))
     (fn [e]
       (prn "Clone failed, reason: " e)
       (state/set-cloning? false)
       (set-git-status! repo-url :clone-failed)
       (set-git-error! repo-url e)
       (let [status-code (some-> (gobj/get e "data")
                                 (gobj/get "statusCode"))]
         (when (contains? #{401 404} status-code)
           ;; TODO: notification
           ))))))

(defn new-notification
  [text]
  (js/Notification. "Logseq" #js {:body text
                                  ;; :icon logo
                                  }))

(defn request-notifications
  []
  (util/p-handle (.requestPermission js/Notification)
                 (fn [result]
                   (storage/set :notification-permission-asked? true)

                   (when (= "granted" result)
                     (storage/set :notification-permission? true)))))

(defn request-notifications-if-not-asked
  []
  (when-not (storage/get :notification-permission-asked?)
    (request-notifications)))

;; notify deadline or scheduled tasks
(defn run-notify-worker!
  []
  (when (storage/get :notification-permission?)
    (let [notify-fn (fn []
                      (let [tasks (:tasks @state/state)
                            tasks (flatten (vals tasks))]
                        (doseq [{:keys [marker title] :as task} tasks]
                          (when-not (contains? #{"DONE" "CANCElED" "CANCELLED"} marker)
                            (doseq [[type {:keys [date time] :as timestamp}] (:timestamps task)]
                              (let [{:keys [year month day]} date
                                    {:keys [hour min]
                                     :or {hour 9
                                          min 0}} time
                                    now (date/get-local-date)]
                                (when (and (contains? #{"Scheduled" "Deadline"} type)
                                           (= (assoc date :hour hour :minute min) now))
                                  (let [notification-text (str type ": " (second (first title)))]
                                    (new-notification notification-text)))))))))]
      (notify-fn)
      (js/setInterval notify-fn (* 1000 60)))))

(defn restore-config!
  [repo-url]
  (db/reset-config! repo-url))

(defn alter-file
  [repo path content {:keys [reset? re-render-root?]
                      :or {reset? true
                           re-render-root? false}}]
  (if reset?
    (db/reset-file! repo path content)
    (db/set-file-content! repo path content))
  (util/p-handle
   (fs/write-file (util/get-repo-dir repo) path content)
   (fn [_]
     (git-add repo path)
     (when (= path (str config/app-name "/" config/config-file))
       (restore-config! repo))
     (when re-render-root? (re-render-root!))
     (history/add-history!
      [:git/repo repo]
      {:db (d/db (db/get-conn repo false))
       :files-db (d/db (db/get-files-conn repo))
       :file-handler (fn [cb]
                       (->
                        (p/let [result (fs/write-file (util/get-repo-dir repo) path content)]
                          (git-add repo path)
                          (cb))
                        (p/catch (fn [error]
                                   (prn "Add history file handler failed, error: " error)))))}))
   (fn [error]
     (prn "Write file failed, path: " path ", content: " content)
     (js/console.dir error))))

(defn transact-react-and-alter-file!
  [repo tx transact-option files]
  (db/transact-react!
   repo
   tx
   transact-option)
  (doseq [[file-path new-content] files]
    (alter-file repo file-path new-content {:reset? false
                                            :re-render-root? false})))

(defn git-set-username-email!
  [repo-url {:keys [name email]}]
  (when (and name email)
    (git/set-username-email
     (util/get-repo-dir repo-url)
     name
     email)))

(defn highlight-element!
  [fragment]
  (when-let [element (gdom/getElement fragment)]
    (dom/add-class! element "block-highlight")
    (js/setTimeout #(dom/remove-class! element "block-highlight")
                   4000)))

(defn scroll-and-highlight!
  [state]
  (when-let [fragment (util/get-fragment)]
    (util/scroll-to-element fragment)
    (highlight-element! fragment))
  state)

(defn get-title
  [name path-params]
  (case name
    :home
    "Logseq"
    :repos
    "Repos"
    :repo-add
    "Add another repo"
    :graph
    "Graph"
    :all-files
    "All files"
    :all-pages
    "All pages"
    :file
    (str "File " (util/url-decode (:path path-params)))
    :new-page
    "Create a new page"
    :page
    (util/capitalize-all (util/url-decode (:name path-params)))
    :tag
    (str "#" (util/url-decode (:name path-params)))
    :diff
    "Git diff"
    :draw
    "Draw"
    :else
    "Logseq"))

(defn set-route-match!
  [route]
  (swap! state/state assoc :route-match route)
  (let [{:keys [data path-params]} route
        title (get-title (:name data) path-params)]
    (util/set-title! title)
    (scroll-and-highlight! nil)))

(defn set-ref-component!
  [k ref]
  (swap! state/state assoc :ref-components k ref))

(defn periodically-push-tasks
  [repo-url]
  (let [token (get-github-token)
        push (fn []
               (push repo-url))]
    (js/setInterval push
                    (* (config/git-push-secs) 1000))))

(defn update-repo-sync-status!
  []
  (p/let [changes (git/get-status-matrix (state/get-current-repo))]
    (state/update-sync-status! changes)))

(defn periodically-update-repo-status
  [repo-url]
  (js/setInterval update-repo-sync-status!
                  (* (config/git-repo-status-secs) 1000)))

(defn periodically-pull-and-push
  [repo-url {:keys [pull-now?]
             :or {pull-now? true}}]
  (periodically-update-repo-status repo-url)
  (periodically-pull repo-url pull-now?)
  (when
      (or (not config/dev?)
          (and config/dev?
               (= repo-url "https://github.com/tiensonqin/empty-repo")))
    (periodically-push-tasks repo-url)))

(defn persist-repo-metadata!
  [repo]
  (let [files (db/get-files repo)]
    (when (seq files)
      (let [data (db/get-sync-metadata repo)
            data-str (pr-str data)]
        (alter-file repo
                    (str config/app-name "/" config/metadata-file)
                    data-str
                    {:reset? false})))))

(defn periodically-persist-app-metadata
  [repo-url]
  (js/setInterval #(persist-repo-metadata! repo-url)
                  (* 5 60 1000)))

(defn render-local-images!
  []
  (when-let [content-node (gdom/getElement "content")]
    (let [images (array-seq (gdom/getElementsByTagName "img" content-node))
          get-src (fn [image] (.getAttribute image "src"))
          local-images (filter
                        (fn [image]
                          (let [src (get-src image)]
                            (and src
                                 (not (or (string/starts-with? src "http://")
                                          (string/starts-with? src "https://"))))))
                        images)]
      (doseq [img local-images]
        (gobj/set img
                  "onerror"
                  (fn []
                    (gobj/set (gobj/get img "style")
                              "display" "none")))
        (let [path (get-src img)
              path (if (= (first path) \.)
                     (subs path 1)
                     path)]
          (util/p-handle
           (fs/read-file-2 (util/get-repo-dir (state/get-current-repo))
                           path)
           (fn [blob]
             (let [blob (js/Blob. (array blob) (clj->js {:type "image"}))
                   img-url (image/create-object-url blob)]
               (gobj/set img "src" img-url)
               (gobj/set (gobj/get img "style")
                         "display" "initial")))))))))

(defn load-more-journals!
  []
  (let [current-length (:journals-length @state/state)]
    (when (< current-length (db/get-journals-length))
      (state/update-state! :journals-length inc))))

(defn request-presigned-url
  [file filename mime-type uploading? url-handler on-processing]
  (cond
    (> (gobj/get file "size") (* 12 1024 1024))
    (show-notification! [:p "Sorry, we don't support any file that's larger than 12MB."] :error)

    :else
    (do
      (reset! uploading? true)
      ;; start uploading?
      (util/post (str config/api "presigned_url")
                 {:filename filename
                  :mime-type mime-type}
                 (fn [{:keys [presigned-url s3-object-key] :as resp}]
                   (if presigned-url
                     (util/upload presigned-url
                                  file
                                  (fn [_result]
                                    ;; request cdn signed url
                                    (util/post (str config/api "signed_url")
                                               {:s3-object-key s3-object-key}
                                               (fn [{:keys [signed-url]}]
                                                 (reset! uploading? false)
                                                 (if signed-url
                                                   (do
                                                     (url-handler signed-url))
                                                   (prn "Something error, can't get a valid signed url.")))
                                               (fn [error]
                                                 (reset! uploading? false)
                                                 (prn "Something error, can't get a valid signed url."))))
                                  (fn [error]
                                    (reset! uploading? false)
                                    (prn "upload failed.")
                                    (js/console.dir error))
                                  (fn [e]
                                    (on-processing e)))
                     ;; TODO: notification, or re-try
                     (do
                       (reset! uploading? false)
                       (prn "failed to get any presigned url, resp: " resp))))
                 (fn [_error]
                   ;; (prn "Get token failed, error: " error)
                   (reset! uploading? false))))))

(defn clear-store!
  []
  (p/let [ks (.keys db/localforage-instance)
          _ (doseq [k ks]
              (when-not (string/ends-with? k (str "/" config/local-repo))
                (.removeItem db/localforage-instance k)))
          dirs (fs/readdir "/")
          dirs (remove #(= % config/local-repo) dirs)]
    (-> (p/all (doall (map (fn [dir]
                             (fs/rmdir (str "/" dir)))
                        dirs)))
        (p/then (fn []
                  (prn "Cleared store!"))))))

;; clear localforage
(defn sign-out!
  [e]
  (->
   (do
     ;; remember not to remove the encrypted token
     (storage/set :git/current-repo config/local-repo)
     (storage/remove :git/clone-repo)
     (clear-store!))
   (p/catch (fn [e]
              (println "sign out error: ")
              (js/console.dir e)))
   (p/finally (fn []
                (set! (.-href js/window.location) "/logout")))))

(defn set-format-js-loading!
  [format value]
  (when format
    (swap! state/state assoc-in [:format/loading format] value)))

(defn lazy-load
  [format]
  (let [format (format/normalize format)]
    (when-let [record (format/get-format-record format)]
      (when-not (protocol/loaded? record)
        (set-format-js-loading! format true)
        (protocol/lazyLoad record
                           (fn [result]
                             (set-format-js-loading! format false)))))))

(defn reset-cursor-range!
  [node]
  (when node
    (state/set-cursor-range! (util/caret-range node))))

(defn restore-cursor-pos!
  ([id markup]
   (restore-cursor-pos! id markup false))
  ([id markup dummy?]
   (when-let [node (gdom/getElement (str id))]
     (when-let [cursor-range (state/get-cursor-range)]
       (when-let [range (string/trim cursor-range)]
         (let [pos (inc (diff/find-position markup range))]
           (util/set-caret-pos! node pos)))))))

(defn search
  [q]
  (swap! state/state assoc :search/result
         {:pages (search/page-search q)
          :blocks (search/search q)}))

(defn clear-search!
  []
  (swap! state/state assoc
         :search/result nil
         :search/q "")
  (when-let [input (gdom/getElement "search_field")]
    (gobj/set input "value" "")))

(defn email? [v]
  (and v
       (.isValid (EmailAddress. v))))

(defn set-email!
  [email]
  (when (email? email)
    (util/post (str config/api "email")
               {:email email}
               (fn [result]
                 (db/transact! [{:me/email email}])
                 (swap! state/state assoc-in [:me :email] email))
               (fn [error]
                 (show-notification! "Email already exists!"
                                     :error)))))


(defn new-file-content
  [{:heading/keys [content meta dummy?] :as heading} file-content value]
  (let [utf8-content (utf8/encode file-content)
        prefix (utf8/substring utf8-content 0 (:pos meta))
        postfix (let [end-pos (if dummy?
                                (:pos meta)
                                (:end-pos meta))]
                  (utf8/substring utf8-content end-pos))
        value (str
               (if (= "\n" (last prefix))
                 ""
                 "\n")
               value
               (if (= "\n" (first postfix))
                 ""
                 "\n"))]
    [(str prefix value postfix)
     value]))

(defn- default-content-with-title
  [format title]
  (case format
    "org"
    (util/format "#+TITLE: %s\n#+TAGS:\n\n** " title)
    "markdown"
    (util/format "---\ntitle: %s\ntags:\n---\n\n## " title)
    ""))

(defn create-new-page!
  [title]
  (let [repo (state/get-current-repo)
        dir (util/get-repo-dir repo)]
    (when dir
      (p/let [_ (-> (fs/mkdir (str dir "/" config/default-pages-directory))
                    (p/catch (fn [_e])))]
        (let [format (name (state/get-preferred-format))
              page (-> title
                       (string/lower-case)
                       (string/replace #"\s+" "_"))
              page (util/encode-str page)
              path (str config/default-pages-directory "/" page "." (if (= format "markdown") "md" format))
              file-path (str "/" path)]
          (p/let [exists? (fs/file-exists? dir file-path)]
            (if exists?
              (show-notification!
               [:p.content
                "File already exists!"]
               :error)
              ;; create the file
              (let [content (default-content-with-title format (util/capitalize-all title))]
                (p/let [_ (fs/create-if-not-exists dir file-path content)]
                  (db/reset-file! repo path content)
                  (git-add repo path)
                  (redirect! {:to :page
                              :path-params {:name page}}))))))))))

(defn- with-heading-meta
  [repo heading]
  (if (:heading/dummy? heading)
    heading
    (assoc heading :heading/meta
           (:heading/meta (db/entity repo [:heading/uuid (:heading/uuid heading)])))))

(defn highlight-heading!
  [heading-uuid]
  (let [headings (array-seq (js/document.getElementsByClassName (str heading-uuid)))]
    (doseq [heading headings]
      (dom/add-class! heading "block-highlight"))))

(defn unhighlight-heading!
  []
  (let [headings (some->> (array-seq (js/document.getElementsByClassName "block-highlight"))
                          (repeat 2)
                          (apply concat))]
    (doseq [heading headings]
      (gdom-classes/remove heading "block-highlight"))))

(defn rebuild-after-headings
  [repo file before-end-pos new-end-pos]
  (let [file-id (:db/id file)
        after-headings (db/get-file-after-headings repo file-id before-end-pos)
        last-start-pos (atom new-end-pos)]
    (mapv
     (fn [{:heading/keys [uuid meta] :as heading}]
       (let [old-start-pos (:pos meta)
             old-end-pos (:end-pos meta)
             new-end-pos (if old-end-pos
                           (+ @last-start-pos (- old-end-pos old-start-pos)))
             new-meta {:pos @last-start-pos
                       :end-pos new-end-pos}]
         (reset! last-start-pos new-end-pos)
         {:heading/uuid uuid
          :heading/meta new-meta}))
     after-headings)))

(defn save-heading-if-changed!
  [{:heading/keys [uuid content meta file page dummy? format repo pre-heading? content] :as heading} value]
  (let [repo (or repo (state/get-current-repo))
        heading (with-heading-meta repo heading)
        format (or format (state/get-preferred-format))
        [old-directives new-directives] (when pre-heading?
                                          [(:page/directives (db/entity (:db/id page)))
                                           (db/parse-directives value format)])
        permalink-changed? (when (and pre-heading? (:permalink old-directives))
                             (not= (:permalink old-directives)
                                   (:permalink new-directives)))
        value (if permalink-changed?
                (db/add-directives! format value {:old_permalink (:permalink old-directives)})
                value)
        new-directives (if permalink-changed?
                         (assoc new-directives :old_permalink (:permalink old-directives)))]
    (when (not= (string/trim content) value) ; heading content changed
      (let [file (db/entity repo (:db/id file))
            page (db/entity repo (:db/id page))
            save-heading (fn [file {:heading/keys [uuid content meta page file dummy? format] :as heading}]
                           (let [file (db/entity repo (:db/id file))
                                 file-path (:file/path file)
                                 format (format/get-format file-path)]
                             (let [file-content (db/get-file repo file-path)
                                   [new-content value] (new-file-content heading file-content value)
                                   {:keys [headings pages start-pos end-pos]} (if pre-heading?
                                                                                (let [new-end-pos (utf8/length (utf8/encode value))]
                                                                                  {:headings [(-> heading
                                                                                                  (assoc :heading/content value)
                                                                                                  (assoc-in [:heading/meta :end-pos] new-end-pos))]
                                                                                   :pages []
                                                                                   :start-pos 0
                                                                                   :end-pos new-end-pos})
                                                                                (block/parse-heading (assoc heading :heading/content value) format))
                                   headings (db/recompute-heading-children repo heading headings)
                                   after-headings (rebuild-after-headings repo file (:end-pos meta) end-pos)
                                   modified-time (let [modified-at (tc/to-long (t/now))]
                                                   [[:db/add (:db/id page) :page/last-modified-at modified-at]
                                                    [:db/add (:db/id file) :file/last-modified-at modified-at]])
                                   page-directives (when pre-heading?
                                                     [(assoc page :page/directives new-directives)])]
                               (profile
                                "Save heading: "
                                (transact-react-and-alter-file!
                                 repo
                                 (concat
                                  pages
                                  headings
                                  page-directives
                                  after-headings
                                  modified-time)
                                 {:key :heading/change
                                  :data (map (fn [heading] (assoc heading :heading/page page)) headings)}
                                 [[file-path new-content]]
                                 )))))]
        (cond
          ;; Page was referenced but no related file
          (and page (not file))
          (let [format (name format)
                path (str (-> (:page/name page)
                              (string/replace #"\s+" "_")
                              (util/encode-str)) "." format)
                file-path (str "/" path)
                dir (util/get-repo-dir repo)]
            (p/let [exists? (fs/file-exists? dir file-path)]
              (if exists?
                (show-notification!
                 [:p.content
                  "File already exists!"]
                 :error)
                ;; create the file
                (let [content (default-content-with-title format (util/capitalize-all (:page/name page)))]
                  (p/let [_ (fs/create-if-not-exists dir file-path content)]
                    (db/reset-file! repo path content)
                    (git-add repo path)
                    ;; save heading
                    (let [file (db/entity repo [:file/path path])
                          heading (assoc heading
                                         :heading/page {:db/id (:db/id page)}
                                         :heading/file {:db/id (:db/id file)}
                                         :heading/meta
                                         {:pos (utf8/length (utf8/encode content))
                                          :end-pos nil})]
                      (save-heading file heading)))))))

          (and file page)
          (save-heading file heading)

          :else
          nil)))))

(defn insert-new-heading!
  [{:heading/keys [uuid content meta file dummy? level repo page] :as heading} value create-new-heading? ok-handler]
  (let [repo (or repo (state/get-current-repo))
        value (string/trim value)
        heading (with-heading-meta repo heading)
        format (:heading/format heading)
        new-heading-content (config/default-empty-heading format level)
        page (db/entity repo (:db/id page))
        file (db/entity repo (:db/id file))
        insert-heading (fn [heading file-path file-content]
                         (let [value (if create-new-heading?
                                       (str value "\n" new-heading-content)
                                       value)
                               [new-content value] (new-file-content heading file-content value)
                               {:keys [headings pages start-pos end-pos]} (block/parse-heading (assoc heading :heading/content value) format)
                               first-heading (first headings)
                               last-heading (last headings)
                               headings (db/recompute-heading-children repo heading headings)
                               after-headings (rebuild-after-headings repo file (:end-pos meta) end-pos)]
                           (profile
                            "Insert heading"
                            (transact-react-and-alter-file!
                             repo
                             (concat
                              pages
                              headings
                              after-headings)
                             {:key :heading/change
                              :data (map (fn [heading] (assoc heading :heading/page page)) headings)}
                             [[file-path new-content]]))
                           (when ok-handler
                             (ok-handler [first-heading last-heading new-heading-content]))))]
    (cond
      (and (not file) page)
      (let [format (name format)
            path (str (-> (:page/name page)
                          (string/replace #"\s+" "_")
                          (util/encode-str)) "." format)
            file-path (str "/" path)
            dir (util/get-repo-dir repo)]
        (p/let [exists? (fs/file-exists? dir file-path)]
          (if exists?
            (show-notification!
             [:p.content
              "File already exists!"]
             :error)
            ;; create the file
            (let [content (default-content-with-title format (util/capitalize-all (:page/name page)))]
              (p/let [_ (fs/create-if-not-exists dir file-path content)]
                (db/reset-file! repo path content)
                (git-add repo path)
                (let [file (db/entity repo [:file/path path])
                      heading (assoc heading
                                     :heading/page {:db/id (:db/id page)}
                                     :heading/file {:db/id (:db/id file)}
                                     :heading/meta
                                     {:pos (utf8/length (utf8/encode content))
                                      :end-pos nil})]
                  (insert-heading heading path content)))))))

      file
      (let [file-path (:file/path file)
            file-content (db/get-file repo file-path)]
        (insert-heading heading file-path file-content))

      :else
      nil)))

;; TODO: utf8 encode performance
(defn check
  [{:heading/keys [uuid marker content meta file dummy?] :as heading}]
  (let [new-content (string/replace-first content marker "DONE")]
    (save-heading-if-changed! heading new-content)))

(defn uncheck
  [{:heading/keys [uuid marker content meta file dummy?] :as heading}]
  (let [new-content (string/replace-first content "DONE" "NOW")]
    (save-heading-if-changed! heading new-content)))

(defn set-marker
  [{:heading/keys [uuid marker content meta file dummy?] :as heading} new-marker]
  (let [new-content (string/replace-first content marker new-marker)]
    (save-heading-if-changed! heading new-content)))

(defn set-priority
  [{:heading/keys [uuid marker priority content meta file dummy?] :as heading} new-priority]
  (let [new-content (string/replace-first content
                                          (util/format "[#%s]" priority)
                                          (util/format "[#%s]" new-priority))]
    (save-heading-if-changed! heading new-content)))

(defn delete-heading!
  [{:heading/keys [uuid meta content file repo] :as heading} dummy?]
  (when-not dummy?
    (let [repo (or repo (state/get-current-repo))
          heading (db/pull repo '[*] [:heading/uuid uuid])]
      (when heading
        (let [file-path (:file/path (db/entity repo (:db/id file)))
              file-content (db/get-file repo file-path)
              after-headings (rebuild-after-headings repo file (:end-pos meta) (:pos meta))
              new-content (utf8/delete! file-content (:pos meta) (:end-pos meta))]
          (transact-react-and-alter-file!
           repo
           (concat
            [[:db.fn/retractEntity [:heading/uuid uuid]]]
            after-headings)
           {:key :heading/change
            :data [heading]}
           [[file-path new-content]]))))))

(defn delete-headings!
  [repo heading-uuids]
  (when (seq heading-uuids)
    (let [headings (db/pull-many repo '[*] (mapv (fn [id]
                                                   [:heading/uuid id])
                                                 heading-uuids))
          first-heading (first headings)
          last-heading (last headings)
          file (db/entity repo (:db/id (:heading/file first-heading)))
          file-path (:file/path file)
          file-content (db/get-file repo file-path)
          start-pos (:pos (:heading/meta first-heading))
          end-pos (:end-pos (:heading/meta last-heading))
          after-headings (rebuild-after-headings repo file end-pos start-pos)
          new-content (utf8/delete! file-content start-pos end-pos)
          tx-data (concat
                   (mapv
                    (fn [uuid]
                      [:db.fn/retractEntity [:heading/uuid uuid]])
                    heading-uuids)
                   after-headings
                   [{:file/path file-path}])]
      (transact-react-and-alter-file!
       repo
       tx-data
       {:key :heading/change
        :data headings}
       [[file-path new-content]]))))

(defn set-heading-property!
  [heading-id key value]
  (let [heading-id (if (string? heading-id) (uuid heading-id) heading-id)
        key (string/upper-case (name key))
        value (name value)]
    (when-let [heading (db/pull [:heading/uuid heading-id])]
      (let [{:heading/keys [file page content properties properties-meta meta]} heading
            {:keys [start-pos end-pos]} properties-meta
            start-pos (- start-pos (:pos meta))]
        (cond
          (and start-pos end-pos (> end-pos start-pos))
          (let [encoded (utf8/encode content)
                properties (utf8/substring encoded start-pos end-pos)
                lines (string/split-lines properties)
                property-check? #(re-find (re-pattern
                                           (util/format ":%s:" key))
                                          %)
                has-property? (some property-check? lines)]
            (when-not (and has-property?
                           (some #(string/includes? % (str ":" key ": " value)) lines)) ; same key-value, skip it
              (let [properties (if has-property?
                                 (str
                                  (->> (map (fn [line]
                                              (if (property-check? line)
                                                (util/format "   :%s: %s" key value)
                                                line)) lines)
                                       (string/join "\n"))
                                  "\n")
                                 (str properties
                                      (util/format "\n   :%s: %s\n" key value)))
                    prefix (utf8/substring encoded 0 start-pos)
                    postfix (when (> (:end-pos meta) end-pos)
                              (utf8/substring encoded end-pos (:end-pos meta)))
                    new-content (str prefix properties postfix)]
                (save-heading-if-changed! heading new-content))))

          :else
          (let [properties (util/format
                            "\n   :PROPERTIES:\n   :%s: %s\n   :END:\n"
                            key value)
                [heading-line & others] (string/split-lines content)
                new-content (str heading-line properties
                                 (string/join "\n" others))]
            (save-heading-if-changed! heading new-content)))))))

;; FIXME: not working for nested parent
(defn- unchanged-sibling?
  [target-element target-heading to-heading nested?]
  (when-let [heading (util/get-prev-heading target-element)]
    (let [prev-heading-uuid (uuid (dom/attr heading "headingid"))
          target-level (:heading/level target-heading)
          to-level (:heading/level to-heading)
          original-nested? (< to-level target-level)]
      (and (= prev-heading-uuid
              (:heading/uuid to-heading))
           (= original-nested? nested?)))))

(defn clone-and-pull
  [repo-url]
  (util/post (str config/api "repos")
             {:url repo-url}
             (fn [result]
               (swap! state/state
                      update-in [:me :repos]
                      (fn [repos]
                        (util/distinct-by :url (conj repos result)))))
             (fn [error]
               (prn "Something wrong!")))
  (p/let [_ (clone repo-url)
          _ (git-set-username-email! repo-url (:me @state/state))]
    (load-db-and-journals! repo-url nil true)
    (periodically-pull-and-push repo-url {:pull-now? false})
    (periodically-persist-app-metadata repo-url)))

(defn star-page!
  [page-name starred?]
  (state/star-page! (state/get-current-repo) page-name starred?))

(defn remove-repo!
  [{:keys [id url] :as repo}]
  (util/delete (str config/api "repos/" id)
               (fn []
                 (db/remove-conn! url)
                 (db/remove-db! url)
                 (db/remove-files-db! url)
                 (fs/rmdir (util/get-repo-dir url))
                 (state/delete-repo! repo))
               (fn [error]
                 (prn "Delete repo failed, error: " error))))

(defn rebuild-index!
  [{:keys [id url] :as repo}]
  (db/remove-conn! url)
  (db/clear-query-state!)
  (-> (p/let [_ (db/remove-db! url)
              _ (db/remove-files-db! url)]
        (fs/rmdir (util/get-repo-dir url)))
      (p/catch (fn [error]
                 (prn "Delete repo failed, error: " error)))
      (p/finally (fn []
                   (clone-and-pull url)))))

(defn remove-level-spaces
  [text format]
  (if-not (string/blank? text)
    (let [pattern (util/format
                   "^[%s]+\\s?"
                   (config/get-heading-pattern format))]
      (string/replace-first text (re-pattern pattern) ""))))

(defn edit-heading!
  [heading-id prev-pos format id]
  (let [heading (or
                 (db/pull [:heading/uuid heading-id])
                 ;; dummy?
                 {:heading/uuid heading-id
                  :heading/content ""})]
    (let [{:heading/keys [content]} heading
          content (remove-level-spaces content format)
          edit-input-id (str (subs id 0 (- (count id) 36)) heading-id)
          content-length (count content)
          text-range (if (or (= :max prev-pos) (<= content-length prev-pos))
                       content
                       (subs content 0 prev-pos))]
      (state/set-editing! edit-input-id content heading text-range))))

(defn clear-selection!
  [e]
  (when (state/in-selection-mode?)
    (doseq [heading (state/get-selection-headings)]
      (dom/remove-class! heading "selected")
      (dom/remove-class! heading "noselect"))
    (state/clear-selection!))
  (when e
    (when-not (util/input? (gobj/get e "target"))
      (util/clear-selection!))))

(defn- get-selected-headings-with-children
  []
  (when-let [headings (seq (get @state/state :selection/headings))]
    (mapcat (fn [heading]
              (cons heading
                    (array-seq (dom/by-class heading "ls-heading"))))
            headings)))

(defn copy-selection-headings
  []
  (when-let [headings (seq (get-selected-headings-with-children))]
    (let [repo (dom/attr (first headings) "repo")
          ids (distinct (map #(uuid (dom/attr % "headingid")) headings))
          content (some->> (db/get-headings-contents repo ids)
                           (map :heading/content)
                           (string/join ""))]
      (when-not (string/blank? content)
        (util/copy-to-clipboard! content)))))

(defn cut-selection-headings
  []
  (copy-selection-headings)
  (when-let [headings (seq (get-selected-headings-with-children))]
    (let [repo (dom/attr (first headings) "repo")
          ids (distinct (map #(uuid (dom/attr % "headingid")) headings))]
      (delete-headings! repo ids))))

(defn set-preferred-format!
  [format]
  (when format
    (state/set-preferred-format! format)
    (when (:name (:me @state/state))
      (util/post (str config/api "set_preferred_format")
                 {:preferred_format (name format)}
                 (fn [])
                 (fn [_e])))))

(defn clone-and-pull-repos
  [me]
  (if (and js/window.git js/window.pfs)
    (doseq [{:keys [id url]} (:repos me)]
      (let [repo url]
        (p/let [config-exists? (fs/file-exists?
                                (util/get-repo-dir url)
                                ".git/config")]
          (if (and config-exists?
                   (db/cloned? repo))
            (do
              (git-set-username-email! repo me)
              (periodically-pull-and-push repo {:pull-now? true})
              (periodically-persist-app-metadata repo))
            (clone-and-pull repo)))))
    (js/setTimeout (fn []
                     (clone-and-pull-repos me))
                   500)))

(defn set-github-token!
  [token]
  (state/set-github-token! token)
  (let [object-key (get-in @state/state [:me :encrypt_object_key])]
    (p/let [key (if object-key
                  (encrypt/get-key-from-object-key object-key)
                  (encrypt/generate-key))
            encrypted (encrypt/encrypt key token)
            object-key (or object-key
                           (encrypt/base64-key key))]
      (state/set-encrypt-token! encrypted)
      (util/post (str config/api "encrypt_object_key")
                 {:object-key object-key}
                 (fn []
                   (let [me (:me @state/state)]
                     (when (:repos me)
                       (clone-and-pull-repos me))))
                 (fn [_e])))))

(defn watch-for-date!
  []
  (js/setInterval #(state/set-today! (date/today))
                  10000))

(defn setup-local-repo-if-not-exists!
  []
  (if js/window.pfs
    (let [repo config/local-repo]
      (p/let [result (-> (fs/mkdir (str "/" repo))
                         (p/catch (fn [_e] nil)))
              _ (state/set-current-repo! repo)
              _ (db/start-db-conn! nil
                                   repo
                                   db-listen-to-tx!)
              _ (create-month-journal-if-not-exists repo)
              _ (create-config-file-if-not-exists repo)]
        (state/set-db-restoring! false)))
    (js/setTimeout setup-local-repo-if-not-exists! 100)))

(defn start!
  [render]
  (let [me (and js/window.user (bean/->clj js/window.user))
        logged? (:name me)
        repos (if logged?
                (:repos me)
                [{:url config/local-repo}])]
    (when me (set-state-kv! :me me))
    (state/set-db-restoring! true)
    (render)
    (-> (p/all (db/restore! (assoc me :repos repos) db-listen-to-tx! restore-config!))
        (p/then
         (fn []
           (if (and (not logged?)
                    (not (seq (db/get-files config/local-repo))))
             (setup-local-repo-if-not-exists!)
             (state/set-db-restoring! false))
           (watch-for-date!)
           (when me
             (when-let [object-key (:encrypt_object_key me)]
               (when-let [encrypted-token (state/get-encrypted-token)]
                 (->
                  (p/let [token (encrypt/decrypt object-key encrypted-token)]
                    ;; FIXME: Sometimes it has spaces in the front
                    (let [token (string/trim token)]
                      (state/set-github-token! token)
                      (clone-and-pull-repos me)))
                  (p/catch
                      (fn [error]
                        (println "Token decrypted failed")
                        (state/clear-encrypt-token!))))))))))))

(defn load-docs!
  []
  (redirect! {:to :home})
  ;; TODO: Allow user to overwrite this repo
  (let [docs-repo "https://github.com/logseq/docs"]
    (if (db/cloned? docs-repo)
      ;; switch to docs repo
      (state/set-current-repo! docs-repo)
      (p/let [_ (clone docs-repo)]
        (load-db-and-journals! docs-repo nil true)))))

;; sidebars
(defn hide-left-sidebar
  []
  (dom/add-class! (dom/by-id "menu")
                  "md:block")
  (dom/remove-class! (dom/by-id "left-sidebar")
                     "enter")
  (dom/remove-class! (dom/by-id "search")
                     "sidebar-open")
  (dom/remove-class! (dom/by-id "main")
                     "sidebar-open"))

(defn show-left-sidebar
  []
  (dom/remove-class! (dom/by-id "menu")
                     "md:block")
  (dom/add-class! (dom/by-id "left-sidebar")
                  "enter")
  (dom/add-class! (dom/by-id "search")
                  "sidebar-open")
  (dom/add-class! (dom/by-id "main")
                  "sidebar-open"))

(defn hide-right-sidebar
  []
  (let [sidebar (dom/by-id "right-sidebar")]
    (dom/remove-class! (dom/by-id "main-content-container")
                       "right-sidebar-open")
    (dom/remove-class! sidebar "enter")))

(defn show-right-sidebar
  []
  (let [sidebar (dom/by-id "right-sidebar")]
    (dom/add-class! sidebar "enter")
    (dom/add-class! (dom/by-id "main-content-container")
                    "right-sidebar-open")))

(defn toggle-right-sidebar
  []
  (let [sidebar (dom/by-id "right-sidebar")]
    (if (dom/has-class? sidebar "enter")
      (hide-right-sidebar)
      (show-right-sidebar))))

;; document.execCommand("undo", false, null);
(defn default-undo
  []
  (js/document.execCommand "undo" false nil))

;; document.execCommand("redo", false, null);
(defn default-redo
  []
  (js/document.execCommand "redo" false nil))

;; history
(defn undo!
  []
  (let [route (get-in (:route-match @state/state) [:data :name])]
    (if (and (contains? #{:home :page :file :tag} route)
             (not (state/get-edit-input-id))
             (state/get-current-repo))
      (let [repo (state/get-current-repo)
            k [:git/repo repo]]
        (history/undo! k re-render-root!))
      (default-undo))))

(defn redo!
  []
  (let [route (get-in (:route-match @state/state) [:data :name])]
    (if (and (contains? #{:home :page} route)
             (not (state/get-edit-input-id))
             (state/get-current-repo))
      (let [repo (state/get-current-repo)
            k [:git/repo repo]]
        (history/redo! k re-render-root!))
      (default-redo))))

;; excalidraw
(defn create-draws-directory!
  [repo]
  (let [repo-dir (util/get-repo-dir repo)]
    (util/p-handle
     (fs/mkdir (str repo-dir (str "/" config/default-draw-directory)))
     (fn [_result] nil)
     (fn [_error] nil))))

(defn save-excalidraw!
  [file data ok-handler]
  (let [path (str config/default-draw-directory "/" file)
        repo (state/get-current-repo)]
    (when repo
      (let [repo-dir (util/get-repo-dir repo)]
        (p/let [_ (create-draws-directory! repo)]
          (util/p-handle
           (fs/write-file repo-dir path data)
           (fn [_]
             (util/p-handle
              (git-add repo path)
              (fn [_]
                (ok-handler file)
                (let [modified-at (tc/to-long (t/now))]
                  (db/transact! repo
                    [{:file/path path
                      :file/last-modified-at modified-at}
                     {:page/name file
                      :page/file path
                      :page/last-modified-at (tc/to-long (t/now))
                      :page/journal? false}])))))
           (fn [error]
             (prn "Write file failed, path: " path ", data: " data)
             (js/console.dir error))))))))

(defn get-all-excalidraw-files
  [ok-handler]
  (when-let [repo (state/get-current-repo)]
    (p/let [_ (create-draws-directory! repo)]
      (let [dir (str (util/get-repo-dir repo)
                     "/"
                     config/default-draw-directory)]
        (util/p-handle
         (fs/readdir dir)
         (fn [files]
           (let [files (-> (filter #(string/ends-with? % ".excalidraw") files)
                           (distinct)
                           (sort)
                           (reverse))]
             (ok-handler files)))
         (fn [error]
           (js/console.dir error)))))))

(defn load-excalidraw-file
  [file ok-handler]
  (when-let [repo (state/get-current-repo)]
    (util/p-handle
     (load-file repo (str config/default-draw-directory "/" file))
     (fn [content]
       (ok-handler content))
     (fn [error]
       (prn "Error loading " file ": "
            error)))))

(defn git-remove-file!
  [repo file]
  (when-not (string/blank? file)
    (->
     (p/let [_ (git/remove-file repo file)
             result (fs/unlink (str (util/get-repo-dir repo)
                                    "/"
                                    file)
                               nil)]
       (set-git-status! repo :should-push)
       (when-let [file (db/entity repo [:file/path file])]
         (let [file-id (:db/id file)
               page-id (db/get-file-page-id (:file/path file))
               tx-data (map
                         (fn [db-id]
                           [:db.fn/retractEntity db-id])
                         (remove nil? [file-id page-id]))]
           (when (seq tx-data)
             (db/transact! repo tx-data)))))
     (p/catch (fn [err]
                (prn "error: " err))))))

(defn re-index-file!
  [file]
  (when-let [repo (state/get-current-repo)]
    (let [path (:file/path file)
          content (db/get-file path)]
      (alter-file repo path content {:re-render-root? true}))))


(comment
  (defn debug-latest-commits
    []
    (get-latest-commit (state/get-current-repo)
                       (fn [commits]
                         (prn (mapv :oid (bean/->clj commits))))
                       10))

  (defn debug-matrix
    []
    (p/let [changes (git/get-status-matrix (state/get-current-repo))]
      (prn changes)))

  (defn debug-file
    [path]
    (p/let [content (load-file (state/get-current-repo)
                               path)]
      (let [db-content (db/get-file path)]
        (prn {:content content
              :db-content db-content
              :utf8-length (utf8/length (utf8/encode content))}))))
  )
