(ns electron.git
  (:require ["dugite" :refer [GitProcess]]
            [goog.object :as gobj]
            [electron.state :as state]
            [electron.utils :refer [logger] :as utils]
            [promesa.core :as p]
            [clojure.string :as string]
            ["fs-extra" :as fs]
            ["path" :as path]
            ["os" :as os]))

(def log-error (partial (.-error logger) "[Git]"))

(defn get-graph-path
  []
  (:graph/current @state/state))

(defn get-graph-git-dir
  []
  (when-let [graph-path (some-> (get-graph-path)
                                (string/replace "/" "_")
                                (string/replace ":" "comma"))]
    (let [dir (.join path (.homedir os) ".logseq" "git" graph-path ".git")]
      (. fs ensureDirSync dir)
      dir)))

(defn dot-git-exists?
  []
  (let [p (.join path (get-graph-path) ".git")]
    (fs/existsSync p)))

(defn run-git!
  [commands]
  (when-let [path (get-graph-path)]
    (when (fs/existsSync path)
      (p/let [result (.exec GitProcess commands path)]
        (if (zero? (gobj/get result "exitCode"))
          (let [result (gobj/get result "stdout")]
            (p/resolved result))
          (let [error (gobj/get result "stderr")]
            (when-not (string/blank? error)
              (log-error error))
            (p/rejected error)))))))

(defn git-dir-exists?
  []
  (try
    (let [p (.join path (get-graph-path) ".git")]
      (.isDirectory (fs/statSync p)))
    (catch js/Error e
      nil)))

(defn remove-dot-git-file!
  []
  (try
    (let [graph-path (get-graph-path)
          _ (and (string/blank? graph-path) (throw (js/Error. "Empty graph path")))
          p (.join path graph-path ".git")]
      (when (and (fs/existsSync p)
                 (.isFile (fs/statSync p)))
        (let [content (.toString (fs/readFileSync p))
              dir-path (string/replace content "gitdir: " "")]
          (when (and content
                     (string/starts-with? content "gitdir:")
                     (string/includes? content ".logseq/")
                     (not (fs/existsSync dir-path)))
            (fs/unlinkSync p)))))
    (catch js/Error e
      (log-error e))))

(defn init!
  []
  (let [_ (remove-dot-git-file!)
        separate-git-dir (get-graph-git-dir)
        args (cond
               (git-dir-exists?)
               ["init"]
               separate-git-dir
               ["init" (str "--separate-git-dir=" separate-git-dir)]
               :else
               ["init"])]
    (p/let [_ (run-git! (clj->js args))]
      (when utils/win32?
        (run-git! ["config" "core.safecrlf" "false"])))))

(defn add-all!
  []
  (-> (run-git! #js ["add" "--ignore-errors" "./*"])
      (p/catch (fn [error]
                 (let [error (string/lower-case (str error))]
                   (if (or (string/includes? error "permission denied")
                           (string/includes? error "index.lock': File exists"))
                     (log-error error)
                     (p/rejected error)))))))

;; git log -100 --oneline -p ~/Desktop/org/pages/contents.org

(defn commit!
  [message]
  (run-git! #js ["commit" "-m" message]))

(defn add-all-and-commit!
  ([]
   (add-all-and-commit! nil))
  ([message]
   (let [message (if (string/blank? message)
                   "Auto saved by Logseq"
                   message)]
     (->
      (p/let [_ (init!)
              _ (add-all!)]
        (commit! message))
      (p/catch (fn [error]
                 (when (and
                        (string? error)
                        (not (string/blank? error)))
                   (if (string/starts-with? error "Author identity unknown")
                     (utils/send-to-renderer "setGitUsernameAndEmail" {:type "git"})
                     (utils/send-to-renderer "notification" {:type "error"
                                                             :payload (str error "\nIf you don't want to see those errors or don't need git, you can disable the \"Git auto commit\" feature on Settings > Version control.")})))))))))

(defonce quotes-regex #"\"[^\"]+\"")
(defn wrapped-by-quotes?
  [v]
  (and (string? v) (>= (count v) 2) (= "\"" (first v) (last v))))

(defn unquote-string
  [v]
  (string/trim (subs v 1 (dec (count v)))))

(defn- split-args
  [s]
  (let [quotes (re-seq quotes-regex s)
        non-quotes (string/split s quotes-regex)
        col (if (seq quotes)
              (concat (interleave non-quotes quotes)
                      (drop (count quotes) non-quotes))
              non-quotes)]
    (->> col
         (map (fn [s]
                (if (wrapped-by-quotes? s)
                  [(unquote-string s)]
                  (string/split s #"\s"))))
         (flatten)
         (remove string/blank?))))

(defn raw!
  [args]
  (init!)
  (let [args (if (string? args)
               (split-args args)
               args)
        ok-handler (fn [result]
                     (p/resolved result))
        error-handler (fn [error]
                        ;; TODO: why this happen?
                        (when-not (string/blank? error)
                          (let [error (str (first args) " error: " error)]
                            (utils/send-to-renderer "notification" {:type "error"
                                                                    :payload error}))
                          (p/rejected error)))]
    (->
     (p/let [_ (when (= (first args) "commit")
                 (add-all!))
             result (run-git! (clj->js args))]
       (p/resolved result))
     (p/catch error-handler))))

(defn auto-commit-current-graph!
  []
  (when (not (state/git-auto-commit-disabled?))
    (state/clear-git-commit-interval!)
    (js/setTimeout add-all-and-commit! 3000)
    (let [seconds (state/get-git-commit-seconds)]
      (when (int? seconds)
        (let [interval (js/setInterval add-all-and-commit! (* seconds 1000))]
          (state/set-git-commit-interval! interval))))))
