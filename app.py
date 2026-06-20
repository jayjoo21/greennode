import os, io, random, base64, sqlite3
from datetime import datetime, timedelta
from flask import Flask, render_template, request, jsonify, url_for

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = os.path.join(BASE_DIR, "uploads")
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024
ALLOWED = {"png", "jpg", "jpeg", "gif", "webp"}

DB_PATH = os.path.join(BASE_DIR, "greennnode.db")

# ═══════════════════════════════════════════════════════════════
# MOCK DATA — replace every section marked # MOCK with real data
# ═══════════════════════════════════════════════════════════════

MOCK_AI_BASE = {               # MOCK — real model inference (TF / ONNX)
    "disease":    "Pepper__bacterial_spot",
    "confidence": 91.0,
    "label_kr":   "세균점무늬병",
}
MOCK_SENSOR_BASE = {           # MOCK — real ADC / I2C sensor read
    "moisture": 327,
}
MOCK_ALERTS = [                # MOCK — replace with DB (SQLite / Postgres)
    {"id":1,"level":"critical","title":"세균점무늬병 감지",  "desc":"신뢰도 88.5%로 병해가 감지되었습니다.", "time":"16:03","date":"2026-06-19","type":"disease","read":False},
    {"id":2,"level":"warning", "title":"토양 수분 낮음",    "desc":"ADC 327 — 관수가 필요합니다.",          "time":"15:47","date":"2026-06-19","type":"water",  "read":False},
    {"id":3,"level":"info",    "title":"자동 관수 완료",    "desc":"5초간 관수가 완료되었습니다.",           "time":"15:34","date":"2026-06-19","type":"system", "read":True },
    {"id":4,"level":"warning", "title":"토양 수분 낮음",    "desc":"ADC 298 — 건조 상태입니다.",             "time":"09:15","date":"2026-06-19","type":"water",  "read":True },
    {"id":5,"level":"critical","title":"세균점무늬병 의심", "desc":"신뢰도 72.3%로 병해가 의심됩니다.",     "time":"08:42","date":"2026-06-18","type":"disease","read":True },
    {"id":6,"level":"info",    "title":"센서 연결 확인",    "desc":"토양 센서가 정상 연결되었습니다.",       "time":"07:00","date":"2026-06-18","type":"system", "read":True },
]
MOCK_SETTINGS = {              # MOCK — replace with config file / DB
    "dry_threshold":         300,
    "wet_threshold":         700,
    "pump_healthy_duration": 5,
    "pump_disease_duration": 2,
    "auto_irrigation":       True,
    "confidence_threshold":  60,
}
diagnosis_history = [          # MOCK — replace with DB query
    {
        "date":   (datetime.now() - timedelta(hours=h)).strftime("%Y-%m-%d"),
        "time":   (datetime.now() - timedelta(hours=h)).strftime("%H:%M"),
        "plant":  "고추",
        "result": r, "conf": c, "action": a, "level": l,
    }
    for h, r, c, a, l in [
        (2,  "세균점무늬병", 88.5, "관수 절수 처리", "critical"),
        (6,  "정상",         40.2, "정상 관수",       "normal"),
        (26, "세균점무늬병", 72.3, "관수 중단",       "warning"),
        (50, "세균점무늬병", 65.1, "관수 절수 처리",  "warning"),
        (74, "정상",         35.8, "정상 관수",       "normal"),
    ]
]
pump_state = {"on": False}

# ═══════════════════════════════════════════════════════════════


# ── SQLite helpers ────────────────────────────────────────────────────────────

def get_db():
    db = sqlite3.connect(DB_PATH, timeout=10)
    db.execute("PRAGMA journal_mode=WAL")  # safe for multiple gunicorn workers
    db.row_factory = sqlite3.Row
    return db


def _row_to_dict(row):
    """Convert an irrigation_log row to the display dict the templates/API expect."""
    try:
        dt = datetime.strptime(row["watered_at"], "%Y-%m-%d %H:%M:%S")
    except ValueError:
        dt = datetime.strptime(row["watered_at"], "%Y-%m-%d %H:%M")
    return {
        "time":             dt.strftime("%m/%d %H:%M"),
        "duration":         row["duration"],
        "reason":           row["reason"],
        "moisture_before":  row["moisture_before"],
        "moisture_after":   row["moisture_after"],
    }


def get_last_watered():
    db = get_db()
    row = db.execute("SELECT MAX(watered_at) AS lw FROM irrigation_log").fetchone()
    db.close()
    lw = row["lw"] if row else None
    if not lw:
        return "기록 없음"
    try:
        return datetime.strptime(lw, "%Y-%m-%d %H:%M:%S").strftime("%Y-%m-%d %H:%M")
    except ValueError:
        return lw


def get_irrigation_history(limit=5):
    db = get_db()
    rows = db.execute(
        "SELECT * FROM irrigation_log ORDER BY watered_at DESC LIMIT ?", (limit,)
    ).fetchall()
    db.close()
    return [_row_to_dict(r) for r in rows]


def init_db():
    db = get_db()
    db.execute("""
        CREATE TABLE IF NOT EXISTS irrigation_log (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            watered_at      TEXT    NOT NULL,
            duration        INTEGER NOT NULL,
            reason          TEXT    NOT NULL,
            moisture_before INTEGER,
            moisture_after  INTEGER
        )
    """)
    db.commit()

    if db.execute("SELECT COUNT(*) FROM irrigation_log").fetchone()[0] == 0:
        now = datetime.now()
        seeds = [
            (1,  5, "정상 + 건조",      302, 580),
            (5,  2, "병해 감지 + 건조", 285, 420),
            (10, 5, "정상 + 건조",      290, 600),
            (18, 0, "습함 — 관수 없음", 750, 750),
            (23, 5, "정상 + 건조",      310, 590),
        ]
        db.executemany(
            "INSERT INTO irrigation_log (watered_at, duration, reason, moisture_before, moisture_after)"
            " VALUES (?,?,?,?,?)",
            [
                ((now - timedelta(hours=h)).strftime("%Y-%m-%d %H:%M:%S"), d, r, mb, ma)
                for h, d, r, mb, ma in seeds
            ],
        )
        db.commit()
    db.close()


try:
    init_db()
except Exception as _e:
    print(f"[WARN] init_db failed: {_e}", flush=True)
os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
os.makedirs(os.path.join(BASE_DIR, "static", "qr"), exist_ok=True)
# ─────────────────────────────────────────────────────────────────────────────


def allowed(fn): return "." in fn and fn.rsplit(".", 1)[1].lower() in ALLOWED
def moisture_status(v):
    return "dry" if v < 300 else "normal" if v < 700 else "wet"
def severity_label(c):
    return "normal" if c < 60 else "caution" if c <= 85 else "critical"
def decide_irrigation(ai, m):
    s = moisture_status(m)
    healthy = ai["confidence"] < MOCK_SETTINGS["confidence_threshold"] or "healthy" in ai["disease"].lower()
    if s == "wet":  return {"pump": False, "duration": 0,                                        "reason": "습함 — 관수 없음"}
    if healthy:     return {"pump": True,  "duration": MOCK_SETTINGS["pump_healthy_duration"],   "reason": "정상 + 건조"}
    return                 {"pump": True,  "duration": MOCK_SETTINGS["pump_disease_duration"],   "reason": "병해 감지 + 건조"}

def gen_moisture(count, start=520):
    """Realistic moisture simulation: gradual decline, irrigation spike every ~8 steps."""
    vals, v = [], start
    for i in range(count):
        if i % 8 == 0 and i > 0:
            v = min(1023, v + random.randint(180, 320))
        v = max(50, v - random.randint(8, 28) + random.randint(0, 8))
        vals.append(max(0, min(1023, round(v))))
    return vals


@app.context_processor
def inject_globals():
    return {
        "unread_count": sum(1 for a in MOCK_ALERTS if not a["read"]),
        "now": datetime.now(),
    }


# ── Pages ────────────────────────────────────────────────────────────────────
@app.route("/")
def index():
    return render_template("index.html", page="dashboard")

@app.route("/analytics")
def analytics():
    return render_template("analytics.html", page="analytics")

@app.route("/history")
def history():
    return render_template("history.html", page="history",
        irrigation_history=get_irrigation_history(limit=100),
        diagnosis_history=diagnosis_history)

@app.route("/settings")
def settings():
    return render_template("settings.html", page="settings", settings=MOCK_SETTINGS)

@app.route("/alerts")
def alerts():
    return render_template("alerts.html", page="alerts", alerts=MOCK_ALERTS)


# ── API ──────────────────────────────────────────────────────────────────────
@app.route("/api/sensor")
def api_sensor():
    # MOCK DATA — replace with real sensor reads
    m   = max(0, min(1023, MOCK_SENSOR_BASE["moisture"] + random.randint(-25, 25)))
    c   = MOCK_AI_BASE["confidence"]
    return jsonify(
        moisture=m, moisture_pct=round(m / 1023 * 100, 1),
        moisture_status=moisture_status(m),
        disease=MOCK_AI_BASE["disease"], confidence=c,
        label_kr=MOCK_AI_BASE["label_kr"], severity=severity_label(c),
        pump_on=pump_state["on"], last_watered=get_last_watered(),
    )

@app.route("/api/history/moisture")
def api_moisture_history():
    # MOCK DATA — replace with time-series DB query
    now, v, pts = datetime.now(), 520, []
    for i in range(24, 0, -1):
        if i % 8 == 0: v = min(1023, v + random.randint(180, 300))
        v = max(50, v - random.randint(8, 25))
        pts.append({"time": (now - timedelta(hours=i)).strftime("%H:%M"), "value": max(0, min(1023, v))})
    return jsonify(pts)

@app.route("/api/analytics")
def api_analytics():
    # MOCK DATA — replace with real analytics query
    r, now = request.args.get("range", "24h"), datetime.now()
    if r == "24h":
        labels = [(now - timedelta(hours=i)).strftime("%H:%M") for i in range(23, -1, -1)]
        moisture = gen_moisture(24, 520)
        irr = [1 if i % 8 == 0 and i > 0 else 0 for i in range(24)]
    elif r == "7d":
        labels = [(now - timedelta(days=i)).strftime("%m/%d") for i in range(6, -1, -1)]
        moisture = gen_moisture(7, 480)
        irr = [random.randint(1, 3) for _ in range(7)]
    else:
        labels = [(now - timedelta(days=i)).strftime("%m/%d") for i in range(29, -1, -1)]
        moisture = gen_moisture(30, 500)
        irr = [random.randint(0, 4) for _ in range(30)]
    avg = round(sum(moisture) / len(moisture) / 1023 * 100)
    return jsonify(
        labels=labels, moisture=moisture, irrigation=irr,
        disease_labels=["정상", "세균점무늬병"],
        disease_values=[55, 45],
        summary={"avg_moisture": avg, "total_irrigations": sum(1 for x in irr if x > 0),
                 "top_disease": "세균점무늬병", "avg_interval": 8},
    )

@app.route("/api/calendar")
def api_calendar():
    # MOCK DATA — replace with DB query for real events
    events = {
        **{str(d): {"irrigation": True, "disease": False} for d in [1,4,7,13,16,19,22,25,28]},
        **{str(d): {"irrigation": False,"disease": True}  for d in [5, 12, 20]},
        "10": {"irrigation": True, "disease": True},
    }
    return jsonify(events=events,
                   year=int(request.args.get("year", datetime.now().year)),
                   month=int(request.args.get("month", datetime.now().month)))

@app.route("/api/irrigate", methods=["POST"])
def api_irrigate():
    # MOCK DATA — replace with live reads
    m = max(0, min(1023, MOCK_SENSOR_BASE["moisture"] + random.randint(-25, 25)))
    d = decide_irrigation(MOCK_AI_BASE, m)
    if d["pump"]:
        pump_state["on"] = True
        db = get_db()
        db.execute(
            "INSERT INTO irrigation_log (watered_at, duration, reason, moisture_before, moisture_after)"
            " VALUES (?,?,?,?,?)",
            (
                datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                d["duration"], d["reason"],
                m, min(1023, m + random.randint(180, 280)),
            ),
        )
        db.commit()
        db.close()
    return jsonify(decision=d, last_watered=get_last_watered(),
                   history=get_irrigation_history())

@app.route("/api/irrigation/history")
def api_irr_history():
    return jsonify(get_irrigation_history())

@app.route("/api/upload", methods=["POST"])
def api_upload():
    if "file" not in request.files: return jsonify(error="파일이 없습니다"), 400
    f = request.files["file"]
    if not f.filename or not allowed(f.filename): return jsonify(error="지원하지 않는 형식"), 400
    f.save(os.path.join(app.config["UPLOAD_FOLDER"],
           f"leaf_{datetime.now().strftime('%Y%m%d_%H%M%S')}{os.path.splitext(f.filename)[1]}"))
    # MOCK DATA — replace with real model inference
    c = MOCK_AI_BASE["confidence"]
    return jsonify(disease=MOCK_AI_BASE["disease"], confidence=c,
                   label_kr=MOCK_AI_BASE["label_kr"], severity=severity_label(c))

@app.route("/api/qrcode")
def api_qrcode():
    try:
        import qrcode
        url = request.host_url.rstrip("/")
        buf = io.BytesIO()
        qrcode.make(url).save(buf, format="PNG")
        b64 = base64.b64encode(buf.getvalue()).decode()
        return jsonify(qr=f"data:image/png;base64,{b64}", url=url)
    except ImportError:
        return jsonify(error="pip install qrcode pillow"), 500

@app.route("/api/alerts")
def api_alerts_list():
    return jsonify(MOCK_ALERTS)

@app.route("/api/alerts/unread-count")
def api_unread():
    return jsonify(count=sum(1 for a in MOCK_ALERTS if not a["read"]))

@app.route("/api/alerts/<int:aid>/read", methods=["POST"])
def api_alert_read(aid):
    for a in MOCK_ALERTS:
        if a["id"] == aid: a["read"] = True; break
    return jsonify(ok=True, unread=sum(1 for a in MOCK_ALERTS if not a["read"]))

@app.route("/api/alerts/read-all", methods=["POST"])
def api_read_all():
    for a in MOCK_ALERTS: a["read"] = True
    return jsonify(ok=True, unread=0)

@app.route("/api/settings", methods=["GET", "POST"])
def api_settings():
    if request.method == "POST":
        data = request.get_json() or {}
        MOCK_SETTINGS.update({k: v for k, v in data.items() if k in MOCK_SETTINGS})
        return jsonify(ok=True, settings=MOCK_SETTINGS)
    return jsonify(MOCK_SETTINGS)


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
