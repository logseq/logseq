#!/usr/bin/env python3
import argparse
import json
import logging
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from sentence_transformers import SentenceTransformer


DEFAULT_MODEL = "all-MiniLM-L6-v2"
WARMUP_INPUT = "Logseq embedding server warmup"
_MODELS = {}


def configure_logging(log_file):
    if not log_file:
        return

    log_dir = os.path.dirname(log_file)
    if log_dir:
        os.makedirs(log_dir, exist_ok=True)
    logging.basicConfig(
        filename=log_file,
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
    )


def load_model(model_name):
    if model_name not in _MODELS:
        logging.info("Loading embedding model: %s", model_name)
        _MODELS[model_name] = SentenceTransformer(model_name)
    return _MODELS[model_name]


def encode_texts(model, texts):
    return model.encode(
        texts,
        normalize_embeddings=True,
        show_progress_bar=False,
    )


def warm_model(model_name):
    logging.info("Warming embedding model: %s", model_name)
    model = load_model(model_name)
    encode_texts(model, [WARMUP_INPUT])
    logging.info("Embedding model warmup finished: %s", model_name)


def normalize_input(value):
    if isinstance(value, str):
        return [value]
    if isinstance(value, list) and all(isinstance(item, str) for item in value):
        return value
    raise ValueError("input must be a string or a list of strings")


class EmbeddingHandler(BaseHTTPRequestHandler):
    server_version = "LogseqEmbeddingServer/1.0"

    def do_GET(self):
        if self.path == "/healthz":
            self.send_json({"status": "ok"})
            return

        self.send_json({"error": "not found"}, status=404)

    def do_POST(self):
        if self.path != "/v1/embeddings":
            self.send_json({"error": "not found"}, status=404)
            return

        try:
            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            model_name = payload.get("model") or self.server.default_model
            texts = normalize_input(payload.get("input"))
            model = load_model(model_name)
            vectors = encode_texts(model, texts).tolist()
            self.send_json(
                {
                    "object": "list",
                    "model": model_name,
                    "data": [
                        {
                            "object": "embedding",
                            "index": index,
                            "embedding": vector,
                        }
                        for index, vector in enumerate(vectors)
                    ],
                }
            )
        except Exception as error:
            logging.exception("Embedding request failed")
            self.send_json({"error": str(error)}, status=400)

    def log_message(self, _format, *_args):
        return

    def send_json(self, payload, status=200):
        body = json.dumps(payload).encode("utf-8")
        try:
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except BrokenPipeError:
            logging.exception("Embedding response write failed")
            raise


class EmbeddingServer(ThreadingHTTPServer):
    def __init__(self, server_address, handler_class, default_model):
        super().__init__(server_address, handler_class)
        self.default_model = default_model

    def handle_error(self, request, client_address):
        logging.exception("Unhandled embedding server error from %s", client_address)
        super().handle_error(request, client_address)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--log-file")
    args = parser.parse_args()

    configure_logging(args.log_file)
    try:
        warm_model(args.model)
        server = EmbeddingServer((args.host, args.port), EmbeddingHandler, args.model)
        logging.info(
            "Embedding server listening on http://%s:%s/v1/embeddings",
            args.host,
            args.port,
        )
        print(
            f"Embedding server listening on http://{args.host}:{args.port}/v1/embeddings",
            flush=True,
        )
        server.serve_forever()
    except Exception:
        logging.exception("Embedding server failed")
        raise


if __name__ == "__main__":
    main()
