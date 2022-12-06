(ns logseq.publish
  "Main ns used by logseq app to build an HTML from a page or a block."
  (:require [rum.core :as rum]
            [logseq.publish.util :as util]
            [logseq.publish.html :as html]
            ["react-dom/server" :as react-dom-server]))

(defn ->html
  "Convert blocks into HTML."
  [config blocks refed-blocks refs root-id]
  (react-dom-server/renderToString
   (html/blocks-container blocks (merge config
                                        {:refed-blocks refed-blocks
                                         :refs refs}) root-id)))

(comment
  (require '["fs" :as fs])
  (do
    (def blocks
      [{:block/uuid #uuid "633bc97b-5149-4fb8-ae0b-cc4d6b3508c2",
        :block/journal? false,
        :block/updated-at 1664862648459,
        :block/created-at 1664862587814,
        :block/format :markdown,
        :db/id 40,
        :block/name "post 02",
        :block/file #:db{:id 48},
        :block/original-name "Post 02"}
       {:block/uuid #uuid "633bc99d-3bbc-406d-b6ae-87dcc04ffa29",
        :block/properties {},
        :block/journal? false,
        :block/left #:db{:id 40},
        :block/refs [#:db{:id 49}],
        :block/format :markdown,
        :block/content "Hello, [[Logseq Publish]]!",
        :db/id 47,
        :block/path-refs [#:db{:id 40} #:db{:id 49}],
        :block/parent #:db{:id 40},
        :block/unordered true,
        :block/page #:db{:id 40}}
       {:block/uuid #uuid "633bc9ad-1718-4cbc-8dbf-587d4ff960a0",
        :block/properties {},
        :block/journal? false,
        :block/left #:db{:id 47},
        :block/format :markdown,
        :block/content "blabla",
        :db/id 50,
        :block/path-refs [#:db{:id 40} #:db{:id 49}],
        :block/parent #:db{:id 47},
        :block/unordered true,
        :block/page #:db{:id 40}}
       {:block/uuid #uuid "633bc9b3-e67e-49be-9b72-fd8c7fc29077",
        :block/properties {},
        :block/journal? false,
        :block/left #:db{:id 47},
        :block/format :markdown,
        :block/content "Another heading",
        :db/id 51,
        :block/path-refs [#:db{:id 40}],
        :block/parent #:db{:id 40},
        :block/unordered true,
        :block/page #:db{:id 40}}
       {:block/uuid #uuid "633be94e-7957-44c4-85b3-34a4e73882d7",
        :block/properties {},
        :block/journal? false,
        :block/left #:db{:id 51},
        :block/format :markdown,
        :block/content "Block ref example:",
        :db/id 53,
        :block/path-refs [#:db{:id 40}],
        :block/parent #:db{:id 40},
        :block/unordered true,
        :block/page #:db{:id 40}}
       {:block/uuid #uuid "633be95f-f15c-4541-8547-93b4941fa497",
        :block/properties {},
        :block/journal? false,
        :block/left #:db{:id 53},
        :block/refs [#:db{:id 41}],
        :block/format :markdown,
        :block/content "((633bc97e-2f52-4bec-b7f2-814a52c12043))",
        :db/id 54,
        :block/path-refs [#:db{:id 40} #:db{:id 41}],
        :block/parent #:db{:id 53},
        :block/unordered true,
        :block/page #:db{:id 40}}
       {:block/uuid #uuid "633be960-be6f-4337-83f3-980f46647994",
        :block/properties {},
        :block/journal? false,
        :block/left #:db{:id 53},
        :block/format :markdown,
        :block/content "Block embed example:",
        :db/id 55,
        :block/path-refs [#:db{:id 40}],
        :block/parent #:db{:id 40},
        :block/unordered true,
        :block/page #:db{:id 40}}
       {:block/uuid #uuid "633be968-eed4-4002-8e32-f5666c59608b",
        :block/properties {},
        :block/journal? false,
        :block/left #:db{:id 55},
        :block/format :markdown,
        :block/content
        "{{embed ((633bc97e-2f52-4bec-b7f2-814a52c12043))}}",
        :db/id 56,
        :block/macros [#:db{:id 58}],
        :block/path-refs [#:db{:id 40}],
        :block/parent #:db{:id 55},
        :block/unordered true,
        :block/page #:db{:id 40}}])

    (def refed-blocks
      {#uuid "633bc97e-2f52-4bec-b7f2-814a52c12043"
       [{:block/uuid #uuid "633bc97e-2f52-4bec-b7f2-814a52c12043",
         :block/properties {},
         :block/journal? false,
         :block/left #:db{:id 37},
         :block/format :markdown,
         :block/content "Hi, this is my first **block**.",
         :db/id 41,
         :block/path-refs [#:db{:id 37}],
         :block/parent #:db{:id 37},
         :block/unordered true,
         :block/page #:db{:id 37}}
        {:block/uuid #uuid "633bc986-4819-48d5-89b8-8f9e37be2315",
         :block/properties {},
         :block/journal? false,
         :block/left #:db{:id 41},
         :block/format :markdown,
         :block/content "Child block 1",
         :db/id 43,
         :block/path-refs [#:db{:id 37}],
         :block/parent #:db{:id 41},
         :block/unordered true,
         :block/page #:db{:id 37}}
        {:block/uuid #uuid "633bc98c-8e8d-4826-be75-8ae8e395513b",
         :block/properties {},
         :block/journal? false,
         :block/left #:db{:id 43},
         :block/format :markdown,
         :block/content "blabla",
         :db/id 44,
         :block/path-refs [#:db{:id 37}],
         :block/parent #:db{:id 43},
         :block/unordered true,
         :block/page #:db{:id 37}}
        {:block/uuid #uuid "633bc98f-bd62-4057-bbf3-2b0581bb0b23",
         :block/properties {},
         :block/journal? false,
         :block/left #:db{:id 43},
         :block/format :markdown,
         :block/content "Child block 2",
         :db/id 45,
         :block/path-refs [#:db{:id 37}],
         :block/parent #:db{:id 41},
         :block/unordered true,
         :block/page #:db{:id 37}}
        {:block/uuid #uuid "633bc995-d90f-42ba-a58f-aab391a1ef20",
         :block/properties {},
         :block/journal? false,
         :block/left #:db{:id 45},
         :block/format :markdown,
         :block/content "blabla https://google.com",
         :db/id 46,
         :block/path-refs [#:db{:id 37}],
         :block/parent #:db{:id 45},
         :block/unordered true,
         :block/page #:db{:id 37}}]})

    (def refs
      [{:block/uuid #uuid "633bc97b-5149-4fb8-ae0b-cc4d6b3508c2",
        :block/journal? false,
        :block/updated-at 1664862648459,
        :block/created-at 1664862587814,
        :block/format :markdown,
        :db/id 49,
        :block/name "logseq publish",
        :block/original-name "Logseq Publish"}])

    (def root-id #uuid "633bc97b-5149-4fb8-ae0b-cc4d6b3508c2")

    (def html-str (->html blocks refed-blocks refs root-id))

    (.writeFileSync fs "/tmp/out.html" html-str)

    ;; (def all-blocks (->> (concat blocks (apply concat (vals refed-blocks)) refs)
    ;;                      (util/distinct-by :block/uuid)))

    ))
