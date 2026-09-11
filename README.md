# frontend-delivery

Simulacro de coordinación de eventos entre un Administrador y sus deliverys.

- Login sin contraseña: entrás con un botón ("Entrar como administrador",
  "Entrar como Juan", "Entrar como Ana", "Entrar como María").
- El Administrador crea eventos (lugar + fecha/hora, nota y cupo opcionales).
- Cada delivery ve los eventos abiertos y se anota / desanota.
- El Administrador ve en vivo quién se anotó a cada evento (se refresca solo
  cada 4 segundos, igual que otros proyectos del monorepo).

Backend: módulo `delivery` en el backend compartido de SaasPro
(`saasproback.onrender.com`), ya commiteado y con su migración aplicada.

## Desarrollo local

```
npm install
npm run dev
```

Por defecto apunta a `https://saasproback.onrender.com`. Para apuntar a un
backend local, copiá `.env.example` a `.env` y poné
`VITE_API_BASE_URL=http://localhost:3000`.

## Deploy

Automático: cualquier push a `main` dispara el GitHub Action
(`.github/workflows/deploy.yml`) que publica en GitHub Pages.

⚠️ Si el repo de GitHub termina con un nombre distinto a `frontend-delivery`,
hay que ajustar el `base` en `vite.config.ts` para que coincida con
`https://<usuario>.github.io/<repo>/`.
