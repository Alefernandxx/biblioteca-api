# API Biblioteca — Trabalho do 2º Trimestre (DWEB 1)

API REST com **Node.js + Express**, **PostgreSQL (Neon)**, **Prisma 7.10.0**, **JWT** e **bcrypt**.

## Modelo de dados (5 tabelas)
- `users` — 1:N com categorias, livros e autores
- `categorias` — 1:N com livros
- `livros` — N:N com autores
- `autores` — N:N com livros
- `livros_autores` — tabela associativa (chave composta + campos `papel` e `criadoEm`)

## Como rodar
1. `npm install`
2. Copie `.env.example` para `.env` e preencha `DATABASE_URL` (Neon), `JWT_SECRET` e `PORT`
3. `npx prisma migrate dev --name init`
4. `npx prisma generate`
5. `npm run dev`

## Rotas
| Método | Rota | Proteção |
|---|---|---|
| POST | /auth/register | pública |
| POST | /auth/login | pública |
| GET | /auth/me | JWT |
| GET/POST | /categorias, /livros, /autores | JWT |
| GET/PUT/DELETE | /categorias/:id, /livros/:id, /autores/:id | JWT (PUT/DELETE só do dono → 403) |
| POST | /livros/:id/autores/:idAutor | JWT |
| GET | /livros/:id/autores | JWT |
| GET | /autores/:id/livros | JWT |
| DELETE | /livros/:id/autores/:idAutor | JWT |

Exemplos prontos em `requests.http`.
