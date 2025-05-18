from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from ytmusicapi import YTMusic, OAuthCredentials
from dotenv import load_dotenv
import os

load_dotenv()

client_id = os.getenv("CLIENT_ID")
client_secret = os.getenv("CLIENT_SECRET")


yt = YTMusic('../oauth.json', oauth_credentials=OAuthCredentials(client_id=client_id, client_secret=client_secret))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get('/ytmusic/search')
def search_track(q: str):
    results = yt.search(q)
    if results:
        return {
            'videoId': results[0]['videoId'],
            'title': results[0]['title'],
            'artist': results[0]['artists'][0]['name']
        }
    return {'error': 'No results found'}