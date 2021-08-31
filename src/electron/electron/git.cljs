(ns electron.git
  (:require ["dugite" :refer [GitProcess]]
            [goog.object :as gobj]
            [electron.state :as state]
            [electron.utils :as utils]
            [promesa.core :as p]
            [clojure.string :as string]
            ["fs-extra" :as fs]
            ["path" :as path]
            ["os" :as os]))

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
              (js/console.error error))
            (p/rejected error)))))))

(defn git-dir-exists?
  []
  (try
    (let [p (.join path (get-graph-path) ".git")]
      (.isDirectory (fs/statSync p)))
    (catch js/Error e
      nil)))

(defn init!
  []
  (let [separate-git-dir (get-graph-git-dir)
        args (cond
               (git-dir-exists?)
               ["init"]
               separate-git-dir
               ["init" (str "--separate-git-dir=" separate-git-dir)]
               :else
               ["init"])]
    (-> (run-git! (clj->js args))
        (p/catch (fn [error]
                   (when (string/starts-with? error "fatal: not a git repository")
                     (let [p (.join path (get-graph-path) ".git")]
                       (when (.isFile (fs/statSync p))
                         (let [content (fs/readFileSync p)]
                           (when (and content (string/starts-with? content "gitdir:"))
                             (fs/unlinkSync p)))))))))))

(defn add-all!
  []
  (run-git! #js ["add" "./*"]))

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
                 (when (and (not (string/blank? error))
                            ;; FIXME: not sure why this happened
                            (not (string/starts-with? error "fatal: not a git repository")))
                   (if (string/starts-with? error "Author identity unknown")
                     (utils/send-to-renderer "setGitUsernameAndEmail" {:type "git"})
                     (utils/send-to-renderer "notification" {:type "error"
                                                             :payload error}))))))
)))

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
    (let [seconds (state/get-git-commit-seconds)]
      (when (int? seconds)
        (let [interval (js/setInterval add-all-and-commit! (* seconds 1000))]
          (state/set-git-commit-interval! interval))))))
