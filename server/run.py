from app import create_app

app = create_app()

if __name__ == "__main__":
    print("🚀 Starting LightMap Server...")
    print("Dashboard available at http://127.0.0.1:5000")
    app.run(host="0.0.0.0", port=5003, debug=True, use_reloader=False)
