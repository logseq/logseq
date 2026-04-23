(ns logseq.cli.command.skill
  "Skill utility commands for exposing the built-in logseq-cli skill markdown."
  (:require ["fs" :as fs]
            ["os" :as os]
            ["path" :as node-path]
            [clojure.string :as string]
            [logseq.cli.command.core :as core]
            [logseq.common.path :as path]))

(def ^:private skill-dir-name "logseq-cli")
(def ^:private skill-file-name "SKILL.md")
(def ^:private relative-skill-path [".agents" "skills" skill-dir-name skill-file-name])

(def ^:private install-spec
  {:global {:desc "Install to ~/.agents/skills/logseq-cli"
            :coerce :boolean}})

(def entries
  [(core/command-entry ["skill" "show"]
                       :skill-show
                       "Print built-in logseq-cli skill markdown"
                       {})
   (core/command-entry ["skill" "install"]
                       :skill-install
                       "Install built-in logseq-cli skill file"
                       install-spec
                       {:examples ["logseq skill install"
                                   "logseq skill install --global"]})])

(defn resolve-install-target
  [{:keys [global? cwd home-dir]}]
  (let [home-dir (some-> home-dir str string/trim)
        cwd (or cwd (.cwd js/process))
        base-dir (if global?
                   (when (seq home-dir)
                     home-dir)
                   cwd)]
    (if-not (seq base-dir)
      {:ok? false
       :error {:code :skill-home-dir-unavailable
               :message "home directory is unavailable; cannot resolve --global install target"}}
      (let [dir (path/path-join base-dir ".agents" "skills" skill-dir-name)]
        {:ok? true
         :dir dir
         :file (path/path-join dir skill-file-name)}))))

(defn resolve-skill-source-path
  [candidates]
  (let [candidates (->> (or candidates [])
                        (filter string?)
                        (filter #(seq (string/trim %)))
                        vec)
        path (some (fn [candidate]
                     (when (fs/existsSync candidate)
                       candidate))
                   candidates)]
    (if (seq path)
      {:ok? true
       :path path}
      {:ok? false
       :error {:code :skill-source-not-found
               :message (str "skill source file not found. Checked paths: "
                             (string/join ", " candidates))
               :checked-paths candidates}})))

(defn- source-path-candidates
  []
  (let [from-dir (fn [dir]
                   (apply node-path/join dir relative-skill-path))]
    [(from-dir js/__dirname)
     (from-dir (node-path/join js/__dirname ".."))
     (from-dir (node-path/join js/__dirname ".." ".."))
     (from-dir (node-path/join js/__dirname ".." ".." ".."))]))

(defn- resolve-action-source-path
  [action]
  (if-let [source-path (some-> (:source-path action) str string/trim not-empty)]
    {:ok? true :path source-path}
    (resolve-skill-source-path (source-path-candidates))))

(defn build-show-action
  [_options]
  {:ok? true
   :action {:type :skill-show}})

(defn build-install-action
  [options]
  {:ok? true
   :action {:type :skill-install
            :global? (boolean (:global options))}})

(defn execute-skill-show
  [action _config]
  (let [{:keys [ok? path error]} (resolve-action-source-path action)]
    (if-not ok?
      {:status :error
       :error error}
      (try
        {:status :ok
         :output-format :human
         :data {:message (fs/readFileSync path "utf8")
                :source-path path}}
        (catch :default e
          {:status :error
           :error {:code :skill-show-failed
                   :message (str "failed to read skill source: " (or (.-message e) e))
                   :source-path path
                   :cause (or (.-code e) (:code (ex-data e)))}})))))

(defn- resolve-install-destination
  [action]
  (if (and (seq (some-> (:destination-dir action) str string/trim))
           (seq (some-> (:destination-file action) str string/trim)))
    {:ok? true
     :dir (:destination-dir action)
     :file (:destination-file action)}
    (let [env-home (or (some-> js/process .-env .-HOME)
                       (some-> js/process .-env .-USERPROFILE))]
    (resolve-install-target {:global? (:global? action)
                             :cwd (.cwd js/process)
                             :home-dir (or env-home
                                           (.homedir os))}))))

(defn execute-skill-install
  [action _config]
  (let [{:keys [ok? path error]} (resolve-action-source-path action)]
    (if-not ok?
      {:status :error
       :error error}
      (let [{:keys [ok? dir file error]} (resolve-install-destination action)]
        (if-not ok?
          {:status :error
           :error error}
          (try
            (when (and (fs/existsSync dir)
                       (.isFile (fs/statSync dir)))
              (throw (ex-info "destination path is a file"
                              {:code :skill-install-invalid-destination
                               :destination dir})))
            (fs/mkdirSync dir #js {:recursive true})
            (let [payload (fs/readFileSync path "utf8")]
              (fs/writeFileSync file payload "utf8"))
            {:status :ok
             :data {:source-path path
                    :installed-path file
                    :message (str "Installed skill to " file)}}
            (catch :default e
              (let [data (ex-data e)
                    code (or (:code data) (.-code e))]
                {:status :error
                 :error {:code (if (= :skill-install-invalid-destination code)
                                 :skill-install-invalid-destination
                                 :skill-install-failed)
                         :message (str "failed to install skill: " (or (.-message e) e))
                         :source-path path
                         :destination file
                         :cause code}}))))))))
