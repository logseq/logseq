(ns logseq.outliner.validate-mutation2-test
  "Second-run mutation survivors in logseq.outliner.validate: the data of every
  thrown notification."
  (:require [clojure.string :as string]
            [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.validate :as outliner-validate]))

(defn- thrown-ex-data
  [f]
  (try (f)
       nil
       (catch :default e (ex-data e))))

;; Fails if, in `validate-page-title-no-hashtag`, the `:type` key is dropped, the `:payload` key is dropped, the `:message` key is dropped, the `:i18n-key` key is dropped or `:page.validation/name-no-hash` becomes `:page.validation/name-no-slash`.
(deftest validate-page-title-no-hashtag-throws-notification
  (is (= {:node :n
          :type :notification
          :payload {:message "Page name can't include \"#\"."
                    :i18n-key :page.validation/name-no-hash
                    :type :warning}}
         (thrown-ex-data #(outliner-validate/validate-page-title-no-hashtag "a#b" {:node :n})))))

;; Fails if, in `validate-page-title-characters`, the `:type` key is dropped, the `:payload` key is dropped, the `:message` key is dropped, the `:i18n-key` key is dropped or `:page.validation/name-no-slash` becomes `:page.validation/duplicate`.
(deftest validate-page-title-characters-throws-notification
  (is (= {:node :n
          :type :notification
          :payload {:message "Page name can't include \"/\"."
                    :i18n-key :page.validation/name-no-slash
                    :type :warning}}
         (thrown-ex-data #(outliner-validate/validate-page-title-characters "a/b" {:node :n})))))

;; Fails if, in `validate-page-title`, the body becomes `nil`, the `:type` key is dropped, the `:payload` key is dropped, the `:message` key is dropped, the `:i18n-key` key is dropped or `:page.validation/name-blank` becomes `:page.validation/name-no-hash`.
(deftest validate-page-title-throws-when-blank
  (is (= {:node :n
          :type :notification
          :payload {:message "Page name can't be blank."
                    :i18n-key :page.validation/name-blank
                    :type :warning}}
         (thrown-ex-data #(outliner-validate/validate-page-title " " {:node :n})))))

;; Fails if, in `validate-unique-for-page`, the `:message` key is dropped, the `:i18n-key` key is dropped, the `:i18n-args` key is dropped, the `:type` key is dropped, `:property.validation/duplicate` becomes `:property.validation/invalid-name`, `:class.validation/duplicate` becomes `:class.validation/extends-cycle`, `:block/title` becomes `:block/_parent` or `:page.validation/duplicate` becomes `:page.validation/duplicate-name`.
(deftest validate-unique-by-name-and-tags-throws-notifications
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:color {:logseq.property/type :default}
                            :color2 {:logseq.property/type :default}}
               :classes {:Class1 {} :Class2 {}}
               :pages-and-blocks
               [{:page {:block/title "page1"}}
                {:page {:block/title "another page"}}
                {:page {:block/title "Apple" :build/tags [:Company]}}
                {:page {:block/title "Another Company" :build/tags [:Company]}}]})
        db @conn]
    (is (= {:type :notification
            :payload {:message "Another property named \"color\" already exists."
                      :i18n-key :property.validation/duplicate
                      :i18n-args ["color"]
                      :type :warning}}
           (thrown-ex-data #(outliner-validate/validate-unique-by-name-and-tags
                             db "color" (d/entity db :user.property/color2)))))
    (is (= {:type :notification
            :payload {:message "Another tag named \"Class1\" already exists."
                      :i18n-key :class.validation/duplicate
                      :i18n-args ["Class1"]
                      :type :warning}}
           (thrown-ex-data #(outliner-validate/validate-unique-by-name-and-tags
                             db "Class1" (d/entity db :user.class/Class2)))))
    (is (= {:type :notification
            :payload {:message "Another page named \"page1\" already exists."
                      :i18n-key :page.validation/duplicate-name
                      :i18n-args ["page1"]
                      :type :warning}}
           (thrown-ex-data #(outliner-validate/validate-unique-by-name-and-tags
                             db "page1" (db-test/find-page-by-title db "another page")))))
    (let [data (thrown-ex-data #(outliner-validate/validate-unique-by-name-and-tags
                                 db "Apple" (db-test/find-page-by-title db "Another Company")))
          tags-str (second (get-in data [:payload :i18n-args]))]
      (is (= #{"#Company" "#Page"} (set (string/split tags-str #", "))))
      (is (= {:type :notification
              :payload {:message (str "Another page named \"Apple\" already exists for tags: " tags-str)
                        :i18n-key :page.validation/duplicate
                        :i18n-args ["Apple" tags-str]
                        :type :warning}}
             data)))))

;; Fails if, in `validate-disallow-page-with-journal-name`, the `:type` key is dropped, the `:payload` key is dropped, the `:message` key is dropped or the `:i18n-key` key is dropped.
(deftest validate-block-title-validates-uniqueness-and-journal-names
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}}
               {:page {:block/title "another page"}}])
        db @conn
        another (db-test/find-page-by-title db "another page")]
    (is (= :page.validation/duplicate-name
           (get-in (thrown-ex-data #(outliner-validate/validate-block-title db "page1" another))
                   [:payload :i18n-key])))
    (is (= {:type :notification
            :payload {:message "This page can't be changed to a journal page"
                      :i18n-key :journal/page-cant-convert-warning
                      :type :warning}}
           (thrown-ex-data #(outliner-validate/validate-block-title db "Dec 16th, 2024" another))))
    (is (= {:type :notification
            :payload {:message "This page can't be changed to a journal page"
                      :i18n-key :journal/page-cant-convert-warning
                      :type :warning}}
           (thrown-ex-data #(outliner-validate/validate-disallow-page-with-journal-name "Dec 16th, 2024" another))))))

;; Fails if, in `validate-property-title`, the body becomes `nil`, the `:type` key is dropped, the `:payload` key is dropped, the `:message` key is dropped, the `:i18n-key` key is dropped or `:property.validation/invalid-name` becomes `:property.validation/duplicate`.
(deftest validate-property-title-throws-notification
  (let [message "This is an invalid property name. A property name cannot start with page reference characters '#' or '[['."
        expected-payload {:message message
                          :i18n-key :property.validation/invalid-name
                          :type :error}]
    (is (= {:type :notification :payload expected-payload}
           (thrown-ex-data #(outliner-validate/validate-property-title "#bad"))))
    (is (= {:k 1 :type :notification :payload expected-payload}
           (thrown-ex-data #(outliner-validate/validate-property-title "[[bad" {:k 1}))))
    (is (nil? (outliner-validate/validate-property-title "good")))))

;; Fails if, in `validate-editing-built-in-property`, the `:type` key is dropped, the `:payload` key is dropped, the `:message` key is dropped, the `:property` key is dropped, the `:disallowed-attributes` key is dropped or `:db/ident` becomes `:db/id`.
(deftest validate-editing-built-in-property-throws-notification
  (let [conn (db-test/create-conn)
        property (d/entity @conn :logseq.property/heading)]
    (is (= {:type :notification
            :payload {:message "Can't change the given attributes for a built-in property"
                      :type :error}
            :property :logseq.property/heading
            :disallowed-attributes #{:block/title}}
           (thrown-ex-data #(outliner-validate/validate-editing-built-in-property
                             property {:block/title "x" :logseq.property/description "ok"}))))))

;; Fails if, in `validate-extends-property-have-correct-type`, the `:type` key is dropped, the `:payload` key is dropped, the `:blocks` key is dropped, the `:message` key is dropped, the `:i18n-key` key is dropped, `:class.validation/invalid-extends-type` becomes `:class.validation/tag-with-non-tag`, `:db/id` becomes `:db/ident`, `:block/title` becomes `:block/_parent` or `remove` becomes `filter`.
;; Fails if, in `disallow-built-in-class-extends-change`, the `:type` key is dropped, the `:payload` key is dropped, the `:message` key is dropped, the `:i18n-key` key is dropped or `:class.validation/built-in-extends-change` becomes `:class.validation/cant-add-tag-on-built-in`.
;; Fails if, in `disallow-extends-cycle`, `:db/id` becomes `:db/ident`, the `:type` key is dropped, the `:payload` key is dropped, the `:message` key is dropped, the `:i18n-key` key is dropped, the `:blocks` key is dropped, `:class.validation/extends-cycle` becomes `:class.validation/invalid-extends-type` or `:block/title` becomes `:block/_parent`.
(deftest validate-extends-property-throws-notifications
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:Parent {}
                         :Child {:logseq.property.class/extends :user.class/Parent}}
               :pages-and-blocks [{:page {:block/title "not a tag"}}]})
        db @conn
        parent (d/entity db :user.class/Parent)
        child (d/entity db :user.class/Child)
        page (db-test/find-page-by-title db "not a tag")]
    (is (= {:type :notification
            :payload {:message "Can't extend this page since either it is not a tag or is extending from a page that is not a tag"
                      :i18n-key :class.validation/invalid-extends-type
                      :type :error}
            :blocks [{:db/id (:db/id page) :block/title "not a tag"}]}
           (-> (thrown-ex-data #(outliner-validate/validate-extends-property db parent [child page]))
               (update :blocks vec))))
    (is (= {:type :notification
            :payload {:message "Can't change the extends of a built-in tag"
                      :i18n-key :class.validation/built-in-extends-change
                      :type :error}}
           (thrown-ex-data #(outliner-validate/validate-extends-property
                             db parent [(d/entity db :logseq.class/Task)]))))
    (is (= {:type :notification
            :payload {:message "Tag extends cycle"
                      :i18n-key :class.validation/extends-cycle
                      :type :error
                      :blocks [{:db/id (:db/id parent) :block/title "Parent"}]}}
           (-> (thrown-ex-data #(outliner-validate/validate-extends-property db child [parent]))
               (update-in [:payload :blocks] vec)))
        "A tag can't extend its own descendant")
    (is (= :class.validation/extends-cycle
           (get-in (thrown-ex-data #(outliner-validate/validate-extends-property db parent [parent]))
                   [:payload :i18n-key]))
        "A tag can't extend itself")))

;; Fails if, in `disallow-node-cant-tag-with-built-in-non-tags`, the `:type` key is dropped, the `:payload` key is dropped, the `:property-value` key is dropped, the `:message` key is dropped, the `:i18n-key` key is dropped, the `:i18n-args` key is dropped, `:block/title` becomes `:block/_parent` or `:class.validation/tag-with-non-tag` becomes `:class.validation/built-in-extends-change`.
;; Fails if, in `disallow-node-cant-tag-with-private-tags`, the `:payload` key is dropped, the `:property-id` key is dropped, the `:property-value` key is dropped, the `:message` key is dropped, the `:i18n-key` key is dropped, the `:i18n-args` key is dropped, the `:type` key is dropped, `:class.validation/cant-remove-tag-built-in` becomes `:class.validation/cant-remove-tag-on-built-in`, `:class.validation/cant-set-tag-built-in` becomes `:class.validation/duplicate` or `:block/tags` becomes `:block/title`.
;; Fails if, in `disallow-tagging-a-built-in-entity`, the `:type` key is dropped, the `:payload` key is dropped, the `:message` key is dropped, the `:i18n-key` key is dropped, the `:i18n-args` key is dropped, `:block/title` becomes `:block/_parent`, `:class.validation/cant-remove-tag-on-built-in` becomes `:class.validation/cant-set-tag-built-in` or `:class.validation/cant-add-tag-on-built-in` becomes `:class.validation/cant-remove-tag-built-in`.
(deftest validate-tags-property-throws-notifications
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "page1"}
                 :blocks [{:block/title "block"}]}]})
        db @conn
        block (db-test/find-block-by-content db "block")
        tag-title (:block/title (d/entity db :logseq.class/Tag))
        priority-title (:block/title (d/entity db :logseq.property/priority))
        heading (d/entity db :logseq.property/heading)]
    (is (= {:type :notification
            :payload {:message (str "Can't set tag with built-in #" tag-title)
                      :i18n-key :class.validation/cant-set-tag-built-in
                      :i18n-args [tag-title]
                      :type :error}
            :property-id :block/tags
            :property-value :logseq.class/Tag}
           (thrown-ex-data #(outliner-validate/validate-tags-property db [(:db/id block)] :logseq.class/Tag))))
    (is (= {:type :notification
            :payload {:message (str "Can't set tag with built-in page that isn't a tag " (pr-str priority-title))
                      :i18n-key :class.validation/tag-with-non-tag
                      :i18n-args [priority-title]
                      :type :error}
            :property-value :logseq.property/priority}
           (thrown-ex-data #(outliner-validate/validate-tags-property db [(:db/id block)] :logseq.property/priority))))
    (is (= {:type :notification
            :payload {:message (str "Can't add tag on built-in " (pr-str (:block/title heading)))
                      :i18n-key :class.validation/cant-add-tag-on-built-in
                      :i18n-args [(:block/title heading)]
                      :type :error}}
           (thrown-ex-data #(outliner-validate/validate-tags-property db [:logseq.property/heading] :logseq.class/Page))))
    (is (= {:type :notification
            :payload {:message (str "Can't remove tag with built-in #" tag-title)
                      :i18n-key :class.validation/cant-remove-tag-built-in
                      :i18n-args [tag-title]
                      :type :error}
            :property-id :block/tags
            :property-value :logseq.class/Tag}
           (thrown-ex-data #(outliner-validate/validate-tags-property-deletion db [(:db/id block)] :logseq.class/Tag))))
    (is (= {:type :notification
            :payload {:message (str "Can't remove tag on built-in " (pr-str (:block/title heading)))
                      :i18n-key :class.validation/cant-remove-tag-on-built-in
                      :i18n-args [(:block/title heading)]
                      :type :error}}
           (thrown-ex-data #(outliner-validate/validate-tags-property-deletion db [:logseq.property/heading] :logseq.class/Tag))))))

;; Fails if, in `disallow-removing-page-tag`, `:block/parent` becomes `:block/tags`, the `:type` key is dropped, the `:payload` key is dropped, the `:message` key is dropped, the `:i18n-key` key is dropped, the `:i18n-args` key is dropped, the `:entity` key is dropped, the `:property` key is dropped, `:block/title` becomes `:block/_parent`, `:page.convert/cant-be-block` becomes `:page.convert/cant-be-block-has-children`, `:block/tags` becomes `:block/title`, `:db/id` becomes `:db/ident`, `:page.convert/cant-be-block-move-first` becomes `:page.convert/page-to-property-namespaced`, `:block/_parent` becomes `:block/keys` or `:page.convert/cant-be-block-has-children` becomes `:page.convert/cant-be-block-move-first`.
(deftest validate-tags-property-deletion-refuses-page-to-block-conversion
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "no parent"}}
               {:page {:block/title "root namespace"}}
               {:page {:block/title "top"}}
               {:page {:block/title "has page child"}}
               {:page {:block/title "child page"}}])
        library (:db/id (d/entity @conn [:block/uuid (:block/uuid (db-test/find-page-by-title @conn "Library"))]))
        _ (d/transact! conn [{:db/id (:db/id (db-test/find-page-by-title @conn "root namespace"))
                              :block/parent library}
                             {:db/id (:db/id (db-test/find-page-by-title @conn "has page child"))
                              :block/parent (:db/id (db-test/find-page-by-title @conn "top"))}
                             {:db/id (:db/id (db-test/find-page-by-title @conn "child page"))
                              :block/parent (:db/id (db-test/find-page-by-title @conn "has page child"))}])
        db @conn
        data-for (fn [title i18n-key message]
                   (let [page (db-test/find-page-by-title db title)]
                     [{:type :notification
                       :payload {:message message
                                 :type :error
                                 :i18n-key i18n-key
                                 :i18n-args [title]
                                 :entity (into {} page)
                                 :property :block/tags}}
                      (thrown-ex-data #(outliner-validate/validate-tags-property-deletion
                                        db [(:db/id page)] :logseq.class/Page))]))]
    (let [[expected actual] (data-for "no parent" :page.convert/cant-be-block
                                      "Page \"no parent\" cannot be converted to a block")]
      (is (= expected actual)))
    (let [[expected actual] (data-for "root namespace" :page.convert/cant-be-block-move-first
                                      "Page \"root namespace\" cannot be converted to a block, please move it to another page first")]
      (is (= expected actual)))
    (let [[expected actual] (data-for "has page child" :page.convert/cant-be-block-has-children
                                      "Page \"has page child\" cannot be converted to a block because it has page children")]
      (is (= expected actual)))))

;; Fails if, in `validate-block-can-tag-with-page-tag`, the `:node` key is dropped, `:logseq.property/created-from-property` becomes `:logseq.property/description`, `:page.convert/property-value-to-page` becomes `:page.convert/block-parent-not-page`, `:page.convert/block-parent-not-page` becomes `:page.convert/cant-be-block`, the `:type` key is dropped, the `:payload` key is dropped, the `:message` key is dropped, the `:i18n-key` key is dropped or the `:block` key is dropped.
(deftest validate-tags-property-page-tag-refuses-invalid-blocks
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:p1 {:logseq.property/type :default}}
               :pages-and-blocks
               [{:page {:block/title "page1"}
                 :blocks [{:block/title "parent block"
                           :build/children [{:block/title "nested block"}]}
                          {:block/title "blank block"}
                          {:block/title "slash block"}
                          {:block/title "property value block"}]}]})
        p1 (d/entity @conn :user.property/p1)
        blank (db-test/find-block-by-content @conn "blank block")
        slash (db-test/find-block-by-content @conn "slash block")
        value-block (db-test/find-block-by-content @conn "property value block")
        _ (d/transact! conn [{:db/id (:db/id blank) :block/title " "}
                             {:db/id (:db/id slash) :block/title "a/b"}
                             {:db/id (:db/id value-block) :logseq.property/created-from-property (:db/id p1)}])
        db @conn
        nested (db-test/find-block-by-content db "nested block")
        tag! (fn [block] (thrown-ex-data #(outliner-validate/validate-tags-property
                                           db [(:db/id block)] :logseq.class/Page)))]
    (is (= (d/entity db (:db/id blank)) (:node (tag! (d/entity db (:db/id blank)))))
        "A blank title is reported with its node")
    (is (= (d/entity db (:db/id slash)) (:node (tag! (d/entity db (:db/id slash)))))
        "A title with a slash is reported with its node")
    (let [block (d/entity db (:db/id value-block))
          data (tag! block)]
      (is (= {:type :notification
              :payload {:message "Can't convert property value to page."
                        :i18n-key :page.convert/property-value-to-page
                        :type :error
                        :block (into {} block)}}
             data)))
    (let [data (tag! nested)]
      (is (= {:type :notification
              :payload {:message "Can't convert this block to page since its parent is not a page."
                        :i18n-key :page.convert/block-parent-not-page
                        :type :error
                        :block (into {} nested)}}
             data)))))

;; Fails if, in `validate-page-to-property-conversion`, the `:message` key is dropped or the `:type` key is dropped.
(deftest validate-page-to-property-conversion-throws-notification
  (let [conn (db-test/create-conn-with-blocks [{:page {:block/title "namespaced"}}])
        library (db-test/find-page-by-title @conn "Library")
        _ (d/transact! conn [{:db/id (:db/id (db-test/find-page-by-title @conn "namespaced"))
                              :block/parent (:db/id library)}])
        page (db-test/find-page-by-title @conn "namespaced")]
    (is (= {:type :notification
            :payload {:message "Namespaced pages can't be properties"
                      :i18n-key :page.convert/page-to-property-namespaced
                      :type :error}}
           (thrown-ex-data #(outliner-validate/validate-page-to-property-conversion page))))))

;; Fails if, in `disallow-editing-private-built-in-nodes`, the body becomes `nil`, the `:type` key is dropped, the `:payload` key is dropped or the `:message` key is dropped.
(deftest disallow-editing-private-built-in-nodes-throws-notification
  (let [conn (db-test/create-conn)
        db @conn]
    (is (= {:type :notification
            :payload {:message "Built-in private nodes can't be modified"
                      :type :error}}
           (thrown-ex-data #(outliner-validate/disallow-editing-private-built-in-nodes
                             [(d/entity db :logseq.property/built-in?)]))))))
