(ns frontend.core-test
  (:require [frontend.state :as state]
            [frontend.db.conn :as conn]))

(defn get-current-conn
  []
  (->
    (state/get-current-repo)
    (conn/get-conn false)))



'({:file/path "logseq/config.edn", :file/last-modified-at 1616577680877}
  {:file/path "logseq/metadata.edn",
   :file/last-modified-at 1616577680819}
  {:file/path "logseq/custom.css", :file/last-modified-at 1616577680873}
  {:file/path "journals/2021_03_24.md",
   :file/last-modified-at 1616577697190}
  {:file/path "pages/contents.md", :file/last-modified-at 1616577680876}
  {:block/name "mar 24th, 2021",
   :block/original-name "Mar 24th, 2021",
   :block/file [:file/path "journals/2021_03_24.md"],
   :block/journal? true,
   :block/journal-day 20210324,
   :block/properties {:title "Mar 24th, 2021"},
   :block/uuid #uuid "605bffeb-c7e6-4c89-a173-0d14e23f8c8d",
   :block/refs ()}
  {:block/name "contents",
   :block/original-name "Contents",
   :block/file [:file/path "pages/contents.md"],
   :block/journal? false,
   :block/journal-day 0,
   :block/uuid #uuid "605bffeb-4906-43cc-8964-2f5f994cae84",
   :block/refs ()}
  {:block/uuid #uuid "605bffeb-6dd8-4d14-8caf-0151cdd754a7",
   :block/refs ()}
  {:block/uuid #uuid "605bffeb-6e6b-40b1-9330-362a8983dbb8",
   :block/refs ()}
  {:block/uuid #uuid "605bffeb-5046-437b-919a-1cbcd25355ec",
   :block/refs ()}
  {:block/uuid #uuid "605bffeb-978a-4503-b030-6fa988b3ae85",
   :block/refs ()}
  {:block/uuid #uuid "605bffeb-6df0-4bea-9490-c4ce5f0a059d",
   :block/refs ()}
  {:block/uuid #uuid "605bffeb-0178-4bdb-a877-f5b5f3e44748",
   :block/refs ()}
  {:block/uuid #uuid "605bffeb-7715-4196-9c06-a0845f03da6a",
   :block/refs ()}
  {:block/uuid #uuid "605bffeb-e9d9-43e1-9392-9f0497c3c53b",
   :block/refs ()}
  {:block/uuid #uuid "605bffeb-3de5-4ca6-8d3b-cd85c292ae88",
   :block/refs ()}
  {:block/uuid #uuid "605bffeb-abf0-456b-bc10-80be0ab4f849",
   :block/refs ()}
  {:block/pre-block? true,
   :block/uuid #uuid "605bffeb-6dd8-4d14-8caf-0151cdd754a7",
   :block/left [:block/name "mar 24th, 2021"],
   :block/refs (),
   :block/body
   ({:block/uuid #uuid "605bffeb-6e6b-40b1-9330-362a8983dbb8",
     :block/refs (),
     :block/anchor "level_1",
     :block/children
     #{[:block/uuid #uuid "605bffeb-5046-437b-919a-1cbcd25355ec"]},
     :block/body [],
     :block/meta
     {:timestamps [], :properties [], :start-pos 31, :end-pos 42},
     :block/level 2,
     :block/tags [],
     :block/title [["Plain" "level 1"]]}
    {:block/uuid #uuid "605bffeb-5046-437b-919a-1cbcd25355ec",
     :block/refs (),
     :block/anchor "level_2",
     :block/children
     #{[:block/uuid #uuid "605bffeb-978a-4503-b030-6fa988b3ae85"]
       [:block/uuid #uuid "605bffeb-6df0-4bea-9490-c4ce5f0a059d"]},
     :block/body [],
     :block/meta
     {:timestamps [], :properties [], :start-pos 42, :end-pos 54},
     :block/level 3,
     :block/tags [],
     :block/title [["Plain" "level 2"]]}
    {:block/uuid #uuid "605bffeb-978a-4503-b030-6fa988b3ae85",
     :block/refs (),
     :block/anchor "level_3",
     :block/children #{},
     :block/body [],
     :block/meta
     {:timestamps [], :properties [], :start-pos 54, :end-pos 67},
     :block/level 4,
     :block/tags [],
     :block/title [["Plain" "level 3"]]}
    {:block/uuid #uuid "605bffeb-6df0-4bea-9490-c4ce5f0a059d",
     :block/refs (),
     :block/anchor "",
     :block/children #{},
     :block/body [],
     :block/meta
     {:timestamps [], :properties [], :start-pos 67, :end-pos 72},
     :block/level 4,
     :block/tags [],
     :block/title []}),
   :block/meta {:start-pos 0, :end-pos 31},
   :block/format :markdown,
   :block/level 2,
   :block/content "---\ntitle: Mar 24th, 2021\n---\n\n",
   :block/parent [:block/name "mar 24th, 2021"],
   :block/page [:block/name "mar 24th, 2021"],
   :block/file [:file/path "journals/2021_03_24.md"]}
  {:block/uuid #uuid "605bffeb-6e6b-40b1-9330-362a8983dbb8",
   :block/left
   [:block/uuid #uuid "605bffeb-6dd8-4d14-8caf-0151cdd754a7"],
   :block/refs (),
   :block/anchor "level_1",
   :block/children
   #{[:block/uuid #uuid "605bffeb-5046-437b-919a-1cbcd25355ec"]},
   :block/body [],
   :block/meta
   {:timestamps [], :properties [], :start-pos 31, :end-pos 42},
   :block/format :markdown,
   :block/level 2,
   :block/tags [],
   :block/title [["Plain" "level 1"]],
   :block/content "## level 1\n",
   :block/parent [:block/name "mar 24th, 2021"],
   :block/page [:block/name "mar 24th, 2021"],
   :block/file [:file/path "journals/2021_03_24.md"]}
  {:block/uuid #uuid "605bffeb-5046-437b-919a-1cbcd25355ec",
   :block/left
   [:block/uuid #uuid "605bffeb-6e6b-40b1-9330-362a8983dbb8"],
   :block/refs (),
   :block/anchor "level_2",
   :block/children
   #{[:block/uuid #uuid "605bffeb-978a-4503-b030-6fa988b3ae85"]
     [:block/uuid #uuid "605bffeb-6df0-4bea-9490-c4ce5f0a059d"]},
   :block/body [],
   :block/meta
   {:timestamps [], :properties [], :start-pos 42, :end-pos 54},
   :block/format :markdown,
   :block/level 3,
   :block/tags [],
   :block/title [["Plain" "level 2"]],
   :block/content "### level 2\n",
   :block/parent
   [:block/uuid #uuid "605bffeb-6e6b-40b1-9330-362a8983dbb8"],
   :block/page [:block/name "mar 24th, 2021"],
   :block/file [:file/path "journals/2021_03_24.md"]}
  {:block/uuid #uuid "605bffeb-978a-4503-b030-6fa988b3ae85",
   :block/left
   [:block/uuid #uuid "605bffeb-5046-437b-919a-1cbcd25355ec"],
   :block/refs (),
   :block/anchor "level_3",
   :block/children #{},
   :block/body [],
   :block/meta
   {:timestamps [], :properties [], :start-pos 54, :end-pos 67},
   :block/format :markdown,
   :block/level 4,
   :block/tags [],
   :block/title [["Plain" "level 3"]],
   :block/content "#### level 3\n",
   :block/parent
   [:block/uuid #uuid "605bffeb-5046-437b-919a-1cbcd25355ec"],
   :block/page [:block/name "mar 24th, 2021"],
   :block/file [:file/path "journals/2021_03_24.md"]}
  {:block/uuid #uuid "605bffeb-6df0-4bea-9490-c4ce5f0a059d",
   :block/left
   [:block/uuid #uuid "605bffeb-978a-4503-b030-6fa988b3ae85"],
   :block/refs (),
   :block/anchor "",
   :block/children #{},
   :block/body [],
   :block/meta
   {:timestamps [], :properties [], :start-pos 67, :end-pos 72},
   :block/format :markdown,
   :block/level 4,
   :block/tags [],
   :block/title [],
   :block/content "####\n",
   :block/parent
   [:block/uuid #uuid "605bffeb-5046-437b-919a-1cbcd25355ec"],
   :block/page [:block/name "mar 24th, 2021"],
   :block/file [:file/path "journals/2021_03_24.md"]}
  {:block/uuid #uuid "605bffeb-0178-4bdb-a877-f5b5f3e44748",
   :block/left [:block/name "contents"],
   :block/refs (),
   :block/anchor "What-27-s_Contents-3f-",
   :block/children
   #{[:block/uuid #uuid "605bffeb-7715-4196-9c06-a0845f03da6a"]},
   :block/body [],
   :block/meta
   {:timestamps [], :properties [], :start-pos 0, :end-pos 24},
   :block/format :markdown,
   :block/level 2,
   :block/tags [],
   :block/title
   [["Plain" "What's "]
    ["Emphasis" [["Bold"] [["Plain" "Contents"]]]]
    ["Plain" "?"]],
   :block/content "## What's **Contents**?\n",
   :block/parent [:block/name "contents"],
   :block/page [:block/name "contents"],
   :block/file [:file/path "pages/contents.md"]}
  {:block/uuid #uuid "605bffeb-7715-4196-9c06-a0845f03da6a",
   :block/left
   [:block/uuid #uuid "605bffeb-0178-4bdb-a877-f5b5f3e44748"],
   :block/refs (),
   :block/anchor
   "It-27-s_a_normal_page_called_-2c-_you_can_use_it_for-3a-",
   :block/children
   #{[:block/uuid #uuid "605bffeb-abf0-456b-bc10-80be0ab4f849"]
     [:block/uuid #uuid "605bffeb-e9d9-43e1-9392-9f0497c3c53b"]
     [:block/uuid #uuid "605bffeb-3de5-4ca6-8d3b-cd85c292ae88"]},
   :block/body [],
   :block/meta
   {:timestamps [], :properties [], :start-pos 24, :end-pos 88},
   :block/format :markdown,
   :block/level 3,
   :block/tags [],
   :block/title
   [["Plain" "It's a normal page called "]
    ["Link"
     {:url ["Search" "Contents"],
      :label [["Plain" ""]],
      :full_text "[[Contents]]",
      :metadata ""}]
    ["Plain" ", you can use it for:"]],
   :block/content
   "### It's a normal page called [[Contents]], you can use it for:\n",
   :block/path-refs ({:block/name "contents"}),
   :block/parent
   [:block/uuid #uuid "605bffeb-0178-4bdb-a877-f5b5f3e44748"],
   :block/page [:block/name "contents"],
   :block/file [:file/path "pages/contents.md"]}
  {:block/uuid #uuid "605bffeb-e9d9-43e1-9392-9f0497c3c53b",
   :block/left
   [:block/uuid #uuid "605bffeb-7715-4196-9c06-a0845f03da6a"],
   :block/refs (),
   :block/anchor "1-2e-_table_of_content-2f-index-2f-MOC",
   :block/children #{},
   :block/body [],
   :block/meta
   {:timestamps [], :properties [], :start-pos 88, :end-pos 123},
   :block/format :markdown,
   :block/level 4,
   :block/tags [],
   :block/title [["Plain" "1. table of content/index/MOC"]],
   :block/content "#### 1. table of content/index/MOC\n",
   :block/path-refs ({:block/name "contents"}),
   :block/parent
   [:block/uuid #uuid "605bffeb-7715-4196-9c06-a0845f03da6a"],
   :block/page [:block/name "contents"],
   :block/file [:file/path "pages/contents.md"]}
  {:block/uuid #uuid "605bffeb-3de5-4ca6-8d3b-cd85c292ae88",
   :block/left
   [:block/uuid #uuid "605bffeb-e9d9-43e1-9392-9f0497c3c53b"],
   :block/refs (),
   :block/anchor
   "2-2e-_pinning-2f-bookmarking_favorites_pages-2f-blocks_(e-2e-g-2e-_)",
   :block/children #{},
   :block/body [],
   :block/meta
   {:timestamps [], :properties [], :start-pos 123, :end-pos 192},
   :block/format :markdown,
   :block/level 4,
   :block/tags [],
   :block/title
   [["Plain" "2. pinning/bookmarking favorites pages/blocks (e.g. "]
    ["Link"
     {:url ["Search" "Logseq"],
      :label [["Plain" ""]],
      :full_text "[[Logseq]]",
      :metadata ""}]
    ["Plain" ")"]],
   :block/content
   "#### 2. pinning/bookmarking favorites pages/blocks (e.g. [[Logseq]])\n",
   :block/path-refs ({:block/name "logseq"} {:block/name "contents"}),
   :block/parent
   [:block/uuid #uuid "605bffeb-7715-4196-9c06-a0845f03da6a"],
   :block/page [:block/name "contents"],
   :block/file [:file/path "pages/contents.md"]}
  {:block/uuid #uuid "605bffeb-abf0-456b-bc10-80be0ab4f849",
   :block/left
   [:block/uuid #uuid "605bffeb-3de5-4ca6-8d3b-cd85c292ae88"],
   :block/refs (),
   :block/anchor
   "3-2e-_You_can_also_put_many_different_things-2c-_depending_on_your_personal_workflow-2e-",
   :block/children #{},
   :block/body [],
   :block/meta
   {:timestamps [], :properties [], :start-pos 192, :end-pos 276},
   :block/format :markdown,
   :block/level 4,
   :block/tags [],
   :block/title
   [["Plain"
     "3. You can also put many different things, depending on your personal workflow."]],
   :block/content
   "#### 3. You can also put many different things, depending on your personal workflow.",
   :block/path-refs ({:block/name "contents"}),
   :block/parent
   [:block/uuid #uuid "605bffeb-7715-4196-9c06-a0845f03da6a"],
   :block/page [:block/name "contents"],
   :block/file [:file/path "pages/contents.md"]})

