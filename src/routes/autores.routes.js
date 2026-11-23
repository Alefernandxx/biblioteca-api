const express = require("express");
const prisma = require("../prisma");
const auth = require("../middlewares/auth");

const router = express.Router();
router.use(auth);

// ---------- CRUD de Autores ----------

// GET /autores
router.get("/", async (req, res) => {
  try {
    const autores = await prisma.autor.findMany({ orderBy: { nome: "asc" } });
    res.status(200).json(autores);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao listar autores." });
  }
});

// GET /autores/:id
router.get("/:id", async (req, res) => {
  try {
    const autor = await prisma.autor.findUnique({ where: { id: req.params.id } });
    if (!autor) return res.status(404).json({ erro: "Autor não encontrado." });
    res.status(200).json(autor);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao buscar autor." });
  }
});

// POST /autores
router.post("/", async (req, res) => {
  try {
    const { nome, nacionalidade } = req.body || {};
    if (!nome) return res.status(400).json({ erro: "nome é obrigatório." });

    const autor = await prisma.autor.create({
      data: { nome, nacionalidade, userId: req.userId },
    });
    res.status(201).json(autor);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao criar autor." });
  }
});

// PUT /autores/:id
router.put("/:id", async (req, res) => {
  try {
    const { nome, nacionalidade } = req.body || {};
    if (!nome) return res.status(400).json({ erro: "nome é obrigatório." });

    const existente = await prisma.autor.findUnique({ where: { id: req.params.id } });
    if (!existente) return res.status(404).json({ erro: "Autor não encontrado." });
    if (existente.userId !== req.userId) {
      return res.status(403).json({ erro: "Você não tem permissão para alterar este registro." });
    }

    const autor = await prisma.autor.update({
      where: { id: req.params.id },
      data: { nome, nacionalidade },
    });
    res.status(200).json(autor);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao atualizar autor." });
  }
});

// DELETE /autores/:id
router.delete("/:id", async (req, res) => {
  try {
    const existente = await prisma.autor.findUnique({ where: { id: req.params.id } });
    if (!existente) return res.status(404).json({ erro: "Autor não encontrado." });
    if (existente.userId !== req.userId) {
      return res.status(403).json({ erro: "Você não tem permissão para remover este registro." });
    }

    await prisma.autor.delete({ where: { id: req.params.id } }); // pivô removida em cascata
    res.status(200).json({ mensagem: "Autor removido com sucesso." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao remover autor." });
  }
});

// ---------- N:N (lado do Autor) ----------

// GET /autores/:id/livros  -> lista os livros de um autor
router.get("/:id/livros", async (req, res) => {
  try {
    const autor = await prisma.autor.findUnique({
      where: { id: req.params.id },
      include: { livros: { include: { livro: true } } },
    });
    if (!autor) return res.status(404).json({ erro: "Autor não encontrado." });

    const livros = autor.livros.map((la) => ({ ...la.livro, papel: la.papel }));
    res.status(200).json(livros);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao listar livros do autor." });
  }
});

module.exports = router;
