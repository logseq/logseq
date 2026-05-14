goog.provide('logseq.outliner.op');
logseq.outliner.op.op_schema = new cljs.core.PersistentVector(null, 25, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"multi","multi",-190293005),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"dispatch","dispatch",1319337009),cljs.core.first], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"save-block","save-block",591532560),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"catn","catn",-48807277),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"keyword","keyword",811389747)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"args","args",1315556576),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"tuple","tuple",-472667284),new cljs.core.Keyword("logseq.outliner.op","block","logseq.outliner.op/block",-1593459498),new cljs.core.Keyword("logseq.outliner.op","option","logseq.outliner.op/option",2068421300)], null)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"insert-blocks","insert-blocks",-1269782013),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"catn","catn",-48807277),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"keyword","keyword",811389747)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"args","args",1315556576),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"tuple","tuple",-472667284),new cljs.core.Keyword("logseq.outliner.op","blocks","logseq.outliner.op/blocks",1115022051),new cljs.core.Keyword("logseq.outliner.op","id","logseq.outliner.op/id",589765864),new cljs.core.Keyword("logseq.outliner.op","option","logseq.outliner.op/option",2068421300)], null)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"delete-blocks","delete-blocks",-1868631596),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"catn","catn",-48807277),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"keyword","keyword",811389747)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"args","args",1315556576),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"tuple","tuple",-472667284),new cljs.core.Keyword("logseq.outliner.op","ids","logseq.outliner.op/ids",1210310592),new cljs.core.Keyword("logseq.outliner.op","option","logseq.outliner.op/option",2068421300)], null)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"move-blocks","move-blocks",-955702999),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"catn","catn",-48807277),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"keyword","keyword",811389747)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"args","args",1315556576),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"tuple","tuple",-472667284),new cljs.core.Keyword("logseq.outliner.op","ids","logseq.outliner.op/ids",1210310592),new cljs.core.Keyword("logseq.outliner.op","id","logseq.outliner.op/id",589765864),new cljs.core.Keyword(null,"boolean","boolean",-1919418404)], null)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"move-blocks-up-down","move-blocks-up-down",1370411060),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"catn","catn",-48807277),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"keyword","keyword",811389747)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"args","args",1315556576),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"tuple","tuple",-472667284),new cljs.core.Keyword("logseq.outliner.op","ids","logseq.outliner.op/ids",1210310592),new cljs.core.Keyword(null,"boolean","boolean",-1919418404)], null)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"indent-outdent-blocks","indent-outdent-blocks",-104352713),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"catn","catn",-48807277),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"keyword","keyword",811389747)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"args","args",1315556576),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"tuple","tuple",-472667284),new cljs.core.Keyword("logseq.outliner.op","ids","logseq.outliner.op/ids",1210310592),new cljs.core.Keyword(null,"boolean","boolean",-1919418404),new cljs.core.Keyword("logseq.outliner.op","option","logseq.outliner.op/option",2068421300)], null)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"upsert-property","upsert-property",1682220994),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"catn","catn",-48807277),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"keyword","keyword",811389747)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"args","args",1315556576),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"tuple","tuple",-472667284),new cljs.core.Keyword("logseq.outliner.op","property-id","logseq.outliner.op/property-id",-1886556645),new cljs.core.Keyword("logseq.outliner.op","schema","logseq.outliner.op/schema",705503821),new cljs.core.Keyword("logseq.outliner.op","option","logseq.outliner.op/option",2068421300)], null)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"set-block-property","set-block-property",-301154301),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"catn","catn",-48807277),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"keyword","keyword",811389747)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"args","args",1315556576),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"tuple","tuple",-472667284),new cljs.core.Keyword("logseq.outliner.op","block-id","logseq.outliner.op/block-id",1936892674),new cljs.core.Keyword("logseq.outliner.op","property-id","logseq.outliner.op/property-id",-1886556645),new cljs.core.Keyword("logseq.outliner.op","value","logseq.outliner.op/value",1805928645)], null)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"remove-block-property","remove-block-property",-1355530334),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"catn","catn",-48807277),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"keyword","keyword",811389747)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"args","args",1315556576),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"tuple","tuple",-472667284),new cljs.core.Keyword("logseq.outliner.op","block-id","logseq.outliner.op/block-id",1936892674),new cljs.core.Keyword("logseq.outliner.op","property-id","logseq.outliner.op/property-id",-1886556645)], null)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"delete-property-value","delete-property-value",1921787953),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"catn","catn",-48807277),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"keyword","keyword",811389747)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"args","args",1315556576),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"tuple","tuple",-472667284),new cljs.core.Keyword("logseq.outliner.op","block-id","logseq.outliner.op/block-id",1936892674),new cljs.core.Keyword("logseq.outliner.op","property-id","logseq.outliner.op/property-id",-1886556645),new cljs.core.Keyword("logseq.outliner.op","value","logseq.outliner.op/value",1805928645)], null)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"create-property-text-block","create-property-text-block",1772697260),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"catn","catn",-48807277),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"keyword","keyword",811389747)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"args","args",1315556576),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"tuple","tuple",-472667284),new cljs.core.Keyword("logseq.outliner.op","block-id","logseq.outliner.op/block-id",1936892674),new cljs.core.Keyword("logseq.outliner.op","property-id","logseq.outliner.op/property-id",-1886556645),new cljs.core.Keyword("logseq.outliner.op","value","logseq.outliner.op/value",1805928645),new cljs.core.Keyword("logseq.outliner.op","option","logseq.outliner.op/option",2068421300)], null)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"collapse-expand-block-property","collapse-expand-block-property",-1319815188),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"catn","catn",-48807277),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"keyword","keyword",811389747)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"args","args",1315556576),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"tuple","tuple",-472667284),new cljs.core.Keyword("logseq.outliner.op","block-id","logseq.outliner.op/block-id",1936892674),new cljs.core.Keyword("logseq.outliner.op","property-id","logseq.outliner.op/property-id",-1886556645),new cljs.core.Keyword(null,"boolean","boolean",-1919418404)], null)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"batch-set-property","batch-set-property",-617851002),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"catn","catn",-48807277),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"keyword","keyword",811389747)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"args","args",1315556576),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"tuple","tuple",-472667284),new cljs.core.Keyword("logseq.outliner.op","block-ids","logseq.outliner.op/block-ids",-1499857372),new cljs.core.Keyword("logseq.outliner.op","property-id","logseq.outliner.op/property-id",-1886556645),new cljs.core.Keyword("logseq.outliner.op","value","logseq.outliner.op/value",1805928645),new cljs.core.Keyword("logseq.outliner.op","option","logseq.outliner.op/option",2068421300)], null)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"batch-remove-property","batch-remove-property",-1380335108),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"catn","catn",-48807277),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"keyword","keyword",811389747)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"args","args",1315556576),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"tuple","tuple",-472667284),new cljs.core.Keyword("logseq.outliner.op","block-ids","logseq.outliner.op/block-ids",-1499857372),new cljs.core.Keyword("logseq.outliner.op","property-id","logseq.outliner.op/property-id",-1886556645)], null)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"class-add-property","class-add-property",991910065),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"catn","catn",-48807277),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"keyword","keyword",811389747)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"args","args",1315556576),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"tuple","tuple",-472667284),new cljs.core.Keyword("logseq.outliner.op","class-id","logseq.outliner.op/class-id",-908424569),new cljs.core.Keyword("logseq.outliner.op","property-id","logseq.outliner.op/property-id",-1886556645)], null)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"class-remove-property","class-remove-property",457070573),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"catn","catn",-48807277),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"keyword","keyword",811389747)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"args","args",1315556576),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"tuple","tuple",-472667284),new cljs.core.Keyword("logseq.outliner.op","class-id","logseq.outliner.op/class-id",-908424569),new cljs.core.Keyword("logseq.outliner.op","property-id","logseq.outliner.op/property-id",-1886556645)], null)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"upsert-closed-value","upsert-closed-value",-392689675),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"catn","catn",-48807277),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"keyword","keyword",811389747)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"args","args",1315556576),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"tuple","tuple",-472667284),new cljs.core.Keyword("logseq.outliner.op","property-id","logseq.outliner.op/property-id",-1886556645),new cljs.core.Keyword("logseq.outliner.op","option","logseq.outliner.op/option",2068421300)], null)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"delete-closed-value","delete-closed-value",-133763456),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"catn","catn",-48807277),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"keyword","keyword",811389747)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"args","args",1315556576),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"tuple","tuple",-472667284),new cljs.core.Keyword("logseq.outliner.op","property-id","logseq.outliner.op/property-id",-1886556645),new cljs.core.Keyword("logseq.outliner.op","value","logseq.outliner.op/value",1805928645)], null)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"add-existing-values-to-closed-values","add-existing-values-to-closed-values",-712668508),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"catn","catn",-48807277),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"keyword","keyword",811389747)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"args","args",1315556576),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"tuple","tuple",-472667284),new cljs.core.Keyword("logseq.outliner.op","property-id","logseq.outliner.op/property-id",-1886556645),new cljs.core.Keyword("logseq.outliner.op","values","logseq.outliner.op/values",752714600)], null)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"transact","transact",-267998670),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"catn","catn",-48807277),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"keyword","keyword",811389747)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"args","args",1315556576),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"tuple","tuple",-472667284),new cljs.core.Keyword("logseq.outliner.op","tx-data","logseq.outliner.op/tx-data",-1069172667),new cljs.core.Keyword("logseq.outliner.op","tx-meta","logseq.outliner.op/tx-meta",-868363050)], null)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"create-page","create-page",-1352656443),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"catn","catn",-48807277),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"keyword","keyword",811389747)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"args","args",1315556576),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"tuple","tuple",-472667284),new cljs.core.Keyword("logseq.outliner.op","title","logseq.outliner.op/title",-1130880077),new cljs.core.Keyword("logseq.outliner.op","option","logseq.outliner.op/option",2068421300)], null)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"rename-page","rename-page",-2094129371),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"catn","catn",-48807277),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"keyword","keyword",811389747)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"args","args",1315556576),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"tuple","tuple",-472667284),new cljs.core.Keyword("logseq.outliner.op","uuid","logseq.outliner.op/uuid",-141837019),new cljs.core.Keyword("logseq.outliner.op","title","logseq.outliner.op/title",-1130880077)], null)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"delete-page","delete-page",-1371381770),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"catn","catn",-48807277),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"keyword","keyword",811389747)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"args","args",1315556576),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"tuple","tuple",-472667284),new cljs.core.Keyword("logseq.outliner.op","uuid","logseq.outliner.op/uuid",-141837019)], null)], null)], null)], null)], null);
logseq.outliner.op.ops_schema = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"schema","schema",-1582001791),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"registry","registry",1021159018),cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword("logseq.outliner.op","ids","logseq.outliner.op/ids",1210310592),new cljs.core.Keyword("logseq.outliner.op","block-id","logseq.outliner.op/block-id",1936892674),new cljs.core.Keyword("logseq.outliner.op","blocks","logseq.outliner.op/blocks",1115022051),new cljs.core.Keyword("logseq.outliner.op","block-ids","logseq.outliner.op/block-ids",-1499857372),new cljs.core.Keyword("logseq.outliner.op","tx-data","logseq.outliner.op/tx-data",-1069172667),new cljs.core.Keyword("logseq.outliner.op","value","logseq.outliner.op/value",1805928645),new cljs.core.Keyword("logseq.outliner.op","uuid","logseq.outliner.op/uuid",-141837019),new cljs.core.Keyword("logseq.outliner.op","class-id","logseq.outliner.op/class-id",-908424569),new cljs.core.Keyword("logseq.outliner.op","id","logseq.outliner.op/id",589765864),new cljs.core.Keyword("logseq.outliner.op","values","logseq.outliner.op/values",752714600),new cljs.core.Keyword("logseq.outliner.op","schema","logseq.outliner.op/schema",705503821),new cljs.core.Keyword("logseq.outliner.op","title","logseq.outliner.op/title",-1130880077),new cljs.core.Keyword("logseq.outliner.op","option","logseq.outliner.op/option",2068421300),new cljs.core.Keyword("logseq.outliner.op","block","logseq.outliner.op/block",-1593459498),new cljs.core.Keyword("logseq.outliner.op","tx-meta","logseq.outliner.op/tx-meta",-868363050),new cljs.core.Keyword("logseq.outliner.op","property-id","logseq.outliner.op/property-id",-1886556645)],[new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"sequential","sequential",-1082983960),new cljs.core.Keyword("logseq.outliner.op","id","logseq.outliner.op/id",589765864)], null),new cljs.core.Keyword(null,"any","any",1705907423),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"sequential","sequential",-1082983960),new cljs.core.Keyword("logseq.outliner.op","block","logseq.outliner.op/block",-1593459498)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"sequential","sequential",-1082983960),new cljs.core.Keyword("logseq.outliner.op","block-id","logseq.outliner.op/block-id",1936892674)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"sequential","sequential",-1082983960),new cljs.core.Keyword(null,"any","any",1705907423)], null),new cljs.core.Keyword(null,"any","any",1705907423),cljs.core.uuid_QMARK_,cljs.core.int_QMARK_,cljs.core.int_QMARK_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"sequential","sequential",-1082983960),new cljs.core.Keyword("logseq.outliner.op","value","logseq.outliner.op/value",1805928645)], null),cljs.core.map_QMARK_,cljs.core.string_QMARK_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"maybe","maybe",-314397560),cljs.core.map_QMARK_], null),cljs.core.map_QMARK_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"maybe","maybe",-314397560),cljs.core.map_QMARK_], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"or","or",235744169),cljs.core.int_QMARK_,cljs.core.keyword_QMARK_,cljs.core.nil_QMARK_], null)])], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"sequential","sequential",-1082983960),logseq.outliner.op.op_schema], null)], null);
logseq.outliner.op.ops_validator = malli.core.validator.cljs$core$IFn$_invoke$arity$1(logseq.outliner.op.ops_schema);
if((typeof logseq !== 'undefined') && (typeof logseq.outliner !== 'undefined') && (typeof logseq.outliner.op !== 'undefined') && (typeof logseq.outliner.op._STAR_op_handlers !== 'undefined')){
} else {
logseq.outliner.op._STAR_op_handlers = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
}
logseq.outliner.op.register_op_handlers_BANG_ = (function logseq$outliner$op$register_op_handlers_BANG_(handlers){
return cljs.core.reset_BANG_(logseq.outliner.op._STAR_op_handlers,handlers);
});
logseq.outliner.op.apply_ops_BANG_ = (function logseq$outliner$op$apply_ops_BANG_(repo,conn,ops,date_formatter,opts){
if(cljs.core.truth_((logseq.outliner.op.ops_validator.cljs$core$IFn$_invoke$arity$1 ? logseq.outliner.op.ops_validator.cljs$core$IFn$_invoke$arity$1(ops) : logseq.outliner.op.ops_validator.call(null,ops)))){
} else {
throw (new Error(["Assert failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(ops),"\n","(ops-validator ops)"].join('')));
}

var opts_SINGLEQUOTE_ = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(opts,new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"conn","conn",278309663),conn], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"local-tx?","local-tx?",-891534872),true], 0));
var _STAR_result = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
var db_based_QMARK_ = (function (){var G__65240 = cljs.core.deref(conn);
return (logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(G__65240) : logseq.db.db_based_graph_QMARK_.call(null,G__65240));
})();
var opts__63380__auto___65685 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(opts_SINGLEQUOTE_,new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"current-block","current-block",1027687970)], 0));
if((!((logseq.outliner.batch_tx.get_batch_db_before() == null)))){
var seq__65241_65686 = cljs.core.seq(ops);
var chunk__65242_65687 = null;
var count__65243_65688 = (0);
var i__65244_65689 = (0);
while(true){
if((i__65244_65689 < count__65243_65688)){
var vec__65348_65690 = chunk__65242_65687.cljs$core$IIndexed$_nth$arity$2(null,i__65244_65689);
var op_65691 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65348_65690,(0),null);
var args_65692 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65348_65690,(1),null);
if(cljs.core.truth_(db_based_QMARK_)){
} else {
if((!(((clojure.string.includes_QMARK_(cljs.core.name(op_65691),"property")) || (clojure.string.includes_QMARK_(cljs.core.name(op_65691),"closed-value")))))){
} else {
throw (new Error(["Assert failed: ",["Property related ops are only for db based graphs, ops: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(ops)].join(''),"\n","(not (or (string/includes? (name op) \"property\") (string/includes? (name op) \"closed-value\")))"].join('')));
}
}

var G__65354_65694 = op_65691;
var G__65354_65695__$1 = (((G__65354_65694 instanceof cljs.core.Keyword))?G__65354_65694.fqn:null);
switch (G__65354_65695__$1) {
case "save-block":
cljs.core.apply.cljs$core$IFn$_invoke$arity$5(logseq.outliner.core.save_block_BANG_,repo,conn,date_formatter,args_65692);

break;
case "insert-blocks":
var vec__65355_65697 = args_65692;
var blocks_65698 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65355_65697,(0),null);
var target_block_id_65699 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65355_65697,(1),null);
var opts_65700__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65355_65697,(2),null);
var temp__5804__auto___65701 = (function (){var G__65358 = cljs.core.deref(conn);
var G__65359 = target_block_id_65699;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__65358,G__65359) : datascript.core.entity.call(null,G__65358,G__65359));
})();
if(cljs.core.truth_(temp__5804__auto___65701)){
var target_block_65702 = temp__5804__auto___65701;
var result_65703 = logseq.outliner.core.insert_blocks_BANG_(repo,conn,blocks_65698,target_block_65702,opts_65700__$1);
cljs.core.reset_BANG_(_STAR_result,result_65703);
} else {
}

break;
case "delete-blocks":
var vec__65361_65704 = args_65692;
var block_ids_65705 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65361_65704,(0),null);
var opts_65706__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65361_65704,(1),null);
var blocks_65707 = cljs.core.keep.cljs$core$IFn$_invoke$arity$2(((function (seq__65241_65686,chunk__65242_65687,count__65243_65688,i__65244_65689,vec__65361_65704,block_ids_65705,opts_65706__$1,G__65354_65694,G__65354_65695__$1,vec__65348_65690,op_65691,args_65692,opts__63380__auto___65685,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_){
return (function (p1__65212_SHARP_){
var G__65364 = cljs.core.deref(conn);
var G__65365 = p1__65212_SHARP_;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__65364,G__65365) : datascript.core.entity.call(null,G__65364,G__65365));
});})(seq__65241_65686,chunk__65242_65687,count__65243_65688,i__65244_65689,vec__65361_65704,block_ids_65705,opts_65706__$1,G__65354_65694,G__65354_65695__$1,vec__65348_65690,op_65691,args_65692,opts__63380__auto___65685,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_))
,block_ids_65705);
logseq.outliner.core.delete_blocks_BANG_(repo,conn,date_formatter,blocks_65707,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts_65706__$1,opts_SINGLEQUOTE_], 0)));

break;
case "move-blocks":
var vec__65367_65708 = args_65692;
var block_ids_65709 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65367_65708,(0),null);
var target_block_id_65710 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65367_65708,(1),null);
var sibling_QMARK__65711 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65367_65708,(2),null);
var blocks_65712 = cljs.core.keep.cljs$core$IFn$_invoke$arity$2(((function (seq__65241_65686,chunk__65242_65687,count__65243_65688,i__65244_65689,vec__65367_65708,block_ids_65709,target_block_id_65710,sibling_QMARK__65711,G__65354_65694,G__65354_65695__$1,vec__65348_65690,op_65691,args_65692,opts__63380__auto___65685,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_){
return (function (p1__65213_SHARP_){
var G__65374 = cljs.core.deref(conn);
var G__65375 = p1__65213_SHARP_;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__65374,G__65375) : datascript.core.entity.call(null,G__65374,G__65375));
});})(seq__65241_65686,chunk__65242_65687,count__65243_65688,i__65244_65689,vec__65367_65708,block_ids_65709,target_block_id_65710,sibling_QMARK__65711,G__65354_65694,G__65354_65695__$1,vec__65348_65690,op_65691,args_65692,opts__63380__auto___65685,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_))
,block_ids_65709);
var target_block_65713 = (function (){var G__65376 = cljs.core.deref(conn);
var G__65377 = target_block_id_65710;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__65376,G__65377) : datascript.core.entity.call(null,G__65376,G__65377));
})();
if(cljs.core.truth_((function (){var and__5000__auto__ = target_block_65713;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.seq(blocks_65712);
} else {
return and__5000__auto__;
}
})())){
logseq.outliner.core.move_blocks_BANG_(repo,conn,blocks_65712,target_block_65713,sibling_QMARK__65711);
} else {
}

break;
case "move-blocks-up-down":
var vec__65378_65714 = args_65692;
var block_ids_65715 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65378_65714,(0),null);
var up_QMARK__65716 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65378_65714,(1),null);
var blocks_65717 = cljs.core.keep.cljs$core$IFn$_invoke$arity$2(((function (seq__65241_65686,chunk__65242_65687,count__65243_65688,i__65244_65689,vec__65378_65714,block_ids_65715,up_QMARK__65716,G__65354_65694,G__65354_65695__$1,vec__65348_65690,op_65691,args_65692,opts__63380__auto___65685,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_){
return (function (p1__65215_SHARP_){
var G__65381 = cljs.core.deref(conn);
var G__65382 = p1__65215_SHARP_;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__65381,G__65382) : datascript.core.entity.call(null,G__65381,G__65382));
});})(seq__65241_65686,chunk__65242_65687,count__65243_65688,i__65244_65689,vec__65378_65714,block_ids_65715,up_QMARK__65716,G__65354_65694,G__65354_65695__$1,vec__65348_65690,op_65691,args_65692,opts__63380__auto___65685,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_))
,block_ids_65715);
if(cljs.core.seq(blocks_65717)){
logseq.outliner.core.move_blocks_up_down_BANG_(repo,conn,blocks_65717,up_QMARK__65716);
} else {
}

break;
case "indent-outdent-blocks":
var vec__65384_65718 = args_65692;
var block_ids_65719 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65384_65718,(0),null);
var indent_QMARK__65720 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65384_65718,(1),null);
var opts_65721__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65384_65718,(2),null);
var blocks_65722 = cljs.core.keep.cljs$core$IFn$_invoke$arity$2(((function (seq__65241_65686,chunk__65242_65687,count__65243_65688,i__65244_65689,vec__65384_65718,block_ids_65719,indent_QMARK__65720,opts_65721__$1,G__65354_65694,G__65354_65695__$1,vec__65348_65690,op_65691,args_65692,opts__63380__auto___65685,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_){
return (function (p1__65216_SHARP_){
var G__65387 = cljs.core.deref(conn);
var G__65388 = p1__65216_SHARP_;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__65387,G__65388) : datascript.core.entity.call(null,G__65387,G__65388));
});})(seq__65241_65686,chunk__65242_65687,count__65243_65688,i__65244_65689,vec__65384_65718,block_ids_65719,indent_QMARK__65720,opts_65721__$1,G__65354_65694,G__65354_65695__$1,vec__65348_65690,op_65691,args_65692,opts__63380__auto___65685,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_))
,block_ids_65719);
if(cljs.core.seq(blocks_65722)){
logseq.outliner.core.indent_outdent_blocks_BANG_.cljs$core$IFn$_invoke$arity$variadic(repo,conn,blocks_65722,indent_QMARK__65720,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts_65721__$1], 0));
} else {
}

break;
case "upsert-property":
cljs.core.reset_BANG_(_STAR_result,cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.upsert_property_BANG_,conn,args_65692));

break;
case "set-block-property":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.set_block_property_BANG_,conn,args_65692);

break;
case "remove-block-property":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.remove_block_property_BANG_,conn,args_65692);

break;
case "delete-property-value":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.delete_property_value_BANG_,conn,args_65692);

break;
case "create-property-text-block":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.create_property_text_block_BANG_,conn,args_65692);

break;
case "batch-set-property":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.batch_set_property_BANG_,conn,args_65692);

break;
case "batch-remove-property":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.batch_remove_property_BANG_,conn,args_65692);

break;
case "class-add-property":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.class_add_property_BANG_,conn,args_65692);

break;
case "class-remove-property":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.class_remove_property_BANG_,conn,args_65692);

break;
case "upsert-closed-value":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.upsert_closed_value_BANG_,conn,args_65692);

break;
case "delete-closed-value":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.delete_closed_value_BANG_,conn,args_65692);

break;
case "add-existing-values-to-closed-values":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.add_existing_values_to_closed_values_BANG_,conn,args_65692);

break;
case "transact":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.db.transact_BANG_,conn,args_65692);

break;
default:
var temp__5804__auto___65723 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(logseq.outliner.op._STAR_op_handlers),op_65691);
if(cljs.core.truth_(temp__5804__auto___65723)){
var handler_65724 = temp__5804__auto___65723;
cljs.core.reset_BANG_(_STAR_result,(handler_65724.cljs$core$IFn$_invoke$arity$3 ? handler_65724.cljs$core$IFn$_invoke$arity$3(repo,conn,args_65692) : handler_65724.call(null,repo,conn,args_65692)));
} else {
}

}


var G__65725 = seq__65241_65686;
var G__65726 = chunk__65242_65687;
var G__65727 = count__65243_65688;
var G__65728 = (i__65244_65689 + (1));
seq__65241_65686 = G__65725;
chunk__65242_65687 = G__65726;
count__65243_65688 = G__65727;
i__65244_65689 = G__65728;
continue;
} else {
var temp__5804__auto___65729 = cljs.core.seq(seq__65241_65686);
if(temp__5804__auto___65729){
var seq__65241_65730__$1 = temp__5804__auto___65729;
if(cljs.core.chunked_seq_QMARK_(seq__65241_65730__$1)){
var c__5525__auto___65731 = cljs.core.chunk_first(seq__65241_65730__$1);
var G__65732 = cljs.core.chunk_rest(seq__65241_65730__$1);
var G__65733 = c__5525__auto___65731;
var G__65734 = cljs.core.count(c__5525__auto___65731);
var G__65735 = (0);
seq__65241_65686 = G__65732;
chunk__65242_65687 = G__65733;
count__65243_65688 = G__65734;
i__65244_65689 = G__65735;
continue;
} else {
var vec__65392_65736 = cljs.core.first(seq__65241_65730__$1);
var op_65737 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65392_65736,(0),null);
var args_65738 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65392_65736,(1),null);
if(cljs.core.truth_(db_based_QMARK_)){
} else {
if((!(((clojure.string.includes_QMARK_(cljs.core.name(op_65737),"property")) || (clojure.string.includes_QMARK_(cljs.core.name(op_65737),"closed-value")))))){
} else {
throw (new Error(["Assert failed: ",["Property related ops are only for db based graphs, ops: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(ops)].join(''),"\n","(not (or (string/includes? (name op) \"property\") (string/includes? (name op) \"closed-value\")))"].join('')));
}
}

var G__65395_65740 = op_65737;
var G__65395_65741__$1 = (((G__65395_65740 instanceof cljs.core.Keyword))?G__65395_65740.fqn:null);
switch (G__65395_65741__$1) {
case "save-block":
cljs.core.apply.cljs$core$IFn$_invoke$arity$5(logseq.outliner.core.save_block_BANG_,repo,conn,date_formatter,args_65738);

break;
case "insert-blocks":
var vec__65396_65743 = args_65738;
var blocks_65744 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65396_65743,(0),null);
var target_block_id_65745 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65396_65743,(1),null);
var opts_65746__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65396_65743,(2),null);
var temp__5804__auto___65747__$1 = (function (){var G__65400 = cljs.core.deref(conn);
var G__65401 = target_block_id_65745;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__65400,G__65401) : datascript.core.entity.call(null,G__65400,G__65401));
})();
if(cljs.core.truth_(temp__5804__auto___65747__$1)){
var target_block_65748 = temp__5804__auto___65747__$1;
var result_65749 = logseq.outliner.core.insert_blocks_BANG_(repo,conn,blocks_65744,target_block_65748,opts_65746__$1);
cljs.core.reset_BANG_(_STAR_result,result_65749);
} else {
}

break;
case "delete-blocks":
var vec__65406_65750 = args_65738;
var block_ids_65751 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65406_65750,(0),null);
var opts_65752__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65406_65750,(1),null);
var blocks_65753 = cljs.core.keep.cljs$core$IFn$_invoke$arity$2(((function (seq__65241_65686,chunk__65242_65687,count__65243_65688,i__65244_65689,vec__65406_65750,block_ids_65751,opts_65752__$1,G__65395_65740,G__65395_65741__$1,vec__65392_65736,op_65737,args_65738,seq__65241_65730__$1,temp__5804__auto___65729,opts__63380__auto___65685,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_){
return (function (p1__65212_SHARP_){
var G__65409 = cljs.core.deref(conn);
var G__65410 = p1__65212_SHARP_;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__65409,G__65410) : datascript.core.entity.call(null,G__65409,G__65410));
});})(seq__65241_65686,chunk__65242_65687,count__65243_65688,i__65244_65689,vec__65406_65750,block_ids_65751,opts_65752__$1,G__65395_65740,G__65395_65741__$1,vec__65392_65736,op_65737,args_65738,seq__65241_65730__$1,temp__5804__auto___65729,opts__63380__auto___65685,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_))
,block_ids_65751);
logseq.outliner.core.delete_blocks_BANG_(repo,conn,date_formatter,blocks_65753,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts_65752__$1,opts_SINGLEQUOTE_], 0)));

break;
case "move-blocks":
var vec__65412_65754 = args_65738;
var block_ids_65755 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65412_65754,(0),null);
var target_block_id_65756 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65412_65754,(1),null);
var sibling_QMARK__65757 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65412_65754,(2),null);
var blocks_65758 = cljs.core.keep.cljs$core$IFn$_invoke$arity$2(((function (seq__65241_65686,chunk__65242_65687,count__65243_65688,i__65244_65689,vec__65412_65754,block_ids_65755,target_block_id_65756,sibling_QMARK__65757,G__65395_65740,G__65395_65741__$1,vec__65392_65736,op_65737,args_65738,seq__65241_65730__$1,temp__5804__auto___65729,opts__63380__auto___65685,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_){
return (function (p1__65213_SHARP_){
var G__65415 = cljs.core.deref(conn);
var G__65416 = p1__65213_SHARP_;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__65415,G__65416) : datascript.core.entity.call(null,G__65415,G__65416));
});})(seq__65241_65686,chunk__65242_65687,count__65243_65688,i__65244_65689,vec__65412_65754,block_ids_65755,target_block_id_65756,sibling_QMARK__65757,G__65395_65740,G__65395_65741__$1,vec__65392_65736,op_65737,args_65738,seq__65241_65730__$1,temp__5804__auto___65729,opts__63380__auto___65685,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_))
,block_ids_65755);
var target_block_65759 = (function (){var G__65417 = cljs.core.deref(conn);
var G__65418 = target_block_id_65756;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__65417,G__65418) : datascript.core.entity.call(null,G__65417,G__65418));
})();
if(cljs.core.truth_((function (){var and__5000__auto__ = target_block_65759;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.seq(blocks_65758);
} else {
return and__5000__auto__;
}
})())){
logseq.outliner.core.move_blocks_BANG_(repo,conn,blocks_65758,target_block_65759,sibling_QMARK__65757);
} else {
}

break;
case "move-blocks-up-down":
var vec__65419_65761 = args_65738;
var block_ids_65762 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65419_65761,(0),null);
var up_QMARK__65763 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65419_65761,(1),null);
var blocks_65764 = cljs.core.keep.cljs$core$IFn$_invoke$arity$2(((function (seq__65241_65686,chunk__65242_65687,count__65243_65688,i__65244_65689,vec__65419_65761,block_ids_65762,up_QMARK__65763,G__65395_65740,G__65395_65741__$1,vec__65392_65736,op_65737,args_65738,seq__65241_65730__$1,temp__5804__auto___65729,opts__63380__auto___65685,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_){
return (function (p1__65215_SHARP_){
var G__65422 = cljs.core.deref(conn);
var G__65423 = p1__65215_SHARP_;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__65422,G__65423) : datascript.core.entity.call(null,G__65422,G__65423));
});})(seq__65241_65686,chunk__65242_65687,count__65243_65688,i__65244_65689,vec__65419_65761,block_ids_65762,up_QMARK__65763,G__65395_65740,G__65395_65741__$1,vec__65392_65736,op_65737,args_65738,seq__65241_65730__$1,temp__5804__auto___65729,opts__63380__auto___65685,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_))
,block_ids_65762);
if(cljs.core.seq(blocks_65764)){
logseq.outliner.core.move_blocks_up_down_BANG_(repo,conn,blocks_65764,up_QMARK__65763);
} else {
}

break;
case "indent-outdent-blocks":
var vec__65426_65766 = args_65738;
var block_ids_65767 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65426_65766,(0),null);
var indent_QMARK__65768 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65426_65766,(1),null);
var opts_65769__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65426_65766,(2),null);
var blocks_65770 = cljs.core.keep.cljs$core$IFn$_invoke$arity$2(((function (seq__65241_65686,chunk__65242_65687,count__65243_65688,i__65244_65689,vec__65426_65766,block_ids_65767,indent_QMARK__65768,opts_65769__$1,G__65395_65740,G__65395_65741__$1,vec__65392_65736,op_65737,args_65738,seq__65241_65730__$1,temp__5804__auto___65729,opts__63380__auto___65685,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_){
return (function (p1__65216_SHARP_){
var G__65429 = cljs.core.deref(conn);
var G__65430 = p1__65216_SHARP_;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__65429,G__65430) : datascript.core.entity.call(null,G__65429,G__65430));
});})(seq__65241_65686,chunk__65242_65687,count__65243_65688,i__65244_65689,vec__65426_65766,block_ids_65767,indent_QMARK__65768,opts_65769__$1,G__65395_65740,G__65395_65741__$1,vec__65392_65736,op_65737,args_65738,seq__65241_65730__$1,temp__5804__auto___65729,opts__63380__auto___65685,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_))
,block_ids_65767);
if(cljs.core.seq(blocks_65770)){
logseq.outliner.core.indent_outdent_blocks_BANG_.cljs$core$IFn$_invoke$arity$variadic(repo,conn,blocks_65770,indent_QMARK__65768,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts_65769__$1], 0));
} else {
}

break;
case "upsert-property":
cljs.core.reset_BANG_(_STAR_result,cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.upsert_property_BANG_,conn,args_65738));

break;
case "set-block-property":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.set_block_property_BANG_,conn,args_65738);

break;
case "remove-block-property":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.remove_block_property_BANG_,conn,args_65738);

break;
case "delete-property-value":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.delete_property_value_BANG_,conn,args_65738);

break;
case "create-property-text-block":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.create_property_text_block_BANG_,conn,args_65738);

break;
case "batch-set-property":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.batch_set_property_BANG_,conn,args_65738);

break;
case "batch-remove-property":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.batch_remove_property_BANG_,conn,args_65738);

break;
case "class-add-property":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.class_add_property_BANG_,conn,args_65738);

break;
case "class-remove-property":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.class_remove_property_BANG_,conn,args_65738);

break;
case "upsert-closed-value":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.upsert_closed_value_BANG_,conn,args_65738);

break;
case "delete-closed-value":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.delete_closed_value_BANG_,conn,args_65738);

break;
case "add-existing-values-to-closed-values":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.add_existing_values_to_closed_values_BANG_,conn,args_65738);

break;
case "transact":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.db.transact_BANG_,conn,args_65738);

break;
default:
var temp__5804__auto___65780__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(logseq.outliner.op._STAR_op_handlers),op_65737);
if(cljs.core.truth_(temp__5804__auto___65780__$1)){
var handler_65781 = temp__5804__auto___65780__$1;
cljs.core.reset_BANG_(_STAR_result,(handler_65781.cljs$core$IFn$_invoke$arity$3 ? handler_65781.cljs$core$IFn$_invoke$arity$3(repo,conn,args_65738) : handler_65781.call(null,repo,conn,args_65738)));
} else {
}

}


var G__65783 = cljs.core.next(seq__65241_65730__$1);
var G__65784 = null;
var G__65785 = (0);
var G__65786 = (0);
seq__65241_65686 = G__65783;
chunk__65242_65687 = G__65784;
count__65243_65688 = G__65785;
i__65244_65689 = G__65786;
continue;
}
} else {
}
}
break;
}
} else {
try{var tx_meta__62753__auto___65787 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(opts__63380__auto___65685,new cljs.core.Keyword(null,"additional-tx","additional-tx",-343057604),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396)], 0)),new cljs.core.Keyword("batch-tx","batch-tx-mode?","batch-tx/batch-tx-mode?",1787753099),true);
logseq.outliner.batch_tx.set_batch_opts(tx_meta__62753__auto___65787);

logseq.outliner.batch_tx.set_batch_db_before_BANG_(cljs.core.deref(new cljs.core.Keyword(null,"conn","conn",278309663).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396).cljs$core$IFn$_invoke$arity$1(opts_SINGLEQUOTE_))));

var seq__65439_65788 = cljs.core.seq(ops);
var chunk__65440_65789 = null;
var count__65441_65790 = (0);
var i__65442_65791 = (0);
while(true){
if((i__65442_65791 < count__65441_65790)){
var vec__65515_65792 = chunk__65440_65789.cljs$core$IIndexed$_nth$arity$2(null,i__65442_65791);
var op_65793 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65515_65792,(0),null);
var args_65794 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65515_65792,(1),null);
if(cljs.core.truth_(db_based_QMARK_)){
} else {
if((!(((clojure.string.includes_QMARK_(cljs.core.name(op_65793),"property")) || (clojure.string.includes_QMARK_(cljs.core.name(op_65793),"closed-value")))))){
} else {
throw (new Error(["Assert failed: ",["Property related ops are only for db based graphs, ops: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(ops)].join(''),"\n","(not (or (string/includes? (name op) \"property\") (string/includes? (name op) \"closed-value\")))"].join('')));
}
}

var G__65518_65795 = op_65793;
var G__65518_65796__$1 = (((G__65518_65795 instanceof cljs.core.Keyword))?G__65518_65795.fqn:null);
switch (G__65518_65796__$1) {
case "save-block":
cljs.core.apply.cljs$core$IFn$_invoke$arity$5(logseq.outliner.core.save_block_BANG_,repo,conn,date_formatter,args_65794);

break;
case "insert-blocks":
var vec__65520_65798 = args_65794;
var blocks_65799 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65520_65798,(0),null);
var target_block_id_65800 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65520_65798,(1),null);
var opts_65801__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65520_65798,(2),null);
var temp__5804__auto___65803 = (function (){var G__65523 = cljs.core.deref(conn);
var G__65524 = target_block_id_65800;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__65523,G__65524) : datascript.core.entity.call(null,G__65523,G__65524));
})();
if(cljs.core.truth_(temp__5804__auto___65803)){
var target_block_65806 = temp__5804__auto___65803;
var result_65807 = logseq.outliner.core.insert_blocks_BANG_(repo,conn,blocks_65799,target_block_65806,opts_65801__$1);
cljs.core.reset_BANG_(_STAR_result,result_65807);
} else {
}

break;
case "delete-blocks":
var vec__65526_65808 = args_65794;
var block_ids_65809 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65526_65808,(0),null);
var opts_65810__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65526_65808,(1),null);
var blocks_65811 = cljs.core.keep.cljs$core$IFn$_invoke$arity$2(((function (seq__65439_65788,chunk__65440_65789,count__65441_65790,i__65442_65791,vec__65526_65808,block_ids_65809,opts_65810__$1,G__65518_65795,G__65518_65796__$1,vec__65515_65792,op_65793,args_65794,tx_meta__62753__auto___65787,opts__63380__auto___65685,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_){
return (function (p1__65212_SHARP_){
var G__65529 = cljs.core.deref(conn);
var G__65530 = p1__65212_SHARP_;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__65529,G__65530) : datascript.core.entity.call(null,G__65529,G__65530));
});})(seq__65439_65788,chunk__65440_65789,count__65441_65790,i__65442_65791,vec__65526_65808,block_ids_65809,opts_65810__$1,G__65518_65795,G__65518_65796__$1,vec__65515_65792,op_65793,args_65794,tx_meta__62753__auto___65787,opts__63380__auto___65685,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_))
,block_ids_65809);
logseq.outliner.core.delete_blocks_BANG_(repo,conn,date_formatter,blocks_65811,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts_65810__$1,opts_SINGLEQUOTE_], 0)));

break;
case "move-blocks":
var vec__65532_65814 = args_65794;
var block_ids_65815 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65532_65814,(0),null);
var target_block_id_65816 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65532_65814,(1),null);
var sibling_QMARK__65817 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65532_65814,(2),null);
var blocks_65818 = cljs.core.keep.cljs$core$IFn$_invoke$arity$2(((function (seq__65439_65788,chunk__65440_65789,count__65441_65790,i__65442_65791,vec__65532_65814,block_ids_65815,target_block_id_65816,sibling_QMARK__65817,G__65518_65795,G__65518_65796__$1,vec__65515_65792,op_65793,args_65794,tx_meta__62753__auto___65787,opts__63380__auto___65685,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_){
return (function (p1__65213_SHARP_){
var G__65538 = cljs.core.deref(conn);
var G__65539 = p1__65213_SHARP_;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__65538,G__65539) : datascript.core.entity.call(null,G__65538,G__65539));
});})(seq__65439_65788,chunk__65440_65789,count__65441_65790,i__65442_65791,vec__65532_65814,block_ids_65815,target_block_id_65816,sibling_QMARK__65817,G__65518_65795,G__65518_65796__$1,vec__65515_65792,op_65793,args_65794,tx_meta__62753__auto___65787,opts__63380__auto___65685,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_))
,block_ids_65815);
var target_block_65819 = (function (){var G__65540 = cljs.core.deref(conn);
var G__65541 = target_block_id_65816;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__65540,G__65541) : datascript.core.entity.call(null,G__65540,G__65541));
})();
if(cljs.core.truth_((function (){var and__5000__auto__ = target_block_65819;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.seq(blocks_65818);
} else {
return and__5000__auto__;
}
})())){
logseq.outliner.core.move_blocks_BANG_(repo,conn,blocks_65818,target_block_65819,sibling_QMARK__65817);
} else {
}

break;
case "move-blocks-up-down":
var vec__65542_65826 = args_65794;
var block_ids_65827 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65542_65826,(0),null);
var up_QMARK__65828 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65542_65826,(1),null);
var blocks_65829 = cljs.core.keep.cljs$core$IFn$_invoke$arity$2(((function (seq__65439_65788,chunk__65440_65789,count__65441_65790,i__65442_65791,vec__65542_65826,block_ids_65827,up_QMARK__65828,G__65518_65795,G__65518_65796__$1,vec__65515_65792,op_65793,args_65794,tx_meta__62753__auto___65787,opts__63380__auto___65685,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_){
return (function (p1__65215_SHARP_){
var G__65545 = cljs.core.deref(conn);
var G__65546 = p1__65215_SHARP_;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__65545,G__65546) : datascript.core.entity.call(null,G__65545,G__65546));
});})(seq__65439_65788,chunk__65440_65789,count__65441_65790,i__65442_65791,vec__65542_65826,block_ids_65827,up_QMARK__65828,G__65518_65795,G__65518_65796__$1,vec__65515_65792,op_65793,args_65794,tx_meta__62753__auto___65787,opts__63380__auto___65685,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_))
,block_ids_65827);
if(cljs.core.seq(blocks_65829)){
logseq.outliner.core.move_blocks_up_down_BANG_(repo,conn,blocks_65829,up_QMARK__65828);
} else {
}

break;
case "indent-outdent-blocks":
var vec__65548_65831 = args_65794;
var block_ids_65832 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65548_65831,(0),null);
var indent_QMARK__65833 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65548_65831,(1),null);
var opts_65834__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65548_65831,(2),null);
var blocks_65835 = cljs.core.keep.cljs$core$IFn$_invoke$arity$2(((function (seq__65439_65788,chunk__65440_65789,count__65441_65790,i__65442_65791,vec__65548_65831,block_ids_65832,indent_QMARK__65833,opts_65834__$1,G__65518_65795,G__65518_65796__$1,vec__65515_65792,op_65793,args_65794,tx_meta__62753__auto___65787,opts__63380__auto___65685,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_){
return (function (p1__65216_SHARP_){
var G__65554 = cljs.core.deref(conn);
var G__65555 = p1__65216_SHARP_;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__65554,G__65555) : datascript.core.entity.call(null,G__65554,G__65555));
});})(seq__65439_65788,chunk__65440_65789,count__65441_65790,i__65442_65791,vec__65548_65831,block_ids_65832,indent_QMARK__65833,opts_65834__$1,G__65518_65795,G__65518_65796__$1,vec__65515_65792,op_65793,args_65794,tx_meta__62753__auto___65787,opts__63380__auto___65685,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_))
,block_ids_65832);
if(cljs.core.seq(blocks_65835)){
logseq.outliner.core.indent_outdent_blocks_BANG_.cljs$core$IFn$_invoke$arity$variadic(repo,conn,blocks_65835,indent_QMARK__65833,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts_65834__$1], 0));
} else {
}

break;
case "upsert-property":
cljs.core.reset_BANG_(_STAR_result,cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.upsert_property_BANG_,conn,args_65794));

break;
case "set-block-property":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.set_block_property_BANG_,conn,args_65794);

break;
case "remove-block-property":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.remove_block_property_BANG_,conn,args_65794);

break;
case "delete-property-value":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.delete_property_value_BANG_,conn,args_65794);

break;
case "create-property-text-block":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.create_property_text_block_BANG_,conn,args_65794);

break;
case "batch-set-property":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.batch_set_property_BANG_,conn,args_65794);

break;
case "batch-remove-property":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.batch_remove_property_BANG_,conn,args_65794);

break;
case "class-add-property":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.class_add_property_BANG_,conn,args_65794);

break;
case "class-remove-property":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.class_remove_property_BANG_,conn,args_65794);

break;
case "upsert-closed-value":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.upsert_closed_value_BANG_,conn,args_65794);

break;
case "delete-closed-value":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.delete_closed_value_BANG_,conn,args_65794);

break;
case "add-existing-values-to-closed-values":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.add_existing_values_to_closed_values_BANG_,conn,args_65794);

break;
case "transact":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.db.transact_BANG_,conn,args_65794);

break;
default:
var temp__5804__auto___65838 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(logseq.outliner.op._STAR_op_handlers),op_65793);
if(cljs.core.truth_(temp__5804__auto___65838)){
var handler_65839 = temp__5804__auto___65838;
cljs.core.reset_BANG_(_STAR_result,(handler_65839.cljs$core$IFn$_invoke$arity$3 ? handler_65839.cljs$core$IFn$_invoke$arity$3(repo,conn,args_65794) : handler_65839.call(null,repo,conn,args_65794)));
} else {
}

}


var G__65840 = seq__65439_65788;
var G__65841 = chunk__65440_65789;
var G__65842 = count__65441_65790;
var G__65843 = (i__65442_65791 + (1));
seq__65439_65788 = G__65840;
chunk__65440_65789 = G__65841;
count__65441_65790 = G__65842;
i__65442_65791 = G__65843;
continue;
} else {
var temp__5804__auto___65847 = cljs.core.seq(seq__65439_65788);
if(temp__5804__auto___65847){
var seq__65439_65848__$1 = temp__5804__auto___65847;
if(cljs.core.chunked_seq_QMARK_(seq__65439_65848__$1)){
var c__5525__auto___65849 = cljs.core.chunk_first(seq__65439_65848__$1);
var G__65850 = cljs.core.chunk_rest(seq__65439_65848__$1);
var G__65851 = c__5525__auto___65849;
var G__65852 = cljs.core.count(c__5525__auto___65849);
var G__65853 = (0);
seq__65439_65788 = G__65850;
chunk__65440_65789 = G__65851;
count__65441_65790 = G__65852;
i__65442_65791 = G__65853;
continue;
} else {
var vec__65557_65854 = cljs.core.first(seq__65439_65848__$1);
var op_65855 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65557_65854,(0),null);
var args_65856 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65557_65854,(1),null);
if(cljs.core.truth_(db_based_QMARK_)){
} else {
if((!(((clojure.string.includes_QMARK_(cljs.core.name(op_65855),"property")) || (clojure.string.includes_QMARK_(cljs.core.name(op_65855),"closed-value")))))){
} else {
throw (new Error(["Assert failed: ",["Property related ops are only for db based graphs, ops: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(ops)].join(''),"\n","(not (or (string/includes? (name op) \"property\") (string/includes? (name op) \"closed-value\")))"].join('')));
}
}

var G__65560_65859 = op_65855;
var G__65560_65860__$1 = (((G__65560_65859 instanceof cljs.core.Keyword))?G__65560_65859.fqn:null);
switch (G__65560_65860__$1) {
case "save-block":
cljs.core.apply.cljs$core$IFn$_invoke$arity$5(logseq.outliner.core.save_block_BANG_,repo,conn,date_formatter,args_65856);

break;
case "insert-blocks":
var vec__65562_65864 = args_65856;
var blocks_65865 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65562_65864,(0),null);
var target_block_id_65866 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65562_65864,(1),null);
var opts_65867__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65562_65864,(2),null);
var temp__5804__auto___65868__$1 = (function (){var G__65565 = cljs.core.deref(conn);
var G__65566 = target_block_id_65866;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__65565,G__65566) : datascript.core.entity.call(null,G__65565,G__65566));
})();
if(cljs.core.truth_(temp__5804__auto___65868__$1)){
var target_block_65869 = temp__5804__auto___65868__$1;
var result_65870 = logseq.outliner.core.insert_blocks_BANG_(repo,conn,blocks_65865,target_block_65869,opts_65867__$1);
cljs.core.reset_BANG_(_STAR_result,result_65870);
} else {
}

break;
case "delete-blocks":
var vec__65567_65871 = args_65856;
var block_ids_65872 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65567_65871,(0),null);
var opts_65873__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65567_65871,(1),null);
var blocks_65874 = cljs.core.keep.cljs$core$IFn$_invoke$arity$2(((function (seq__65439_65788,chunk__65440_65789,count__65441_65790,i__65442_65791,vec__65567_65871,block_ids_65872,opts_65873__$1,G__65560_65859,G__65560_65860__$1,vec__65557_65854,op_65855,args_65856,seq__65439_65848__$1,temp__5804__auto___65847,tx_meta__62753__auto___65787,opts__63380__auto___65685,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_){
return (function (p1__65212_SHARP_){
var G__65570 = cljs.core.deref(conn);
var G__65571 = p1__65212_SHARP_;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__65570,G__65571) : datascript.core.entity.call(null,G__65570,G__65571));
});})(seq__65439_65788,chunk__65440_65789,count__65441_65790,i__65442_65791,vec__65567_65871,block_ids_65872,opts_65873__$1,G__65560_65859,G__65560_65860__$1,vec__65557_65854,op_65855,args_65856,seq__65439_65848__$1,temp__5804__auto___65847,tx_meta__62753__auto___65787,opts__63380__auto___65685,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_))
,block_ids_65872);
logseq.outliner.core.delete_blocks_BANG_(repo,conn,date_formatter,blocks_65874,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts_65873__$1,opts_SINGLEQUOTE_], 0)));

break;
case "move-blocks":
var vec__65573_65875 = args_65856;
var block_ids_65876 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65573_65875,(0),null);
var target_block_id_65877 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65573_65875,(1),null);
var sibling_QMARK__65878 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65573_65875,(2),null);
var blocks_65879 = cljs.core.keep.cljs$core$IFn$_invoke$arity$2(((function (seq__65439_65788,chunk__65440_65789,count__65441_65790,i__65442_65791,vec__65573_65875,block_ids_65876,target_block_id_65877,sibling_QMARK__65878,G__65560_65859,G__65560_65860__$1,vec__65557_65854,op_65855,args_65856,seq__65439_65848__$1,temp__5804__auto___65847,tx_meta__62753__auto___65787,opts__63380__auto___65685,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_){
return (function (p1__65213_SHARP_){
var G__65580 = cljs.core.deref(conn);
var G__65581 = p1__65213_SHARP_;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__65580,G__65581) : datascript.core.entity.call(null,G__65580,G__65581));
});})(seq__65439_65788,chunk__65440_65789,count__65441_65790,i__65442_65791,vec__65573_65875,block_ids_65876,target_block_id_65877,sibling_QMARK__65878,G__65560_65859,G__65560_65860__$1,vec__65557_65854,op_65855,args_65856,seq__65439_65848__$1,temp__5804__auto___65847,tx_meta__62753__auto___65787,opts__63380__auto___65685,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_))
,block_ids_65876);
var target_block_65880 = (function (){var G__65582 = cljs.core.deref(conn);
var G__65583 = target_block_id_65877;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__65582,G__65583) : datascript.core.entity.call(null,G__65582,G__65583));
})();
if(cljs.core.truth_((function (){var and__5000__auto__ = target_block_65880;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.seq(blocks_65879);
} else {
return and__5000__auto__;
}
})())){
logseq.outliner.core.move_blocks_BANG_(repo,conn,blocks_65879,target_block_65880,sibling_QMARK__65878);
} else {
}

break;
case "move-blocks-up-down":
var vec__65584_65881 = args_65856;
var block_ids_65882 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65584_65881,(0),null);
var up_QMARK__65883 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65584_65881,(1),null);
var blocks_65884 = cljs.core.keep.cljs$core$IFn$_invoke$arity$2(((function (seq__65439_65788,chunk__65440_65789,count__65441_65790,i__65442_65791,vec__65584_65881,block_ids_65882,up_QMARK__65883,G__65560_65859,G__65560_65860__$1,vec__65557_65854,op_65855,args_65856,seq__65439_65848__$1,temp__5804__auto___65847,tx_meta__62753__auto___65787,opts__63380__auto___65685,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_){
return (function (p1__65215_SHARP_){
var G__65587 = cljs.core.deref(conn);
var G__65588 = p1__65215_SHARP_;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__65587,G__65588) : datascript.core.entity.call(null,G__65587,G__65588));
});})(seq__65439_65788,chunk__65440_65789,count__65441_65790,i__65442_65791,vec__65584_65881,block_ids_65882,up_QMARK__65883,G__65560_65859,G__65560_65860__$1,vec__65557_65854,op_65855,args_65856,seq__65439_65848__$1,temp__5804__auto___65847,tx_meta__62753__auto___65787,opts__63380__auto___65685,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_))
,block_ids_65882);
if(cljs.core.seq(blocks_65884)){
logseq.outliner.core.move_blocks_up_down_BANG_(repo,conn,blocks_65884,up_QMARK__65883);
} else {
}

break;
case "indent-outdent-blocks":
var vec__65589_65885 = args_65856;
var block_ids_65886 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65589_65885,(0),null);
var indent_QMARK__65887 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65589_65885,(1),null);
var opts_65888__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65589_65885,(2),null);
var blocks_65889 = cljs.core.keep.cljs$core$IFn$_invoke$arity$2(((function (seq__65439_65788,chunk__65440_65789,count__65441_65790,i__65442_65791,vec__65589_65885,block_ids_65886,indent_QMARK__65887,opts_65888__$1,G__65560_65859,G__65560_65860__$1,vec__65557_65854,op_65855,args_65856,seq__65439_65848__$1,temp__5804__auto___65847,tx_meta__62753__auto___65787,opts__63380__auto___65685,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_){
return (function (p1__65216_SHARP_){
var G__65592 = cljs.core.deref(conn);
var G__65593 = p1__65216_SHARP_;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__65592,G__65593) : datascript.core.entity.call(null,G__65592,G__65593));
});})(seq__65439_65788,chunk__65440_65789,count__65441_65790,i__65442_65791,vec__65589_65885,block_ids_65886,indent_QMARK__65887,opts_65888__$1,G__65560_65859,G__65560_65860__$1,vec__65557_65854,op_65855,args_65856,seq__65439_65848__$1,temp__5804__auto___65847,tx_meta__62753__auto___65787,opts__63380__auto___65685,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_))
,block_ids_65886);
if(cljs.core.seq(blocks_65889)){
logseq.outliner.core.indent_outdent_blocks_BANG_.cljs$core$IFn$_invoke$arity$variadic(repo,conn,blocks_65889,indent_QMARK__65887,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts_65888__$1], 0));
} else {
}

break;
case "upsert-property":
cljs.core.reset_BANG_(_STAR_result,cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.upsert_property_BANG_,conn,args_65856));

break;
case "set-block-property":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.set_block_property_BANG_,conn,args_65856);

break;
case "remove-block-property":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.remove_block_property_BANG_,conn,args_65856);

break;
case "delete-property-value":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.delete_property_value_BANG_,conn,args_65856);

break;
case "create-property-text-block":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.create_property_text_block_BANG_,conn,args_65856);

break;
case "batch-set-property":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.batch_set_property_BANG_,conn,args_65856);

break;
case "batch-remove-property":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.batch_remove_property_BANG_,conn,args_65856);

break;
case "class-add-property":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.class_add_property_BANG_,conn,args_65856);

break;
case "class-remove-property":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.class_remove_property_BANG_,conn,args_65856);

break;
case "upsert-closed-value":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.upsert_closed_value_BANG_,conn,args_65856);

break;
case "delete-closed-value":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.delete_closed_value_BANG_,conn,args_65856);

break;
case "add-existing-values-to-closed-values":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.add_existing_values_to_closed_values_BANG_,conn,args_65856);

break;
case "transact":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.db.transact_BANG_,conn,args_65856);

break;
default:
var temp__5804__auto___65891__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(logseq.outliner.op._STAR_op_handlers),op_65855);
if(cljs.core.truth_(temp__5804__auto___65891__$1)){
var handler_65893 = temp__5804__auto___65891__$1;
cljs.core.reset_BANG_(_STAR_result,(handler_65893.cljs$core$IFn$_invoke$arity$3 ? handler_65893.cljs$core$IFn$_invoke$arity$3(repo,conn,args_65856) : handler_65893.call(null,repo,conn,args_65856)));
} else {
}

}


var G__65894 = cljs.core.next(seq__65439_65848__$1);
var G__65895 = null;
var G__65896 = (0);
var G__65897 = (0);
seq__65439_65788 = G__65894;
chunk__65440_65789 = G__65895;
count__65441_65790 = G__65896;
i__65442_65791 = G__65897;
continue;
}
} else {
}
}
break;
}

if(cljs.core.seq(null)){
logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"conn","conn",278309663).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396).cljs$core$IFn$_invoke$arity$1(opts_SINGLEQUOTE_)),null,cljs.core.PersistentArrayMap.EMPTY);
} else {
}

var G__65597_65901 = new cljs.core.Keyword(null,"conn","conn",278309663).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396).cljs$core$IFn$_invoke$arity$1(opts_SINGLEQUOTE_));
var G__65598_65902 = cljs.core.PersistentVector.EMPTY;
var G__65599_65903 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("batch-tx","exit?","batch-tx/exit?",-2021083148),true], null);
(datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3(G__65597_65901,G__65598_65902,G__65599_65903) : datascript.core.transact_BANG_.call(null,G__65597_65901,G__65598_65902,G__65599_65903));

logseq.outliner.batch_tx.exit_batch_txs_mode_BANG_();
}catch (e65438){var e__62754__auto___65904 = e65438;
logseq.outliner.batch_tx.exit_batch_txs_mode_BANG_();

throw e__62754__auto___65904;
}}

return cljs.core.deref(_STAR_result);
});

//# sourceMappingURL=logseq.outliner.op.js.map
