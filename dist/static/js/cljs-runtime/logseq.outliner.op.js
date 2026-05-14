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
var db_based_QMARK_ = (function (){var G__145857 = cljs.core.deref(conn);
return (logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(G__145857) : logseq.db.db_based_graph_QMARK_.call(null,G__145857));
})();
var opts__41801__auto___146139 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(opts_SINGLEQUOTE_,new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"current-block","current-block",1027687970)], 0));
if((!((logseq.outliner.batch_tx.get_batch_db_before() == null)))){
var seq__145858_146140 = cljs.core.seq(ops);
var chunk__145859_146141 = null;
var count__145860_146142 = (0);
var i__145861_146143 = (0);
while(true){
if((i__145861_146143 < count__145860_146142)){
var vec__145935_146144 = chunk__145859_146141.cljs$core$IIndexed$_nth$arity$2(null,i__145861_146143);
var op_146145 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__145935_146144,(0),null);
var args_146146 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__145935_146144,(1),null);
if(cljs.core.truth_(db_based_QMARK_)){
} else {
if((!(((clojure.string.includes_QMARK_(cljs.core.name(op_146145),"property")) || (clojure.string.includes_QMARK_(cljs.core.name(op_146145),"closed-value")))))){
} else {
throw (new Error(["Assert failed: ",["Property related ops are only for db based graphs, ops: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(ops)].join(''),"\n","(not (or (string/includes? (name op) \"property\") (string/includes? (name op) \"closed-value\")))"].join('')));
}
}

var G__145938_146147 = op_146145;
var G__145938_146148__$1 = (((G__145938_146147 instanceof cljs.core.Keyword))?G__145938_146147.fqn:null);
switch (G__145938_146148__$1) {
case "save-block":
cljs.core.apply.cljs$core$IFn$_invoke$arity$5(logseq.outliner.core.save_block_BANG_,repo,conn,date_formatter,args_146146);

break;
case "insert-blocks":
var vec__145939_146150 = args_146146;
var blocks_146151 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__145939_146150,(0),null);
var target_block_id_146152 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__145939_146150,(1),null);
var opts_146153__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__145939_146150,(2),null);
var temp__5804__auto___146154 = (function (){var G__145942 = cljs.core.deref(conn);
var G__145943 = target_block_id_146152;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__145942,G__145943) : datascript.core.entity.call(null,G__145942,G__145943));
})();
if(cljs.core.truth_(temp__5804__auto___146154)){
var target_block_146155 = temp__5804__auto___146154;
var result_146156 = logseq.outliner.core.insert_blocks_BANG_(repo,conn,blocks_146151,target_block_146155,opts_146153__$1);
cljs.core.reset_BANG_(_STAR_result,result_146156);
} else {
}

break;
case "delete-blocks":
var vec__145944_146157 = args_146146;
var block_ids_146158 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__145944_146157,(0),null);
var opts_146159__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__145944_146157,(1),null);
var blocks_146160 = cljs.core.keep.cljs$core$IFn$_invoke$arity$2(((function (seq__145858_146140,chunk__145859_146141,count__145860_146142,i__145861_146143,vec__145944_146157,block_ids_146158,opts_146159__$1,G__145938_146147,G__145938_146148__$1,vec__145935_146144,op_146145,args_146146,opts__41801__auto___146139,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_){
return (function (p1__145848_SHARP_){
var G__145947 = cljs.core.deref(conn);
var G__145948 = p1__145848_SHARP_;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__145947,G__145948) : datascript.core.entity.call(null,G__145947,G__145948));
});})(seq__145858_146140,chunk__145859_146141,count__145860_146142,i__145861_146143,vec__145944_146157,block_ids_146158,opts_146159__$1,G__145938_146147,G__145938_146148__$1,vec__145935_146144,op_146145,args_146146,opts__41801__auto___146139,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_))
,block_ids_146158);
logseq.outliner.core.delete_blocks_BANG_(repo,conn,date_formatter,blocks_146160,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts_146159__$1,opts_SINGLEQUOTE_], 0)));

break;
case "move-blocks":
var vec__145949_146161 = args_146146;
var block_ids_146162 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__145949_146161,(0),null);
var target_block_id_146163 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__145949_146161,(1),null);
var sibling_QMARK__146164 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__145949_146161,(2),null);
var blocks_146165 = cljs.core.keep.cljs$core$IFn$_invoke$arity$2(((function (seq__145858_146140,chunk__145859_146141,count__145860_146142,i__145861_146143,vec__145949_146161,block_ids_146162,target_block_id_146163,sibling_QMARK__146164,G__145938_146147,G__145938_146148__$1,vec__145935_146144,op_146145,args_146146,opts__41801__auto___146139,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_){
return (function (p1__145849_SHARP_){
var G__145952 = cljs.core.deref(conn);
var G__145953 = p1__145849_SHARP_;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__145952,G__145953) : datascript.core.entity.call(null,G__145952,G__145953));
});})(seq__145858_146140,chunk__145859_146141,count__145860_146142,i__145861_146143,vec__145949_146161,block_ids_146162,target_block_id_146163,sibling_QMARK__146164,G__145938_146147,G__145938_146148__$1,vec__145935_146144,op_146145,args_146146,opts__41801__auto___146139,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_))
,block_ids_146162);
var target_block_146166 = (function (){var G__145954 = cljs.core.deref(conn);
var G__145955 = target_block_id_146163;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__145954,G__145955) : datascript.core.entity.call(null,G__145954,G__145955));
})();
if(cljs.core.truth_((function (){var and__5000__auto__ = target_block_146166;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.seq(blocks_146165);
} else {
return and__5000__auto__;
}
})())){
logseq.outliner.core.move_blocks_BANG_(repo,conn,blocks_146165,target_block_146166,sibling_QMARK__146164);
} else {
}

break;
case "move-blocks-up-down":
var vec__145956_146168 = args_146146;
var block_ids_146169 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__145956_146168,(0),null);
var up_QMARK__146170 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__145956_146168,(1),null);
var blocks_146171 = cljs.core.keep.cljs$core$IFn$_invoke$arity$2(((function (seq__145858_146140,chunk__145859_146141,count__145860_146142,i__145861_146143,vec__145956_146168,block_ids_146169,up_QMARK__146170,G__145938_146147,G__145938_146148__$1,vec__145935_146144,op_146145,args_146146,opts__41801__auto___146139,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_){
return (function (p1__145850_SHARP_){
var G__145959 = cljs.core.deref(conn);
var G__145960 = p1__145850_SHARP_;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__145959,G__145960) : datascript.core.entity.call(null,G__145959,G__145960));
});})(seq__145858_146140,chunk__145859_146141,count__145860_146142,i__145861_146143,vec__145956_146168,block_ids_146169,up_QMARK__146170,G__145938_146147,G__145938_146148__$1,vec__145935_146144,op_146145,args_146146,opts__41801__auto___146139,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_))
,block_ids_146169);
if(cljs.core.seq(blocks_146171)){
logseq.outliner.core.move_blocks_up_down_BANG_(repo,conn,blocks_146171,up_QMARK__146170);
} else {
}

break;
case "indent-outdent-blocks":
var vec__145961_146172 = args_146146;
var block_ids_146173 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__145961_146172,(0),null);
var indent_QMARK__146174 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__145961_146172,(1),null);
var opts_146175__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__145961_146172,(2),null);
var blocks_146176 = cljs.core.keep.cljs$core$IFn$_invoke$arity$2(((function (seq__145858_146140,chunk__145859_146141,count__145860_146142,i__145861_146143,vec__145961_146172,block_ids_146173,indent_QMARK__146174,opts_146175__$1,G__145938_146147,G__145938_146148__$1,vec__145935_146144,op_146145,args_146146,opts__41801__auto___146139,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_){
return (function (p1__145851_SHARP_){
var G__145964 = cljs.core.deref(conn);
var G__145965 = p1__145851_SHARP_;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__145964,G__145965) : datascript.core.entity.call(null,G__145964,G__145965));
});})(seq__145858_146140,chunk__145859_146141,count__145860_146142,i__145861_146143,vec__145961_146172,block_ids_146173,indent_QMARK__146174,opts_146175__$1,G__145938_146147,G__145938_146148__$1,vec__145935_146144,op_146145,args_146146,opts__41801__auto___146139,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_))
,block_ids_146173);
if(cljs.core.seq(blocks_146176)){
logseq.outliner.core.indent_outdent_blocks_BANG_.cljs$core$IFn$_invoke$arity$variadic(repo,conn,blocks_146176,indent_QMARK__146174,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts_146175__$1], 0));
} else {
}

break;
case "upsert-property":
cljs.core.reset_BANG_(_STAR_result,cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.upsert_property_BANG_,conn,args_146146));

break;
case "set-block-property":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.set_block_property_BANG_,conn,args_146146);

break;
case "remove-block-property":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.remove_block_property_BANG_,conn,args_146146);

break;
case "delete-property-value":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.delete_property_value_BANG_,conn,args_146146);

break;
case "create-property-text-block":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.create_property_text_block_BANG_,conn,args_146146);

break;
case "batch-set-property":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.batch_set_property_BANG_,conn,args_146146);

break;
case "batch-remove-property":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.batch_remove_property_BANG_,conn,args_146146);

break;
case "class-add-property":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.class_add_property_BANG_,conn,args_146146);

break;
case "class-remove-property":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.class_remove_property_BANG_,conn,args_146146);

break;
case "upsert-closed-value":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.upsert_closed_value_BANG_,conn,args_146146);

break;
case "delete-closed-value":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.delete_closed_value_BANG_,conn,args_146146);

break;
case "add-existing-values-to-closed-values":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.add_existing_values_to_closed_values_BANG_,conn,args_146146);

break;
case "transact":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.db.transact_BANG_,conn,args_146146);

break;
default:
var temp__5804__auto___146177 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(logseq.outliner.op._STAR_op_handlers),op_146145);
if(cljs.core.truth_(temp__5804__auto___146177)){
var handler_146180 = temp__5804__auto___146177;
cljs.core.reset_BANG_(_STAR_result,(handler_146180.cljs$core$IFn$_invoke$arity$3 ? handler_146180.cljs$core$IFn$_invoke$arity$3(repo,conn,args_146146) : handler_146180.call(null,repo,conn,args_146146)));
} else {
}

}


var G__146181 = seq__145858_146140;
var G__146182 = chunk__145859_146141;
var G__146183 = count__145860_146142;
var G__146184 = (i__145861_146143 + (1));
seq__145858_146140 = G__146181;
chunk__145859_146141 = G__146182;
count__145860_146142 = G__146183;
i__145861_146143 = G__146184;
continue;
} else {
var temp__5804__auto___146185 = cljs.core.seq(seq__145858_146140);
if(temp__5804__auto___146185){
var seq__145858_146186__$1 = temp__5804__auto___146185;
if(cljs.core.chunked_seq_QMARK_(seq__145858_146186__$1)){
var c__5525__auto___146187 = cljs.core.chunk_first(seq__145858_146186__$1);
var G__146188 = cljs.core.chunk_rest(seq__145858_146186__$1);
var G__146189 = c__5525__auto___146187;
var G__146190 = cljs.core.count(c__5525__auto___146187);
var G__146191 = (0);
seq__145858_146140 = G__146188;
chunk__145859_146141 = G__146189;
count__145860_146142 = G__146190;
i__145861_146143 = G__146191;
continue;
} else {
var vec__145966_146192 = cljs.core.first(seq__145858_146186__$1);
var op_146193 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__145966_146192,(0),null);
var args_146194 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__145966_146192,(1),null);
if(cljs.core.truth_(db_based_QMARK_)){
} else {
if((!(((clojure.string.includes_QMARK_(cljs.core.name(op_146193),"property")) || (clojure.string.includes_QMARK_(cljs.core.name(op_146193),"closed-value")))))){
} else {
throw (new Error(["Assert failed: ",["Property related ops are only for db based graphs, ops: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(ops)].join(''),"\n","(not (or (string/includes? (name op) \"property\") (string/includes? (name op) \"closed-value\")))"].join('')));
}
}

var G__145969_146197 = op_146193;
var G__145969_146198__$1 = (((G__145969_146197 instanceof cljs.core.Keyword))?G__145969_146197.fqn:null);
switch (G__145969_146198__$1) {
case "save-block":
cljs.core.apply.cljs$core$IFn$_invoke$arity$5(logseq.outliner.core.save_block_BANG_,repo,conn,date_formatter,args_146194);

break;
case "insert-blocks":
var vec__145970_146200 = args_146194;
var blocks_146201 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__145970_146200,(0),null);
var target_block_id_146202 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__145970_146200,(1),null);
var opts_146203__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__145970_146200,(2),null);
var temp__5804__auto___146204__$1 = (function (){var G__145973 = cljs.core.deref(conn);
var G__145974 = target_block_id_146202;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__145973,G__145974) : datascript.core.entity.call(null,G__145973,G__145974));
})();
if(cljs.core.truth_(temp__5804__auto___146204__$1)){
var target_block_146205 = temp__5804__auto___146204__$1;
var result_146206 = logseq.outliner.core.insert_blocks_BANG_(repo,conn,blocks_146201,target_block_146205,opts_146203__$1);
cljs.core.reset_BANG_(_STAR_result,result_146206);
} else {
}

break;
case "delete-blocks":
var vec__145975_146207 = args_146194;
var block_ids_146208 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__145975_146207,(0),null);
var opts_146209__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__145975_146207,(1),null);
var blocks_146210 = cljs.core.keep.cljs$core$IFn$_invoke$arity$2(((function (seq__145858_146140,chunk__145859_146141,count__145860_146142,i__145861_146143,vec__145975_146207,block_ids_146208,opts_146209__$1,G__145969_146197,G__145969_146198__$1,vec__145966_146192,op_146193,args_146194,seq__145858_146186__$1,temp__5804__auto___146185,opts__41801__auto___146139,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_){
return (function (p1__145848_SHARP_){
var G__145978 = cljs.core.deref(conn);
var G__145979 = p1__145848_SHARP_;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__145978,G__145979) : datascript.core.entity.call(null,G__145978,G__145979));
});})(seq__145858_146140,chunk__145859_146141,count__145860_146142,i__145861_146143,vec__145975_146207,block_ids_146208,opts_146209__$1,G__145969_146197,G__145969_146198__$1,vec__145966_146192,op_146193,args_146194,seq__145858_146186__$1,temp__5804__auto___146185,opts__41801__auto___146139,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_))
,block_ids_146208);
logseq.outliner.core.delete_blocks_BANG_(repo,conn,date_formatter,blocks_146210,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts_146209__$1,opts_SINGLEQUOTE_], 0)));

break;
case "move-blocks":
var vec__145980_146212 = args_146194;
var block_ids_146213 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__145980_146212,(0),null);
var target_block_id_146214 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__145980_146212,(1),null);
var sibling_QMARK__146215 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__145980_146212,(2),null);
var blocks_146216 = cljs.core.keep.cljs$core$IFn$_invoke$arity$2(((function (seq__145858_146140,chunk__145859_146141,count__145860_146142,i__145861_146143,vec__145980_146212,block_ids_146213,target_block_id_146214,sibling_QMARK__146215,G__145969_146197,G__145969_146198__$1,vec__145966_146192,op_146193,args_146194,seq__145858_146186__$1,temp__5804__auto___146185,opts__41801__auto___146139,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_){
return (function (p1__145849_SHARP_){
var G__145983 = cljs.core.deref(conn);
var G__145984 = p1__145849_SHARP_;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__145983,G__145984) : datascript.core.entity.call(null,G__145983,G__145984));
});})(seq__145858_146140,chunk__145859_146141,count__145860_146142,i__145861_146143,vec__145980_146212,block_ids_146213,target_block_id_146214,sibling_QMARK__146215,G__145969_146197,G__145969_146198__$1,vec__145966_146192,op_146193,args_146194,seq__145858_146186__$1,temp__5804__auto___146185,opts__41801__auto___146139,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_))
,block_ids_146213);
var target_block_146217 = (function (){var G__145985 = cljs.core.deref(conn);
var G__145986 = target_block_id_146214;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__145985,G__145986) : datascript.core.entity.call(null,G__145985,G__145986));
})();
if(cljs.core.truth_((function (){var and__5000__auto__ = target_block_146217;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.seq(blocks_146216);
} else {
return and__5000__auto__;
}
})())){
logseq.outliner.core.move_blocks_BANG_(repo,conn,blocks_146216,target_block_146217,sibling_QMARK__146215);
} else {
}

break;
case "move-blocks-up-down":
var vec__145987_146220 = args_146194;
var block_ids_146221 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__145987_146220,(0),null);
var up_QMARK__146222 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__145987_146220,(1),null);
var blocks_146223 = cljs.core.keep.cljs$core$IFn$_invoke$arity$2(((function (seq__145858_146140,chunk__145859_146141,count__145860_146142,i__145861_146143,vec__145987_146220,block_ids_146221,up_QMARK__146222,G__145969_146197,G__145969_146198__$1,vec__145966_146192,op_146193,args_146194,seq__145858_146186__$1,temp__5804__auto___146185,opts__41801__auto___146139,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_){
return (function (p1__145850_SHARP_){
var G__145990 = cljs.core.deref(conn);
var G__145991 = p1__145850_SHARP_;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__145990,G__145991) : datascript.core.entity.call(null,G__145990,G__145991));
});})(seq__145858_146140,chunk__145859_146141,count__145860_146142,i__145861_146143,vec__145987_146220,block_ids_146221,up_QMARK__146222,G__145969_146197,G__145969_146198__$1,vec__145966_146192,op_146193,args_146194,seq__145858_146186__$1,temp__5804__auto___146185,opts__41801__auto___146139,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_))
,block_ids_146221);
if(cljs.core.seq(blocks_146223)){
logseq.outliner.core.move_blocks_up_down_BANG_(repo,conn,blocks_146223,up_QMARK__146222);
} else {
}

break;
case "indent-outdent-blocks":
var vec__145992_146225 = args_146194;
var block_ids_146226 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__145992_146225,(0),null);
var indent_QMARK__146227 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__145992_146225,(1),null);
var opts_146228__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__145992_146225,(2),null);
var blocks_146229 = cljs.core.keep.cljs$core$IFn$_invoke$arity$2(((function (seq__145858_146140,chunk__145859_146141,count__145860_146142,i__145861_146143,vec__145992_146225,block_ids_146226,indent_QMARK__146227,opts_146228__$1,G__145969_146197,G__145969_146198__$1,vec__145966_146192,op_146193,args_146194,seq__145858_146186__$1,temp__5804__auto___146185,opts__41801__auto___146139,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_){
return (function (p1__145851_SHARP_){
var G__145995 = cljs.core.deref(conn);
var G__145996 = p1__145851_SHARP_;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__145995,G__145996) : datascript.core.entity.call(null,G__145995,G__145996));
});})(seq__145858_146140,chunk__145859_146141,count__145860_146142,i__145861_146143,vec__145992_146225,block_ids_146226,indent_QMARK__146227,opts_146228__$1,G__145969_146197,G__145969_146198__$1,vec__145966_146192,op_146193,args_146194,seq__145858_146186__$1,temp__5804__auto___146185,opts__41801__auto___146139,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_))
,block_ids_146226);
if(cljs.core.seq(blocks_146229)){
logseq.outliner.core.indent_outdent_blocks_BANG_.cljs$core$IFn$_invoke$arity$variadic(repo,conn,blocks_146229,indent_QMARK__146227,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts_146228__$1], 0));
} else {
}

break;
case "upsert-property":
cljs.core.reset_BANG_(_STAR_result,cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.upsert_property_BANG_,conn,args_146194));

break;
case "set-block-property":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.set_block_property_BANG_,conn,args_146194);

break;
case "remove-block-property":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.remove_block_property_BANG_,conn,args_146194);

break;
case "delete-property-value":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.delete_property_value_BANG_,conn,args_146194);

break;
case "create-property-text-block":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.create_property_text_block_BANG_,conn,args_146194);

break;
case "batch-set-property":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.batch_set_property_BANG_,conn,args_146194);

break;
case "batch-remove-property":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.batch_remove_property_BANG_,conn,args_146194);

break;
case "class-add-property":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.class_add_property_BANG_,conn,args_146194);

break;
case "class-remove-property":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.class_remove_property_BANG_,conn,args_146194);

break;
case "upsert-closed-value":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.upsert_closed_value_BANG_,conn,args_146194);

break;
case "delete-closed-value":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.delete_closed_value_BANG_,conn,args_146194);

break;
case "add-existing-values-to-closed-values":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.add_existing_values_to_closed_values_BANG_,conn,args_146194);

break;
case "transact":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.db.transact_BANG_,conn,args_146194);

break;
default:
var temp__5804__auto___146230__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(logseq.outliner.op._STAR_op_handlers),op_146193);
if(cljs.core.truth_(temp__5804__auto___146230__$1)){
var handler_146231 = temp__5804__auto___146230__$1;
cljs.core.reset_BANG_(_STAR_result,(handler_146231.cljs$core$IFn$_invoke$arity$3 ? handler_146231.cljs$core$IFn$_invoke$arity$3(repo,conn,args_146194) : handler_146231.call(null,repo,conn,args_146194)));
} else {
}

}


var G__146232 = cljs.core.next(seq__145858_146186__$1);
var G__146233 = null;
var G__146234 = (0);
var G__146235 = (0);
seq__145858_146140 = G__146232;
chunk__145859_146141 = G__146233;
count__145860_146142 = G__146234;
i__145861_146143 = G__146235;
continue;
}
} else {
}
}
break;
}
} else {
try{var tx_meta__41780__auto___146236 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(opts__41801__auto___146139,new cljs.core.Keyword(null,"additional-tx","additional-tx",-343057604),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396)], 0)),new cljs.core.Keyword("batch-tx","batch-tx-mode?","batch-tx/batch-tx-mode?",1787753099),true);
logseq.outliner.batch_tx.set_batch_opts(tx_meta__41780__auto___146236);

logseq.outliner.batch_tx.set_batch_db_before_BANG_(cljs.core.deref(new cljs.core.Keyword(null,"conn","conn",278309663).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396).cljs$core$IFn$_invoke$arity$1(opts_SINGLEQUOTE_))));

var seq__145998_146238 = cljs.core.seq(ops);
var chunk__145999_146239 = null;
var count__146000_146240 = (0);
var i__146001_146241 = (0);
while(true){
if((i__146001_146241 < count__146000_146240)){
var vec__146069_146242 = chunk__145999_146239.cljs$core$IIndexed$_nth$arity$2(null,i__146001_146241);
var op_146243 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__146069_146242,(0),null);
var args_146244 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__146069_146242,(1),null);
if(cljs.core.truth_(db_based_QMARK_)){
} else {
if((!(((clojure.string.includes_QMARK_(cljs.core.name(op_146243),"property")) || (clojure.string.includes_QMARK_(cljs.core.name(op_146243),"closed-value")))))){
} else {
throw (new Error(["Assert failed: ",["Property related ops are only for db based graphs, ops: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(ops)].join(''),"\n","(not (or (string/includes? (name op) \"property\") (string/includes? (name op) \"closed-value\")))"].join('')));
}
}

var G__146072_146245 = op_146243;
var G__146072_146246__$1 = (((G__146072_146245 instanceof cljs.core.Keyword))?G__146072_146245.fqn:null);
switch (G__146072_146246__$1) {
case "save-block":
cljs.core.apply.cljs$core$IFn$_invoke$arity$5(logseq.outliner.core.save_block_BANG_,repo,conn,date_formatter,args_146244);

break;
case "insert-blocks":
var vec__146073_146248 = args_146244;
var blocks_146249 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__146073_146248,(0),null);
var target_block_id_146250 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__146073_146248,(1),null);
var opts_146251__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__146073_146248,(2),null);
var temp__5804__auto___146252 = (function (){var G__146076 = cljs.core.deref(conn);
var G__146077 = target_block_id_146250;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__146076,G__146077) : datascript.core.entity.call(null,G__146076,G__146077));
})();
if(cljs.core.truth_(temp__5804__auto___146252)){
var target_block_146253 = temp__5804__auto___146252;
var result_146254 = logseq.outliner.core.insert_blocks_BANG_(repo,conn,blocks_146249,target_block_146253,opts_146251__$1);
cljs.core.reset_BANG_(_STAR_result,result_146254);
} else {
}

break;
case "delete-blocks":
var vec__146078_146255 = args_146244;
var block_ids_146256 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__146078_146255,(0),null);
var opts_146257__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__146078_146255,(1),null);
var blocks_146258 = cljs.core.keep.cljs$core$IFn$_invoke$arity$2(((function (seq__145998_146238,chunk__145999_146239,count__146000_146240,i__146001_146241,vec__146078_146255,block_ids_146256,opts_146257__$1,G__146072_146245,G__146072_146246__$1,vec__146069_146242,op_146243,args_146244,tx_meta__41780__auto___146236,opts__41801__auto___146139,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_){
return (function (p1__145848_SHARP_){
var G__146081 = cljs.core.deref(conn);
var G__146082 = p1__145848_SHARP_;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__146081,G__146082) : datascript.core.entity.call(null,G__146081,G__146082));
});})(seq__145998_146238,chunk__145999_146239,count__146000_146240,i__146001_146241,vec__146078_146255,block_ids_146256,opts_146257__$1,G__146072_146245,G__146072_146246__$1,vec__146069_146242,op_146243,args_146244,tx_meta__41780__auto___146236,opts__41801__auto___146139,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_))
,block_ids_146256);
logseq.outliner.core.delete_blocks_BANG_(repo,conn,date_formatter,blocks_146258,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts_146257__$1,opts_SINGLEQUOTE_], 0)));

break;
case "move-blocks":
var vec__146083_146259 = args_146244;
var block_ids_146260 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__146083_146259,(0),null);
var target_block_id_146261 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__146083_146259,(1),null);
var sibling_QMARK__146262 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__146083_146259,(2),null);
var blocks_146263 = cljs.core.keep.cljs$core$IFn$_invoke$arity$2(((function (seq__145998_146238,chunk__145999_146239,count__146000_146240,i__146001_146241,vec__146083_146259,block_ids_146260,target_block_id_146261,sibling_QMARK__146262,G__146072_146245,G__146072_146246__$1,vec__146069_146242,op_146243,args_146244,tx_meta__41780__auto___146236,opts__41801__auto___146139,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_){
return (function (p1__145849_SHARP_){
var G__146086 = cljs.core.deref(conn);
var G__146087 = p1__145849_SHARP_;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__146086,G__146087) : datascript.core.entity.call(null,G__146086,G__146087));
});})(seq__145998_146238,chunk__145999_146239,count__146000_146240,i__146001_146241,vec__146083_146259,block_ids_146260,target_block_id_146261,sibling_QMARK__146262,G__146072_146245,G__146072_146246__$1,vec__146069_146242,op_146243,args_146244,tx_meta__41780__auto___146236,opts__41801__auto___146139,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_))
,block_ids_146260);
var target_block_146264 = (function (){var G__146088 = cljs.core.deref(conn);
var G__146089 = target_block_id_146261;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__146088,G__146089) : datascript.core.entity.call(null,G__146088,G__146089));
})();
if(cljs.core.truth_((function (){var and__5000__auto__ = target_block_146264;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.seq(blocks_146263);
} else {
return and__5000__auto__;
}
})())){
logseq.outliner.core.move_blocks_BANG_(repo,conn,blocks_146263,target_block_146264,sibling_QMARK__146262);
} else {
}

break;
case "move-blocks-up-down":
var vec__146090_146266 = args_146244;
var block_ids_146267 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__146090_146266,(0),null);
var up_QMARK__146268 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__146090_146266,(1),null);
var blocks_146269 = cljs.core.keep.cljs$core$IFn$_invoke$arity$2(((function (seq__145998_146238,chunk__145999_146239,count__146000_146240,i__146001_146241,vec__146090_146266,block_ids_146267,up_QMARK__146268,G__146072_146245,G__146072_146246__$1,vec__146069_146242,op_146243,args_146244,tx_meta__41780__auto___146236,opts__41801__auto___146139,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_){
return (function (p1__145850_SHARP_){
var G__146095 = cljs.core.deref(conn);
var G__146096 = p1__145850_SHARP_;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__146095,G__146096) : datascript.core.entity.call(null,G__146095,G__146096));
});})(seq__145998_146238,chunk__145999_146239,count__146000_146240,i__146001_146241,vec__146090_146266,block_ids_146267,up_QMARK__146268,G__146072_146245,G__146072_146246__$1,vec__146069_146242,op_146243,args_146244,tx_meta__41780__auto___146236,opts__41801__auto___146139,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_))
,block_ids_146267);
if(cljs.core.seq(blocks_146269)){
logseq.outliner.core.move_blocks_up_down_BANG_(repo,conn,blocks_146269,up_QMARK__146268);
} else {
}

break;
case "indent-outdent-blocks":
var vec__146097_146271 = args_146244;
var block_ids_146272 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__146097_146271,(0),null);
var indent_QMARK__146273 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__146097_146271,(1),null);
var opts_146274__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__146097_146271,(2),null);
var blocks_146275 = cljs.core.keep.cljs$core$IFn$_invoke$arity$2(((function (seq__145998_146238,chunk__145999_146239,count__146000_146240,i__146001_146241,vec__146097_146271,block_ids_146272,indent_QMARK__146273,opts_146274__$1,G__146072_146245,G__146072_146246__$1,vec__146069_146242,op_146243,args_146244,tx_meta__41780__auto___146236,opts__41801__auto___146139,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_){
return (function (p1__145851_SHARP_){
var G__146100 = cljs.core.deref(conn);
var G__146101 = p1__145851_SHARP_;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__146100,G__146101) : datascript.core.entity.call(null,G__146100,G__146101));
});})(seq__145998_146238,chunk__145999_146239,count__146000_146240,i__146001_146241,vec__146097_146271,block_ids_146272,indent_QMARK__146273,opts_146274__$1,G__146072_146245,G__146072_146246__$1,vec__146069_146242,op_146243,args_146244,tx_meta__41780__auto___146236,opts__41801__auto___146139,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_))
,block_ids_146272);
if(cljs.core.seq(blocks_146275)){
logseq.outliner.core.indent_outdent_blocks_BANG_.cljs$core$IFn$_invoke$arity$variadic(repo,conn,blocks_146275,indent_QMARK__146273,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts_146274__$1], 0));
} else {
}

break;
case "upsert-property":
cljs.core.reset_BANG_(_STAR_result,cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.upsert_property_BANG_,conn,args_146244));

break;
case "set-block-property":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.set_block_property_BANG_,conn,args_146244);

break;
case "remove-block-property":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.remove_block_property_BANG_,conn,args_146244);

break;
case "delete-property-value":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.delete_property_value_BANG_,conn,args_146244);

break;
case "create-property-text-block":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.create_property_text_block_BANG_,conn,args_146244);

break;
case "batch-set-property":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.batch_set_property_BANG_,conn,args_146244);

break;
case "batch-remove-property":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.batch_remove_property_BANG_,conn,args_146244);

break;
case "class-add-property":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.class_add_property_BANG_,conn,args_146244);

break;
case "class-remove-property":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.class_remove_property_BANG_,conn,args_146244);

break;
case "upsert-closed-value":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.upsert_closed_value_BANG_,conn,args_146244);

break;
case "delete-closed-value":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.delete_closed_value_BANG_,conn,args_146244);

break;
case "add-existing-values-to-closed-values":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.add_existing_values_to_closed_values_BANG_,conn,args_146244);

break;
case "transact":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.db.transact_BANG_,conn,args_146244);

break;
default:
var temp__5804__auto___146278 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(logseq.outliner.op._STAR_op_handlers),op_146243);
if(cljs.core.truth_(temp__5804__auto___146278)){
var handler_146282 = temp__5804__auto___146278;
cljs.core.reset_BANG_(_STAR_result,(handler_146282.cljs$core$IFn$_invoke$arity$3 ? handler_146282.cljs$core$IFn$_invoke$arity$3(repo,conn,args_146244) : handler_146282.call(null,repo,conn,args_146244)));
} else {
}

}


var G__146284 = seq__145998_146238;
var G__146285 = chunk__145999_146239;
var G__146286 = count__146000_146240;
var G__146287 = (i__146001_146241 + (1));
seq__145998_146238 = G__146284;
chunk__145999_146239 = G__146285;
count__146000_146240 = G__146286;
i__146001_146241 = G__146287;
continue;
} else {
var temp__5804__auto___146288 = cljs.core.seq(seq__145998_146238);
if(temp__5804__auto___146288){
var seq__145998_146289__$1 = temp__5804__auto___146288;
if(cljs.core.chunked_seq_QMARK_(seq__145998_146289__$1)){
var c__5525__auto___146290 = cljs.core.chunk_first(seq__145998_146289__$1);
var G__146291 = cljs.core.chunk_rest(seq__145998_146289__$1);
var G__146292 = c__5525__auto___146290;
var G__146293 = cljs.core.count(c__5525__auto___146290);
var G__146294 = (0);
seq__145998_146238 = G__146291;
chunk__145999_146239 = G__146292;
count__146000_146240 = G__146293;
i__146001_146241 = G__146294;
continue;
} else {
var vec__146102_146295 = cljs.core.first(seq__145998_146289__$1);
var op_146296 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__146102_146295,(0),null);
var args_146297 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__146102_146295,(1),null);
if(cljs.core.truth_(db_based_QMARK_)){
} else {
if((!(((clojure.string.includes_QMARK_(cljs.core.name(op_146296),"property")) || (clojure.string.includes_QMARK_(cljs.core.name(op_146296),"closed-value")))))){
} else {
throw (new Error(["Assert failed: ",["Property related ops are only for db based graphs, ops: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(ops)].join(''),"\n","(not (or (string/includes? (name op) \"property\") (string/includes? (name op) \"closed-value\")))"].join('')));
}
}

var G__146105_146298 = op_146296;
var G__146105_146299__$1 = (((G__146105_146298 instanceof cljs.core.Keyword))?G__146105_146298.fqn:null);
switch (G__146105_146299__$1) {
case "save-block":
cljs.core.apply.cljs$core$IFn$_invoke$arity$5(logseq.outliner.core.save_block_BANG_,repo,conn,date_formatter,args_146297);

break;
case "insert-blocks":
var vec__146106_146301 = args_146297;
var blocks_146302 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__146106_146301,(0),null);
var target_block_id_146303 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__146106_146301,(1),null);
var opts_146304__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__146106_146301,(2),null);
var temp__5804__auto___146305__$1 = (function (){var G__146109 = cljs.core.deref(conn);
var G__146110 = target_block_id_146303;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__146109,G__146110) : datascript.core.entity.call(null,G__146109,G__146110));
})();
if(cljs.core.truth_(temp__5804__auto___146305__$1)){
var target_block_146306 = temp__5804__auto___146305__$1;
var result_146307 = logseq.outliner.core.insert_blocks_BANG_(repo,conn,blocks_146302,target_block_146306,opts_146304__$1);
cljs.core.reset_BANG_(_STAR_result,result_146307);
} else {
}

break;
case "delete-blocks":
var vec__146111_146308 = args_146297;
var block_ids_146309 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__146111_146308,(0),null);
var opts_146310__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__146111_146308,(1),null);
var blocks_146311 = cljs.core.keep.cljs$core$IFn$_invoke$arity$2(((function (seq__145998_146238,chunk__145999_146239,count__146000_146240,i__146001_146241,vec__146111_146308,block_ids_146309,opts_146310__$1,G__146105_146298,G__146105_146299__$1,vec__146102_146295,op_146296,args_146297,seq__145998_146289__$1,temp__5804__auto___146288,tx_meta__41780__auto___146236,opts__41801__auto___146139,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_){
return (function (p1__145848_SHARP_){
var G__146114 = cljs.core.deref(conn);
var G__146115 = p1__145848_SHARP_;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__146114,G__146115) : datascript.core.entity.call(null,G__146114,G__146115));
});})(seq__145998_146238,chunk__145999_146239,count__146000_146240,i__146001_146241,vec__146111_146308,block_ids_146309,opts_146310__$1,G__146105_146298,G__146105_146299__$1,vec__146102_146295,op_146296,args_146297,seq__145998_146289__$1,temp__5804__auto___146288,tx_meta__41780__auto___146236,opts__41801__auto___146139,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_))
,block_ids_146309);
logseq.outliner.core.delete_blocks_BANG_(repo,conn,date_formatter,blocks_146311,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts_146310__$1,opts_SINGLEQUOTE_], 0)));

break;
case "move-blocks":
var vec__146116_146312 = args_146297;
var block_ids_146313 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__146116_146312,(0),null);
var target_block_id_146314 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__146116_146312,(1),null);
var sibling_QMARK__146315 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__146116_146312,(2),null);
var blocks_146316 = cljs.core.keep.cljs$core$IFn$_invoke$arity$2(((function (seq__145998_146238,chunk__145999_146239,count__146000_146240,i__146001_146241,vec__146116_146312,block_ids_146313,target_block_id_146314,sibling_QMARK__146315,G__146105_146298,G__146105_146299__$1,vec__146102_146295,op_146296,args_146297,seq__145998_146289__$1,temp__5804__auto___146288,tx_meta__41780__auto___146236,opts__41801__auto___146139,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_){
return (function (p1__145849_SHARP_){
var G__146119 = cljs.core.deref(conn);
var G__146120 = p1__145849_SHARP_;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__146119,G__146120) : datascript.core.entity.call(null,G__146119,G__146120));
});})(seq__145998_146238,chunk__145999_146239,count__146000_146240,i__146001_146241,vec__146116_146312,block_ids_146313,target_block_id_146314,sibling_QMARK__146315,G__146105_146298,G__146105_146299__$1,vec__146102_146295,op_146296,args_146297,seq__145998_146289__$1,temp__5804__auto___146288,tx_meta__41780__auto___146236,opts__41801__auto___146139,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_))
,block_ids_146313);
var target_block_146317 = (function (){var G__146121 = cljs.core.deref(conn);
var G__146122 = target_block_id_146314;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__146121,G__146122) : datascript.core.entity.call(null,G__146121,G__146122));
})();
if(cljs.core.truth_((function (){var and__5000__auto__ = target_block_146317;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.seq(blocks_146316);
} else {
return and__5000__auto__;
}
})())){
logseq.outliner.core.move_blocks_BANG_(repo,conn,blocks_146316,target_block_146317,sibling_QMARK__146315);
} else {
}

break;
case "move-blocks-up-down":
var vec__146123_146320 = args_146297;
var block_ids_146321 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__146123_146320,(0),null);
var up_QMARK__146322 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__146123_146320,(1),null);
var blocks_146323 = cljs.core.keep.cljs$core$IFn$_invoke$arity$2(((function (seq__145998_146238,chunk__145999_146239,count__146000_146240,i__146001_146241,vec__146123_146320,block_ids_146321,up_QMARK__146322,G__146105_146298,G__146105_146299__$1,vec__146102_146295,op_146296,args_146297,seq__145998_146289__$1,temp__5804__auto___146288,tx_meta__41780__auto___146236,opts__41801__auto___146139,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_){
return (function (p1__145850_SHARP_){
var G__146129 = cljs.core.deref(conn);
var G__146130 = p1__145850_SHARP_;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__146129,G__146130) : datascript.core.entity.call(null,G__146129,G__146130));
});})(seq__145998_146238,chunk__145999_146239,count__146000_146240,i__146001_146241,vec__146123_146320,block_ids_146321,up_QMARK__146322,G__146105_146298,G__146105_146299__$1,vec__146102_146295,op_146296,args_146297,seq__145998_146289__$1,temp__5804__auto___146288,tx_meta__41780__auto___146236,opts__41801__auto___146139,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_))
,block_ids_146321);
if(cljs.core.seq(blocks_146323)){
logseq.outliner.core.move_blocks_up_down_BANG_(repo,conn,blocks_146323,up_QMARK__146322);
} else {
}

break;
case "indent-outdent-blocks":
var vec__146131_146324 = args_146297;
var block_ids_146325 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__146131_146324,(0),null);
var indent_QMARK__146326 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__146131_146324,(1),null);
var opts_146327__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__146131_146324,(2),null);
var blocks_146328 = cljs.core.keep.cljs$core$IFn$_invoke$arity$2(((function (seq__145998_146238,chunk__145999_146239,count__146000_146240,i__146001_146241,vec__146131_146324,block_ids_146325,indent_QMARK__146326,opts_146327__$1,G__146105_146298,G__146105_146299__$1,vec__146102_146295,op_146296,args_146297,seq__145998_146289__$1,temp__5804__auto___146288,tx_meta__41780__auto___146236,opts__41801__auto___146139,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_){
return (function (p1__145851_SHARP_){
var G__146134 = cljs.core.deref(conn);
var G__146135 = p1__145851_SHARP_;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__146134,G__146135) : datascript.core.entity.call(null,G__146134,G__146135));
});})(seq__145998_146238,chunk__145999_146239,count__146000_146240,i__146001_146241,vec__146131_146324,block_ids_146325,indent_QMARK__146326,opts_146327__$1,G__146105_146298,G__146105_146299__$1,vec__146102_146295,op_146296,args_146297,seq__145998_146289__$1,temp__5804__auto___146288,tx_meta__41780__auto___146236,opts__41801__auto___146139,opts_SINGLEQUOTE_,_STAR_result,db_based_QMARK_))
,block_ids_146325);
if(cljs.core.seq(blocks_146328)){
logseq.outliner.core.indent_outdent_blocks_BANG_.cljs$core$IFn$_invoke$arity$variadic(repo,conn,blocks_146328,indent_QMARK__146326,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts_146327__$1], 0));
} else {
}

break;
case "upsert-property":
cljs.core.reset_BANG_(_STAR_result,cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.upsert_property_BANG_,conn,args_146297));

break;
case "set-block-property":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.set_block_property_BANG_,conn,args_146297);

break;
case "remove-block-property":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.remove_block_property_BANG_,conn,args_146297);

break;
case "delete-property-value":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.delete_property_value_BANG_,conn,args_146297);

break;
case "create-property-text-block":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.create_property_text_block_BANG_,conn,args_146297);

break;
case "batch-set-property":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.batch_set_property_BANG_,conn,args_146297);

break;
case "batch-remove-property":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.batch_remove_property_BANG_,conn,args_146297);

break;
case "class-add-property":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.class_add_property_BANG_,conn,args_146297);

break;
case "class-remove-property":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.class_remove_property_BANG_,conn,args_146297);

break;
case "upsert-closed-value":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.upsert_closed_value_BANG_,conn,args_146297);

break;
case "delete-closed-value":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.delete_closed_value_BANG_,conn,args_146297);

break;
case "add-existing-values-to-closed-values":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.outliner.property.add_existing_values_to_closed_values_BANG_,conn,args_146297);

break;
case "transact":
cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.db.transact_BANG_,conn,args_146297);

break;
default:
var temp__5804__auto___146330__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(logseq.outliner.op._STAR_op_handlers),op_146296);
if(cljs.core.truth_(temp__5804__auto___146330__$1)){
var handler_146331 = temp__5804__auto___146330__$1;
cljs.core.reset_BANG_(_STAR_result,(handler_146331.cljs$core$IFn$_invoke$arity$3 ? handler_146331.cljs$core$IFn$_invoke$arity$3(repo,conn,args_146297) : handler_146331.call(null,repo,conn,args_146297)));
} else {
}

}


var G__146332 = cljs.core.next(seq__145998_146289__$1);
var G__146333 = null;
var G__146334 = (0);
var G__146335 = (0);
seq__145998_146238 = G__146332;
chunk__145999_146239 = G__146333;
count__146000_146240 = G__146334;
i__146001_146241 = G__146335;
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

var G__146136_146337 = new cljs.core.Keyword(null,"conn","conn",278309663).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396).cljs$core$IFn$_invoke$arity$1(opts_SINGLEQUOTE_));
var G__146137_146338 = cljs.core.PersistentVector.EMPTY;
var G__146138_146339 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("batch-tx","exit?","batch-tx/exit?",-2021083148),true], null);
(datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3(G__146136_146337,G__146137_146338,G__146138_146339) : datascript.core.transact_BANG_.call(null,G__146136_146337,G__146137_146338,G__146138_146339));

logseq.outliner.batch_tx.exit_batch_txs_mode_BANG_();
}catch (e145997){var e__41781__auto___146341 = e145997;
logseq.outliner.batch_tx.exit_batch_txs_mode_BANG_();

throw e__41781__auto___146341;
}}

return cljs.core.deref(_STAR_result);
});

//# sourceMappingURL=logseq.outliner.op.js.map
