#!/usr/bin/env python3
import argparse
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from sentence_transformers import SentenceTransformer


DEFAULT_MODEL = "all-MiniLM-L6-v2"
_MODELS = {}


def load_model(model_name):
    if model_name not in _MODELS:
        _MODELS[model_name] = SentenceTransformer(model_name)
    return _MODELS[model_name]


def normalize_input(value):
    if isinstance(value, str):
        return [value]
    if isinstance(value, list) and all(isinstance(item, str) for item in value):
        return value
    raise ValueError("input must be a string or a list of strings")


class EmbeddingHandler(BaseHTTPRequestHandler):
    server_version = "LogseqEmbeddingServer/1.0"

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
            vectors = model.encode(texts, normalize_embeddings=True).tolist()
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
            self.send_json({"error": str(error)}, status=400)

    def log_message(self, _format, *_args):
        return

    def send_json(self, payload, status=200):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


class EmbeddingServer(ThreadingHTTPServer):
    def __init__(self, server_address, handler_class, default_model):
        super().__init__(server_address, handler_class)
        self.default_model = default_model


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--model", default=DEFAULT_MODEL)
    args = parser.parse_args()

    server = EmbeddingServer((args.host, args.port), EmbeddingHandler, args.model)
    print(
        f"Embedding server listening on http://{args.host}:{args.port}/v1/embeddings",
        flush=True,
    )
    server.serve_forever()


if __name__ == "__main__":
    main()
