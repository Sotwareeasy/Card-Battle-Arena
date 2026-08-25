<div align="center">

<img src="public/favicon.svg" width="72" height="72" alt="Card Battle Arena logo" />

# ⚡ CARD BATTLE ARENA
### *Harry Potter Edition*

**Un juego de cartas por turnos construido 100% con JavaScript Vanilla y Web Components — sin frameworks, sin magia oculta.**

<br />

[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Web Components](https://img.shields.io/badge/Web%20Components-Native-29ABE2?style=for-the-badge&logo=webcomponents.org&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/Web_components)
[![JSON Server](https://img.shields.io/badge/JSON%20Server-REST%20API-black?style=for-the-badge)](https://github.com/typicode/json-server)
[![Railway](https://img.shields.io/badge/Deploy-Railway-0B0D0E?style=for-the-badge&logo=railway&logoColor=white)](https://railway.app/)

[![Status](https://img.shields.io/badge/status-en%20desarrollo-yellow?style=flat-square)]()
[![Proyecto](https://img.shields.io/badge/tipo-proyecto%20académico-8A2BE2?style=flat-square)]()
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)]()

<br />

<img src="public/hogwarts-bg.png" width="100%" alt="Hogwarts Arena banner" />

</div>

<br />

## 📖 Tabla de contenidos

- [✨ Sobre el proyecto](#-sobre-el-proyecto)
- [🎮 Características](#-características)
- [🃏 El elenco](#-el-elenco)
- [⚔️ Cómo funciona una batalla](#️-cómo-funciona-una-batalla)
- [🏗️ Arquitectura](#️-arquitectura)
- [📂 Estructura del proyecto](#-estructura-del-proyecto)
- [🚀 Empezando](#-empezando)
- [🔐 Variables de entorno](#-variables-de-entorno)
- [☁️ Despliegue en Railway](#️-despliegue-en-railway)
- [🗺️ Roadmap](#️-roadmap)
- [👤 Autor](#-autor)

<br />

## ✨ Sobre el proyecto

**Card Battle Arena** es un juego de cartas coleccionables inspirado en el universo de Harry Potter, desarrollado como proyecto académico con un objetivo claro: demostrar dominio de **JavaScript puro** — sin React, sin Vue, sin ningún framework — usando la especificación nativa de **Web Components** (`customElements`, Shadow-less DOM encapsulation, eventos personalizados) para construir una interfaz reactiva, modular y mantenible.

El jugador se registra, arma un mazo de 5 cartas, y se enfrenta a una **IA controlada por la máquina** en batallas por turnos con hechizos de ataque, defensa y un movimiento especial desbloqueable. Los resultados se persisten en un backend REST (`json-server`) y alimentan un leaderboard global.

<br />

## 🎮 Características

| | |
|---|---|
| 🔐 **Autenticación de jugadores** | Registro y login con contraseña, sesión persistente en memoria de la partida |
| 🛡️ **Panel administrativo** | CRUD completo de cartas protegido por login de administrador |
| 🃏 **20 cartas únicas** | Cada una con 4 ataques, 1 defensa y 1 hechizo especial con cooldown |
| 🤖 **IA rival** | La máquina arma su mazo y decide sus acciones de forma autónoma cada turno |
| 🏆 **Leaderboard global** | Ranking de jugadores por puntos, victorias y partidas jugadas |
| 🎨 **Diseño temático** | Tipografías *Cinzel* y *Crimson Text*, paleta oscura, cursor de varita personalizado |
| 🔊 **Sonidos ambientados** | Efectos de sonido para ataques, defensas, hechizos especiales y derrotas |
| ☁️ **Listo para producción** | Configurado para desplegar frontend + API como servicios independientes en Railway, con persistencia en volumen |

<br />

## 🃏 El elenco

<div align="center">

| Personaje | Rol | Personaje | Rol |
|---|---|---|---|
| ⚡ Harry Potter | Wizard | 🐍 Lord Voldemort | Dark Wizard |
| 📚 Hermione Granger | Student | 🦇 Bellatrix Lestrange | Dark Wizard |
| 🧡 Ron Weasley | Wizard | 🐉 Draco Malfoy | Wizard |
| 🧙 Albus Dumbledore | Professor | 🐍 Lucius Malfoy | Dark Wizard |
| 🖤 Severus Snape | Professor | 🧦 Dobby | Magical Being |
| 🐱 Minerva McGonagall | Professor | 👻 Dementor | Creature |
| 🐺 Sirius Black | Auror | 🐍 Basilisco | Creature |
| 🪓 Rubeus Hagrid | Magical Being | 🔥 Fawkes | Creature |
| 🌕 Remus Lupin | Professor | 🌙 Luna Lovegood | Student |
| 🌿 Neville Longbottom | Wizard | 🕯️ Gellert Grindelwald | Dark Wizard |

</div>

Cada carta tiene **250 HP**, 4 hechizos de ataque con daño escalonado (20 → 50), un hechizo de defensa que reduce el daño recibido en un **50%**, y un hechizo especial de alto impacto que se desbloquea en el turno 2 y entra en cooldown tras usarse.

<br />

## ⚔️ Cómo funciona una batalla

```
┌─────────────────────────────────────────────────┐
│  1. Registro / Login  →  2. Selección de mazo    │
│              (5 cartas de 20 disponibles)         │
└─────────────────────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │   Turno aleatorio inicial      │
        │   (jugador o máquina)          │
        └───────────────────────────────┘
                        │
          ┌─────────────┴─────────────┐
          ▼                           ▼
  ⚔️ Atacar (4 hechizos)      🛡️ Defender (Protego)
          │                           │
          └─────────────┬─────────────┘
                        ▼
          ✨ Especial (desde turno 2, con cooldown)
                        │
                        ▼
        Carta a 0 HP → entra la siguiente del mazo
                        │
                        ▼
          Mazo rival agotado → 🏆 Victoria / 💀 Derrota
                        │
                        ▼
        Puntos + estadísticas guardados en el backend
```

El motor de batalla (`battleEngine.js`) es un módulo de **funciones puras**, sin acceso a DOM ni a `fetch` — recibe el estado actual, aplica las reglas del juego, y devuelve el nuevo estado. Esto permite testearlo de forma aislada y mantener la lógica de negocio completamente desacoplada de la interfaz.

<br />

## 🏗️ Arquitectura

- **Frontend:** [Vite](https://vitejs.dev/) + JavaScript Vanilla, construido enteramente sobre **Web Components nativos** (`class extends HTMLElement` + `customElements.define`). Cada componente gestiona su propio estado, renderizado y ciclo de eventos mediante `CustomEvent` con `bubbles: true`, comunicándose hacia arriba sin necesidad de un state manager externo.
- **Backend:** [`json-server`](https://github.com/typicode/json-server) expone un CRUD REST completo sobre un archivo JSON (`jugadores`, `cartas`, `batallas`, `administradores`), consumido desde una capa de API centralizada (`src/api/`) que estandariza el manejo de errores HTTP.
- **Persistencia:** en producción, el archivo de datos vive en un **volumen persistente de Railway**, independiente del ciclo de vida efímero del contenedor.

<br />

## 📂 Estructura del proyecto

```
Card-Battle-Arena/
├── public/                    # Assets estáticos (imágenes de cartas, sonidos, fondo)
├── src/
│   ├── api/                   # Capa de acceso a la API REST (una función por recurso)
│   │   ├── apiConfig.js       #   → helper fetch centralizado + resolución de entorno
│   │   ├── playersApi.js
│   │   ├── adminsApi.js
│   │   ├── cardsApi.js
│   │   └── battlesApi.js
│   ├── components/
│   │   ├── app/                # Componente raíz (game-app) — orquesta las pantallas
│   │   ├── auth/                # Registro, login de jugador y login de admin
│   │   ├── battle/               # Arena de batalla, controles, cartas en juego
│   │   ├── deck/                 # Selector de mazo
│   │   ├── cards/                 # Panel CRUD de administración de cartas
│   │   └── leaderboard/            # Ranking global
│   ├── utils/
│   │   ├── battleEngine.js      # Motor de batalla (funciones puras)
│   │   ├── machineAI.js         # Lógica de decisión de la máquina
│   │   ├── validators.js        # Validaciones reutilizables (nickname, password...)
│   │   └── random.js
│   ├── data/
│   │   ├── db.example.json      # Semilla de datos (versionada)
│   │   └── db.json              # Base de datos real (ignorada por git)
│   └── app.js                  # Entry point — registra todos los Web Components
├── .env.example
├── package.json
└── README.md
```

<br />

## 🚀 Empezando

### Requisitos previos
- [Node.js](https://nodejs.org/) 18+
- npm

### Instalación

```bash
git clone <url-del-repo>
cd Card-Battle-Arena
npm install
cp .env.example .env
```

### Levantar el proyecto en desarrollo

Se necesitan **dos procesos corriendo en paralelo**, en dos terminales distintas:

```bash
# Terminal 1 — API REST (json-server)
npm run server
```

```bash
# Terminal 2 — Frontend (Vite)
npm run dev
```

La API queda disponible en `http://localhost:3000` y el frontend en la URL que indique Vite (por defecto `http://localhost:5173`).

<br />

## 🔐 Variables de entorno

| Variable | Descripción | Ejemplo |
|---|---|---|
| `VITE_API_MODE` | Entorno activo: `development` o `production` | `development` |
| `VITE_API_DEV_URL` | URL del `json-server` local | `http://localhost:3000` |
| `VITE_API_PROD_URL` | URL de la API en producción (Railway) | `https://api-hogwarts.up.railway.app` |

> ⚠️ Estas variables se "hornean" en el bundle **en tiempo de build** (comportamiento estándar de Vite) — deben estar definidas *antes* de correr `npm run build`.

<br />

## ☁️ Despliegue en Railway

El proyecto está pensado para desplegarse como **dos servicios independientes** dentro de un mismo proyecto de Railway, ambos apuntando al mismo repositorio:

<div align="center">

| Servicio | Root Directory | Build Command | Start Command | Extra |
|---|---|---|---|---|
| 🗄️ **API** | `Card-Battle-Arena` | `npm install` | `npm run start:api` | Volumen montado en `/data` + `DB_PATH=/data/db.json` |
| 🎨 **Frontend** | `Card-Battle-Arena` | `npm install && npm run build` | `npm run start:web` | `VITE_API_MODE=production` + `VITE_API_PROD_URL=<url del servicio API>` |

</div>

El volumen persistente es lo que garantiza que los datos (jugadores, puntajes, historial de batallas) **sobrevivan a cada redeploy** — sin él, `json-server` perdería toda la información al reiniciarse el contenedor.

<br />

## 🗺️ Roadmap

- [x] Registro de jugadores
- [x] Selección de mazo y batalla por turnos
- [x] IA de la máquina
- [x] Leaderboard global
- [x] Panel administrativo (CRUD de cartas)
- [x] Autenticación con contraseña + login/logout de jugadores
- [x] Persistencia en Railway con volumen
- [ ] Historial de batallas por jugador
- [ ] Modo multijugador en tiempo real

<br />

## 👤 Autor

Proyecto académico desarrollado con 🪄 por **Felipe**.

<div align="center">

*"It is our choices, Harry, that show what we truly are, far more than our abilities."* — Albus Dumbledore

</div>
