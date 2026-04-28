(ns frontend.context.i18n-test
  (:require [cljs.test :refer [deftest is testing use-fixtures]]
            [frontend.context.i18n :as i18n]
            [frontend.state :as state]))

(defn- set-language!
  [language]
  (state/set-preferred-language! language))

(use-fixtures :each
  (fn [f]
    (state/set-state! :preferred-language nil)
    (f)
    (state/set-state! :preferred-language nil)))

(deftest preferred-locale-test
  (testing "preferred locale defaults to English and reflects canonicalized state values"
    (is (= :en
           (i18n/preferred-locale)))

    (set-language! "zh-cn")
    (is (= :zh-CN
           (i18n/preferred-locale)))

    (set-language! "en-US")
    (is (= :en
           (i18n/preferred-locale)))))

(deftest locale-tag-test
  (testing "locale tags default to English"
    (is (= "en"
           (i18n/locale-tag nil))))

  (testing "locale-tag preserves canonical locale casing"
    (is (= "pt-BR"
           (i18n/locale-tag :pt-BR)))
    (is (= "zh-CN"
           (i18n/locale-tag :zh-CN)))))

(deftest start-test
  (testing "start initializes preferred language from the browser locale when missing"
    (with-redefs [i18n/fetch-local-language (constantly "pt-br")]
      (i18n/start)
      (is (= :pt-BR
             (i18n/preferred-locale)))))

  (testing "start does not overwrite an existing preferred language"
    (set-language! :en)
    (with-redefs [i18n/fetch-local-language (constantly "zh-cn")]
      (i18n/start)
      (is (= :en
             (i18n/preferred-locale))))))

(deftest t-test
  (testing "t translates the current locale"
    (set-language! :en)
    (is (= "About Logseq"
           (i18n/t :help/about)))

    (set-language! :es)
    (is (= "Acerca de Logseq"
           (i18n/t :help/about))))

  (testing "t keeps locale-specific punctuation around placeholders"
    (set-language! :en)
    (is (= "Page \"Inbox\" was deleted successfully!"
           (i18n/t :page.delete/success "Inbox")))

    (set-language! :zh-CN)
    (is (= "页面“Inbox”已成功删除！"
           (i18n/t :page.delete/success "Inbox")))

    (set-language! :zh-Hant)
    (is (= "頁面「Inbox」已成功刪除！"
           (i18n/t :page.delete/success "Inbox")))))

(deftest tt-test
  (testing "tt returns the first translated key"
    (set-language! :en)
    (is (= "About Logseq"
           (i18n/tt :missing/key :help/about))))

  (testing "tt returns nil when every key is missing"
    (is (nil? (i18n/tt :missing/one :missing/two)))))

(deftest interpolate-rich-text-test
  (testing "interpolate-rich-text keeps replacement order and preserves missing placeholders"
    (is (= ["Reassigned from "
            [:span.shortcut-feedback-name "Old action"]]
           (i18n/interpolate-rich-text
            "Reassigned from {1}"
            [[:span.shortcut-feedback-name "Old action"]])))

    (is (= [[:a {:href "https://example.com"} "https://example.com"]
            " に公開しました"]
           (i18n/interpolate-rich-text
            "{1} に公開しました"
            [[:a {:href "https://example.com"} "https://example.com"]])))

    (is (= ["Published to "
            "{2}"]
           (i18n/interpolate-rich-text
            "Published to {2}"
            [[:span "unused"]]))))

  (testing "non-string templates are returned as a single fragment"
    (is (= [[:span "inline"]]
           (i18n/interpolate-rich-text
            [:span "inline"]
            [])))))

(deftest interpolate-rich-text-with-line-breaks-test
  (is (= ["Line 1"
          [:br]
          "Line 2 "
          [:a "link"]
          "."]
         (i18n/interpolate-rich-text
          "Line 1\nLine 2 {1}."
          [[:a "link"]]
          true)))

  (is (= ["first" [:br] [:br] "third"]
         (i18n/interpolate-rich-text "first\n\nthird" [] true)))

  (is (= [:<> "Published to " [:a {:href "https://example.com"} "https://example.com"]]
         (i18n/interpolate-rich-text-node
          "Published to {1}"
          [[:a {:href "https://example.com"} "https://example.com"]]))))

(deftest replace-newlines-with-br-test
  (is (= ["first" [:br] [:br] "third"]
         (i18n/replace-newlines-with-br "first\n\nthird")))
  (is (= ["first"
          [:br]
          "second "
          [:a "link"]
          [:br]
          "third"]
         (i18n/replace-newlines-with-br ["first\nsecond " [:a "link"] "\nthird"]))))

(deftest locale-join-rich-text-test
  (testing "locale-join-rich-text uses an English comma by default"
    (set-language! :en)
    (is (= [[:span "synced"] ", " [:span "storage"]]
           (i18n/locale-join-rich-text
            [[:span "synced"] [:span "storage"]])))
    (is (= [:<> [:span "synced"] ", " [:span "storage"]]
           (i18n/locale-join-rich-text-node
            [[:span "synced"] [:span "storage"]]))))

  (testing "locale-join-rich-text uses locale-specific separators"
    (set-language! :zh-CN)
    (is (= [[:span "已同步"] "，" [:span "存储空间"]]
           (i18n/locale-join-rich-text
            [[:span "已同步"] [:span "存储空间"]])))

    (set-language! :ja)
    (is (= [[:span "同期済み"] "、" [:span "保存容量"]]
           (i18n/locale-join-rich-text
            [[:span "同期済み"] [:span "保存容量"]])))

    (set-language! :ar)
    (is (= [[:span "المزامنة"] "، " [:span "التخزين"]]
           (i18n/locale-join-rich-text
            [[:span "المزامنة"] [:span "التخزين"]])))))

(deftest locale-format-number-test
  (let [m 1234.56
        n 1234567.89
        opts {:notation "compact"}]
    (set-language! :en)
    (is (= "1,234.56"
           (i18n/locale-format-number m)))
    (is (= "1.2K"
           (i18n/locale-format-number m opts)))
    (is (= "1,234,567.89"
           (i18n/locale-format-number n)))
    (is (= "1.2M"
           (i18n/locale-format-number n opts)))

    (set-language! :zh-CN)
    (is (= "1,234.56"
           (i18n/locale-format-number m)))
    (is (= "1235"
           (i18n/locale-format-number m opts)))
    (is (= "1,234,567.89"
           (i18n/locale-format-number n)))
    (is (= "123万"
           (i18n/locale-format-number n opts)))))

(deftest locale-format-date-test
  (let [d (js/Date. 2026 3 5 9 7)
        opts {:year "numeric" :month "long" :day "numeric"}]
    (set-language! :en)
    (is (= "4/5/2026"
           (i18n/locale-format-date d {})))
    (is (= "Apr 5, 2026"
           (i18n/locale-format-date d)))
    (is (= "April 5, 2026"
           (i18n/locale-format-date d opts)))

    (set-language! :zh-CN)
    (is (= "2026/4/5"
           (i18n/locale-format-date d {})))
    (is (= "2026年4月5日"
           (i18n/locale-format-date d)))
    (is (= "2026年4月5日"
           (i18n/locale-format-date d opts)))))

(deftest locale-format-time-test
  (let [d (js/Date. 2026 3 5 9 7)]
    (set-language! :en)
    (is (= "09:07"
           (i18n/locale-format-time d)))

    (set-language! :zh-CN)
    (is (= "09:07"
           (i18n/locale-format-time d)))

    (set-language! :id)
    (is (= "09.07"
           (i18n/locale-format-time d)))))

(deftest interpolate-sentence-test
  (testing "plain text with no substitution"
    (is (= [:<> "No substitution needed."]
           (i18n/interpolate-sentence "No substitution needed."))))

  (testing "placeholders only replace {1} {2} in order"
    (is (= [:<> "Hello Bob, you have 3 unread alerts."]
           (i18n/interpolate-sentence
            "Hello {1}, you have {2} unread alerts."
            :placeholders ["Bob" "3"]))))

  (testing "single placeholder with unused extra placeholders"
    (is (= [:<> "Status: active."]
           (i18n/interpolate-sentence
            "Status: {1}."
            :placeholders ["active" "ignored"]))))

  (testing "array links replace all {{text}} in order"
    (is (= [:<>
            "Click "
            [:a {:href "/signup" :target "_blank"} "Sign up"]
            " to continue."]
           (i18n/interpolate-sentence
            "Click {{Sign up}} to continue."
            :links [{:href "/signup" :target "_blank"}]))))

  (testing "array links with multiple {{text}} use successive link attrs"
    (is (= [:<>
            "Check "
            [:a {:href "/terms"} "Terms"]
            " and "
            [:a {:href "/privacy"} "Privacy Policy"]
            "."]
           (i18n/interpolate-sentence
            "Check {{Terms}} and {{Privacy Policy}}."
            :links [{:href "/terms"} {:href "/privacy"}]))))

  (testing "hash links replace $key{{text}} by matching keys"
    (is (= [:<>
            "Visit "
            [:a {:href "https://github.com/example" :target "_blank"} "GitHub"]
            " to report issues or read "
            [:a {:href "https://docs.example.com"} "documentation"]
            "."]
           (i18n/interpolate-sentence
            "Visit $github{{GitHub}} to report issues or read $docs{{documentation}}."
            :links {:github {:href "https://github.com/example" :target "_blank"}
                    :docs {:href "https://docs.example.com"}}))))

  (testing "hash links skip unknown keys gracefully"
    (is (= [:<>
            "See "
            [:a {:href "/faq"} "FAQ"]
            "."]
           (i18n/interpolate-sentence
            "See $faq{{FAQ}}."
            :links {:faq {:href "/faq"} :unused {:href "/nowhere"}}))))

  (testing "placeholders applied before link substitution"
    (is (= [:<>
            "Hello Alice, your browser doesn't support "
            [:a {:href "https://example.com/api" :target "_blank"} "The Storage API"]
            "."]
           (i18n/interpolate-sentence
            "Hello {1}, your browser doesn't support {{The Storage API}}."
            :placeholders ["Alice"]
            :links [{:href "https://example.com/api" :target "_blank"}]))))

  (testing "template with no link markers returns plain text fragment"
    (is (= [:<> "Nothing to link here."]
           (i18n/interpolate-sentence
            "Nothing to link here."
            :links [{:href "/somewhere"}]))))

  (testing "empty text segments before link are omitted"
    (is (= [:<>
            [:a {:href "/start"} "Start here"]
            " to begin."]
           (i18n/interpolate-sentence
            "{{Start here}} to begin."
            :links [{:href "/start"}])))))
