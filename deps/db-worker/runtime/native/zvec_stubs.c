#include <caml/mlvalues.h>
#include <caml/memory.h>
#include <caml/alloc.h>
#include <caml/custom.h>
#include <caml/fail.h>
#include <stdlib.h>
#include <string.h>

#if defined(__APPLE__) && defined(__aarch64__)
#include <dlfcn.h>
#include <pthread.h>
#include "zvec_c_api.h"

#define API(X) \
 X(zvec_initialize) X(zvec_get_last_error) \
 X(zvec_collection_options_create) X(zvec_collection_options_destroy) \
 X(zvec_collection_options_set_enable_mmap) \
 X(zvec_collection_schema_create) X(zvec_collection_schema_destroy) X(zvec_collection_schema_add_field) \
 X(zvec_field_schema_create) X(zvec_field_schema_destroy) X(zvec_field_schema_set_index_params) \
 X(zvec_index_params_create) X(zvec_index_params_destroy) X(zvec_index_params_set_metric_type) \
 X(zvec_collection_open) X(zvec_collection_create_and_open) X(zvec_collection_close) \
 X(zvec_collection_flush) X(zvec_collection_destroy) X(zvec_collection_upsert) X(zvec_collection_delete) \
 X(zvec_doc_create) X(zvec_doc_destroy) X(zvec_doc_set_pk) X(zvec_doc_add_field_by_value) \
 X(zvec_vector_query_create) X(zvec_vector_query_destroy) X(zvec_vector_query_set_topk) \
 X(zvec_vector_query_set_field_name) X(zvec_vector_query_set_query_vector) \
 X(zvec_vector_query_set_output_fields) X(zvec_vector_query_set_hnsw_params) \
 X(zvec_query_params_hnsw_create) X(zvec_collection_query) X(zvec_docs_free) \
 X(zvec_doc_get_pk_pointer) X(zvec_doc_get_score) X(zvec_doc_get_field_value_pointer)
#define DECLARE(name) static __typeof__(&name) api_##name;
API(DECLARE)
static void *library;
static pthread_mutex_t library_mutex = PTHREAD_MUTEX_INITIALIZER;

static char *last_error(void) {
  char *message = NULL;
  api_zvec_get_last_error(&message);
  return message ? message : strdup("zvec operation failed");
}

static void raise_error(char *message) {
  CAMLparam0();
  CAMLlocal1(text);
  text = caml_copy_string(message);
  free(message);
  caml_failwith_value(text);
  CAMLreturn0;
}

static void load_library(const char *path) {
  pthread_mutex_lock(&library_mutex);
  if (!library) {
    void *candidate = dlopen(path, RTLD_NOW | RTLD_LOCAL);
    if (!candidate) {
      char *message = strdup(dlerror());
      pthread_mutex_unlock(&library_mutex);
      raise_error(message);
    }
#define LOAD(name) \
    api_##name = (__typeof__(&name))dlsym(candidate, #name); \
    if (!api_##name) { \
      dlclose(candidate); pthread_mutex_unlock(&library_mutex); \
      caml_failwith("Missing zvec symbol: " #name); \
    }
    API(LOAD)
    if (api_zvec_initialize(NULL) != ZVEC_OK) {
      char *message = last_error();
      dlclose(candidate);
      pthread_mutex_unlock(&library_mutex);
      raise_error(message);
    }
    library = candidate;
  }
  pthread_mutex_unlock(&library_mutex);
}

#define HANDLE(value) (*(zvec_collection_t **)Data_custom_val(value))
static zvec_collection_t *collection(value handle) {
  if (!HANDLE(handle)) caml_invalid_argument("Vector index is closed");
  return HANDLE(handle);
}
static void finalize(value handle) {
  if (HANDLE(handle)) {
    api_zvec_collection_close(HANDLE(handle));
    HANDLE(handle) = NULL;
  }
}
static struct custom_operations handle_ops = {
  .identifier = "logseq.zvec.collection",
  .finalize = finalize,
  .compare = custom_compare_default,
  .hash = custom_hash_default,
  .serialize = custom_serialize_default,
  .deserialize = custom_deserialize_default,
  .compare_ext = custom_compare_ext_default,
  .fixed_length = custom_fixed_length_default
};
#define TRY(call) do { if ((call) != ZVEC_OK) { message = last_error(); goto cleanup; } } while (0)
#define ALLOC(pointer, call) do { pointer = (call); if (!pointer) { message = last_error(); goto cleanup; } } while (0)

CAMLprim value logseq_zvec_open(value library_path, value path, value dimension, value create) {
  CAMLparam4(library_path, path, dimension, create);
  CAMLlocal1(result);
  load_library(String_val(library_path));
  result = caml_alloc_custom(&handle_ops, sizeof(zvec_collection_t *), 0, 1);
  HANDLE(result) = NULL;
  char *message = NULL;
  zvec_collection_options_t *options = NULL;
  zvec_collection_schema_t *schema = NULL;
  zvec_field_schema_t *field = NULL;
  zvec_index_params_t *params = NULL;
  ALLOC(options, api_zvec_collection_options_create());
  TRY(api_zvec_collection_options_set_enable_mmap(options, true));
  if (!Bool_val(create)) {
    TRY(api_zvec_collection_open(String_val(path), options, &HANDLE(result)));
  } else {
    ALLOC(schema, api_zvec_collection_schema_create("blocks"));
    ALLOC(field, api_zvec_field_schema_create("embedding", ZVEC_DATA_TYPE_VECTOR_FP32, false, Int_val(dimension)));
    ALLOC(params, api_zvec_index_params_create(ZVEC_INDEX_TYPE_HNSW));
    TRY(api_zvec_index_params_set_metric_type(params, ZVEC_METRIC_TYPE_COSINE));
    TRY(api_zvec_field_schema_set_index_params(field, params));
    TRY(api_zvec_collection_schema_add_field(schema, field));
    api_zvec_index_params_destroy(params); params = NULL;
    api_zvec_field_schema_destroy(field); field = NULL;
    ALLOC(field, api_zvec_field_schema_create("page", ZVEC_DATA_TYPE_STRING, false, 0));
    ALLOC(params, api_zvec_index_params_create(ZVEC_INDEX_TYPE_INVERT));
    TRY(api_zvec_field_schema_set_index_params(field, params));
    TRY(api_zvec_collection_schema_add_field(schema, field));
    api_zvec_index_params_destroy(params); params = NULL;
    api_zvec_field_schema_destroy(field); field = NULL;
    ALLOC(field, api_zvec_field_schema_create("title", ZVEC_DATA_TYPE_STRING, false, 0));
    TRY(api_zvec_collection_schema_add_field(schema, field));
    TRY(api_zvec_collection_create_and_open(String_val(path), schema, options, &HANDLE(result)));
  }
cleanup:
  if (params) api_zvec_index_params_destroy(params);
  if (field) api_zvec_field_schema_destroy(field);
  if (schema) api_zvec_collection_schema_destroy(schema);
  if (options) api_zvec_collection_options_destroy(options);
  if (message) raise_error(message);
  CAMLreturn(result);
}

CAMLprim value logseq_zvec_close(value handle) {
  CAMLparam1(handle);
  if (HANDLE(handle)) {
    char *message = NULL;
    if (api_zvec_collection_flush(HANDLE(handle)) != ZVEC_OK) message = last_error();
    zvec_collection_t *current = HANDLE(handle);
    HANDLE(handle) = NULL;
    if (api_zvec_collection_close(current) != ZVEC_OK && !message) message = last_error();
    if (message) raise_error(message);
  }
  CAMLreturn(Val_unit);
}

CAMLprim value logseq_zvec_destroy(value handle) {
  CAMLparam1(handle);
  zvec_collection_t *current = collection(handle);
  if (api_zvec_collection_destroy(current) != ZVEC_OK) raise_error(last_error());
  HANDLE(handle) = NULL;
  if (api_zvec_collection_close(current) != ZVEC_OK) raise_error(last_error());
  CAMLreturn(Val_unit);
}

static float *copy_vector(value vector) {
  size_t length = Wosize_val(vector) / Double_wosize;
  float *data = caml_stat_alloc(length * sizeof(float));
  for (size_t i = 0; i < length; i++) data[i] = Double_flat_field(vector, i);
  return data;
}

CAMLprim value logseq_zvec_upsert(value handle, value documents) {
  CAMLparam2(handle, documents);
  zvec_collection_t *current = collection(handle);
  size_t count = Wosize_val(documents), created = 0, successes = 0, errors = 0;
  char *message = NULL;
  zvec_doc_t **docs = caml_stat_alloc(count * sizeof(zvec_doc_t *));
  float *vector = NULL;
  for (size_t i = 0; i < count; i++) {
    value doc = Field(documents, i);
    ALLOC(docs[i], api_zvec_doc_create());
    created++;
    api_zvec_doc_set_pk(docs[i], String_val(Field(doc, 0)));
    value page = Field(doc, 1), embedding = Field(doc, 2), title = Field(doc, 3);
    TRY(api_zvec_doc_add_field_by_value(docs[i], "page", ZVEC_DATA_TYPE_STRING, String_val(page), caml_string_length(page)));
    const char *title_text = Is_block(title) ? String_val(Field(title, 0)) : "";
    size_t title_length = Is_block(title) ? caml_string_length(Field(title, 0)) : 0;
    TRY(api_zvec_doc_add_field_by_value(docs[i], "title", ZVEC_DATA_TYPE_STRING, title_text, title_length));
    vector = copy_vector(embedding);
    TRY(api_zvec_doc_add_field_by_value(docs[i], "embedding", ZVEC_DATA_TYPE_VECTOR_FP32,
        vector, Wosize_val(embedding) / Double_wosize * sizeof(float)));
    caml_stat_free(vector); vector = NULL;
  }
  TRY(api_zvec_collection_upsert(current, (const zvec_doc_t **)docs, count, &successes, &errors));
  if (errors || successes != count) message = strdup("zvec upsert rejected documents");
cleanup:
  if (vector) caml_stat_free(vector);
  for (size_t i = 0; i < created; i++) api_zvec_doc_destroy(docs[i]);
  caml_stat_free(docs);
  if (message) raise_error(message);
  CAMLreturn(Val_unit);
}

CAMLprim value logseq_zvec_delete(value handle, value ids) {
  CAMLparam2(handle, ids);
  zvec_collection_t *current = collection(handle);
  size_t count = Wosize_val(ids), successes = 0, errors = 0;
  const char **keys = caml_stat_alloc(count * sizeof(char *));
  for (size_t i = 0; i < count; i++) keys[i] = String_val(Field(ids, i));
  zvec_error_code_t status = api_zvec_collection_delete(current, keys, count, &successes, &errors);
  caml_stat_free(keys);
  if (status != ZVEC_OK) raise_error(last_error());
  if (errors) caml_failwith("zvec delete rejected documents");
  CAMLreturn(Val_unit);
}

CAMLprim value logseq_zvec_query(value handle, value embedding, value limit) {
  CAMLparam3(handle, embedding, limit);
  CAMLlocal5(result, row, id, page, title);
  CAMLlocal1(score);
  zvec_collection_t *current = collection(handle);
  char *message = NULL;
  zvec_vector_query_t *query = NULL;
  zvec_doc_t **docs = NULL;
  size_t count = 0;
  float *vector = copy_vector(embedding);
  ALLOC(query, api_zvec_vector_query_create());
  TRY(api_zvec_vector_query_set_field_name(query, "embedding"));
  TRY(api_zvec_vector_query_set_topk(query, Int_val(limit)));
  TRY(api_zvec_vector_query_set_query_vector(query, vector,
      Wosize_val(embedding) / Double_wosize * sizeof(float)));
  const char *fields[] = {"page", "title"};
  TRY(api_zvec_vector_query_set_output_fields(query, fields, 2));
  zvec_hnsw_query_params_t *params = api_zvec_query_params_hnsw_create(300, 0., false, false);
  if (!params) { message = last_error(); goto cleanup; }
  TRY(api_zvec_vector_query_set_hnsw_params(query, params));
  TRY(api_zvec_collection_query(current, query, &docs, &count));
  result = caml_alloc(count, 0);
  for (size_t i = 0; i < count; i++) Store_field(result, i, Val_unit);
  for (size_t i = 0; i < count; i++) {
    const void *text;
    size_t length;
    id = caml_copy_string(api_zvec_doc_get_pk_pointer(docs[i]));
    TRY(api_zvec_doc_get_field_value_pointer(docs[i], "page", ZVEC_DATA_TYPE_STRING, &text, &length));
    page = caml_alloc_initialized_string(length, text);
    TRY(api_zvec_doc_get_field_value_pointer(docs[i], "title", ZVEC_DATA_TYPE_STRING, &text, &length));
    title = caml_alloc_initialized_string(length, text);
    score = caml_copy_double(api_zvec_doc_get_score(docs[i]));
    row = caml_alloc_tuple(4);
    Store_field(row, 0, id); Store_field(row, 1, page); Store_field(row, 2, score); Store_field(row, 3, title);
    Store_field(result, i, row);
  }
cleanup:
  if (docs) api_zvec_docs_free(docs, count);
  if (query) api_zvec_vector_query_destroy(query);
  caml_stat_free(vector);
  if (message) raise_error(message);
  CAMLreturn(result);
}
#else
#define UNAVAILABLE(name, args) CAMLprim value name args { caml_failwith("Native vectors require macOS arm64"); }
UNAVAILABLE(logseq_zvec_open, (value library_path, value path, value dimension, value create))
UNAVAILABLE(logseq_zvec_close, (value handle))
UNAVAILABLE(logseq_zvec_destroy, (value handle))
UNAVAILABLE(logseq_zvec_upsert, (value handle, value documents))
UNAVAILABLE(logseq_zvec_delete, (value handle, value ids))
UNAVAILABLE(logseq_zvec_query, (value handle, value embedding, value limit))
#endif
