# app.py
# ============================================================
#  Finanza.ai – Backend (Flask)
#  Autor: (Lucas Almeida)
#  Objetivo: API financeira com fallback de DB, Auth JWT,
#  integração Gemini, e servidor do frontend.
# ============================================================

import os
import datetime
from functools import wraps

from flask import Flask, request, jsonify, render_template
from flask_cors import CORS

from dotenv import load_dotenv
load_dotenv()

import bcrypt
import jwt as pyjwt

# ------------------- Gemini -------------------
import google.generativeai as genai

# ------------------- MongoDB / MockDB -------------------
from pymongo import MongoClient
from pymongo.errors import PyMongoError


# ============================================================
# Config Flask
# ============================================================
app = Flask(__name__, template_folder="templates", static_folder="static")
CORS(app)

app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev_secret_key")


# ============================================================
#  DB FALLBACK SYSTEM
# ============================================================

class MockDB:
    """
    Banco de dados mockado em memória.
    Estrutura simples e resiliente para testes.
    """
    def __init__(self):
        self.users = []
        self.transactions = []


db = None
try:
    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
        raise Exception("No MONGO_URI found")

    client = MongoClient(mongo_uri, serverSelectionTimeoutMS=2000)
    client.server_info()   # Força tentativa de conexão

    db = client["finanza"]
except Exception:
    db = MockDB()


# ============================================================
#  Helpers gerais
# ============================================================

def create_jwt(user_id: str):
    payload = {
        "user_id": str(user_id),
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }
    token = pyjwt.encode(payload, app.config["SECRET_KEY"], algorithm="HS256")
    return token


def token_required(f):
    """
    Protege rotas que requerem autenticação.
    Lê o token do header "Authorization: Bearer <token>"
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", None)
        if not auth_header:
            return jsonify({"error": "Token missing"}), 401

        try:
            scheme, token = auth_header.split(" ")
            if scheme.lower() != "bearer":
                raise Exception()
        except Exception:
            return jsonify({"error": "Invalid auth header"}), 401

        try:
            decoded = pyjwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
            request.user_id = decoded["user_id"]
        except Exception:
            return jsonify({"error": "Invalid or expired token"}), 401
        
        return f(*args, **kwargs)
    return decorated


# ============================================================
#  ROTAS DE AUTENTICAÇÃO
# ============================================================

@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json()
    email = data.get("email", "").strip().lower()
    pwd = data.get("password", "").encode()
    
    if not email or not pwd:
        return jsonify({"error": "Missing credentials"}), 400

    hashed = bcrypt.hashpw(pwd, bcrypt.gensalt())

    # Mongo path
    if isinstance(db, MockDB):
        if next((u for u in db.users if u["email"] == email), None):
            return jsonify({"error": "Email already registered"}), 400

        new_user = {"_id": len(db.users) + 1, "email": email, "password": hashed}
        db.users.append(new_user)
        token = create_jwt(new_user["_id"])
        return jsonify({"token": token})

    else:
        # Mongo
        if db.users.find_one({"email": email}):
            return jsonify({"error": "Email already registered"}), 400
        
        res = db.users.insert_one({"email": email, "password": hashed})
        token = create_jwt(res.inserted_id)
        return jsonify({"token": token})


@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email", "").strip().lower()
    pwd = data.get("password", "").encode()

    if isinstance(db, MockDB):
        user = next((u for u in db.users if u["email"] == email), None)
        if not user or not bcrypt.checkpw(pwd, user["password"]):
            return jsonify({"error": "Invalid credentials"}), 401

        token = create_jwt(user["_id"])
        return jsonify({"token": token})

    else:
        user = db.users.find_one({"email": email})
        if not user or not bcrypt.checkpw(pwd, user["password"]):
            return jsonify({"error": "Invalid credentials"}), 401

        token = create_jwt(user["_id"])
        return jsonify({"token": token})


@app.route("/api/auth/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json()
    email = data.get("email", "").strip().lower()

    if not email:
        return jsonify({"error": "Email required"}), 400

    # Check if user exists
    user = None
    if isinstance(db, MockDB):
        user = next((u for u in db.users if u["email"] == email), None)
    else:
        user = db.users.find_one({"email": email})

    if not user:
        # Security: Don't reveal if user exists
        return jsonify({"message": "If email exists, code sent."})

    # Generate Code (Simple 6 digit)
    import random
    code = str(random.randint(100000, 999999))
    
    # Store Token (Mock or Mongo)
    # For simplicity, we will store in a separate collection 'reset_tokens'
    # Structure: { "email": email, "code": code, "exp": timestamp }
    exp_time = datetime.datetime.utcnow() + datetime.timedelta(minutes=15)
    
    token_doc = {
        "email": email,
        "code": code,
        "exp": exp_time
    }

    if isinstance(db, MockDB):
        # Initialize if not exists
        if not hasattr(db, 'reset_tokens'):
            db.reset_tokens = []
        # Remove old tokens for this email
        db.reset_tokens = [t for t in db.reset_tokens if t["email"] != email]
        db.reset_tokens.append(token_doc)
    else:
        db.reset_tokens.delete_many({"email": email})
        db.reset_tokens.insert_one(token_doc)

    # In a real app, send email here.
    # For this demo, we return the code in the response so the user can test it.
    print(f"RESET CODE FOR {email}: {code}")
    return jsonify({"message": "Code sent", "debug_code": code})


@app.route("/api/auth/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json()
    email = data.get("email", "").strip().lower()
    code = data.get("code", "").strip()
    new_pwd = data.get("new_password", "").encode()

    if not email or not code or not new_pwd:
        return jsonify({"error": "Missing fields"}), 400

    # Verify Token
    token_doc = None
    if isinstance(db, MockDB):
        if hasattr(db, 'reset_tokens'):
            token_doc = next((t for t in db.reset_tokens if t["email"] == email and t["code"] == code), None)
    else:
        token_doc = db.reset_tokens.find_one({"email": email, "code": code})

    if not token_doc:
        return jsonify({"error": "Invalid or expired code"}), 400

    if token_doc["exp"] < datetime.datetime.utcnow():
        return jsonify({"error": "Code expired"}), 400

    # Update Password
    hashed = bcrypt.hashpw(new_pwd, bcrypt.gensalt())

    if isinstance(db, MockDB):
        user = next((u for u in db.users if u["email"] == email), None)
        if user:
            user["password"] = hashed
            # Remove token
            db.reset_tokens = [t for t in db.reset_tokens if t["email"] != email]
    else:
        db.users.update_one({"email": email}, {"$set": {"password": hashed}})
        db.reset_tokens.delete_many({"email": email})

    return jsonify({"message": "Password updated successfully"})


# ============================================================
#  ROTAS DE NEGÓCIO
# ============================================================

@app.route("/api/transactions", methods=["GET"])
@token_required
def get_transactions():
    uid = request.user_id

    if isinstance(db, MockDB):
        tx = [t for t in db.transactions if str(t["user_id"]) == str(uid)]
        return jsonify(tx)

    else:
        tx = list(db.transactions.find({"user_id": uid}))
        for t in tx:
            t["_id"] = str(t["_id"])
        return jsonify(tx)


@app.route("/api/transactions", methods=["POST"])
@token_required
def post_transaction():
    uid = request.user_id
    data = request.get_json()

    tx = {
        "user_id": uid,
        "type": data.get("type"),     # "income" ou "expense"
        "amount": float(data.get("amount", 0)),
        "category": data.get("category", ""),
        "created_at": datetime.datetime.utcnow()
    }

    if isinstance(db, MockDB):
        tx["_id"] = len(db.transactions) + 1
        db.transactions.append(tx)
        return jsonify({"ok": True})

    else:
        db.transactions.insert_one(tx)
        return jsonify({"ok": True})


@app.route("/api/transactions/<tx_id>", methods=["DELETE"])
@token_required
def delete_transaction(tx_id):
    uid = request.user_id

    if isinstance(db, MockDB):
        # MockDB uses integer IDs mostly, but let's handle string comparison
        initial_len = len(db.transactions)
        db.transactions = [t for t in db.transactions if str(t.get("_id")) != str(tx_id) or str(t["user_id"]) != str(uid)]
        
        if len(db.transactions) == initial_len:
            return jsonify({"error": "Transaction not found"}), 404
            
        return jsonify({"ok": True})

    else:
        from bson.objectid import ObjectId
        try:
            res = db.transactions.delete_one({"_id": ObjectId(tx_id), "user_id": uid})
            if res.deleted_count == 0:
                return jsonify({"error": "Transaction not found"}), 404
            return jsonify({"ok": True})
        except Exception:
            return jsonify({"error": "Invalid ID"}), 400


@app.route("/api/transactions/<tx_id>", methods=["PUT"])
@token_required
def update_transaction(tx_id):
    uid = request.user_id
    data = request.get_json()

    update_fields = {}
    if "amount" in data:
        update_fields["amount"] = float(data["amount"])
    if "category" in data:
        update_fields["category"] = data["category"]
    if "type" in data:
        update_fields["type"] = data["type"]

    if not update_fields:
        return jsonify({"error": "No fields to update"}), 400

    if isinstance(db, MockDB):
        tx = next((t for t in db.transactions if str(t.get("_id")) == str(tx_id) and str(t["user_id"]) == str(uid)), None)
        if not tx:
            return jsonify({"error": "Transaction not found"}), 404
        
        tx.update(update_fields)
        return jsonify({"ok": True})

    else:
        from bson.objectid import ObjectId
        try:
            res = db.transactions.update_one(
                {"_id": ObjectId(tx_id), "user_id": uid},
                {"$set": update_fields}
            )
            if res.matched_count == 0:
                return jsonify({"error": "Transaction not found"}), 404
            return jsonify({"ok": True})
        except Exception:
            return jsonify({"error": "Invalid ID"}), 400


@app.route("/api/budgets", methods=["GET"])
@token_required
def get_budgets():
    uid = request.user_id

    if isinstance(db, MockDB):
        # Initialize budgets list if not exists
        if not hasattr(db, 'budgets'):
            db.budgets = []
        budgets = [b for b in db.budgets if str(b["user_id"]) == str(uid)]
        return jsonify(budgets)
    else:
        budgets = list(db.budgets.find({"user_id": uid}))
        for b in budgets:
            b["_id"] = str(b["_id"])
        return jsonify(budgets)


@app.route("/api/budgets", methods=["POST"])
@token_required
def create_budget():
    uid = request.user_id
    data = request.get_json()

    budget = {
        "user_id": uid,
        "category": data.get("category", ""),
        "limit": float(data.get("limit", 0)),
        "created_at": datetime.datetime.utcnow()
    }

    if isinstance(db, MockDB):
        if not hasattr(db, 'budgets'):
            db.budgets = []
        budget["_id"] = len(db.budgets) + 1
        db.budgets.append(budget)
        return jsonify({"ok": True, "budget": budget})
    else:
        result = db.budgets.insert_one(budget)
        budget["_id"] = str(result.inserted_id)
        return jsonify({"ok": True, "budget": budget})


@app.route("/api/budgets/<category>", methods=["PUT"])
@token_required
def update_budget(category):
    uid = request.user_id
    data = request.get_json()
    new_limit = float(data.get("limit", 0))

    if isinstance(db, MockDB):
        if not hasattr(db, 'budgets'):
            db.budgets = []
        budget = next((b for b in db.budgets if str(b["user_id"]) == str(uid) and b["category"] == category), None)
        if not budget:
            return jsonify({"error": "Budget not found"}), 404
        budget["limit"] = new_limit
        return jsonify({"ok": True})
    else:
        result = db.budgets.update_one(
            {"user_id": uid, "category": category},
            {"$set": {"limit": new_limit}}
        )
        if result.matched_count == 0:
            return jsonify({"error": "Budget not found"}), 404
        return jsonify({"ok": True})


@app.route("/api/budgets/<category>", methods=["DELETE"])
@token_required
def delete_budget(category):
    uid = request.user_id

    if isinstance(db, MockDB):
        if not hasattr(db, 'budgets'):
            db.budgets = []
        initial_len = len(db.budgets)
        db.budgets = [b for b in db.budgets if not (str(b["user_id"]) == str(uid) and b["category"] == category)]
        if len(db.budgets) == initial_len:
            return jsonify({"error": "Budget not found"}), 404
        return jsonify({"ok": True})
    else:
        result = db.budgets.delete_one({"user_id": uid, "category": category})
        if result.deleted_count == 0:
            return jsonify({"error": "Budget not found"}), 404
        return jsonify({"ok": True})


@app.route("/api/user/balance", methods=["GET"])
@token_required
def get_balance():
    uid = request.user_id

    if isinstance(db, MockDB):
        txs = [t for t in db.transactions if str(t["user_id"]) == str(uid)]
    else:
        txs = list(db.transactions.find({"user_id": uid}))

    income = sum(t["amount"] for t in txs if t["type"] == "income")
    expense = sum(t["amount"] for t in txs if t["type"] == "expense")

    return jsonify({"balance": income - expense})


# ============================================================
#  Gemini – Chat Financeiro
# ============================================================

@app.route("/api/chat", methods=["POST"])
@token_required
def chat():
    uid = request.user_id
    data = request.get_json()
    user_msg = data.get("message", "")

    # pega ultimas transacoes
    if isinstance(db, MockDB):
        txs = [t for t in db.transactions if str(t["user_id"]) == str(uid)]
        txs = sorted(txs, key=lambda x: x["created_at"], reverse=True)[:20]
    else:
        txs = list(db.transactions.find({"user_id": uid}).sort("created_at", -1).limit(20))

    # monta contexto
    fin_data = "\n".join([f"{t['type']}: {t['amount']} ({t.get('category','')})" for t in txs])

    system_prompt = f"""
Você é Finanza, consultor de Economia Comportamental.
Seu papel: ajudar a pessoa a gerir melhor seu dinheiro, com empatia,
clareza e estratégia. Use linguagem simples e amigável.

Dados das últimas transações:
{fin_data}
"""

    try:
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        model = genai.GenerativeModel("gemini-2.5-flash")

        response = model.generate_content(
            system_prompt + "\n\nUsuário: " + user_msg
        )
        answer = response.text
    except Exception as e:
        return jsonify({"error": "AI unavailable", "detail": str(e)}), 503

    return jsonify({"reply": answer})


# ============================================================
#  Frontend
# ============================================================

@app.route("/")
def index():
    return render_template("index.html")


# ============================================================
# Main
# ============================================================
if __name__ == "__main__":
    # Use environment variable for debug mode (default: False for production)
    debug_mode = os.getenv("FLASK_DEBUG", "False").lower() == "true"
    app.run(debug=debug_mode)
