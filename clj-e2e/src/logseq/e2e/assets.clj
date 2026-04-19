(ns logseq.e2e.assets
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [wally.main :as w]))

(defn assets-dir
  [graph-name]
  (str "/" graph-name "/assets"))

(defn list-assets
  "List file names in the DB-graph assets directory.

  Note: clj-e2e runs the web build, so db-graph files live in lightning-fs
  (`window.pfs`) rather than `~/logseq/graphs/...`."
  [graph-name]
  (let [dir (assets-dir graph-name)]
    (vec
     (or
      (w/eval-js
       (str "(() => window.pfs.readdir(" (pr-str dir) ").catch(() => []))()"))
      []))))

(defn wait-for-asset!
  [graph-name filename timeout-ms]
  (let [deadline-ms (+ (System/currentTimeMillis) timeout-ms)]
    (loop []
      (cond
        (some #(= filename %) (list-assets graph-name))
        true

        (> (System/currentTimeMillis) deadline-ms)
        false

        :else
        (do (Thread/sleep 500) (recur))))))

(defn wait-for-new-asset!
  [graph-name before-filenames timeout-ms]
  (let [before (set before-filenames)
        deadline-ms (+ (System/currentTimeMillis) timeout-ms)]
    (loop []
      (let [after (set (list-assets graph-name))
            new-files (set/difference after before)
            ;; DB-graph assets always have an ext (png/jpg/pdf/etc).
            candidate (first (sort (filter #(string/includes? % ".") new-files)))]
        (cond
          (string? candidate)
          candidate

          (> (System/currentTimeMillis) deadline-ms)
          nil

          :else
          (do (Thread/sleep 250) (recur)))))))

(defn last-asset-block-uuid
  "Return the `:block/uuid` (string) for the last rendered asset block in the
  current page, inferred from the closest `.ls-block[blockid]` wrapper."
  []
  (w/eval-js
   (str
    "(() => {"
    "  const nodes = document.querySelectorAll('.asset-ref-wrap, .asset-transfer-shell');"
    "  const n = nodes.length;"
    "  if (!n) return null;"
    "  const last = nodes[n - 1];"
    "  const block = last.closest('.ls-block');"
    "  return block ? block.getAttribute('blockid') : null;"
    "})()")))

(defn wait-for-last-asset-block-uuid!
  [timeout-ms]
  (let [deadline-ms (+ (System/currentTimeMillis) timeout-ms)]
    (loop []
      (if-let [uuid (last-asset-block-uuid)]
        uuid
        (if (> (System/currentTimeMillis) deadline-ms)
          nil
          (do (Thread/sleep 250) (recur)))))))

(defn clear-assets-dir!
  "Recursively delete the graph's assets directory in lightning-fs (`window.pfs`).

  Why this exists: clj-e2e runs the web build, so \"Delete local graph\" doesn't
  necessarily clear OPFS `/<graph>/assets` the same way Electron deletes
  `~/logseq/graphs/<graph>/assets`. For the regression we care about, we need an
  empty assets/ dir before re-downloading the graph."
  [graph-name]
  (let [dir (assets-dir graph-name)]
    (boolean
     (w/eval-js
      (str
       "(() => {"
       "  const dir = " (pr-str dir) ";"
       "  const rimraf = window.workerThread && window.workerThread.rimraf;"
       "  if (!rimraf) return Promise.resolve(false);"
       "  return rimraf(dir).then(() => true).catch(() => false);"
       "})()")))))
