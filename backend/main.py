from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import requests, os
from dotenv import load_dotenv

load_dotenv()
app = FastAPI()

# CORS許可（React側アクセス対応）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/route")
def get_route(start: str = Query(...), end: str = Query(...)):
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    url = "https://maps.googleapis.com/maps/api/directions/json"
    params = {"origin": start, "destination": end, "key": api_key, "language": "ja"}
    res = requests.get(url, params=params).json()

    if not res.get("routes"):
        return {"error": "経路が見つかりません"}

    route = res["routes"][0]["legs"][0]
    return {
        "summary": res["routes"][0].get("summary"),
        "distance": round(route["distance"]["value"] / 1000, 1),
        "duration": round(route["duration"]["value"] / 60),
        "start_address": route["start_address"],
        "end_address": route["end_address"],
    }