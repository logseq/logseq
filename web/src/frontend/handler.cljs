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
            [frontend.image :as image])
  (:import [goog.events EventHandler]))

;; We only support Github token now
(defn load-file
  [repo-url path state-handler]
  (util/p-handle (fs/read-file (git/get-repo-dir repo-url) path)
                 (fn [content]
                   (state-handler content))))

(defn- hidden?
  [path patterns]
  (some (fn [pattern]
          (or
           (= path pattern)
           (and (string/starts-with? pattern "/")
                (= (str "/" (first (string/split path #"/")))
                   pattern)))) patterns))

(defn load-files
  [repo-url]
  (util/p-handle (git/list-files repo-url)
                 (fn [files]
                   (when (> (count files) 0)
                     (let [files (js->clj files)]
                       ;; FIXME: don't load blobs
                       (if (contains? (set files) config/hidden-file)
                         (load-file repo-url config/hidden-file
                                    (fn [patterns-content]
                                      (when patterns-content
                                        (let [patterns (string/split patterns-content #"\n")
                                              files (remove (fn [path] (hidden? path patterns)) files)]
                                          (db/transact-files! repo-url files)))))
                         (p/promise (db/transact-files! repo-url files))))))))


;; TODO: remove this
(declare load-repo-to-db!)

(defn get-latest-commit
  [handler]
  (-> (git/log (db/get-current-repo)
               (db/get-github-token)
               1)
      (.then (fn [commits]
               (handler (first commits))))
      (.catch (fn [error]
                (prn "get latest commit failed: " error)))))

(defonce latest-commit (atom nil))

;; TODO: Maybe replace with fetch?
;; TODO: callback hell
(defn pull
  [repo-url token]
  (when (and (nil? (:git-error @state/state))
             (nil? (:git-status @state/state)))
    (util/p-handle
     (git/pull repo-url token)
     (fn [result]
       (prn "pull successfully!")
       (get-latest-commit
        (fn [commit]
          (when (or (nil? @latest-commit)
                    (and @latest-commit
                         commit
                         (not= (gobj/get commit "oid")
                               (gobj/get @latest-commit "oid"))))
            (prn "New commit oid: " (gobj/get commit "oid"))
            (-> (load-files repo-url)
                (p/then
                 (fn []
                   (load-repo-to-db! repo-url)))))
          (reset! latest-commit commit)))))))

(defn periodically-pull
  [repo-url]
  (when-let [token (db/get-github-token)]
    (pull repo-url token)
    (js/setInterval #(pull repo-url token)
                    (* 60 1000))))

(defn git-add-commit
  [repo-url file message content]
  (swap! state/state assoc :git-status :commit)
  (db/reset-file! repo-url file content)
  (git/add-commit repo-url file message
                  (fn []
                    (swap! state/state assoc
                           :git-status :should-push))
                  (fn [error]
                    (prn "Commit failed, "
                         {:repo repo-url
                          :file file
                          :message message})
                    (swap! state/state assoc
                           :git-status :commit-failed
                           :git-error error))))

;; TODO: update latest commit
(defn push
  [repo-url file]
  (when (and (= :should-push (:git-status @state/state))
             (nil? (:git-error @state/state)))
    (swap! state/state assoc :git-status :push)
    (let [token (db/get-github-token)]
      (util/p-handle
       (git/push repo-url token)
       (fn []
         (prn "Push successfully!")
         (swap! state/state assoc
                :git-status nil
                :git-error nil)
         ;; TODO: update latest-commit
         (get-latest-commit
          (fn [commit]
            (reset! latest-commit commit))))
       (fn [error]
         (prn "Failed to push, error: " error)
         (swap! state/state assoc
                :git-status :push-failed
                :git-error error))))))

(defn clone
  [repo]
  (let [token (db/get-github-token)]
    (util/p-handle
     (do
       (db/set-repo-cloning repo true)
       (git/clone repo token))
     (fn []
       (db/set-repo-cloning repo false)
       (db/mark-repo-as-cloned repo)
       (db/set-current-repo! repo)
       ;; load contents
       (load-files repo))
     (fn [e]
       (db/set-repo-cloning repo false)
       (prn "Clone failed, reason: " e)))))

(defn new-notification
  [text]
  (js/Notification. "Gitnotes" #js {:body text
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

(defn show-notification!
  [text]
  (swap! state/state assoc
         :notification/show? true
         :notification/text text)
  (js/setTimeout #(swap! state/state assoc
                         :notification/show? false
                         :notification/text nil)
                 3000))

(defn alter-file
  ([path commit-message content]
   (alter-file path commit-message content true))
  ([path commit-message content redirect?]
   (let [token (db/get-github-token)
         repo-url (db/get-current-repo)]
     (util/p-handle
      (fs/write-file (git/get-repo-dir repo-url) path content)
      (fn [_]
        (when redirect?
          (rfe/push-state :file {:path (b64/encodeString path)}))
        (git-add-commit repo-url path commit-message content))))))

(defn clear-storage
  [repo-url]
  (js/window.pfs._idb.wipe)
  (clone repo-url))

;; TODO: utf8 encode performance
(defn check
  [heading]
  (let [{:heading/keys [repo file marker meta uuid]} heading
        pos (:pos meta)
        repo (db/entity (:db/id repo))
        file (db/entity (:db/id file))
        repo-url (:repo/url repo)
        file (:file/path file)
        token (db/get-github-token)]
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
                           (util/format "`%s` marked as DONE." marker)
                           content')))))))

(defn uncheck
  [heading]
  (let [{:heading/keys [repo file marker meta]} heading
        pos (:pos meta)
        repo (db/entity (:db/id repo))
        file (db/entity (:db/id file))
        repo-url (:repo/url repo)
        file (:file/path file)
        token (db/get-github-token)]
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

(defn remove-non-text-files
  [files]
  (remove
   (fn [file]
     (not (contains?
           #{"org"
             "md"
             "markdown"
             "txt"}
           (string/lower-case (last (string/split file #"\."))))))
   files))

(defn load-all-contents!
  [repo-url ok-handler]
  (let [files (db/get-repo-files repo-url)
        files (remove-non-text-files files)]
    (-> (p/all (for [file files]
                 (load-file repo-url file
                            (fn [content]
                              (db/set-file-content! repo-url file content)))))
        (p/then
         (fn [_]
           (ok-handler))))))

(defonce headings-atom (atom nil))

(defn load-repo-to-db!
  [repo-url]
  (load-all-contents!
   repo-url
   (fn []
     (let [headings (db/extract-all-headings repo-url)]
       (reset! headings-atom headings)
       (db/reset-headings! repo-url headings)))))


;; (defn sync
;;   []
;;   (let [[_user token repos] (get-user-token-repos)]
;;     (doseq [repo repos]
;;       (pull repo token))))

(defn get-github-access-token
  ([]
   (util/fetch (str config/api "token/github")
               (fn [resp]
                 (if (:success resp)
                   (db/transact-github-token! (get-in resp [:body :access_token]))
                   (prn "Get token failed, error: " resp)))
               (fn [error]
                 (prn "Get token failed, error: " error))))
  ([code]
   (util/fetch (str config/api "oauth/github?code=" code)
               (fn [resp]
                 (if (:success resp)
                   (do
                     (db/transact-github-token! (get-in resp [:body :access_token]))
                     ;; redirect to home
                     (rfe/push-state :home))
                   (prn "Get token failed, error: " resp)))
               (fn [error]
                 (prn "Get token failed, error: " error)))))

;; journals
(defn create-month-journal-if-not-exists
  [repo-url]
  (let [repo-dir (git/get-repo-dir repo-url)
        path (util/current-journal-path)
        {:keys [year month day weekday]} (util/get-date)
        file-path (str "/" path)
        ;; org-journal format, something like `* Tuesday, 06/04/13`
        month (if (< month 10) (str "0" month) month)
        day (if (< day 10) (str "0" day) day)
        default-content (util/format "* %s, %s/%s/%d\n" weekday month day year)]
    (->
     (util/p-handle
      (fs/mkdir (str repo-dir "/journals"))
      (fn [result]
        (fs/create-if-not-exists repo-dir file-path default-content))
      (fn [error]
        (fs/create-if-not-exists repo-dir file-path default-content)))
     (util/p-handle
      (fn [file-exists?]
        (if file-exists?
          (prn "Month journal already exists!")
          (do
            (prn "create a month journal")
            (git-add-commit repo-url path "create a month journal" default-content))))
      (fn [error]
        (prn error))))))

(defn clone-and-pull
  [repo]
  (p/then (clone repo)
          (fn []
            (create-month-journal-if-not-exists repo)
            (periodically-pull repo))))

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
    (when-not (:edit? @state/state)
      (rum/request-render comp))))

(defn db-listen-to-tx!
  []
  (d/listen! db/conn :persistence
             (fn [tx-report] ;; FIXME do not notify with nil as db-report
               ;; FIXME do not notify if tx-data is empty
               (when-let [db (:db-after tx-report)]
                 (prn "DB changed, re-rendered!")
                 (re-render!)
                 (js/setTimeout (fn []
                                  (db/persist db)) 0)))))

(defn periodically-push-tasks
  [repo-url]
  (let [token (db/get-github-token)
        push (fn []
               (push repo-url token))]
    (js/setInterval push
                    (* 10 1000))))

(defn periodically-pull-and-push
  [repo-url]
  (periodically-pull repo-url)
  ;; (periodically-push-tasks repo-url)
  )

(defn set-state-kv!
  [key value]
  (swap! state/state assoc key value))

(defn edit-journal!
  [content journal]
  (swap! state/state assoc
         :edit? true
         :edit-journal journal))

(defn set-latest-journals!
  []
  (set-state-kv! :latest-journals (db/get-latest-journals {})))

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
        (prn {:new-content new-content})
        (set-state-kv! :latest-journals (db/get-latest-journals {:content new-content}))
        (alter-file path "Auto save" new-content false)))))

(defn render-local-images!
  []
  (let [images (array-seq (gdom/getElementsByTagName "img"))
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
                       "display" "initial"))))))))

;; FIXME:
(defn set-username-email
  []
  (git/set-username-email
   (git/get-repo-dir (db/get-current-repo))
   "Tienson Qin"
   "tiensonqin@gmail.com"))

(defn start!
  []
  (db/restore!)
  (db-listen-to-tx!)
  (when-let [first-repo (first (db/get-repos))]
    (db/set-current-repo! first-repo))
  (let [repos (db/get-repos)]
    (doseq [repo repos]
      (create-month-journal-if-not-exists repo)
      (periodically-pull-and-push repo))))

(comment
  (util/p-handle (fs/read-file (git/get-repo-dir (db/get-current-repo)) "test.org")
                 (fn [content]
                   (prn content)))

  (pull (db/get-current-repo) (db/get-github-token))
  )
