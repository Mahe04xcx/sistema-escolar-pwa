// URL base del API. En producción (Render) queda vacío = misma origen.
// En desarrollo local se usa http://127.0.0.1:8000 vía .env.local
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
export default API_URL;
