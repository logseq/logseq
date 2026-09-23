(ns frontend.extensions.code.languages
  "GENERATED FILE -- do not edit.
   Derived from @codemirror/language-data@6.5.2 dist/index.js: the same
   language table, with each upstream `load()` body resolved eagerly at
   module load instead of a dynamic import()."
  (:require
            ["@codemirror/lang-angular" :refer [angular]]
            ["@codemirror/lang-cpp" :refer [cpp]]
            ["@codemirror/lang-css" :refer [css]]
            ["@codemirror/lang-go" :refer [go]]
            ["@codemirror/lang-html" :refer [html]]
            ["@codemirror/lang-java" :refer [java]]
            ["@codemirror/lang-javascript" :refer [javascript]]
            ["@codemirror/lang-jinja" :refer [jinja]]
            ["@codemirror/lang-json" :refer [json]]
            ["@codemirror/lang-less" :refer [less]]
            ["@codemirror/lang-liquid" :refer [liquid]]
            ["@codemirror/lang-markdown" :refer [markdown]]
            ["@codemirror/lang-php" :refer [php]]
            ["@codemirror/lang-python" :refer [python]]
            ["@codemirror/lang-rust" :refer [rust]]
            ["@codemirror/lang-sass" :refer [sass]]
            ["@codemirror/lang-sql" :refer [Cassandra, MSSQL, MariaSQL, MySQL, PLSQL, PostgreSQL, SQLite, StandardSQL, sql]]
            ["@codemirror/lang-vue" :refer [vue]]
            ["@codemirror/lang-wast" :refer [wast]]
            ["@codemirror/lang-xml" :refer [xml]]
            ["@codemirror/lang-yaml" :refer [yaml]]
            ["@codemirror/legacy-modes/mode/apl" :refer [apl]]
            ["@codemirror/legacy-modes/mode/asciiarmor" :refer [asciiArmor]]
            ["@codemirror/legacy-modes/mode/asn1" :refer [asn1]]
            ["@codemirror/legacy-modes/mode/asterisk" :refer [asterisk]]
            ["@codemirror/legacy-modes/mode/brainfuck" :refer [brainfuck]]
            ["@codemirror/legacy-modes/mode/clike" :refer [csharp, dart, kotlin, objectiveC, objectiveCpp, scala, squirrel]]
            ["@codemirror/legacy-modes/mode/cmake" :refer [cmake]]
            ["@codemirror/legacy-modes/mode/cobol" :refer [cobol]]
            ["@codemirror/legacy-modes/mode/coffeescript" :refer [coffeeScript]]
            ["@codemirror/legacy-modes/mode/commonlisp" :refer [commonLisp]]
            ["@codemirror/legacy-modes/mode/crystal" :refer [crystal]]
            ["@codemirror/legacy-modes/mode/css" :refer [gss]]
            ["@codemirror/legacy-modes/mode/cypher" :refer [cypher]]
            ["@codemirror/legacy-modes/mode/d" :refer [d]]
            ["@codemirror/legacy-modes/mode/diff" :refer [diff]]
            ["@codemirror/legacy-modes/mode/dockerfile" :refer [dockerFile]]
            ["@codemirror/legacy-modes/mode/dtd" :refer [dtd]]
            ["@codemirror/legacy-modes/mode/dylan" :refer [dylan]]
            ["@codemirror/legacy-modes/mode/ebnf" :refer [ebnf]]
            ["@codemirror/legacy-modes/mode/ecl" :refer [ecl]]
            ["@codemirror/legacy-modes/mode/eiffel" :refer [eiffel]]
            ["@codemirror/legacy-modes/mode/elm" :refer [elm]]
            ["@codemirror/legacy-modes/mode/erlang" :refer [erlang]]
            ["@codemirror/legacy-modes/mode/factor" :refer [factor]]
            ["@codemirror/legacy-modes/mode/fcl" :refer [fcl]]
            ["@codemirror/legacy-modes/mode/forth" :refer [forth]]
            ["@codemirror/legacy-modes/mode/fortran" :refer [fortran]]
            ["@codemirror/legacy-modes/mode/gas" :refer [gas]]
            ["@codemirror/legacy-modes/mode/gherkin" :refer [gherkin]]
            ["@codemirror/legacy-modes/mode/groovy" :refer [groovy]]
            ["@codemirror/legacy-modes/mode/haskell" :refer [haskell]]
            ["@codemirror/legacy-modes/mode/haxe" :refer [haxe, hxml]]
            ["@codemirror/legacy-modes/mode/http" :refer [http]]
            ["@codemirror/legacy-modes/mode/idl" :refer [idl]]
            ["@codemirror/legacy-modes/mode/javascript" :refer [jsonld]]
            ["@codemirror/legacy-modes/mode/julia" :refer [julia]]
            ["@codemirror/legacy-modes/mode/livescript" :refer [liveScript]]
            ["@codemirror/legacy-modes/mode/lua" :refer [lua]]
            ["@codemirror/legacy-modes/mode/mathematica" :refer [mathematica]]
            ["@codemirror/legacy-modes/mode/mbox" :refer [mbox]]
            ["@codemirror/legacy-modes/mode/mirc" :refer [mirc]]
            ["@codemirror/legacy-modes/mode/mllike" :refer [fSharp, oCaml, sml]]
            ["@codemirror/legacy-modes/mode/modelica" :refer [modelica]]
            ["@codemirror/legacy-modes/mode/mscgen" :refer [mscgen, msgenny, xu]]
            ["@codemirror/legacy-modes/mode/mumps" :refer [mumps]]
            ["@codemirror/legacy-modes/mode/nginx" :refer [nginx]]
            ["@codemirror/legacy-modes/mode/nsis" :refer [nsis]]
            ["@codemirror/legacy-modes/mode/ntriples" :refer [ntriples]]
            ["@codemirror/legacy-modes/mode/octave" :refer [octave]]
            ["@codemirror/legacy-modes/mode/oz" :refer [oz]]
            ["@codemirror/legacy-modes/mode/pascal" :refer [pascal]]
            ["@codemirror/legacy-modes/mode/perl" :refer [perl]]
            ["@codemirror/legacy-modes/mode/pig" :refer [pig]]
            ["@codemirror/legacy-modes/mode/powershell" :refer [powerShell]]
            ["@codemirror/legacy-modes/mode/properties" :refer [properties]]
            ["@codemirror/legacy-modes/mode/protobuf" :refer [protobuf]]
            ["@codemirror/legacy-modes/mode/pug" :refer [pug]]
            ["@codemirror/legacy-modes/mode/puppet" :refer [puppet]]
            ["@codemirror/legacy-modes/mode/python" :refer [cython]]
            ["@codemirror/legacy-modes/mode/q" :refer [q]]
            ["@codemirror/legacy-modes/mode/r" :refer [r]]
            ["@codemirror/legacy-modes/mode/rpm" :refer [rpmChanges, rpmSpec]]
            ["@codemirror/legacy-modes/mode/ruby" :refer [ruby]]
            ["@codemirror/legacy-modes/mode/sas" :refer [sas]]
            ["@codemirror/legacy-modes/mode/scheme" :refer [scheme]]
            ["@codemirror/legacy-modes/mode/shell" :refer [shell]]
            ["@codemirror/legacy-modes/mode/sieve" :refer [sieve]]
            ["@codemirror/legacy-modes/mode/smalltalk" :refer [smalltalk]]
            ["@codemirror/legacy-modes/mode/solr" :refer [solr]]
            ["@codemirror/legacy-modes/mode/sparql" :refer [sparql]]
            ["@codemirror/legacy-modes/mode/spreadsheet" :refer [spreadsheet]]
            ["@codemirror/legacy-modes/mode/sql" :refer [esper]]
            ["@codemirror/legacy-modes/mode/stex" :refer [stex]]
            ["@codemirror/legacy-modes/mode/stylus" :refer [stylus]]
            ["@codemirror/legacy-modes/mode/swift" :refer [swift]]
            ["@codemirror/legacy-modes/mode/tcl" :refer [tcl]]
            ["@codemirror/legacy-modes/mode/textile" :refer [textile]]
            ["@codemirror/legacy-modes/mode/tiddlywiki" :refer [tiddlyWiki]]
            ["@codemirror/legacy-modes/mode/tiki" :refer [tiki]]
            ["@codemirror/legacy-modes/mode/toml" :refer [toml]]
            ["@codemirror/legacy-modes/mode/troff" :refer [troff]]
            ["@codemirror/legacy-modes/mode/ttcn" :refer [ttcn]]
            ["@codemirror/legacy-modes/mode/ttcn-cfg" :refer [ttcnCfg]]
            ["@codemirror/legacy-modes/mode/turtle" :refer [turtle]]
            ["@codemirror/legacy-modes/mode/vb" :refer [vb]]
            ["@codemirror/legacy-modes/mode/vbscript" :refer [vbScript]]
            ["@codemirror/legacy-modes/mode/velocity" :refer [velocity]]
            ["@codemirror/legacy-modes/mode/verilog" :refer [verilog]]
            ["@codemirror/legacy-modes/mode/vhdl" :refer [vhdl]]
            ["@codemirror/legacy-modes/mode/webidl" :refer [webIDL]]
            ["@codemirror/legacy-modes/mode/xquery" :refer [xQuery]]
            ["@codemirror/legacy-modes/mode/yacas" :refer [yacas]]
            ["@codemirror/legacy-modes/mode/z80" :refer [z80]]
            ["@codemirror/language" :refer [LanguageSupport StreamLanguage]]))

(defn- legacy
  [parser]
  (LanguageSupport. (.define StreamLanguage parser)))

(def ^:large-vars/data-var language-supports
  {
   :c (cpp)
   :cpp (cpp)
   :cql (sql #js {:dialect Cassandra})
   :css (css)
   :go (go)
   :html (html)
   :java (java)
   :javascript (javascript)
   :jinja (jinja)
   :json (json)
   :jsx (javascript #js {:jsx true})
   :less (less)
   :liquid (liquid)
   :mariadb-sql (sql #js {:dialect MariaSQL})
   :markdown (markdown)
   :ms-sql (sql #js {:dialect MSSQL})
   :mysql (sql #js {:dialect MySQL})
   :php (php)
   :plsql (sql #js {:dialect PLSQL})
   :postgresql (sql #js {:dialect PostgreSQL})
   :python (python)
   :rust (rust)
   :sass (sass #js {:indented true})
   :scss (sass)
   :sql (sql #js {:dialect StandardSQL})
   :sqlite (sql #js {:dialect SQLite})
   :tsx (javascript #js {:jsx true :typescript true})
   :typescript (javascript #js {:typescript true})
   :webassembly (wast)
   :xml (xml)
   :yaml (yaml)
   :apl (legacy apl)
   :pgp (legacy asciiArmor)
   :asn-1 (legacy (asn1 #js {}))
   :asterisk (legacy asterisk)
   :brainfuck (legacy brainfuck)
   :cobol (legacy cobol)
   :csharp (legacy csharp)
   :closure-stylesheets-gss (legacy gss)
   :cmake (legacy cmake)
   :coffeescript (legacy coffeeScript)
   :common-lisp (legacy commonLisp)
   :cypher (legacy cypher)
   :cython (legacy cython)
   :crystal (legacy crystal)
   :d (legacy d)
   :dart (legacy dart)
   :diff (legacy diff)
   :dockerfile (legacy dockerFile)
   :dtd (legacy dtd)
   :dylan (legacy dylan)
   :ebnf (legacy ebnf)
   :ecl (legacy ecl)
   :eiffel (legacy eiffel)
   :elm (legacy elm)
   :erlang (legacy erlang)
   :esper (legacy esper)
   :factor (legacy factor)
   :fcl (legacy fcl)
   :forth (legacy forth)
   :fortran (legacy fortran)
   :fsharp (legacy fSharp)
   :gas (legacy gas)
   :gherkin (legacy gherkin)
   :groovy (legacy groovy)
   :haskell (legacy haskell)
   :haxe (legacy haxe)
   :hxml (legacy hxml)
   :http (legacy http)
   :idl (legacy idl)
   :json-ld (legacy jsonld)
   :julia (legacy julia)
   :kotlin (legacy kotlin)
   :livescript (legacy liveScript)
   :lua (legacy lua)
   :mirc (legacy mirc)
   :mathematica (legacy mathematica)
   :modelica (legacy modelica)
   :mumps (legacy mumps)
   :mbox (legacy mbox)
   :nginx (legacy nginx)
   :nsis (legacy nsis)
   :ntriples (legacy ntriples)
   :objective-c (legacy objectiveC)
   :objective-c-2 (legacy objectiveCpp)
   :ocaml (legacy oCaml)
   :octave (legacy octave)
   :oz (legacy oz)
   :pascal (legacy pascal)
   :perl (legacy perl)
   :pig (legacy pig)
   :powershell (legacy powerShell)
   :properties-files (legacy properties)
   :protobuf (legacy protobuf)
   :pug (legacy pug)
   :puppet (legacy puppet)
   :q (legacy q)
   :r (legacy r)
   :rpm-changes (legacy rpmChanges)
   :rpm-spec (legacy rpmSpec)
   :ruby (legacy ruby)
   :sas (legacy sas)
   :scala (legacy scala)
   :scheme (legacy scheme)
   :shell (legacy shell)
   :sieve (legacy sieve)
   :smalltalk (legacy smalltalk)
   :solr (legacy solr)
   :sml (legacy sml)
   :sparql (legacy sparql)
   :spreadsheet (legacy spreadsheet)
   :squirrel (legacy squirrel)
   :stylus (legacy stylus)
   :swift (legacy swift)
   :stex (legacy stex)
   :latex (legacy stex)
   :systemverilog (legacy verilog)
   :tcl (legacy tcl)
   :textile (legacy textile)
   :tiddlywiki (legacy tiddlyWiki)
   :tiki-wiki (legacy tiki)
   :toml (legacy toml)
   :troff (legacy troff)
   :ttcn (legacy ttcn)
   :ttcn-cfg (legacy ttcnCfg)
   :turtle (legacy turtle)
   :webidl (legacy webIDL)
   :vb-net (legacy vb)
   :vbscript (legacy vbScript)
   :velocity (legacy velocity)
   :verilog (legacy verilog)
   :vhdl (legacy vhdl)
   :xquery (legacy xQuery)
   :yacas (legacy yacas)
   :z80 (legacy z80)
   :mscgen (legacy mscgen)
   :xu (legacy xu)
   :msgenny (legacy msgenny)
   :vue (vue)
   :angular-template (angular)
  })
