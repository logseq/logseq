(ns frontend.handler.export-escape-test
  "Backslash escapes written in a block survive the text export and paste back
  as the same text."
  (:require [cljs.test :refer [async deftest is testing use-fixtures]]
            [clojure.string :as string]
            [datascript.core :as d]
            [frontend.db.async :as db-async]
            [frontend.db.conn :as conn]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.export.text :as export-text]
            [frontend.handler.paste :as paste-handler]
            [frontend.state :as state]
            [frontend.test.helper :as test-helper]
            [frontend.worker.export :as worker-export]
            [logseq.db.sqlite.build :as sqlite-build]
            [promesa.core :as p]))

(def ^:private titles
  ["\\# not a heading"
   "\\## not a heading either"
   "\\TODO not a task"
   "line\n\\- not a child"
   "line\n\\# not a heading on line 2"
   "line\n\\> not a quote"
   "1. numbered text"
   "TODO plain text, not a task"
   "line\nTODO on line 2"
   "line\n>"
   "line\n1. numbered on line 2"
   ">"
   "line\n\\TODO typed with a backslash"
   "\\\\ two backslashes"
   "plain text"
   "line\n* a list inside the block"
   "line\n```\n- in a code fence\n```"])

(def ^:private unescaped-titles
  "Block text with an unescaped `- ` or `#` line after the first: the block shows
  it as a line of text; it comes back as the same block, the line escaped."
  {"line\n- a dash line" "line\n\\- a dash line"
   "line\n  - an indented dash line" "line\n  \\- an indented dash line"
   "line\n# a hash line" "line\n\\# a hash line"
   "line\n+ plus on line 2" "line\n\\+ plus on line 2"
   ;; mldoc reads the `#` line as a heading, so `[[` here was never a page ref
   "see [[a page\n# named over two lines]]" "see [[a page\n\\# named over two lines]]"
   "line\n> quote on line 2" "line\n\\> quote on line 2"
   "> a plain block starting with >" "\\> a plain block starting with >"})

(def ^:private all-titles (into titles (keys unescaped-titles)))

(def ^:private uuids
  (mapv (fn [i] (uuid (str "00000000-0000-4000-8000-0000000008" (.padStart (str i) 2 "0")))) (range (count all-titles))))

(use-fixtures :once
  {:before (fn []
             (test-helper/start-test-db!)
             (let [{:keys [init-tx block-props-tx]}
                   (sqlite-build/build-blocks-tx
                    {:pages-and-blocks
                     [{:page {:block/title "escapes"}
                       :blocks (mapv (fn [t u] {:block/title t :block/uuid u :build/keep-uuid? true}) all-titles uuids)}]})]
               (d/transact! (conn/get-db test-helper/test-db false)
                            (concat (map #(select-keys % [:block/uuid]) init-tx) init-tx block-props-tx))))
   :after test-helper/destroy-test-db!})

(defn- worker-stub [api repo & args]
  (let [db (conn/get-db repo)]
    (case api
      :thread-api/export-get-blocks-data
      (let [[ids opts cc] args] (p/resolved (worker-export/get-blocks-export-data db ids opts cc)))
      :thread-api/export-blocks-as-format
      (let [[ids fmt opts cc] args] (p/resolved (worker-export/export-blocks-as-format db ids fmt opts cc)))
      (p/resolved nil))))

(defn- <export-and-paste
  [block-uuid]
  (let [pasted (atom nil)]
    (p/with-redefs [state/<invoke-db-worker worker-stub
                    state/get-edit-block (constantly {:db/id 10})
                    db-async/<get-block-page-info (fn [& _] (p/resolved {:db/id 1 :block/name "paste target"}))
                    editor-handler/paste-blocks (fn [blocks _] (reset! pasted blocks) (p/resolved nil))]
      (p/let [text (export-text/export-blocks-as-markdown test-helper/test-db [block-uuid] {:remove-options #{}})
              _ (#'paste-handler/paste-text-parseable :markdown text)]
        {:text text :blocks @pasted}))))

(deftest escaped-markdown-round-trips
  (async done
         (state/set-current-repo! test-helper/test-db)
         (-> (p/loop [i 0]
               (when (< i (count all-titles))
                 (let [title (nth all-titles i)
                       expected (get unescaped-titles title title)]
                   (p/let [{:keys [text blocks]} (<export-and-paste (nth uuids i))]
                     (testing (str (pr-str title) " exported as " (pr-str text))
                       (is (= [expected] (mapv :block/title blocks)))
                       (is (nil? (:logseq.property/heading (first blocks))))
                       (is (not (string/blank? text))))
                     (p/recur (inc i))))))
             (p/catch (fn [e] (is false (str e))))
             (p/finally done))))
