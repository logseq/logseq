(ns logseq.tasks.lang-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.tasks.lang-lint :as lang-lint]))

(deftest translation-placeholders-detect-placeholder-sets
  (is (= #{"1" "2"}
         (lang-lint/translation-placeholders "Open {1} from {2}")))
  (is (= #{}
         (lang-lint/translation-placeholders "Search with Google"))))

(deftest placeholder-mismatch-findings-detect-non-default-locale-errors
  (testing "a localized value must match English placeholders exactly once it is defined"
    (let [findings (lang-lint/placeholder-mismatch-findings
                    {:en {:electron/link-open-confirm "Are you sure?\n\n{1}"
                          :electron/write-file-failed-with-backup "Write failed {1} {2} {3}."}
                     :zh-Hant {:electron/link-open-confirm "確定要開啟此外部連結嗎？"
                               :electron/write-file-failed-with-backup "寫入失敗。備份檔案：{1}"}
                     :zh-CN {:electron/link-open-confirm "确定要打开此链接吗？\n\n{1}"
                             :electron/write-file-failed-with-backup "写入文件 {1} 失败，{2}。备份文件已保存到 {3}。"}})]
      (is (= [{:lang :zh-Hant
               :translation-key :electron/link-open-confirm
               :expected-placeholders ["1"]
               :actual-placeholders []
               :default-value "Are you sure?\n\n{1}"
               :localized-value "確定要開啟此外部連結嗎？"}
              {:lang :zh-Hant
               :translation-key :electron/write-file-failed-with-backup
               :expected-placeholders ["1" "2" "3"]
               :actual-placeholders ["1"]
               :default-value "Write failed {1} {2} {3}."
               :localized-value "寫入失敗。備份檔案：{1}"}]
             findings)))))

(deftest translation-rich-validation-findings-report-rich-contract-mismatches
  (testing "a localized rich translation must remain a zero-arg function once defined"
    (is (= [{:lang :zh-Hant
             :translation-key :e2ee/cloud-password-rich
             :expected-value-kind :fn
             :actual-value-kind :string}
            {:lang :zh-Hant
             :translation-key :on-boarding/main-title
             :expected-value-kind :fn
             :actual-value-kind :string}]
           (lang-lint/rich-translation-mismatch-findings
            {:en {:on-boarding/main-title (fn [] ["Welcome to " [:strong "Logseq!"]])
                  :e2ee/cloud-password-rich (fn [] ["Cloud sentence " [:span "Local sentence"]])
                  :e2ee/remember-password-rich (fn [] [[:span "Remember "] "your password."])}
             :zh-Hant {:on-boarding/main-title "歡迎使用 Logseq"
                       :e2ee/cloud-password-rich "雲端密碼"
                       :e2ee/remember-password-rich (fn [] [[:span "請記住"] "你的密碼。"])}})))))

(deftest identical-translation-findings-report-defined-values-equal-to-english
  (is (= [{:lang :ko
           :translation-key :ui/cancel
           :default-value "Cancel"}
          {:lang :ko
           :translation-key :ui/save
           :default-value "Save"}]
         (lang-lint/identical-translation-findings
          {:en {:ui/cancel "Cancel"
                :ui/save "Save"
                :ui/close "Close"}
           :ko {:ui/cancel "Cancel"
                :ui/save "Save"
                :ui/close "닫기"}
           :fr {:ui/cancel "Annuler"}}
          :ko))))

(deftest identical-translation-stats-count-defined-values-equal-to-english
  (is (= [{:lang :en
           :translation-count 2
           :same-as-en-count 2}
          {:lang :ko
           :translation-count 2
           :same-as-en-count 1}
          {:lang :fr
           :translation-count 1
           :same-as-en-count 0}]
         (lang-lint/identical-translation-stats
          {:en {:ui/cancel "Cancel"
                :ui/save "Save"}
           :ko {:ui/cancel "Cancel"
                :ui/save "저장"}
           :fr {:ui/cancel "Annuler"}}))))

(deftest translation-summary-stats-report-percent-and-same-as-en-count
  (is (= [{:lang :en
           :percent-translated 100.0
           :translation-count 4
           :same-as-en-count nil}
          {:lang :fr
           :percent-translated 50.0
           :translation-count 2
           :same-as-en-count 1}
          {:lang :ko
           :percent-translated 75.0
           :translation-count 3
           :same-as-en-count 2}]
         (->> (lang-lint/translation-summary-stats
               {:en {:ui/cancel "Cancel"
                     :ui/save "Save"
                     :ui/close "Close"
                     :ui/delete "Delete"}
                :ko {:ui/cancel "Cancel"
                     :ui/save "저장"
                     :ui/close "Close"}
                :fr {:ui/cancel "Annuler"
                     :ui/save "Save"}})
              (sort-by :lang)
              vec))))

(deftest sort-translation-summary-stats-keeps-en-first-then-sorts-by-percent-and-same-as-en-count
  (is (= [:en :ko :fr :zh-Hant]
         (->> [{:lang :fr
                :percent-translated 90.0
                :same-as-en-count 1}
               {:lang :en
                :percent-translated 100.0
                :same-as-en-count nil}
               {:lang :zh-Hant
                :percent-translated 80.0
                :same-as-en-count 3}
               {:lang :ko
                :percent-translated 90.0
                :same-as-en-count 2}]
              lang-lint/sort-translation-summary-stats
              (mapv :lang)))))
