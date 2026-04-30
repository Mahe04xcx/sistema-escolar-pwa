import bcrypt
import pyotp
from main import SessionLocal, User

def crear_administrador(usuario, password):
    db = SessionLocal()
    
    # 1. Generar secreto para 2FA
    secret = pyotp.random_base32()
    
    # 2. Encriptar contraseña de forma directa (soluciona el error de passlib)
    # Convertimos la contraseña a bytes
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_pw = bcrypt.hashpw(password_bytes, salt).decode('utf-8')
    
    nuevo_usuario = User(
        nombre_usuario=usuario,
        password_hash=hashed_pw,
        rol="admin",
        otp_secret=secret
    )
    
    try:
        # Verificar si ya existe para no duplicar
        existe = db.query(User).filter(User.nombre_usuario == usuario).first()
        if existe:
            print(f"ERROR: El usuario '{usuario}' ya está registrado.")
            return

        db.add(nuevo_usuario)
        db.commit()
        print(f"\n" + "="*30)
        print(f"¡USUARIO CREADO CON ÉXITO!")
        print(f"="*30)
        print(f"Usuario: {usuario}")
        print(f"Secret Key 2FA: {secret}")
        print(f"Instrucción: Escanea este Secret o ingrésalo en Google Authenticator.")
        print(f"="*30)
    except Exception as e:
        db.rollback()
        print(f"Error inesperado: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    u = input("Nombre de usuario/correo: ")
    p = input("Contraseña: ")
    crear_administrador(u, p)