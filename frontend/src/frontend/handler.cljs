(ns frontend.handler
  (:refer-clojure :exclude [clone load-file])
  (:require [frontend.git :as git]
            [frontend.fs :as fs]
            [frontend.state :as state]
            [frontend.db :as db]
            [frontend.storage :as storage]
            [frontend.util :as util]
            [frontend.format.org-mode :as org]
            [frontend.format.org.block :as block]
            [frontend.config :as config]
            [clojure.walk :as walk]
            [clojure.string :as string]
            [promesa.core :as p]
            [frontend.api :as api])
  (:import [goog.events EventHandler]))

(defn load-file
  ([path]
   (util/p-handle (fs/read-file path)
                  (fn [content]
                    (let [state @state/state
                          state' (-> state
                                     (assoc-in [:contents path] content)
                                     (assoc-in [:loadings path] false)
                                     (assoc :current-file path))]
                      (reset! state/state state')))))
  ([path state-handler]
   (util/p-handle (fs/read-file path)
                  (fn [content]
                    (state-handler content)))))

(defn- hidden?
  [path patterns]
  (some (fn [pattern]
          (or
           (= path pattern)
           (and (string/starts-with? pattern "/")
                (= (str "/" (first (string/split path #"/")))
                   pattern)))) patterns))

(defn load-files
  []
  (util/p-handle (git/list-files)
                 (fn [files]
                   (when (> (count files) 0)
                     (let [files (js->clj files)]
                       (if (contains? (set files) config/hidden-file)
                         (load-file config/hidden-file
                                    (fn [patterns-content]
                                      (let [patterns (string/split patterns-content #"\n")
                                            files (remove (fn [path] (hidden? path patterns)) files)]
                                        (swap! state/state
                                               assoc :files files))))
                         (swap! state/state
                                assoc :files files)))))))

(defn extract-links
  [form]
  (let [links (atom [])]
    (clojure.walk/postwalk
     (fn [x]
       (when (and (vector? x)
                  (= "Link" (first x)))
         (let [[_ {:keys [url label]}] x
               [_ {:keys [protocol link]}] url
               link (str protocol ":" link)]
           (swap! links conj link)))
       x)
     form)
    @links))

(defn load-links
  ([]
   (load-links config/links-org))
  ([path]
   (util/p-handle (fs/read-file path)
                  (fn [content]
                    (when content
                      (let [blocks (org/parse-json content)
                            blocks (-> (.parse js/JSON blocks)
                                       (js->clj :keywordize-keys true))]
                        (when (seq blocks)
                          (swap! state/state assoc :links (extract-links blocks)))))))))

(defn load-from-disk
  []
  (let [cloned? (storage/get :cloned?)]
    (swap! state/state assoc
           :cloned? cloned?
           :github-username (storage/get :github-username)
           :github-token (storage/get :github-token)
           :github-repo (storage/get :github-repo))
    (when cloned?
      (load-files)
      (load-links))))

(defn periodically-pull
  []
  (let [username (storage/get :github-username)
        token (storage/get :github-token)
        pull (fn []
               (util/p-handle (git/pull username token)
                              (fn [_result]
                                ;; TODO: diff
                                (load-files)))
               (load-links))]
    (pull)
    (js/setInterval pull
                    (* 60 1000))))

(defn add-transaction
  [tx]
  (swap! state/state update :tasks-transactions conj tx))

(defn clear-transactions!
  []
  (swap! state/state assoc :tasks-transactions nil))

(defn- transactions->commit-msg
  [transactions]
  (let [transactions (reverse transactions)]
    (str
     "Orgnote auto save tasks.\n\n"
     (string/join "\n" transactions))))

(defn periodically-push-tasks
  []
  (let [github-token (storage/get :github-token)
        push (fn []
               (let [transactions (:tasks-transactions @state/state)]
                 (when (seq transactions)
                   (git/add-commit-push
                    config/tasks-org
                    (transactions->commit-msg transactions)
                    github-token
                    (fn []
                      (prn "Commit tasks to Github.")
                      (clear-transactions!))
                    (fn []
                      (prn "Failed to push."))))))]
    (js/setInterval push
                    (* 5 1000))))

(defn clone
  [github-username github-token github-repo]
  (util/p-handle
   (do
     (swap! state/state assoc
            :cloning? true)
     (git/clone github-username github-token github-repo))
   (fn []
     (swap! state/state assoc
            :cloned? true)
     (storage/set :cloned? true)
     (swap! state/state assoc
            :cloning? false)
     (periodically-pull))
   (fn [e]
     (prn "Clone failed, reason: " e))))

(defonce event-handler (EventHandler.))

(defn listen-to-resize
  []
  (util/listen event-handler js/window :resize
               (fn []
                 (swap! state/state assoc :width (util/get-width)))))

(defn toggle-drawer?
  [switch]
  (swap! state/state assoc :drawer? switch))

(defn change-page
  [page]
  (swap! state/state assoc :current-page page))

(defn reset-current-file
  []
  (swap! state/state assoc :current-file nil))

(defn toggle-link-dialog?
  [switch]
  (swap! state/state assoc :add-link-dialog? switch))

(defn add-new-link
  [link message]
  (if-let [github-token (storage/get :github-token)]
    (util/p-handle (fs/read-file config/links-org)
                   (fn [content]
                     (let [content' (str content "\n** " link)]
                       (util/p-handle
                        (fs/write-file config/links-org content')
                        (fn [_]
                          (git/add-commit-push config/links-org
                                               message
                                               github-token
                                               (fn []
                                                 (toggle-link-dialog? false))
                                               (fn []
                                                 (.log js/console "Failed to push the new link."))))))))
    (.log js/console "Github token does not exists!")))

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

(defn hide-snackbar
  []
  (swap! state/state assoc
         :snackbar? false
         :snackbar-message nil))

(defn show-snackbar
  [message]
  (swap! state/state assoc
         :snackbar? true
         :snackbar-message message)
  (js/setTimeout hide-snackbar 3000))

(defn alter-file
  [file]
  (when-let [content (get-in @state/state [:contents file])]
    (let [content' (get-in @state/state [:editing-files file])]
      (when-not (= (string/trim content)
                   (string/trim content'))
        (let [github-token (:github-token @state/state)
              path [:commit-message file]
              message (get-in @state/state path (str "Update " file))]
          (util/p-handle
           (fs/write-file file content')
           (fn [_]
             (git/add-commit-push file
                                  message
                                  github-token
                                  (fn []
                                    (swap! state/state util/dissoc-in path)
                                    (swap! state/state assoc-in [:contents file] content')
                                    (show-snackbar "File updated!")
                                    (change-page :home))
                                  (fn []
                                    (prn "Failed to update file."))))))))))

(defn clear-storage
  []
  (js/window.pfs._idb.wipe)
  (storage/set :cloned? false)
  (swap! state/state assoc
         :cloned? false
         :contents nil
         :files nil)
  (clone (:github-username @state/state)
         (:github-token @state/state)
         (:github-repo @state/state)))

(defn check
  [marker pos]
  (let [file config/tasks-org
        github-token (storage/get :github-token)]
    (when-let [content (get-in @state/state [:contents file])]
      (let [content' (str (subs content 0 pos)
                          (-> (subs content pos)
                              (string/replace-first marker "DONE")))]
        ;; TODO: optimize, only update the specific block
        ;; (build-tasks content' file)
        (util/p-handle
         (fs/write-file file content')
         (fn [_]
           (swap! state/state assoc-in [:contents file] content')
           (add-transaction (util/format "`%s` marked as DONE." marker))))))))

(defn uncheck
  [pos]
  (let [file config/tasks-org
        github-token (storage/get :github-token)]
    (when-let [content (get-in @state/state [:contents file])]
      (let [content' (str (subs content 0 pos)
                          (-> (subs content pos)
                              (string/replace-first "DONE" "TODO")))]
        ;; TODO: optimize, only update the specific block
        ;; (build-tasks content' file)
        (util/p-handle
         (fs/write-file file content')
         (fn [_]
           (swap! state/state assoc-in [:contents file] content')
           (add-transaction "DONE rollbacks to TODO.")))))))

(defn extract-headings
  [file content]
  (let [headings (-> content
                     (org/parse-json)
                     (util/json->clj))
        headings (block/extract-headings headings)]
    (map (fn [heading]
           (assoc heading :file file))
      headings)))

(defn load-all-contents!
  [ok-handler]
  (let [files (:files @state/state)]
    (-> (p/all (for [file files]
                 (load-file file
                            (fn [content]
                              (swap! state/state
                                     assoc-in [:contents file] content) ))))
        (p/then
         (fn [_]
           (prn "Files are loaded!")
           (ok-handler))))))

(defn extract-all-headings
  []
  (let [contents (:contents @state/state)]
    (vec
     (mapcat
      (fn [[file content] contents]
        (extract-headings file content))
      contents))))

(defonce headings-atom (atom nil))

(defn initial-db!
  []
  (db/init)
  (load-all-contents!
   (fn []
     (let [headings (extract-all-headings)]
       (reset! headings-atom headings)
       (db/transact-headings! headings)))))

(defn get-me
  []
  (api/get-me (fn [body]
                (let [{:keys [user tokens repos]} body]
                  (swap! state/state assoc
                         :user user
                         :tokens tokens
                         :repos repos)))
              (fn [response]
                (prn "Can't get user's information, error response: " response))))

(defn get-user-token-repos
  []
  (let [user (:user @state/state)
        token (:oauth_token (first (:tokens @state/state)))
        repos (map :url (:repos @state/state))]
    [user token repos]))

(defn add-repo-and-clone
  [url]
  (api/add-repo url
                (fn [repo]
                  (let [[user token _] (get-user-token-repos)]
                    (swap! state/state
                           update :repos conj repo)
                    ;; clone
                    (clone (:name user) token url)))
                (fn [response]
                  (prn "Can't add repo: " url))))

(defn sync
  []
  (let [[user token repos] (get-user-token-repos)]
    (doseq [repo repos]
      (prn {:name (:name user)
            :token token
            :repo repo})
      (clone (:name user) token repo))))
