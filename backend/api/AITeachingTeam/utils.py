from googleapiclient.discovery import build
import re
from serpapi import GoogleSearch
from django.conf import settings

SERVICE_ACCOUNT_FILE = settings.CREDENTIALS_FILE
SCOPES = ["https://www.googleapis.com/auth/documents", "https://www.googleapis.com/auth/drive"]
SERPAPI_KEY = settings.SERPAPI_KEY


def search_serpapi_links(topic):
    params = {
        "q": topic + " site:medium.com OR site:wikipedia.org OR site:arxiv.org",
        "hl": "en",
        "api_key": SERPAPI_KEY
    }
    search = GoogleSearch(params)
    results = search.get_dict()
    links = results.get("organic_results", [])
    return [(r["title"], r["link"]) for r in links[:5]]

def create_google_doc(title, content, creds, share_email):
    docs_service = build("docs", "v1", credentials=creds)
    drive_service = build("drive", "v3", credentials=creds)

    doc = docs_service.documents().create(body={"title": title}).execute()
    doc_id = doc.get("documentId")
    doc_url = f"https://docs.google.com/document/d/{doc_id}"

    requests = [{"insertText": {"location": {"index": 1}, "text": content}}]
    docs_service.documents().batchUpdate(documentId=doc_id, body={"requests": requests}).execute()

    permission = {
        "type": "user",
        "role": "writer",
        "emailAddress": share_email,
    }
    drive_service.permissions().create(
        fileId=doc_id,
        body=permission,
        fields="id",
        sendNotificationEmail=False
    ).execute()

    return doc_url

def extract_text_from_google_doc(doc_url, creds):
    match = re.search(r"/d/([a-zA-Z0-9-_]+)", doc_url)
    if not match:
        raise ValueError("Invalid Google Docs URL")
    doc_id = match.group(1)

    service = build("docs", "v1", credentials=creds)
    document = service.documents().get(documentId=doc_id).execute()

    content = document.get("body", {}).get("content", [])
    full_text = ""

    for elem in content:
        para = elem.get("paragraph")
        if not para:
            continue
        for e in para.get("elements", []):
            if "textRun" in e and "content" in e["textRun"]:
                full_text += e["textRun"]["content"]

    return full_text.strip()
