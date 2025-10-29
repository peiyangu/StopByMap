from fastapi import FastAPI, Query, Request
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
def get_route(
        origin: str = Query(...),
        destination: str = Query(...),
    waypoints: str = Query("", description="カンマ区切りの経由地リスト"),
    avoid_tolls: bool = Query(False),
    request: Request = None,
    ):
    """Google Directions APIを呼び出して経路情報を返す"""
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    base_url = "https://maps.googleapis.com/maps/api/directions/json"

    params = {
        "origin": origin,
        "destination": destination,
        "alternatives": "true",  # 複数経路取得
        "key": api_key,
        "language": "ja",  # 日本語の経路案内
        "region": "jp",    # 日本の地域設定
    }

    if waypoints:
        # 経由地の最適化を有効にする
        waypoints_list = ["optimize:true"]
        waypoints_list.extend(waypoints.split(","))
        params["waypoints"] = "|".join(waypoints_list)

    if avoid_tolls:
        # 有料道路を回避する設定
        params["avoid"] = "tolls"

    if avoid_tolls:
        params["avoid"] = "tolls"

    res = requests.get(base_url, params=params)
    return res.json()