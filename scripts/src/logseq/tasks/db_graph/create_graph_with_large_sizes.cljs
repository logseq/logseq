(ns logseq.tasks.db-graph.create-graph-with-large-sizes
  "Script that generates graphs at large sizes"
  (:require ["os" :as os]
            ["path" :as node-path]
            [babashka.cli :as cli]
            [clojure.string :as string]
            [datascript.core :as d]
            [logseq.outliner.cli :as outliner-cli]
            [nbb.classpath :as cp]
            [nbb.core :as nbb]))

(def ^:private target-entities-per-batch 25000)
(def ^:private max-pages-per-batch 1000)
(def ^:private min-block-title-length 64)
(def ^:private max-block-title-length 512)
(def ^:private block-title-fragment
  "captures project updates, implementation details, follow-up notes, and review context ")

(defn- parse-long-option
  [value]
  (if (string? value)
    (js/parseInt value 10)
    value))

(defn- normalize-options
  [options]
  (update-vals options parse-long-option))

(defn default-batch-pages
  [blocks-per-page]
  (-> (quot target-entities-per-batch (max 1 (inc blocks-per-page)))
      (max 1)
      (min max-pages-per-batch)))

(defn- build-block-title
  [page-idx block-idx]
  (let [target-length (+ min-block-title-length
                         (mod (+ (* page-idx 17) (* block-idx 31))
                              (inc (- max-block-title-length min-block-title-length))))
        prefix (str "Page " page-idx " block " block-idx " summary ")
        raw-title (str prefix
                       (apply str (repeat (inc (quot target-length (count block-title-fragment)))
                                          block-title-fragment)))]
    (subs raw-title 0 target-length)))

(defn- build-blocks
  [page-idx blocks-per-page next-id]
  (loop [block-idx 0
         blocks (transient [])]
    (if (= block-idx blocks-per-page)
      (persistent! blocks)
      (recur (inc block-idx)
             (conj! blocks
                    {:block/uuid (next-id)
                     :block/title (build-block-title page-idx block-idx)})))))

(defn build-page-and-blocks-batch
  ([start-idx page-count blocks-per-page]
   (build-page-and-blocks-batch start-idx page-count blocks-per-page random-uuid))
  ([start-idx page-count blocks-per-page next-id]
   (loop [page-idx 0
          pages-and-blocks (transient [])]
     (if (= page-idx page-count)
       (persistent! pages-and-blocks)
       (recur (inc page-idx)
              (conj! pages-and-blocks
                     {:page {:block/uuid (next-id)
                             :block/title (str "Page-" (+ start-idx page-idx))}
                      :blocks (build-blocks (+ start-idx page-idx) blocks-per-page next-id)}))))))

(defn page-and-block-batches
  ([{:keys [pages blocks batch-pages]}]
   (page-and-block-batches {:pages pages
                            :blocks blocks
                            :batch-pages batch-pages}
                           random-uuid))
  ([{:keys [pages blocks batch-pages]} next-id]
   (let [batch-pages' (or batch-pages (default-batch-pages blocks))]
     ((fn step [start-idx]
        (lazy-seq
         (when (< start-idx pages)
           (cons (build-page-and-blocks-batch start-idx
                                              (min batch-pages' (- pages start-idx))
                                              blocks
                                              next-id)
                 (step (+ start-idx batch-pages'))))))
      0))))

(defn- transact-batch!
  [conn pages-and-blocks]
  (let [{:keys [init-tx block-props-tx]} (outliner-cli/build-blocks-tx {:pages-and-blocks pages-and-blocks})]
    (d/transact! conn init-tx)
    (when (seq block-props-tx)
      (d/transact! conn block-props-tx))))

(defn- total-batches
  [{:keys [pages blocks batch-pages]}]
  (let [batch-pages' (or batch-pages (default-batch-pages blocks))]
    (js/Math.ceil (/ pages batch-pages'))))

(def spec
  "Options spec"
  {:help {:alias :h
          :desc "Print help"}
   :pages {:alias :p
           :default 1000
           :desc "Number of pages to create"}
   :blocks {:alias :b
            :default 20
            :desc "Number of blocks to create per page"}
   :batch-pages {:alias :t
                 :desc "Number of pages to build and transact per batch"}})

(defn parse-args
  [args]
  {:graph-dir (first args)
   :options (normalize-options (cli/parse-opts (rest args) {:spec spec}))})

(defn -main [args]
  (let [{:keys [graph-dir options]} (parse-args args)
        _ (when (or (nil? graph-dir) (:help options))
            (println (str "Usage: $0 GRAPH-NAME [OPTIONS]\nOptions:\n"
                          (cli/format-opts {:spec spec})))
            (js/process.exit 1))
        {:keys [pages blocks batch-pages]} options
        [dir db-name] (if (string/includes? graph-dir "/")
                        ((juxt node-path/dirname node-path/basename) graph-dir)
                        [(node-path/join (os/homedir) "logseq" "graphs") graph-dir])
        conn (outliner-cli/init-conn dir db-name {:classpath (cp/get-classpath)})
        total-batches' (total-batches options)
        pages-per-batch (or batch-pages (default-batch-pages blocks))
        total-blocks (* pages blocks)]
    (println "Creating graph with" pages "pages and" total-blocks "blocks"
             "using" total-batches' "batch(es) of up to" pages-per-batch "pages ...")
    (doseq [[batch-num pages-and-blocks] (map-indexed vector (page-and-block-batches options))]
      (println "Transacting batch" (inc batch-num) "of" total-batches'
               "with" (count pages-and-blocks) "pages")
      (transact-batch! conn pages-and-blocks))
    (println "Created graph" db-name "with" pages "pages and" total-blocks "blocks.")))

(when (= nbb/*file* (nbb/invoked-file))
  (-main *command-line-args*))
