import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import bcrypt from "bcrypt";
import { db } from "./db";
import { eq, and, or, desc, asc } from "drizzle-orm";
import { usuarios, partes, imoveis, parcelas, alugueis, condominios, arquivos, configuracoes } from "@shared/schema";
import { authMiddleware, requireProprietario, generateToken, type AuthRequest } from "./middleware/auth";
import { upload, validateFiles } from "./middleware/upload";
import type { Usuario, Parte, Imovel, Parcela, Aluguel, Condominio, Arquivo } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, senha } = req.body;

      if (!email || !senha) {
        return res.status(400).send("Email e senha são obrigatórios");
      }

      const usuario = await db.select().from(usuarios).where(eq(usuarios.email, email)).then(rows => rows[0]);

      if (!usuario) {
        return res.status(401).send("Credenciais inválidas");
      }

      const senhaValida = await bcrypt.compare(senha, usuario.senha);
      if (!senhaValida) {
        return res.status(401).send("Credenciais inválidas");
      }

      const token = generateToken(usuario);

      const { senha: _, ...usuarioSemSenha } = usuario;
      res.json({ usuario: usuarioSemSenha, token });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.patch("/api/auth/senha", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { senhaAtual, novaSenha } = req.body;

      if (!senhaAtual || !novaSenha) {
        return res.status(400).send("Senha atual e nova senha são obrigatórias");
      }

      if (novaSenha.length < 6) {
        return res.status(400).send("Nova senha deve ter no mínimo 6 caracteres");
      }

      const usuario = await db.select().from(usuarios).where(eq(usuarios.id, req.usuario!.id)).then(rows => rows[0]);

      if (!usuario) {
        return res.status(404).send("Usuário não encontrado");
      }

      const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha);
      if (!senhaValida) {
        return res.status(401).send("Senha atual incorreta");
      }

      const novaSenhaHash = await bcrypt.hash(novaSenha, 10);
      await db.update(usuarios).set({ senha: novaSenhaHash }).where(eq(usuarios.id, usuario.id));

      res.json({ message: "Senha alterada com sucesso" });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/partes", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const result = await db.select().from(partes).orderBy(desc(partes.id));
      res.json(result);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/partes", authMiddleware, requireProprietario, upload.array("arquivos", 3), async (req: AuthRequest, res) => {
    try {
      const { tipo, nome, email, telefone, rg, orgaoEmissor, cpf } = req.body;

      if (!tipo || !nome || !email || !cpf) {
        return res.status(400).send("Campos obrigatórios faltando");
      }

      const files = req.files as Express.Multer.File[];
      if (files && files.length > 0) {
        const validation = validateFiles(files, {
          maxCount: 3,
          maxSizeMB: 5,
          allowedTypes: ["pdf", "zip", "jpeg", "jpg", "png", "doc", "docx", "rtf"],
        });

        if (validation) {
          return res.status(400).send(validation);
        }
      }

      const emailExistente = await db.select().from(usuarios).where(eq(usuarios.email, email)).then(rows => rows[0]);
      if (emailExistente) {
        return res.status(400).send("Já existe um usuário com este email");
      }

      const [parte] = await db.insert(partes).values({
        tipo,
        nome,
        email,
        telefone: telefone || null,
        rg: rg || null,
        orgao_emissor: orgaoEmissor || null,
        cpf,
      }).returning();

      const senhaInicial = "senha123";
      const hashedSenha = await bcrypt.hash(senhaInicial, 10);
      await db.insert(usuarios).values({
        email,
        senha: hashedSenha,
        nome,
        papel: tipo,
        parte_id: parte.id,
      });

      if (files && files.length > 0) {
        for (const file of files) {
          await db.insert(arquivos).values({
            nome_original: file.originalname,
            caminho: file.path,
            mime: file.mimetype,
            tamanho: file.size,
            entidade: "parte",
            entidade_id: parte.id,
            tipo: "anexo",
          });
        }
      }

      res.json(parte);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.patch("/api/partes/:id", authMiddleware, requireProprietario, upload.array("arquivos", 3), async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { tipo, nome, email, telefone, rg, orgaoEmissor, cpf } = req.body;

      const updateData: any = {};

      if (tipo) updateData.tipo = tipo;
      if (nome) updateData.nome = nome;
      if (email) updateData.email = email;
      if (telefone !== undefined) updateData.telefone = telefone || null;
      if (rg !== undefined) updateData.rg = rg || null;
      if (orgaoEmissor !== undefined) updateData.orgao_emissor = orgaoEmissor || null;
      if (cpf) updateData.cpf = cpf;

      if (Object.keys(updateData).length > 0) {
        await db.update(partes).set(updateData).where(eq(partes.id, parseInt(id)));
      }

      const files = req.files as Express.Multer.File[];
      if (files && files.length > 0) {
        const validation = validateFiles(files, {
          maxCount: 3,
          maxSizeMB: 5,
          allowedTypes: ["pdf", "zip", "jpeg", "jpg", "png", "doc", "docx", "rtf"],
        });

        if (validation) {
          return res.status(400).send(validation);
        }

        for (const file of files) {
          await db.insert(arquivos).values({
            nome_original: file.originalname,
            caminho: file.path,
            mime: file.mimetype,
            tamanho: file.size,
            entidade: "parte",
            entidade_id: parseInt(id),
            tipo: "anexo",
          });
        }
      }

      const parte = await db.select().from(partes).where(eq(partes.id, parseInt(id))).then(rows => rows[0]);
      res.json(parte);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.delete("/api/partes/:id", authMiddleware, requireProprietario, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      await db.delete(partes).where(eq(partes.id, parseInt(id)));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/imovel", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const imovel = await db.select().from(imoveis).limit(1).then(rows => rows[0]);
      res.json(imovel || null);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/imovel", authMiddleware, requireProprietario, upload.fields([
    { name: "contrato", maxCount: 1 },
    { name: "fotoCapa", maxCount: 1 },
    { name: "anexos", maxCount: 10 }
  ]), async (req: AuthRequest, res) => {
    try {
      const existingImovel = await db.select().from(imoveis).then(rows => rows[0]);
      if (existingImovel) {
        return res.status(400).send("Já existe um imóvel cadastrado. O sistema permite apenas um imóvel.");
      }

      const { nome, endereco, valor_imovel, valor_aluguel } = req.body;

      if (!nome || !endereco || !valor_imovel || !valor_aluguel) {
        return res.status(400).send("Campos obrigatórios faltando");
      }

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      let contratoId: number | null = null;
      let fotoCapaId: number | null = null;

      if (files.contrato && files.contrato.length > 0) {
        const validation = validateFiles(files.contrato, {
          maxCount: 1,
          maxSizeMB: 10,
          allowedTypes: ["pdf", "doc", "docx", "rtf"],
        });
        if (validation) return res.status(400).send(validation);
      }

      if (files.fotoCapa && files.fotoCapa.length > 0) {
        const validation = validateFiles(files.fotoCapa, {
          maxCount: 1,
          maxSizeMB: 10,
          allowedTypes: ["jpeg", "jpg", "png"],
        });
        if (validation) return res.status(400).send(validation);
      }

      if (files.anexos && files.anexos.length > 0) {
        const validation = validateFiles(files.anexos, {
          maxCount: 10,
          maxSizeMB: 20,
          allowedTypes: ["pdf", "zip", "jpeg", "jpg", "png", "doc", "docx", "rtf"],
        });
        if (validation) return res.status(400).send(validation);
      }

      const [imovel] = await db.insert(imoveis).values({
        nome,
        endereco,
        valor_imovel: valor_imovel.toString(),
        valor_aluguel: valor_aluguel.toString(),
      }).returning();

      if (files.contrato && files.contrato[0]) {
        const file = files.contrato[0];
        const [arquivo] = await db.insert(arquivos).values({
          nome_original: file.originalname,
          caminho: file.path,
          mime: file.mimetype,
          tamanho: file.size,
          entidade: "imovel",
          entidade_id: imovel.id,
          tipo: "contrato",
        }).returning();
        contratoId = arquivo.id;
      }

      if (files.fotoCapa && files.fotoCapa[0]) {
        const file = files.fotoCapa[0];
        const [arquivo] = await db.insert(arquivos).values({
          nome_original: file.originalname,
          caminho: file.path,
          mime: file.mimetype,
          tamanho: file.size,
          entidade: "imovel",
          entidade_id: imovel.id,
          tipo: "foto_capa",
        }).returning();
        fotoCapaId = arquivo.id;
      }

      if (files.anexos && files.anexos.length > 0) {
        for (const file of files.anexos) {
          await db.insert(arquivos).values({
            nome_original: file.originalname,
            caminho: file.path,
            mime: file.mimetype,
            tamanho: file.size,
            entidade: "imovel",
            entidade_id: imovel.id,
            tipo: "anexo",
          });
        }
      }

      if (contratoId || fotoCapaId) {
        const updateData: any = {};
        if (contratoId) updateData.contrato_arquivo_id = contratoId;
        if (fotoCapaId) updateData.foto_capa_id = fotoCapaId;
        await db.update(imoveis).set(updateData).where(eq(imoveis.id, imovel.id));
      }

      const updatedImovel = await db.select().from(imoveis).where(eq(imoveis.id, imovel.id)).then(rows => rows[0]);
      res.json(updatedImovel);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.patch("/api/imovel", authMiddleware, requireProprietario, upload.fields([
    { name: "contrato", maxCount: 1 },
    { name: "fotoCapa", maxCount: 1 },
    { name: "anexos", maxCount: 10 }
  ]), async (req: AuthRequest, res) => {
    try {
      const imovel = await db.select().from(imoveis).limit(1).then(rows => rows[0]);
      if (!imovel) {
        return res.status(404).send("Imóvel não encontrado");
      }

      const { nome, endereco, valor_imovel, valor_aluguel } = req.body;

      const updateData: any = {};

      if (nome) updateData.nome = nome;
      if (endereco) updateData.endereco = endereco;
      if (valor_imovel) updateData.valor_imovel = valor_imovel.toString();
      if (valor_aluguel) updateData.valor_aluguel = valor_aluguel.toString();

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      if (files.contrato && files.contrato[0]) {
        const validation = validateFiles(files.contrato, {
          maxCount: 1,
          maxSizeMB: 10,
          allowedTypes: ["pdf", "doc", "docx", "rtf"],
        });
        if (validation) return res.status(400).send(validation);

        const file = files.contrato[0];
        const [arquivo] = await db.insert(arquivos).values({
          nome_original: file.originalname,
          caminho: file.path,
          mime: file.mimetype,
          tamanho: file.size,
          entidade: "imovel",
          entidade_id: imovel.id,
          tipo: "contrato",
        }).returning();
        updateData.contrato_arquivo_id = arquivo.id;
      }

      if (files.fotoCapa && files.fotoCapa[0]) {
        const validation = validateFiles(files.fotoCapa, {
          maxCount: 1,
          maxSizeMB: 10,
          allowedTypes: ["jpeg", "jpg", "png"],
        });
        if (validation) return res.status(400).send(validation);

        const file = files.fotoCapa[0];
        const [arquivo] = await db.insert(arquivos).values({
          nome_original: file.originalname,
          caminho: file.path,
          mime: file.mimetype,
          tamanho: file.size,
          entidade: "imovel",
          entidade_id: imovel.id,
          tipo: "foto_capa",
        }).returning();
        updateData.foto_capa_id = arquivo.id;
      }

      if (files.anexos && files.anexos.length > 0) {
        const validation = validateFiles(files.anexos, {
          maxCount: 10,
          maxSizeMB: 20,
          allowedTypes: ["pdf", "zip", "jpeg", "jpg", "png", "doc", "docx", "rtf"],
        });
        if (validation) return res.status(400).send(validation);

        for (const file of files.anexos) {
          await db.insert(arquivos).values({
            nome_original: file.originalname,
            caminho: file.path,
            mime: file.mimetype,
            tamanho: file.size,
            entidade: "imovel",
            entidade_id: imovel.id,
            tipo: "anexo",
          });
        }
      }

      if (Object.keys(updateData).length > 0) {
        await db.update(imoveis).set(updateData).where(eq(imoveis.id, imovel.id));
      }

      const updatedImovel = await db.select().from(imoveis).where(eq(imoveis.id, imovel.id)).then(rows => rows[0]);
      res.json(updatedImovel);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/parcelas", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const result = await db.select().from(parcelas).orderBy(asc(parcelas.numero));
      res.json(result);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/parcelas", authMiddleware, upload.single("comprovante"), async (req: AuthRequest, res) => {
    try {
      const imovel = await db.select().from(imoveis).limit(1).then(rows => rows[0]);
      if (!imovel) {
        return res.status(400).send("É necessário cadastrar um imóvel primeiro");
      }

      const { valor } = req.body;
      if (!valor) {
        return res.status(400).send("Valor é obrigatório");
      }

      const lastParcela = await db
        .select()
        .from(parcelas)
        .where(eq(parcelas.imovel_id, imovel.id))
        .orderBy(desc(parcelas.numero))
        .limit(1)
        .then(rows => rows[0]);

      let numero = 1;
      let vencimento: Date;

      if (lastParcela) {
        numero = lastParcela.numero + 1;
        const lastVencimento = new Date(lastParcela.vencimento);
        vencimento = new Date(lastVencimento);
        vencimento.setMonth(vencimento.getMonth() + 1);
        vencimento.setDate(15);
      } else {
        vencimento = new Date();
        vencimento.setMonth(vencimento.getMonth() + 1);
        vencimento.setDate(15);
      }

      const [parcela] = await db.insert(parcelas).values({
        imovel_id: imovel.id,
        numero,
        vencimento,
        valor: valor.toString(),
      }).returning();

      if (req.file) {
        const validation = validateFiles([req.file], {
          maxCount: 1,
          maxSizeMB: 2,
          allowedTypes: ["pdf", "jpg", "jpeg", "png"],
        });
        if (validation) return res.status(400).send(validation);

        const [arquivo] = await db.insert(arquivos).values({
          nome_original: req.file.originalname,
          caminho: req.file.path,
          mime: req.file.mimetype,
          tamanho: req.file.size,
          entidade: "parcela",
          entidade_id: parcela.id,
          tipo: "comprovante",
        }).returning();
        
        await db.update(parcelas).set({ comprovante_id: arquivo.id }).where(eq(parcelas.id, parcela.id));
      }

      const finalParcela = await db.select().from(parcelas).where(eq(parcelas.id, parcela.id)).then(rows => rows[0]);
      res.json(finalParcela);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.patch("/api/parcelas/:id", authMiddleware, requireProprietario, upload.single("comprovante"), async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { status, pagoEm } = req.body;

      const updateData: any = {};

      if (status !== undefined) {
        updateData.status = status;
        if (status === 'pago') {
          updateData.pago_em = new Date();
        } else {
          updateData.pago_em = null;
        }
      }
      if (pagoEm !== undefined) updateData.pago_em = pagoEm ? new Date(pagoEm) : null;

      if (req.file) {
        const validation = validateFiles([req.file], {
          maxCount: 1,
          maxSizeMB: 2,
          allowedTypes: ["pdf", "jpg", "jpeg", "png"],
        });
        if (validation) return res.status(400).send(validation);

        const [arquivo] = await db.insert(arquivos).values({
          nome_original: req.file.originalname,
          caminho: req.file.path,
          mime: req.file.mimetype,
          tamanho: req.file.size,
          entidade: "parcela",
          entidade_id: parseInt(id),
          tipo: "comprovante",
        }).returning();
        
        updateData.comprovante_id = arquivo.id;
      }

      if (Object.keys(updateData).length > 0) {
        await db.update(parcelas).set(updateData).where(eq(parcelas.id, parseInt(id)));
      }

      const parcela = await db.select().from(parcelas).where(eq(parcelas.id, parseInt(id))).then(rows => rows[0]);
      res.json(parcela);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/alugueis", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const result = await db.select().from(alugueis).orderBy(desc(alugueis.ano), desc(alugueis.mes));
      res.json(result);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/alugueis", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const imovel = await db.select().from(imoveis).limit(1).then(rows => rows[0]);
      if (!imovel) {
        return res.status(400).send("É necessário cadastrar um imóvel primeiro");
      }

      const lastAluguel = await db
        .select()
        .from(alugueis)
        .where(eq(alugueis.imovel_id, imovel.id))
        .orderBy(desc(alugueis.ano), desc(alugueis.mes))
        .limit(1)
        .then(rows => rows[0]);

      let mes = 1;
      let ano = new Date().getFullYear();

      if (lastAluguel) {
        mes = lastAluguel.mes + 1;
        ano = lastAluguel.ano;
        if (mes > 12) {
          mes = 1;
          ano++;
        }
      }

      const [aluguel] = await db.insert(alugueis).values({
        imovel_id: imovel.id,
        mes,
        ano,
        valor: imovel.valor_aluguel,
      }).returning();

      res.json(aluguel);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.patch("/api/alugueis/:id", authMiddleware, requireProprietario, upload.single("comprovante"), async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { status, pagoEm } = req.body;

      const updateData: any = {};

      if (status !== undefined) {
        updateData.status = status;
        if (status === 'pago') {
          updateData.pago_em = new Date();
        } else {
          updateData.pago_em = null;
        }
      }
      if (pagoEm !== undefined) updateData.pago_em = pagoEm ? new Date(pagoEm) : null;

      if (req.file) {
        const validation = validateFiles([req.file], {
          maxCount: 1,
          maxSizeMB: 2,
          allowedTypes: ["pdf", "jpg", "jpeg", "png"],
        });
        if (validation) return res.status(400).send(validation);

        const [arquivo] = await db.insert(arquivos).values({
          nome_original: req.file.originalname,
          caminho: req.file.path,
          mime: req.file.mimetype,
          tamanho: req.file.size,
          entidade: "aluguel",
          entidade_id: parseInt(id),
          tipo: "comprovante",
        }).returning();
        
        updateData.comprovante_id = arquivo.id;
      }

      if (Object.keys(updateData).length > 0) {
        await db.update(alugueis).set(updateData).where(eq(alugueis.id, parseInt(id)));
      }

      const aluguel = await db.select().from(alugueis).where(eq(alugueis.id, parseInt(id))).then(rows => rows[0]);
      res.json(aluguel);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/condominios", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const result = await db.select().from(condominios).orderBy(desc(condominios.ano), desc(condominios.mes));
      res.json(result);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/condominios", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const imovel = await db.select().from(imoveis).limit(1).then(rows => rows[0]);
      if (!imovel) {
        return res.status(400).send("É necessário cadastrar um imóvel primeiro");
      }

      const { valor } = req.body;
      if (!valor) {
        return res.status(400).send("Valor é obrigatório");
      }

      const lastCondominio = await db
        .select()
        .from(condominios)
        .where(eq(condominios.imovel_id, imovel.id))
        .orderBy(desc(condominios.ano), desc(condominios.mes))
        .limit(1)
        .then(rows => rows[0]);

      let mes = 1;
      let ano = new Date().getFullYear();

      if (lastCondominio) {
        mes = lastCondominio.mes + 1;
        ano = lastCondominio.ano;
        if (mes > 12) {
          mes = 1;
          ano++;
        }
      }

      const [condominio] = await db.insert(condominios).values({
        imovel_id: imovel.id,
        mes,
        ano,
        valor: valor.toString(),
      }).returning();

      res.json(condominio);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.patch("/api/condominios/:id", authMiddleware, requireProprietario, upload.single("comprovante"), async (req: AuthRequest, res) => {
    try {
      const { id} = req.params;
      const { status, pagoEm } = req.body;

      const updateData: any = {};

      if (status !== undefined) {
        updateData.status = status;
        if (status === 'pago') {
          updateData.pago_em = new Date();
        } else {
          updateData.pago_em = null;
        }
      }
      if (pagoEm !== undefined) updateData.pago_em = pagoEm ? new Date(pagoEm) : null;

      if (req.file) {
        const validation = validateFiles([req.file], {
          maxCount: 1,
          maxSizeMB: 2,
          allowedTypes: ["pdf", "jpg", "jpeg", "png"],
        });
        if (validation) return res.status(400).send(validation);

        const [arquivo] = await db.insert(arquivos).values({
          nome_original: req.file.originalname,
          caminho: req.file.path,
          mime: req.file.mimetype,
          tamanho: req.file.size,
          entidade: "condominio",
          entidade_id: parseInt(id),
          tipo: "comprovante",
        }).returning();
        
        updateData.comprovante_id = arquivo.id;
      }

      if (Object.keys(updateData).length > 0) {
        await db.update(condominios).set(updateData).where(eq(condominios.id, parseInt(id)));
      }

      const condominio = await db.select().from(condominios).where(eq(condominios.id, parseInt(id))).then(rows => rows[0]);
      res.json(condominio);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/dashboard/stats", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const todasParcelas = await db.select().from(parcelas);
      
      const totalParcelas = todasParcelas.length;
      const parcelasPagas = todasParcelas.filter(p => p.status === 'pago').length;
      const parcelasPendentes = totalParcelas - parcelasPagas;
      const valorTotalParcelas = todasParcelas.reduce((sum, p) => sum + parseFloat(p.valor), 0);
      const valorPago = todasParcelas.filter(p => p.status === 'pago').reduce((sum, p) => sum + parseFloat(p.valor), 0);

      const proximoVencimentoParcela = todasParcelas
        .filter(p => p.status !== 'pago')
        .sort((a, b) => new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime())[0];

      const ultimas5Parcelas = todasParcelas.slice(-5).map(p => ({
        numero: p.numero,
        valor: parseFloat(p.valor),
        vencimento: p.vencimento,
        status: p.status,
      }));

      const mesAtual = new Date().getMonth() + 1;
      const anoAtual = new Date().getFullYear();

      const aluguelMesAtual = await db
        .select()
        .from(alugueis)
        .where(and(eq(alugueis.mes, mesAtual), eq(alugueis.ano, anoAtual)))
        .limit(1)
        .then(rows => rows[0]);

      const condominioMesAtual = await db
        .select()
        .from(condominios)
        .where(and(eq(condominios.mes, mesAtual), eq(condominios.ano, anoAtual)))
        .limit(1)
        .then(rows => rows[0]);

      res.json({
        totalParcelas,
        parcelasPagas,
        parcelasPendentes,
        valorTotalParcelas,
        valorPago,
        proximoVencimento: proximoVencimentoParcela?.vencimento || null,
        ultimas5Parcelas,
        aluguelMesAtual: aluguelMesAtual || null,
        condominioMesAtual: condominioMesAtual || null,
      });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Configuração inicial (wizard)
  app.get("/api/configuracao/status", async (req, res) => {
    try {
      const config = await db
        .select()
        .from(configuracoes)
        .limit(1)
        .then(rows => rows[0]);

      res.json({
        configurado: config?.configuracao_inicial || false,
      });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/configuracao/wizard", async (req, res) => {
    try {
      const { proprietario, comprador, imovel, dataInicioContrato } = req.body;

      // Validações básicas
      if (!proprietario?.nome || !proprietario?.email || !proprietario?.senha || !proprietario?.cpf) {
        return res.status(400).send("Dados do proprietário incompletos");
      }
      if (!comprador?.nome || !comprador?.email || !comprador?.cpf) {
        return res.status(400).send("Dados do comprador incompletos");
      }
      if (!imovel?.nome || !imovel?.endereco || !imovel?.valorImovel || !imovel?.valorAluguel) {
        return res.status(400).send("Dados do imóvel incompletos");
      }
      if (!dataInicioContrato) {
        return res.status(400).send("Data de início do contrato é obrigatória");
      }

      // Executar tudo em uma transação
      const resultado = await db.transaction(async (tx) => {
        // Verificar se já foi configurado
        const configExistente = await tx.select().from(configuracoes).limit(1).then(rows => rows[0]);
        if (configExistente?.configuracao_inicial) {
          throw new Error("Sistema já foi configurado");
        }

        // Verificar se já existe imóvel
        const imovelExistente = await tx.select().from(imoveis).limit(1).then(rows => rows[0]);
        if (imovelExistente) {
          throw new Error("Já existe um imóvel cadastrado");
        }

        // 1. Criar parte do Proprietário
        const [parteProprietario] = await tx
          .insert(partes)
          .values({
            tipo: "Proprietário",
            nome: proprietario.nome,
            email: proprietario.email,
            telefone: proprietario.telefone || null,
            cpf: proprietario.cpf,
            rg: proprietario.rg || null,
            orgao_emissor: proprietario.orgaoEmissor || null,
          })
          .returning();

        // 2. Criar usuário Proprietário (admin)
        const senhaHash = await bcrypt.hash(proprietario.senha, 10);
        const [usuarioProprietario] = await tx
          .insert(usuarios)
          .values({
            email: proprietario.email,
            senha: senhaHash,
            nome: proprietario.nome,
            papel: "Proprietário",
            parte_id: parteProprietario.id,
          })
          .returning();

        // 3. Criar parte do Comprador
        const [parteComprador] = await tx
          .insert(partes)
          .values({
            tipo: "Comprador",
            nome: comprador.nome,
            email: comprador.email,
            telefone: comprador.telefone || null,
            cpf: comprador.cpf,
            rg: comprador.rg || null,
            orgao_emissor: comprador.orgaoEmissor || null,
          })
          .returning();

        // 4. Criar imóvel
        const [imovelCriado] = await tx
          .insert(imoveis)
          .values({
            nome: imovel.nome,
            endereco: imovel.endereco,
            valor_imovel: Number(imovel.valorImovel).toFixed(2),
            valor_aluguel: Number(imovel.valorAluguel).toFixed(2),
          })
          .returning();

        // 5. Criar configuração inicial
        await tx.insert(configuracoes).values({
          configuracao_inicial: true,
          data_inicio_contrato: new Date(dataInicioContrato),
        });

        return usuarioProprietario;
      });

      res.json({
        message: "Configuração inicial concluída com sucesso",
        usuario: {
          id: resultado.id,
          email: resultado.email,
          nome: resultado.nome,
          papel: resultado.papel,
        },
      });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
