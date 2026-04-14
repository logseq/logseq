;; src/main/frontend/modules/memo/inspiration.cljs
(ns frontend.modules.memo.inspiration
  (:require [frontend.modules.memo.ai.provider :as ai-provider]
            [cljs.core.async :as async]
            [cljs-http.client :as http]))

(def prompt-templates
  {:expansion
   "基于 {name} ({type}) 延伸三个可能的故事情节。\n\n设定信息：{content}"

   :relation-suggestion
   "为 {name} 建议三个可能关联的其他设定类型"

   :character-arc
   "为角色 {name} 设计成长弧线，包括起点、转折点和结局"

   :gap-analysis
   "分析当前设定网络的缺口，建议可能需要补充的设定"})

(defn build-prompt [template-id setting]
  (let [template (get prompt-templates template-id)
        content (:body setting "")]
    (-> template
        (clojure.string/replace "{name}" (:logseq.memo/id setting))
        (clojure.string/replace "{type}" (name (:logseq.memo/type setting)))
        (clojure.string/replace "{content}" content))))

(defn build-expansion-prompt [setting]
  (build-prompt :expansion setting))

(defn generate-inspiration [setting type]
  (let [prompt (build-prompt type setting)
        ch (ai-provider/complete prompt :ollama)]
    (when ch
      (async/go
        (let [response (async/<! ch)]
          (when (and response (http/unexceptional-status? (:status response)))
            (->> (:body response)
                 (clojure.string/split-lines)
                 (filter seq))))))))
