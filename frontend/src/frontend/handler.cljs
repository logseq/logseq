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

;; We only support Github token now
(defn get-token
  []
  (:oauth_token (first (:tokens @state/state))))

(defn load-file
  ([repo-url path]
   (util/p-handle (fs/read-file (git/get-repo-dir repo-url) path)
                  (fn [content]
                    (let [state @state/state
                          state' (-> state
                                     (assoc-in [:contents path] content)
                                     (assoc-in [:loadings path] false)
                                     (assoc :current-file path))]
                      (reset! state/state state')))))
  ([repo-url path state-handler]
   (util/p-handle (fs/read-file (git/get-repo-dir repo-url) path)
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
  [repo-url]
  (util/p-handle (git/list-files repo-url)
                 (fn [files]
                   (when (> (count files) 0)
                     (let [files (js->clj files)]
                       (if (contains? (set files) config/hidden-file)
                         (load-file repo-url config/hidden-file
                                    (fn [patterns-content]
                                      (when patterns-content
                                        (let [patterns (string/split patterns-content #"\n")
                                              files (remove (fn [path] (hidden? path patterns)) files)]
                                          (swap! state/state
                                                 assoc-in [:repos repo-url :files] files)))))
                         (swap! state/state
                                assoc-in [:repos repo-url :files] files)))))))

;; (defn extract-links
;;   [form]
;;   (let [links (atom [])]
;;     (clojure.walk/postwalk
;;      (fn [x]
;;        (when (and (vector? x)
;;                   (= "Link" (first x)))
;;          (let [[_ {:keys [url label]}] x
;;                [_ {:keys [protocol link]}] url
;;                link (str protocol ":" link)]
;;            (swap! links conj link)))
;;        x)
;;      form)
;;     @links))

(defn load-cloned?
  []
  (storage/get :cloned?))

(defn set-cloned?
  [repo-url value]
  (let [cloned (or (load-cloned?) {})
        new-cloned (assoc cloned repo-url value)]
    (storage/set :cloned? new-cloned)
    new-cloned))

;; TODO: remove this
(declare load-repo-to-db!)

(defn pull
  [repo-url token]
  (util/p-handle (git/pull repo-url token)
                 (fn [result]
                   ;; TODO: diff
                   (-> (load-files repo-url)
                       (p/then
                        (fn []
                          (load-repo-to-db! repo-url)))))))

(defn periodically-pull
  [repo-url]
  (when-let [token (get-token)]
    (pull repo-url token)
    (js/setInterval #(pull repo-url token)
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
     "Gitnotes auto save tasks.\n\n"
     (string/join "\n" transactions))))

(defn periodically-push-tasks
  [repo-url]
  (let [token (get-token)
        push (fn []
               (let [transactions (:tasks-transactions @state/state)]
                 (when (seq transactions)
                   (git/add-commit-push
                    repo-url
                    config/tasks-org
                    (transactions->commit-msg transactions)
                    token
                    (fn []
                      (prn "Commit tasks to Github.")
                      (clear-transactions!))
                    (fn []
                      (prn "Failed to push."))))))]
    (js/setInterval push
                    (* 5 1000))))

(defn clone
  [token repo]
  (util/p-handle
   (do
     (prn "Debug: cloning")
     (swap! state/state assoc-in
            [:repos repo :cloning?] true)
     (git/clone repo token))
   (fn []
     (prn "Debug: cloned")
     (swap! state/state assoc-in
            [:repos repo :cloned?] true)
     (set-cloned? repo true)
     (swap! state/state assoc-in
            [:repos repo :cloning?] false))
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
  [repo-url file]
  (when-let [content (get-in @state/state [:repos repo-url :contents file])]
    (let [content' (get-in @state/state [:repos repo-url :editing-files file])]
      (when-not (= (string/trim content)
                   (string/trim content'))
        (let [token (get-token)
              path [:repos repo-url :commit-message file]
              message (get-in @state/state path (str "Update " file))]
          (util/p-handle
           (fs/write-file (git/get-repo-dir repo-url) file content')
           (fn [_]
             (git/add-commit-push repo-url
                                  file
                                  message
                                  token
                                  (fn []
                                    (swap! state/state util/dissoc-in path)
                                    (swap! state/state assoc-in [:repos repo-url :contents file] content')
                                    (show-snackbar "File updated!")
                                    (change-page :home))
                                  (fn []
                                    (prn "Failed to update file."))))))))))

(defn clear-storage
  [repo-url]
  (let [token (get-token)]
    (js/window.pfs._idb.wipe)
    (storage/set :cloned? false)
    (swap! state/state assoc
           :cloned? false
           :contents nil
           :files nil)
    (clone token repo-url)))

(defn check
  [repo-url file marker pos]
  (let [token (get-token)]
    (when-let [content (get-in @state/state [:repos repo-url :contents file])]
      (let [content' (str (subs content 0 pos)
                          (-> (subs content pos)
                              (string/replace-first marker "DONE")))]
        ;; TODO: optimize, only update the specific block
        ;; (build-tasks content' file)
        (util/p-handle
         (fs/write-file (git/get-repo-dir repo-url) file content')
         (fn [_]
           (swap! state/state assoc-in [:repos repo-url :contents file] content')
           (add-transaction (util/format "`%s` marked as DONE." marker))))))))

(defn uncheck
  [repo-url file pos]
  (let [token (get-token)]
    (when-let [content (get-in @state/state [:repos repo-url :contents file])]
      (let [content' (str (subs content 0 pos)
                          (-> (subs content pos)
                              (string/replace-first "DONE" "TODO")))]
        ;; TODO: optimize, only update the specific block
        ;; (build-tasks content' file)
        (util/p-handle
         (fs/write-file (git/get-repo-dir repo-url) file content')
         (fn [_]
           (swap! state/state assoc-in [:repos repo-url :contents file] content')
           (add-transaction "DONE rollbacks to TODO.")))))))

(defn extract-headings
  [repo-url file content]
  (let [headings (-> content
                     (org/parse-json)
                     (util/json->clj))
        headings (block/extract-headings headings)]
    (map (fn [heading]
           (assoc heading
                  :repo repo-url
                  :file file))
      headings)))

(defn load-all-contents!
  [repo-url ok-handler]
  (let [files (get-in @state/state [:repos repo-url :files])]
    (-> (p/all (for [file files]
                 (load-file repo-url file
                            (fn [content]
                              (swap! state/state
                                     assoc-in [:repos repo-url :contents file] content) ))))
        (p/then
         (fn [_]
           (prn "Files are loaded!")
           (ok-handler))))))

(defn extract-all-headings
  [repo-url]
  (let [contents (get-in @state/state [:repos repo-url :contents])]
    (vec
     (mapcat
      (fn [[file content] contents]
        (extract-headings repo-url file content))
      contents))))

(defonce headings-atom (atom nil))

(defn load-repo-to-db!
  [repo-url]
  (load-all-contents! repo-url
                      (fn []
                        (let [headings (extract-all-headings repo-url)]
                          (reset! headings-atom headings)
                          (db/transact-headings! headings)))))

(defn get-user-token-repos
  []
  (let [user (:user @state/state)
        token (:oauth_token (first (:tokens @state/state)))
        repos (map :url (vals (:repos @state/state)))]
    [user token repos]))

(defn add-repo-and-clone
  [url]
  (api/add-repo url
                (fn [repo]
                  (let [[user token _] (get-user-token-repos)]
                    (swap! state/state
                           update :repos conj repo)
                    ;; clone
                    (clone token url)))
                (fn [response]
                  (prn "Can't add repo: " url))))

(defn sync
  []
  (let [[_user token repos] (get-user-token-repos)]
    (doseq [repo repos]
      (pull repo token))))

(defn periodically-pull-and-push
  [repo-url]
  ;; automatically pull
  (periodically-pull repo-url)

  ;; automatically push
  (periodically-push-tasks repo-url))

(defn get-me
  []
  (api/get-me
   (fn [body]
     (let [{:keys [user tokens repos]} body]
       (swap! state/state assoc
              :user user
              :tokens tokens
              :repos (util/index-by repos :url))
       (db/init)
       (let [repos (map :url repos)
             cloned (load-cloned?)
             token (get-token)]
         (doseq [[repo cloned?] cloned]
           (swap! state/state
                  assoc-in [:repos repo :cloned?] cloned?))
         (when (seq repos)
           (doseq [repo-url repos]
             (if (get cloned repo-url)
               (periodically-pull-and-push repo-url)
               (-> (clone token repo-url)
                   (p/then
                    (fn []
                      (periodically-pull-and-push repo-url))))))))))
   (fn [response]
     (prn "Can't get user's information, error response: " response))))

(defn set-current-repo
  [repo-url]
  (swap! state/state assoc :current-repo repo-url))
