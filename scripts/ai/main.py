from typing import Optional, List

from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

class Texts(BaseModel):
    texts: List

app = FastAPI()

model = SentenceTransformer("all-MiniLM-L6-v2")

@app.post("/embedding/")
async def embedding(texts: Texts):
    data = model.encode(list(texts), convert_to_numpy=True).tolist()
    return {"embedding": data}
