"""
&AI SENSE × Steel Browser クローラー
JSレンダリングが必要なSPAサイト対応
"""
import requests
import json
import time
import subprocess
import sys
from datetime import datetime

STEEL_API = "http://localhost:3007"

# JSレンダリングが必要なサイト（Steel Browser使用）
SPA_SITES = [
    {"name": "M&Aクラウド", "url": "https://macloud.jp/", "category": "M&A"},
    {"name": "バトンズ", "url": "https://batonz.jp/sell/", "category": "M&A"},
    {"name": "Nikkei電子版", "url": "https://www.nikkei.com/", "category": "ニュース"},
    {"name": "東洋経済", "url": "https://toyokeizai.net/", "category": "経済"},
    {"name": "東京商工リサーチ", "url": "https://www.tsr-net.co.jp/news/analysis/", "category": "倒産情報"},
    {"name": "帝国データバンク", "url": "https://www.tdb.co.jp/news/", "category": "企業情報"},
]

def create_session():
    """Steel Browserセッション作成"""
    r = requests.post(f"{STEEL_API}/v1/sessions",
        json={},
        headers={"Content-Type": "application/json"},
        timeout=15)
    if r.status_code == 200:
        return r.json()["id"]
    return None

def release_session(session_id):
    """セッション解放"""
    requests.delete(f"{STEEL_API}/v1/sessions/{session_id}", timeout=10)

def crawl_with_steel(url, session_id=None):
    """Steel Browser経由でJSサイトをクロール"""
    # agent-browserでページを開く
    subprocess.run(["agent-browser", "open", url], capture_output=True, timeout=30)
    time.sleep(4)  # JSレンダリング待ち

    # テキスト取得
    result = subprocess.run(
        ["agent-browser", "get", "text", "body"],
        capture_output=True, text=True, timeout=30
    )
    text = result.stdout[:5000]  # 最大5000文字

    # スクリーンショット
    import os
    shot_path = f"/tmp/steel_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{os.getpid()}.png"
    subprocess.run(["agent-browser", "screenshot", shot_path], capture_output=True, timeout=30)
    
    return {
        "url": url,
        "text": text,
        "screenshot": shot_path,
        "timestamp": datetime.now().isoformat()
    }

def score_with_qwen(text, site_name):
    """Qwen3でコンテンツをスコアリング"""
    try:
        import ollama
        response = ollama.chat(
            model="qwen3-bk:30b",
            messages=[{
                "role": "user",
                "content": f"""
以下は{site_name}のページテキストです。
M&A、企業買収、倒産、事業承継に関する重要情報をスコアリングしてください。

テキスト:
{text[:2000]}

JSON形式で回答:
{{
  "score": 0-100,
  "reason": "理由",
  "keywords": ["キーワード1", "キーワード2"],
  "companies": ["企業名1"]
}}
"""
            }],
            options={"temperature": 0.1}
        )
        content = response['message']['content']
        # JSON抽出
        import re
        match = re.search(r'\{[^{}]*\}', content, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass
    except Exception as e:
        print(f"スコアリングエラー: {e}")
    return {"score": 0, "reason": "エラー", "keywords": [], "companies": []}

def run_steel_crawler():
    """メインクロール実行"""
    print(f"\n{'='*50}")
    print(f"Steel Browser クローラー起動: {datetime.now()}")
    print(f"対象サイト: {len(SPA_SITES)}件")
    print(f"{'='*50}\n")
    
    results = []
    for site in SPA_SITES:
        print(f"🔍 クロール中: {site['name']} ({site['url']})")
        try:
            data = crawl_with_steel(site["url"])
            score_data = score_with_qwen(data["text"], site["name"])
            
            result = {
                "site": site["name"],
                "url": site["url"],
                "category": site["category"],
                "score": score_data.get("score", 0),
                "keywords": score_data.get("keywords", []),
                "companies": score_data.get("companies", []),
                "timestamp": data["timestamp"]
            }
            results.append(result)
            
            if result["score"] >= 40:
                print(f"  ✅ スコア{result['score']}: {result['keywords']}")
            else:
                print(f"  ⚪ スコア{result['score']}: スキップ")
                
            time.sleep(2)
        except Exception as e:
            print(f"  ❌ エラー: {e}")
    
    print(f"\n完了: {len(results)}件 スコア40以上: {sum(1 for r in results if r['score']>=40)}件")
    return results

if __name__ == "__main__":
    results = run_steel_crawler()
    print(json.dumps(results, ensure_ascii=False, indent=2))
