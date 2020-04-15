(ns frontend.handler
  (:refer-clojure :exclude [clone load-file])
  (:require [frontend.git :as git]
            [frontend.fs :as fs]
            [frontend.state :as state]
            [frontend.db :as db]
            [frontend.storage :as storage]
            [frontend.util :as util]
            [frontend.config :as config]
            [clojure.walk :as walk]
            [clojure.string :as string]
            [promesa.core :as p]
            [cljs-bean.core :as bean]
            [reitit.frontend.easy :as rfe]
            [goog.crypt.base64 :as b64]
            [goog.object :as gobj]
            [goog.dom :as gdom]
            [rum.core :as rum]
            [datascript.core :as d]
            [frontend.utf8 :as utf8]
            [frontend.image :as image]
            [clojure.set :as set]
            [cljs-bean.core :as bean])
  (:import [goog.events EventHandler]))

;; TODO: replace all util/p-handle with p/let
;; TODO: separate git status for push-failed, pull-failed, etc
(defn set-state-kv!
  [key value]
  (swap! state/state assoc key value))

(defn get-github-token
  []
  (get-in @state/state [:me :access-token]))

(defn load-file
  [repo-url path]
  (fs/read-file (git/get-repo-dir repo-url) path))

(defn- hidden?
  [path patterns]
  (some (fn [pattern]
          (or
           (= path pattern)
           (and (string/starts-with? pattern "/")
                (= (str "/" (first (string/split path #"/")))
                   pattern)))) patterns))

(defn- get-format
  [file]
  (string/lower-case (last (string/split file #"\."))))

;; Add coding too
(defonce text-formats
  #{:json :org :md :xml :yml :dat :asciidoc :rst :txt :markdown :adoc :html :js :ts :clj :ml :rb :ex :erl :java :php :c})

(defonce img-formats
  #{:gif :svg :jpeg :ico :png :jpg :bmp})

(defonce all-formats
  (set/union text-formats img-formats))

(defn- keep-formats
  [files formats]
  (filter
   (fn [file]
     (let [format (keyword (get-format file))]
       (contains? formats format)))
   files))

(defn- only-text-formats
  [files]
  (keep-formats files text-formats))

;; TODO: no atom version
(defn load-files
  [repo-url]
  (set-state-kv! :repo/cloning? false)
  (set-state-kv! :repo/loading-files? true)
  (let [files-atom (atom nil)]
    (-> (p/let [files (bean/->clj (git/list-files repo-url))
                patterns-content (load-file repo-url config/hidden-file)]
          (reset! files-atom files)
          (when patterns-content
            (let [patterns (string/split patterns-content #"\n")]
              (reset! files-atom (remove (fn [path] (hidden? path patterns)) files)))))
        (p/finally
          (fn []
            @files-atom)))))

(defn- set-latest-commit!
  [hash]
  (set-state-kv! :git/latest-commit hash)
  (storage/set :git/latest-commit hash))

(defn- set-git-status!
  [value]
  (set-state-kv! :git/status value)
  (storage/set :git/status value))

(defn- set-git-error!
  [value]
  (set-state-kv! :git/error value)
  (if value
    (storage/set :git/error (str value))
    (storage/remove :git/error)))

(defn set-latest-journals!
  []
  (set-state-kv! :latest-journals (db/get-latest-journals {})))

(defn git-add-commit
  [repo-url file message content]
  (set-git-status! :commit)
  (db/reset-file! repo-url file content)
  (git/add-commit repo-url file message
                  (fn []
                    (set-git-status! :should-push))
                  (fn [error]
                    (prn "Commit failed, "
                         {:repo repo-url
                          :file file
                          :message message})
                    (set-git-status! :commit-failed)
                    (set-git-error! error))))

;; journals

;; org-journal format, something like `* Tuesday, 06/04/13`
(defn default-month-journal-content
  []
  (let [{:keys [year month day]} (util/get-date)
        last-day (util/get-month-last-day)
        month-pad (if (< month 10) (str "0" month) month)]
    (->> (map
           (fn [day]
             (let [day-pad (if (< day 10) (str "0" day) day)
                   weekday (util/get-weekday (js/Date. year (dec month) day))]
               (str "* " weekday ", " month-pad "/" day-pad "/" year "\n\n")))
           (range 1 (inc last-day)))
         (apply str))))

(defn create-month-journal-if-not-exists
  [repo-url]
  (let [repo-dir (git/get-repo-dir repo-url)
        path (util/current-journal-path)
        file-path (str "/" path)
        default-content (default-month-journal-content)]
    (p/let [_ (-> (fs/mkdir (str repo-dir "/journals"))
                  (p/catch identity))
            file-exists? (fs/create-if-not-exists repo-dir file-path default-content)]
      (when-not file-exists?
        (git-add-commit repo-url path "create a month journal" default-content)))))

(defn load-files-contents!
  [repo-url files ok-handler]
  (let [files (only-text-formats files)]
    (p/let [contents (p/all (doall
                             (for [file files]
                               (load-file repo-url file))))]
      (ok-handler
       (zipmap files contents)))))

(defn load-repo-to-db!
  [repo-url files diffs first-clone?]
  (set-state-kv! :repo/loading-files? false)
  (set-state-kv! :repo/importing-to-db? true)
  (let [load-contents (fn [files delete-files delete-headings]
                        (load-files-contents!
                         repo-url
                         files
                         (fn [contents]
                           (let [headings (db/extract-all-headings repo-url contents)]
                             (db/reset-contents-and-headings! repo-url contents headings delete-files delete-headings)
                             (set-state-kv! :repo/importing-to-db? false)))))]

    (if first-clone?
      (load-contents files nil nil)
      (when (seq diffs)
        (let [filter-diffs (fn [type] (->> (filter (fn [f] (= type (:type f))) diffs)
                                           (map :path)))
              remove-files (filter-diffs "remove")
              modify-files (filter-diffs "modify")
              add-files (filter-diffs "add")
              delete-files (if (seq remove-files)
                             (db/delete-files repo-url remove-files))
              delete-headings (db/delete-headings repo-url (concat remove-files modify-files))
              add-or-modify-files (util/remove-nils (concat add-files modify-files))]
          (load-contents add-or-modify-files delete-files delete-headings))))))

(defn journal-file-changed?
  [repo-url diffs]
  (contains? (set (map :path diffs))
             (db/get-current-journal-path)))

(defn load-db-and-journals!
  [repo-url diffs first-clone?]
  (when (or diffs first-clone?)
    (p/let [files (load-files repo-url)
            _ (load-repo-to-db! repo-url files diffs first-clone?)
            _ (create-month-journal-if-not-exists repo-url)]
      (when (or (journal-file-changed? repo-url diffs)
                (empty? (:latest-journals @state/state)))
        (set-latest-journals!)))))

(defn show-notification!
  [content status]
  (swap! state/state assoc
         :notification/show? true
         :notification/content content
         :notification/status status)
  (when-not (= status :error)
    (js/setTimeout #(swap! state/state assoc
                           :notification/show? false
                           :notification/content nil
                           :notification/status nil)
                   5000)))

(defn- clear-storage
  []
  (p/let [_idb-clear (js/window.pfs._idb.wipe)]
    (js/localStorage.clear)
    (set! (.-href js/window.location) "/")))

(defn pull
  [repo-url token]
  (let [status (:git/status @state/state)]
    (when (and
          (not (:edit? @state/state))
          (nil? (:git/error @state/state))
          (or (nil? status)
              (= status :pulling)))
     (set-git-status! :pulling)
     (let [latest-commit (:git/latest-commit @state/state)]
       (p/let [result (git/fetch repo-url token)
               {:keys [fetchHead]} (bean/->clj result)
               _ (set-latest-commit! fetchHead)]
         (-> (git/merge repo-url)
             (p/then (fn [result]
                       (-> (git/checkout repo-url)
                           (p/then (fn [result]
                                     (set-git-status! nil)
                                     (when (and latest-commit fetchHead
                                                (not= latest-commit fetchHead))
                                       (p/let [diffs (git/get-diffs repo-url latest-commit fetchHead)]
                                         (load-db-and-journals! repo-url diffs false)))))
                           (p/catch (fn [error]
                                      (set-git-status! :checkout-failed)
                                      (set-git-error! error))))))
             (p/catch (fn [error]
                        (set-git-status! :merge-failed)
                        (set-git-error! error)
                        (show-notification!
                         [:p.content
                          "Merges with conflicts are not supported yet, please "
                          [:span.text-gray-700.font-bold
                           "make sure saving all your changes elsewhere"]
                          ". After that, click "
                          [:a.font-bold {:href ""
                                         :on-click clear-storage}
                           "Pull again"]
                          " to pull the latest changes."]
                         :error)))))))))

(defn pull-current-repo
  []
  (when-let [repo (db/get-current-repo)]
    (when-let [token (get-github-token)]
      (pull repo token))))

(defn periodically-pull
  [repo-url pull-now?]
  (when-let [token (get-github-token)]
    (when pull-now? (pull repo-url token))
    (js/setInterval #(pull repo-url token)
                    (* config/auto-pull-secs 1000))))

(defn get-latest-commit
  [handler]
  (-> (p/let [commits (git/log (db/get-current-repo)
                               (get-github-token)
                               1)]
        (handler (first commits)))
      (p/catch (fn [error]
                 (prn "get latest commit failed: " error)))))

(defn set-latest-commit-if-exists! []
  (get-latest-commit
   (fn [commit]
     (when-let [hash (gobj/get commit "oid")]
       (set-latest-commit! hash)))))

;; TODO: update latest commit
(defn push
  [repo-url]
  (when (and
         (not (:edit? @state/state))
         (= :should-push (:git/status @state/state))
         (nil? (:git/error @state/state)))
    (set-git-status! :push)
    (let [token (get-github-token)]
      (util/p-handle
       (git/push repo-url token)
       (fn []
         (prn "Push successfully!")
         (set-git-status! nil)
         (set-git-error! nil)
         (set-latest-commit-if-exists!))
       (fn [error]
         (prn "Failed to push, error: " error)
         (set-git-status! :push-failed)
         (set-git-error! error)
         (show-notification!
          [:p.content
           "Failed to push, please "
           [:span.text-gray-700.font-bold
            "make sure saving all your changes elsewhere"]
           ". After that, click "
           [:a.font-bold {:href ""
                          :on-click clear-storage}
            "Pull again"]
           " to pull the latest changes."]
          :error))))))

(defn clone
  [repo]
  (let [token (get-github-token)]
    (util/p-handle
     (do
       (set-state-kv! :repo/cloning? true)
       (git/clone repo token))
     (fn []
       (db/mark-repo-as-cloned repo)
       (set-latest-commit-if-exists!)
       (util/post (str config/api "repos")
                  {:url repo}
                  (fn [result]
                    (swap! state/state
                           update-in [:user :repos] conj result))
                  (fn [error]
                    (prn "Something wrong!"))))
     (fn [e]
       (set-state-kv! :repo/cloning? false)
       (set-git-status! :clone-failed)
       (set-git-error! e)
       (prn "Clone failed, reason: " e)))))

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
                                    now (util/get-local-date)]
                                (when (and (contains? #{"Scheduled" "Deadline"} type)
                                           (= (assoc date :hour hour :minute min) now))
                                  (let [notification-text (str type ": " (second (first title)))]
                                    (new-notification notification-text)))))))))]
      (notify-fn)
      (js/setInterval notify-fn (* 1000 60)))))

(defn alter-file
  ([path commit-message content]
   (alter-file path commit-message content true))
  ([path commit-message content redirect?]
   (let [token (get-github-token)
         repo-url (db/get-current-repo)]
     (util/p-handle
      (fs/write-file (git/get-repo-dir repo-url) path content)
      (fn [_]
        (when redirect?
          (rfe/push-state :file {:path (b64/encodeString path)}))
        (git-add-commit repo-url path commit-message content))))))

;; TODO: utf8 encode performance
(defn check
  [heading]
  (let [{:heading/keys [repo file marker meta uuid]} heading
        pos (:pos meta)
        repo (db/entity (:db/id repo))
        file (db/entity (:db/id file))
        repo-url (:repo/url repo)
        file (:file/path file)
        token (get-github-token)]
    (when-let [content (db/get-file-content repo-url file)]
      (let [encoded-content (utf8/encode content)
            content' (str (utf8/substring encoded-content 0 pos)
                          (-> (utf8/substring encoded-content pos)
                              (string/replace-first marker "DONE")))]
        (util/p-handle
         (fs/write-file (git/get-repo-dir repo-url) file content')
         (fn [_]
           (prn "check successfully, " file)
           (git-add-commit repo-url file
                           (str marker " marked as DONE")
                           content')))))))

(defn uncheck
  [heading]
  (let [{:heading/keys [repo file marker meta]} heading
        pos (:pos meta)
        repo (db/entity (:db/id repo))
        file (db/entity (:db/id file))
        repo-url (:repo/url repo)
        file (:file/path file)
        token (get-github-token)]
    (when-let [content (db/get-file-content repo-url file)]
      (let [encoded-content (utf8/encode content)
            content' (str (utf8/substring encoded-content 0 pos)
                          (-> (utf8/substring encoded-content pos)
                              (string/replace-first "DONE" "TODO")))]
        (util/p-handle
         (fs/write-file (git/get-repo-dir repo-url) file content')
         (fn [_]
           (prn "uncheck successfully, " file)
           (git-add-commit repo-url file
                           "DONE rollbacks to TODO."
                           content')))))))

(defn git-set-username-email!
  [{:keys [name email]}]
  (when (and name email)
    (git/set-username-email
     (git/get-repo-dir (db/get-current-repo))
     name
     email)))

(defn set-route-match!
  [route]
  (swap! state/state assoc :route-match route))

(defn set-ref-component!
  [k ref]
  (swap! state/state assoc :ref-components k ref))

(defn set-root-component!
  [comp]
  (swap! state/state assoc :root-component comp))

(defn re-render!
  []
  (when-let [comp (get @state/state :root-component)]
    (when (and (not (:edit? @state/state)))
      (rum/request-render comp))))

(defn db-listen-to-tx!
  []
  (d/listen! db/conn :persistence
             (fn [tx-report]
               (when-let [db (:db-after tx-report)]
                 (prn "DB changed, re-rendered!")
                 (re-render!)
                 (js/setTimeout (fn []
                                  (db/persist db)) 0)))))

(defn periodically-push-tasks
  [repo-url]
  (let [token (get-github-token)
        push (fn []
               (push repo-url))]
    (js/setInterval push
                    (* config/auto-push-secs 1000))))

(defn periodically-pull-and-push
  [repo-url {:keys [pull-now?]
             :or {pull-now? true}}]
  (periodically-pull repo-url pull-now?)
  (periodically-push-tasks repo-url))

(defn clone-and-pull
  [repo-url]
  (p/then (clone repo-url)
          (fn []
            (git-set-username-email! (:me @state/state))
            (load-db-and-journals! repo-url nil true)
            (periodically-pull-and-push repo-url {:pull-now? false}))))

(defn edit-journal!
  [content journal]
  (swap! state/state assoc
         :edit? true
         :edit-journal journal))

(defn set-journal-content!
  [uuid content]
  (swap! state/state update :latest-journals
         (fn [journals]
           (mapv
            (fn [journal]
              (if (= (:uuid journal) uuid)
                (assoc journal :content content)
                journal))
            journals))))

(defn save-current-edit-journal!
  [edit-content]
  (let [{:keys [edit-journal]} @state/state
        {:keys [start-pos end-pos]} edit-journal]
    (swap! state/state assoc
           :edit? false
           :edit-journal nil)
    (when-not (= edit-content (:content edit-journal)) ; if new changes
      (let [path (:file-path edit-journal)
            current-journals (db/get-file path)
            new-content (utf8/insert! current-journals start-pos end-pos edit-content)]
        (set-state-kv! :latest-journals (db/get-latest-journals {:content new-content}))
        (alter-file path "Auto save" new-content false)))))

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
           (fs/read-file-2 (git/get-repo-dir (db/get-current-repo))
                           path)
           (fn [blob]
             (let [blob (js/Blob. (array blob) (clj->js {:type "image"}))
                   img-url (image/create-object-url blob)]
               (gobj/set img "src" img-url)
               (gobj/set (gobj/get img "style")
                         "display" "initial")))))))))

(defn load-more-journals!
  []
  (let [journals (:latest-journals @state/state)]
    (when-let [title (:title (last journals))]
      (let [before-date (last (string/split title #", "))
            more-journals (->> (db/get-latest-journals {:before-date before-date
                                                        :days 4})
                               (drop 1))
            journals (concat journals more-journals)]
        (set-state-kv! :latest-journals journals)))))

(defn request-presigned-url
  [file filename mime-type url-handler]
  (cond
    (> (gobj/get file "size") (* 5 1024 1024))
    (show-notification! [:p "Sorry, we don't support any file that's larger than 5MB."] :error)

    :else
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
                                               (if signed-url
                                                 (do
                                                   (prn "Get a singed url: " signed-url)
                                                   (url-handler signed-url))
                                                 (prn "Something error, can't get a valid signed url.")))
                                             (fn [error]
                                               (prn "Something error, can't get a valid signed url."))))
                                (fn [error]
                                  (prn "upload failed.")
                                  (js/console.dir error)))
                   ;; TODO: notification, or re-try
                   (prn "failed to get any presigned url, resp: " resp)))
               (fn [_error]
                 ;; (prn "Get token failed, error: " error)
                 ))))

(defn set-me-if-exists!
  []
  (when js/window.user
    (when-let [me (bean/->clj js/window.user)]
      (set-state-kv! :me me)
      me)))

(defn sign-out!
  [e]
  (.preventDefault e)
  (p/let [_idb-clear (js/window.pfs._idb.wipe)]
    (js/localStorage.clear)
    (set! (.-href js/window.location) "/logout")))

(defn set-format-js-loading!
  [format value]
  (when format
    (swap! state/state assoc-in [:format/loading format] value)))

(defn reset-cursor-pos!
  [e]
  (let [new-pos (gobj/getValueByKeys e "target" "selectionEnd")]
    (println "cursor position: " new-pos)
    (reset! state/cursor-pos new-pos)))

(defn set-edit-node!
  [ref]
  (reset! state/edit-node ref))

(defn move-cursor-to-end [input]
  (let [n (count (.-value input))]
    (set! (.-selectionStart input) n)
    (set! (.-selectionEnd input) n)))

(defn insert-image!
  [image-url]
  (let [content @state/edit-content
        image (str "<img src=\"" image-url "\" />")
        new-content (str content "\n" "#+BEGIN_EXPORT html\n" image "\n#+END_EXPORT\n")
        node @state/edit-node]
    (reset! state/edit-content new-content)
    (set! (.-value node) new-content)
    (move-cursor-to-end node)))

(defn start!
  []
  (let [me (set-me-if-exists!)]
    (db/restore! me)
    (set-latest-journals!)
    (db-listen-to-tx!)
    ;; Currently, we support only one repo.
    (when-let [repo (first (db/get-repos))]
      (if (db/cloned? repo)
        (periodically-pull-and-push repo {:pull-now? true})
        (clone-and-pull repo)))))
