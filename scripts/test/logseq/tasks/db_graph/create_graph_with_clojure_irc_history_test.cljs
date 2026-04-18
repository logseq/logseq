(ns logseq.tasks.db-graph.create-graph-with-clojure-irc-history-test
  (:require ["fs" :as fs]
            ["os" :as node-os]
            ["path" :as node-path]
            [cljs.test :refer [deftest is testing]]
            [logseq.tasks.db-graph.create-graph-with-clojure-irc-history :as sut]))

(deftest extract-day-paths-returns-sorted-unique-day-pages
  (let [index-html (str "<a href=\"2008/2008-02-03.html\">3</a>"
                        "<a href=\"2008/2008-02-01.html\">1</a>"
                        "<a href=\"index.html\">home</a>"
                        "<a href=\"2008/2008-02-01.html\">1</a>")]
    (is (= ["2008/2008-02-01.html" "2008/2008-02-03.html"]
           (sut/extract-day-paths index-html)))))

(deftest extract-chat-rows-parses-time-nick-and-message
  (let [day-html (str "<tr id=\"t1245A\"><td><a href=\"#t1245A\">12:45</a></td>"
                      "<td class=\"n2\">otwieracz</td>"
                      "<td>Hello &quot;there&quot; &amp; <a href=\"https://example.com\">https://example.com</a></td></tr>"
                      "<tr id=\"t1249A\" class=\"h\"><td><a href=\"#t1249A\">12:49</a></td>"
                      "<td class=\"n6\">lxsameer</td>"
                      "<td>otwieracz: selmer</td></tr>")]
    (is (= [{:time "12:45"
             :nick "otwieracz"
             :message "Hello \"there\" & https://example.com"}
            {:time "12:49"
             :nick "lxsameer"
             :message "otwieracz: selmer"}]
           (sut/extract-chat-rows day-html)))))

(deftest select-day-paths-downloads-all-by-default
  (let [paths ["2008/2008-02-01.html"
               "2008/2008-02-02.html"
               "2008/2008-02-03.html"
               "2008/2008-02-04.html"]]
    (is (= paths
           (sut/select-day-paths paths {})))
    (is (= ["2008/2008-02-01.html" "2008/2008-02-02.html"]
           (sut/select-day-paths paths {:limit-days 2})))))

(deftest build-page-and-blocks-uses-journal-page-and-chat-timestamps
  (testing "Each chat block stores created-by-ref and timestamp derived from date/time"
    (let [chouser-uuid #uuid "11111111-1111-1111-1111-111111111111"
          rhickey-uuid #uuid "22222222-2222-2222-2222-222222222222"
          page (sut/build-page-and-blocks {:date "2008-02-01"
                                           :day-path "2008/2008-02-01.html"
                                           :base-url "https://chouser.us/clojure-log/"
                                           :user->uuid {"Chouser" chouser-uuid
                                                        "rhickey" rhickey-uuid}
                                           :chat-rows [{:time "20:46"
                                                        :nick "Chouser"
                                                        :message "Hi"}
                                                       {:time "20:47"
                                                        :nick "rhickey"
                                                        :message "hello"}]})]
      (is (= 20080201
             (get-in page [:page :build/journal])))
      (is (= "20:46 Chouser: Hi"
             (get-in page [:blocks 0 :block/title])))
      (is (= "20:47 rhickey: hello"
             (get-in page [:blocks 1 :block/title])))
      (is (= [:block/uuid chouser-uuid]
             (get-in page [:blocks 0 :build/properties :logseq.property/created-by-ref])))
      (is (= [:block/uuid rhickey-uuid]
             (get-in page [:blocks 1 :build/properties :logseq.property/created-by-ref])))
      (is (= (sut/date-time->timestamp-ms "2008-02-01" "20:46")
             (get-in page [:blocks 0 :block/created-at])))
      (is (= (sut/date-time->timestamp-ms "2008-02-01" "20:47")
             (get-in page [:blocks 1 :block/created-at])))
      (is (= (sut/date-time->timestamp-ms "2008-02-01" "20:46")
             (get-in page [:blocks 0 :block/updated-at])))
      (is (= (sut/date-time->timestamp-ms "2008-02-01" "20:47")
             (get-in page [:blocks 1 :block/updated-at]))))))

(deftest build-user-pages-creates-user-page-entities
  (let [chouser-uuid #uuid "11111111-1111-1111-1111-111111111111"
        rhickey-uuid #uuid "22222222-2222-2222-2222-222222222222"
        pages (sut/build-user-pages {"Chouser" chouser-uuid
                                     "rhickey" rhickey-uuid})
        pages-by-title (into {} (map (fn [{:keys [page]}] [(:block/title page) page])) pages)]
    (is (= #{"Chouser" "rhickey"} (set (keys pages-by-title))))
    (is (= chouser-uuid (get-in pages-by-title ["Chouser" :block/uuid])))
    (is (= "Chouser" (get-in pages-by-title ["Chouser" :build/properties :logseq.property.user/name])))
    (is (= rhickey-uuid (get-in pages-by-title ["rhickey" :block/uuid])))
    (is (= "rhickey" (get-in pages-by-title ["rhickey" :build/properties :logseq.property.user/name])))))

(deftest build-page-and-blocks-handles-empty-chat-day
  (let [page (sut/build-page-and-blocks {:date "2008-02-01"
                                         :day-path "2008/2008-02-01.html"
                                         :base-url "https://chouser.us/clojure-log/"
                                         :user->uuid {}
                                         :chat-rows []})]
    (is (= 20080201
           (get-in page [:page :build/journal])))
    (is (= []
           (:blocks page)))))

(deftest resolve-source-dir-supports-root-and-direct-clojure-log-path
  (let [tmp-root (str (fs/mkdtempSync (node-path/join (node-os/tmpdir) "clj-log-test-")))
        repo-root (node-path/join tmp-root "chouser.github.io-master")
        clojure-log-dir (node-path/join repo-root "clojure-log")
        index-html "<html></html>"]
    (try
      (fs/mkdirSync clojure-log-dir #js {:recursive true})
      (fs/writeFileSync (node-path/join clojure-log-dir "index.html") index-html)
      (is (= clojure-log-dir
             (sut/resolve-source-dir clojure-log-dir)))
      (is (= clojure-log-dir
             (sut/resolve-source-dir repo-root)))
      (is (= clojure-log-dir
             (sut/resolve-source-dir tmp-root)))
      (finally
        (fs/rmSync tmp-root #js {:recursive true :force true})))))
