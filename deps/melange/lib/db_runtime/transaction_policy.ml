module Domain = Melange_db.Transaction_policy

type encoded_validation = {
  dbBased : bool;
  rtcDownload : bool;
  resetConn : bool;
  initialDb : bool;
  skipMeta : bool;
  skipConn : bool;
  exporterNewGraph : bool;
}

type encoded_favorite = { linkUuid : string; title : string }

let keepMapAttribute external_transact attribute =
  Domain.keep_map_attribute ~external_transact attribute

let keepTemporaryAttribute attribute = Domain.keep_temporary_attribute attribute

let keepMap empty db_ident =
  Domain.keep_map ~empty ~db_ident:(Js.Nullable.toOption db_ident)

let keepVectorAttribute attribute =
  Domain.keep_vector_attribute (Js.Nullable.toOption attribute)

let shouldValidate (input : encoded_validation) =
  Domain.should_validate
    {
      db_based = input.dbBased;
      rtc_download = input.rtcDownload;
      reset_conn = input.resetConn;
      initial_db = input.initialDb;
      skip_meta = input.skipMeta;
      skip_conn = input.skipConn;
      exporter_new_graph = input.exporterNewGraph;
    }

let favorite uuid =
  let favorite = Domain.favorite uuid in
  {
    linkUuid = Domain.favorite_uuid favorite;
    title = Domain.favorite_title favorite;
  }
