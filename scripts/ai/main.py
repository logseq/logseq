from typing import Optional, List

from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

class Texts(BaseModel):
    texts: List[str]

app = FastAPI()

model = SentenceTransformer('all-MiniLM-L6-v2')

pool = model.start_multi_process_pool()

def encode(texts: List[str]):
    data = model.encode_multi_process(texts, pool, batch_size=8).tolist()
    return data

@app.post("/embedding/")
async def embedding(texts: Texts):
    data = encode(texts.texts)
    return data
