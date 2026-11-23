const express = require("express");
const prisma = require("../prisma");
const auth = require("../middlewares/auth");

const router = express.Router();
router.use(auth);

// ---------- CRUD de Livros ----------

// GET /livros
router.get("/", async (req, res) => {
  try {
    const livros = await prisma.livro.findMany({
      include: { categoria: true },
      orderBy: { titulo: "asc" },
    });
    res.status(200).json(livros);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao listar livros." });
  }
});

// GET /livros/:id
router.get("/:id", async (req, res) => {
  try {
    const livro = await prisma.livro.findUnique({
      where: { id: req.params.id },
      include: { categoria: true },
    });
    if (!livro) return res.status(404).json({ erro: "Livro não encontrado." });
    res.status(200).json(livro);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao buscar livro." });
  }
});

// POST /livros
router.post("/", async (req, res) => {
  try {
    const { titulo, anoPublicacao, exemplares, categoriaId } = req.body || {};

    if (!titulo || !anoPublicacao || !categoriaId) {
      return res.status(400).json({ erro: "titulo, anoPublicacao e categoriaId são obrigatórios." });
    }
    if (!Number.isInteger(anoPublicacao) || (exemplares !== undefined && !Number.isInteger(exemplares))) {
      return res.status(400).json({ erro: "anoPublicacao e exemplares devem ser números inteiros." });
    }

    const categoria = await prisma.categoria.findUnique({ where: { id: categoriaId } });
    if (!categoria) return res.status(404).json({ erro: "Categoria não encontrada." });

    const livro = await prisma.livro.create({
      data: { titulo, anoPublicacao, exemplares, categoriaId, userId: req.userId },
    });
    res.status(201).json(livro);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao criar livro." });
  }
});

// PUT /livros/:id
router.put("/:id", async (req, res) => {
  try {
    const { titulo, anoPublicacao, exemplares, categoriaId } = req.body || {};

    const existente = await prisma.livro.findUnique({ where: { id: req.params.id } });
    if (!existente) return res.status(404).json({ erro: "Livro não encontrado." });
    if (existente.userId !== req.userId) {
      return res.status(403).json({ erro: "Você não tem permissão para alterar este registro." });
    }

    if (categoriaId) {
      const categoria = await prisma.categoria.findUnique({ where: { id: categoriaId } });
      if (!categoria) return res.status(404).json({ erro: "Categoria não encontrada." });
    }

    const livro = await prisma.livro.update({
      where: { id: req.params.id },
      data: { titulo, anoPublicacao, exemplares, categoriaId },
    });
    res.status(200).json(livro);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao atualizar livro." });
  }
});

// DELETE /livros/:id
router.delete("/:id", async (req, res) => {
  try {
    const existente = await prisma.livro.findUnique({ where: { id: req.params.id } });
    if (!existente) return res.status(404).json({ erro: "Livro não encontrado." });
    if (existente.userId !== req.userId) {
      return res.status(403).json({ erro: "Você não tem permissão para remover este registro." });
    }

    await prisma.livro.delete({ where: { id: req.params.id } }); // pivô removida em cascata
    res.status(200).json({ mensagem: "Livro removido com sucesso." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao remover livro." });
  }
});

// ---------- N:N (lado do Livro) ----------

// POST /livros/:id/autores/:idAutor  -> associa autor ao livro (body opcional: { papel })
router.post("/:id/autores/:idAutor", async (req, res) => {
  try {
    const { id, idAutor } = req.params;

    const livro = await prisma.livro.findUnique({ where: { id } });
    if (!livro) return res.status(404).json({ erro: "Livro não encontrado." });

    const autor = await prisma.autor.findUnique({ where: { id: idAutor } });
    if (!autor) return res.status(404).json({ erro: "Autor não encontrado." });

    const jaExiste = await prisma.livroAutor.findUnique({
      where: { livroId_autorId: { livroId: id, autorId: idAutor } },
    });
    if (jaExiste) return res.status(409).json({ erro: "Associação já existe." });

    const assoc = await prisma.livroAutor.create({
      data: { livroId: id, autorId: idAutor, papel: req.body?.papel },
    });
    res.status(201).json(assoc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao associar autor ao livro." });
  }
});

// GET /livros/:id/autores  -> lista autores de um livro
router.get("/:id/autores", async (req, res) => {
  try {
    const livro = await prisma.livro.findUnique({
      where: { id: req.params.id },
      include: { autores: { include: { autor: true } } },
    });
    if (!livro) return res.status(404).json({ erro: "Livro não encontrado." });

    const autores = livro.autores.map((la) => ({ ...la.autor, papel: la.papel }));
    res.status(200).json(autores);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao listar autores do livro." });
  }
});

// DELETE /livros/:id/autores/:idAutor  -> remove associação
router.delete("/:id/autores/:idAutor", async (req, res) => {
  try {
    const { id, idAutor } = req.params;

    const assoc = await prisma.livroAutor.findUnique({
      where: { livroId_autorId: { livroId: id, autorId: idAutor } },
    });
    if (!assoc) return res.status(404).json({ erro: "Associação não encontrada." });

    await prisma.livroAutor.delete({
      where: { livroId_autorId: { livroId: id, autorId: idAutor } },
    });
    res.status(200).json({ mensagem: "Associação removida com sucesso." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao remover associação." });
  }
});

module.exports = router;
