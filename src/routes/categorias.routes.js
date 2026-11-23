const express = require("express");
const prisma = require("../prisma");
const auth = require("../middlewares/auth");

const router = express.Router();
router.use(auth);

// GET /categorias
router.get("/", async (req, res) => {
  try {
    const categorias = await prisma.categoria.findMany({ orderBy: { nome: "asc" } });
    res.status(200).json(categorias);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao listar categorias." });
  }
});

// GET /categorias/:id
router.get("/:id", async (req, res) => {
  try {
    const categoria = await prisma.categoria.findUnique({
      where: { id: req.params.id },
      include: { livros: true },
    });
    if (!categoria) return res.status(404).json({ erro: "Categoria não encontrada." });
    res.status(200).json(categoria);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao buscar categoria." });
  }
});

// POST /categorias
router.post("/", async (req, res) => {
  try {
    const { nome } = req.body || {};
    if (!nome) return res.status(400).json({ erro: "nome é obrigatório." });

    const categoria = await prisma.categoria.create({ data: { nome, userId: req.userId } });
    res.status(201).json(categoria);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao criar categoria." });
  }
});

// PUT /categorias/:id
router.put("/:id", async (req, res) => {
  try {
    const { nome } = req.body || {};
    if (!nome) return res.status(400).json({ erro: "nome é obrigatório." });

    const existente = await prisma.categoria.findUnique({ where: { id: req.params.id } });
    if (!existente) return res.status(404).json({ erro: "Categoria não encontrada." });
    if (existente.userId !== req.userId) {
      return res.status(403).json({ erro: "Você não tem permissão para alterar este registro." });
    }

    const categoria = await prisma.categoria.update({ where: { id: req.params.id }, data: { nome } });
    res.status(200).json(categoria);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao atualizar categoria." });
  }
});

// DELETE /categorias/:id
router.delete("/:id", async (req, res) => {
  try {
    const existente = await prisma.categoria.findUnique({ where: { id: req.params.id } });
    if (!existente) return res.status(404).json({ erro: "Categoria não encontrada." });
    if (existente.userId !== req.userId) {
      return res.status(403).json({ erro: "Você não tem permissão para remover este registro." });
    }

    await prisma.categoria.delete({ where: { id: req.params.id } });
    res.status(200).json({ mensagem: "Categoria removida com sucesso." });
  } catch (err) {
    if (err.code === "P2003") {
      return res.status(409).json({ erro: "Categoria possui livros vinculados e não pode ser removida." });
    }
    console.error(err);
    res.status(500).json({ erro: "Erro ao remover categoria." });
  }
});

module.exports = router;
