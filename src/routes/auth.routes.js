const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../prisma");
const auth = require("../middlewares/auth");

const router = express.Router();
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /auth/register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body || {};

    if (!username || !email || !password) {
      return res.status(400).json({ erro: "username, email e password são obrigatórios." });
    }
    if (!emailRegex.test(email)) {
      return res.status(400).json({ erro: "E-mail inválido." });
    }
    if (password.length < 6) {
      return res.status(400).json({ erro: "A senha deve ter no mínimo 6 caracteres." });
    }

    const existente = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existente) {
      return res.status(409).json({ erro: "E-mail ou username já cadastrado." });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, email, password: hash },
      select: { id: true, username: true, email: true },
    });

    return res.status(201).json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: "Erro interno ao cadastrar usuário." });
  }
});

// POST /auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ erro: "email e password são obrigatórios." });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    // Mensagem genérica: não revela se foi o e-mail ou a senha
    const invalido = { erro: "Credenciais inválidas." };

    if (!user) return res.status(401).json(invalido);

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json(invalido);

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    return res.status(200).json({ token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: "Erro interno ao fazer login." });
  }
});

// GET /auth/me (protegida)
router.get("/me", auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, username: true, email: true },
    });
    if (!user) return res.status(404).json({ erro: "Usuário não encontrado." });
    return res.status(200).json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: "Erro interno." });
  }
});

module.exports = router;
