(ns electron.git
  (:require ["dugite" :refer [GitProcess]]
            [goog.object :as gobj]
            [electron.state :as state]
            [electron.utils :as utils]
            [electron.logger :as logger]
            [promesa.core :as p]
            [clojure.string :as string]
            ["fs-extra" :as fs]
            ["path" :as node-path]
            ["os" :as os]))

(def log-error (partial logger/error "[Git]"))

(defn get-graph-git-dir
  [graph-path]
  (when-let [graph-path (some-> graph-path
                                (string/replace "/" "_")
                                (string/replace ":" "comma"))]
    (let [dir (.join node-path (.homedir os) ".logseq" "git" graph-path ".git")]
      (. fs ensureDirSync dir)
      dir)))

(defn run-git!
  [graph-path commands]
  (when (and graph-path (fs/existsSync graph-path))
    (p/let [result (.exec GitProcess commands graph-path)]
      (if (zero? (gobj/get result "exitCode"))
        (let [result (gobj/get result "stdout")]
          (p/resolved result))
        (let [error (gobj/get result "stderr")]
          (when-not (string/blank? error)
            (log-error error))
          (p/rejected error))))))

(defn run-git2!
  [graph-path commands]
  (when (and graph-path (fs/existsSync graph-path))
    (p/let [^js result (.exec GitProcess commands graph-path)]
      result)))

(defn git-dir-exists?
  [graph-path]
  (try
    (let [p (.join node-path graph-path ".git")]
      (.isDirectory (fs/statSync p)))
    (catch :default _e
      nil)))

(defn remove-dot-git-file!
  [graph-path]
  (try
    (let [_ (when (string/blank? graph-path)
              (utils/send-to-renderer :setCurrentGraph {})
              (throw (js/Error. "Empty graph path")))
          p (.join node-path graph-path ".git")]
      (when (and (fs/existsSync p)
                 (.isFile (fs/statSync p)))
        (let [content (string/trim (.toString (fs/readFileSync p)))
              dir-path (string/replace content "gitdir: " "")]
          (when (and content
                     (string/starts-with? content "gitdir:")
                     (string/includes? content ".logseq/")
                     (not (fs/existsSync dir-path)))
            (fs/unlinkSync p)))))
    (catch :default e
      (log-error e))))

(defn init!
  [graph-path]
  (let [_ (remove-dot-git-file! graph-path)
        separate-git-dir (get-graph-git-dir graph-path)
        args (cond
               (git-dir-exists? graph-path)
               ["init"]
               separate-git-dir
               ["init" (str "--separate-git-dir=" separate-git-dir)]
               :else
               ["init"])]
    (p/let [_ (run-git! graph-path (clj->js args))]
      (when utils/win32?
        (run-git! graph-path #js ["config" "core.safecrlf" "false"])))))

(defn add-all!
  [graph-path]
  (-> (run-git! graph-path #js ["add" "--ignore-errors" "./*"])
      (p/catch (fn [error]
                 (let [error (string/lower-case (str error))]
                   (if (or (string/includes? error "permission denied")
                           (string/includes? error "index.lock': File exists"))
                     (log-error error)
                     (p/rejected error)))))))

;; git log -100 --oneline -p ~/Desktop/org/pages/contents.org

(defn commit!
  [graph-path message]
  (p/do!
   (run-git! graph-path #js ["config" "core.quotepath" "false"])
   (run-git! graph-path #js ["commit" "-m" message])))

(defn add-all-and-commit-single-graph!
  [graph-path message]
  (let [message (if (string/blank? message)
                  "Auto saved by Logseq"
                  message)]
    (->
     (p/let [_ (init! graph-path)
             _ (add-all! graph-path)]
       (commit! graph-path message))
     (p/catch (fn [error]
                (when (and
                       (string? error)
                       (not (string/blank? error)))
                  (if (string/starts-with? error "Author identity unknown")
                    (utils/send-to-renderer "setGitUsernameAndEmail" {:type "git"})
                    (utils/send-to-renderer "notification" {:type "error"
                                                            :payload (str error "\nIf you don't want to see those errors or don't need git, you can disable the \"Git auto commit\" feature on Settings > Version control.")}))))))))

(defn add-all-and-commit!
  ([]
   (add-all-and-commit! nil))
  ([message]
   (doseq [path (state/get-all-graph-paths)] (add-all-and-commit-single-graph! path message))))

(defn short-status!
  [graph-path]
  (run-git! graph-path #js ["status" "--porcelain"]))

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
  [graph-path args]
  (init! graph-path)
  (let [args (if (string? args)
               (split-args args)
               args)
        error-handler (fn [error]
                        ;; TODO: why this happen?
                        (when-not (string/blank? error)
                          (let [error (str (first args) " error: " error)]
                            (utils/send-to-renderer "notification" {:type "error"
                                                                    :payload error}))
                          (p/rejected error)))]
    (->
     (p/let [_ (when (= (first args) "commit")
                 (add-all! graph-path))
             result (run-git! graph-path (clj->js args))]
       (p/resolved result))
     (p/catch error-handler))))

(defonce auto-commit-interval (atom nil))
(defn- auto-commit-tick-fn
  []
  (when (state/git-auto-commit-enabled?)
    (add-all-and-commit!)))

(defn configure-auto-commit!
  "Configure auto commit interval, reentrantable"
  []
  (when @auto-commit-interval
    (swap! auto-commit-interval js/clearInterval))
  (when (state/git-auto-commit-enabled?)
    (let [seconds (state/get-git-commit-seconds)
          millis (if (int? seconds)
                   (* seconds 1000)
                   6000)]
      (logger/info ::set-auto-commit-interval seconds)
      (js/setTimeout add-all-and-commit! 100)
      (reset! auto-commit-interval (js/setInterval auto-commit-tick-fn millis)))))

(defn before-graph-close-hook!
  []
  (when (and (state/git-auto-commit-enabled?)
             (state/git-commit-on-close-enabled?))
    (add-all-and-commit!)))
