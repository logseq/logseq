(ns frontend.extensions.code-cm6-api-test
  (:require ["@codemirror/state" :refer [EditorState]]
            [cljs.test :refer [deftest is testing]]
            [frontend.extensions.code-cm6 :as cm6]
            [frontend.extensions.code-cm6.editor :as cm6-editor]
            [frontend.extensions.code-cm6.api :as api]))

(defn- noop [& _])

(deftest enhancer-payload-exposes-versioned-cm6-contract
  (let [payload (api/make-enhancer-payload
                 {:editor-id "editor-1"
                  :view {:cm6-view true}
                  :register-extension! noop
                  :register-language! noop
                  :get-language noop})]
    (is (= 1 (:api-version payload)))
    (is (contains? (:capabilities payload) :code-editor/cm6))
    (is (contains? (:capabilities payload) :code-editor/extensions))
    (is (contains? (:capabilities payload) :code-editor/language-registry))
    (is (= "editor-1" (:editor-id payload)))
    (is (true? (api/valid-enhancer-payload? payload)))))

(deftest enhancer-payload-rejects-cm5-shaped-integrations
  (testing "CM6 plugins must receive a versioned host API, not window.CodeMirror"
    (is (false? (api/valid-enhancer-payload? js/window.CodeMirror)))
    (is (false? (api/valid-enhancer-payload?
                 {:CodeMirror js/window.CodeMirror})))
    (is (false? (api/valid-enhancer-payload?
                 {:api-version 1
                  :capabilities #{:code-editor/cm6}
                  :register-extension! noop})))))

(deftest cm5-option-audit-marks-options-that-need-adapters
  (let [options {:lineNumbers true
                 :matchBrackets true
                 :theme "solarized dark"
                 :readOnly false
                 :autoCloseBrackets true
                 :extraKeys {"Ctrl-Space" "autocomplete"}}]
    (is (= #{:autoCloseBrackets
             :extraKeys
             :lineNumbers
             :matchBrackets
             :readOnly
             :theme}
           (api/cm5-option-keys options)))))

(deftest cm6-context-namespace-exposes-controlled-entrypoints
  (testing "The CM6 context module loads without exposing a CM5 editor object"
    (is (fn? cm6/create-context!))
    (is (fn? cm6/get-value))
    (is (fn? cm6/set-value!))
    (is (fn? cm6/set-selection-by-offset!))
    (is (fn? cm6/destroy!))
    (is (fn? cm6-editor/render!))))

(deftest line-ch-and-offset-conversions-use-cm6-document-offsets
  (let [state (EditorState.create #js {:doc "abc\nxy"})
        context {:view #js {:state state}}]
    (is (= 0 (cm6/line-ch->offset context {:line 0 :ch 0})))
    (is (= 2 (cm6/line-ch->offset context {:line 0 :ch 2})))
    (is (= 4 (cm6/line-ch->offset context {:line 1 :ch 0})))
    (is (= 6 (cm6/line-ch->offset context {:line 1 :ch 10})))
    (is (= {:line 1 :ch 1} (cm6/offset->line-ch context 5)))))

(deftest context-default-value-tracks-save-baseline-without-textarea
  (let [context {:*state (atom {:default-value "old"})}]
    (is (= "old" (cm6/default-value context)))
    (is (identical? context (cm6/set-default-value! context "new")))
    (is (= "new" (cm6/default-value context)))))
