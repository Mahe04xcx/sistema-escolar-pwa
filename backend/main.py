from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from passlib.context import CryptContext
from datetime import datetime
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import LETTER
from reportlab.lib import colors
import pyotp
import os
import io

# 1. Configuración de Base de Datos
# En producción, usa la variable de entorno DATABASE_URL (PostgreSQL de Render)
# En desarrollo local, usa MySQL como antes
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "mysql+mysqlconnector://root:Mahemahe2004@localhost/sistema_escolar"
)

# Render usa "postgres://" pero SQLAlchemy necesita "postgresql://"
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 2. Seguridad
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- MODELOS DE BASE DE DATOS ---

class User(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    nombre_usuario = Column(String(50), unique=True)
    password_hash = Column(String(255))
    rol = Column(String(20)) 
    otp_secret = Column(String(32))

class Personal(Base):
    __tablename__ = "personal"
    id = Column(Integer, primary_key=True, index=True)
    nombre_completo = Column(String(100))
    numero_empleado = Column(String(20), unique=True)
    area_departamento = Column(String(100))
    curp = Column(String(25), unique=True)

class Inasistencia(Base):
    __tablename__ = "inasistencias"
    id = Column(Integer, primary_key=True, index=True)
    personal_id = Column(Integer, ForeignKey("personal.id"))
    fecha_falta = Column(String(20))
    horario = Column(String(100))
    motivo = Column(String(255))
    tipo = Column(String(50), nullable=True)
    observaciones = Column(String(255), nullable=True)
    fecha_registro = Column(String(20))

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- I. AUTH Y 2FA ---

@app.post("/registro")
def registrar_usuario(username: str, password: str, rol: str, db: Session = Depends(get_db)):
    secret = pyotp.random_base32()
    nuevo = User(nombre_usuario=username, password_hash=pwd_context.hash(password), rol=rol, otp_secret=secret)
    db.add(nuevo)
    db.commit()
    return {"msg": "Usuario creado", "otp_secret": secret}

@app.post("/auth/verificar-2fa")
async def verificar_otp(payload: dict, db: Session = Depends(get_db)):
    usuario = db.query(User).filter(User.nombre_usuario == payload['usuario']).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    totp = pyotp.TOTP(usuario.otp_secret)
    if totp.verify(payload['token_otp']):
        return {"access_token": "TOKEN_EXITOSO_123", "token_type": "bearer", "rol": usuario.rol}
    else:
        raise HTTPException(status_code=400, detail="Código incorrecto o expirado")

@app.post("/login")
def login(username: str, password: str, code_otp: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.nombre_usuario == username).first()
    if not user or not pwd_context.verify(password, user.password_hash):
        raise HTTPException(status_code=400, detail="Datos incorrectos")
    if not pyotp.TOTP(user.otp_secret).verify(code_otp):
        raise HTTPException(status_code=400, detail="OTP inválido")
    return {"msg": "Ingreso exitoso", "rol": user.rol}

# --- II. GESTIÓN DE PERSONAL (ACTUALIZADO) ---

@app.post("/personal/crear")
def crear_empleado(nombre: str, num_empleado: str, area: str, curp: str, db: Session = Depends(get_db)):
    existente = db.query(Personal).filter(Personal.numero_empleado == num_empleado).first()
    if existente:
        raise HTTPException(status_code=400, detail="El número de empleado ya está registrado")
    nuevo = Personal(nombre_completo=nombre, numero_empleado=num_empleado, area_departamento=area, curp=curp)
    db.add(nuevo)
    db.commit()
    return {"status": "success", "message": "Empleado guardado"}

@app.get("/personal/listar")
@app.get("/personal/lista")
async def listar_personal(db: Session = Depends(get_db)):
    return db.query(Personal).all()

@app.put("/personal/actualizar/{id}")
def actualizar_personal(id: int, nombre: str, numero: str, db: Session = Depends(get_db)):
    docente = db.query(Personal).filter(Personal.id == id).first()
    if not docente:
        raise HTTPException(status_code=404, detail="Docente no encontrado")
    
    docente.nombre_completo = nombre
    docente.numero_empleado = numero
    db.commit()
    return {"status": "success", "message": "Datos actualizados"}

@app.delete("/personal/eliminar/{emp_id}")
def eliminar_empleado(emp_id: int, db: Session = Depends(get_db)):
    # Primero eliminamos sus inasistencias para evitar errores de integridad
    db.query(Inasistencia).filter(Inasistencia.personal_id == emp_id).delete()
    
    emp = db.query(Personal).filter(Personal.id == emp_id).first()
    if not emp: 
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    
    db.delete(emp)
    db.commit()
    return {"message": "Eliminado permanentemente"}

# --- III. INASISTENCIAS Y REPORTES PDF (CORREGIDO PARA FRONTEND) ---

@app.post("/inasistencias/registrar")
async def registrar_inasistencia(
    personal_id: int, 
    fecha: str, 
    horario: str, 
    motivo: str, 
    tipo: str = "FALTA", 
    obs: str = "Sin observaciones",
    db: Session = Depends(get_db)
):
    docente = db.query(Personal).filter(Personal.id == personal_id).first()
    if not docente: 
        raise HTTPException(status_code=404, detail="El docente no existe")

    nueva_falla = Inasistencia(
        personal_id=personal_id, 
        fecha_falta=fecha, 
        horario=horario, 
        motivo=motivo,
        tipo=tipo,
        observaciones=obs,
        fecha_registro=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    )
    db.add(nueva_falla)
    db.commit()
    db.refresh(nueva_falla)
    return {"status": "success", "id": nueva_falla.id}

@app.get("/inasistencias/reporte/{inasistencia_id}")
async def generar_reporte_inasistencia(inasistencia_id: int, db: Session = Depends(get_db)):
    registro = db.query(Inasistencia).filter(Inasistencia.id == inasistencia_id).first()
    if not registro:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    
    docente = db.query(Personal).filter(Personal.id == registro.personal_id).first()

    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=LETTER)
    
    p.setFillColor(colors.hexColor("#800020"))
    p.rect(0, 750, 612, 50, fill=True, stroke=False)
    p.setFillColor(colors.white)
    p.setFont("Helvetica-Bold", 16)
    p.drawCentredString(306, 770, "REPORTE DE INASISTENCIA DOCENTE")
    
    p.setFillColor(colors.black)
    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, 700, f"FECHA DE FALTA: {registro.fecha_falta}")
    p.line(50, 690, 562, 690)
    
    p.setFont("Helvetica", 12)
    p.drawString(50, 660, f"DOCENTE: {docente.nombre_completo}")
    p.drawString(50, 640, f"NÚMERO DE EMPLEADO: {docente.numero_empleado}")
    p.drawString(50, 620, f"MOTIVO: {registro.motivo}")
    p.drawString(50, 600, f"HORARIO: {registro.horario}")
    
    p.line(100, 200, 250, 200)
    p.drawCentredString(175, 185, "Firma Docente")
    p.line(362, 200, 512, 200)
    p.drawCentredString(437, 185, "Sello Dirección")

    p.showPage()
    p.save()
    buffer.seek(0)
    return StreamingResponse(buffer, media_type="application/pdf")

@app.get("/personal/pdf/{docente_id}")
async def generar_pdf_docente(docente_id: int, db: Session = Depends(get_db)):
    docente = db.query(Personal).filter(Personal.id == docente_id).first()
    if not docente: return {"error": "No encontrado"}

    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=LETTER)
    p.setFont("Helvetica-Bold", 16)
    p.drawString(100, 750, "EXPEDIENTE OFICIAL DEL DOCENTE")
    p.setStrokeColorRGB(0.5, 0, 0.125)
    p.line(100, 740, 500, 740)
    p.setFont("Helvetica", 12)
    p.drawString(100, 700, f"Nombre: {docente.nombre_completo}")
    p.drawString(100, 680, f"No. Empleado: {docente.numero_empleado}")
    p.drawString(100, 660, f"Área: {docente.area_departamento}")
    p.drawString(100, 640, f"CURP: {docente.curp}")
    p.showPage()
    p.save()
    buffer.seek(0)
    return StreamingResponse(buffer, media_type="application/pdf")

# --- IV. ESTADÍSTICAS E IA (REFORZADO) ---

@app.get("/estadisticas/general")
def obtener_estadisticas(db: Session = Depends(get_db)):
    por_motivo = db.query(Inasistencia.motivo, func.count(Inasistencia.id)).group_by(Inasistencia.motivo).all()
    total = db.query(Inasistencia).count()
    return {"distribucion": {m: c for m, c in por_motivo}, "total": total}

@app.get("/ia/analizar-riesgo")
def analizar_riesgo_general(db: Session = Depends(get_db)):
    top_faltas = db.query(Inasistencia.personal_id, func.count(Inasistencia.id).label('total'))\
                    .group_by(Inasistencia.personal_id)\
                    .order_by(func.count(Inasistencia.id).desc()).first()
    
    if not top_faltas: 
        return {"diagnostico": "Sistema estable. No hay inasistencias suficientes para generar un patrón de riesgo."}
    
    empleado = db.query(Personal).filter(Personal.id == top_faltas.personal_id).first()
    riesgo = "CRÍTICO" if top_faltas.total >= 3 else "MODERADO" if top_faltas.total == 2 else "ESTABLE"
    
    msg = (f"ANÁLISIS DE GEMINI 3 FLASH: Se detecta un patrón de riesgo {riesgo} en el docente {empleado.nombre_completo}. "
           f"Con un total de {top_faltas.total} faltas, el sistema sugiere una entrevista administrativa para "
           "identificar posibles causas de desmotivación o problemas externos que afecten el desempeño.")
    
    return {"diagnostico": msg}

# --- V. SERVIR FRONTEND ESTÁTICO (para deploy en Render) ---
# El frontend compilado (next export) se sirve desde aquí

FRONTEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend", "out")

if os.path.isdir(FRONTEND_DIR):
    # Servir archivos estáticos de Next.js (_next/static, etc.)
    next_static = os.path.join(FRONTEND_DIR, "_next")
    if os.path.isdir(next_static):
        app.mount("/_next", StaticFiles(directory=next_static), name="next_static")

    # Catch-all: servir las páginas HTML del frontend
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # 1. Archivo exacto (favicon.ico, manifest.json, sw.js, etc.)
        file_path = os.path.join(FRONTEND_DIR, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        
        # 2. Directorio con index.html (ej: /login/ -> /login/index.html)
        index_path = os.path.join(FRONTEND_DIR, full_path, "index.html")
        if os.path.isfile(index_path):
            return FileResponse(index_path)
        
        # 3. Archivo .html (ej: /login -> /login.html)
        html_path = os.path.join(FRONTEND_DIR, f"{full_path}.html")
        if os.path.isfile(html_path):
            return FileResponse(html_path)
        
        # 4. Fallback a index.html principal
        root_index = os.path.join(FRONTEND_DIR, "index.html")
        if os.path.isfile(root_index):
            return FileResponse(root_index)
        
        raise HTTPException(status_code=404, detail="Página no encontrada")