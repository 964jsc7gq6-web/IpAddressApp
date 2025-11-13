import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import bcrypt from "bcrypt";
import { db } from "./db";
import { initializeDatabase } from "./init-db";
import { authMiddleware, requireProprietario, generateToken, type AuthRequest } from "./middleware/auth";
import { upload, validateFiles } from "./middleware/upload";
import type { Usuario, Parte, Imovel, Parcela, Aluguel, Condominio, Arquivo } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  await initializeDatabase();

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, senha } = req.body;

      if (!email || !senha) {
        return res.status(400).send("Email e senha são obrigatórios");
      }

      const usuario = db.prepare("SELECT * FROM usuarios WHERE email = ?").get(email) as Usuario | undefined;

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

      const usuario = db.prepare("SELECT * FROM usuarios WHERE id = ?").get(req.usuario!.id) as Usuario | undefined;

      if (!usuario) {
        return res.status(404).send("Usuário não encontrado");
      }

      const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha);
      if (!senhaValida) {
        return res.status(401).send("Senha atual incorreta");
      }

      const novaSenhaHash = await bcrypt.hash(novaSenha, 10);
      db.prepare("UPDATE usuarios SET senha = ? WHERE id = ?").run(novaSenhaHash, usuario.id);

      res.json({ message: "Senha alterada com sucesso" });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/partes", authMiddleware, (req: AuthRequest, res) => {
    try {
      const partes = db.prepare("SELECT * FROM partes ORDER BY id DESC").all() as Parte[];
      res.json(partes);
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

      const emailExistente = db.prepare("SELECT id FROM usuarios WHERE email = ?").get(email);
      if (emailExistente) {
        return res.status(400).send("Já existe um usuário com este email");
      }

      const result = db.prepare(
        `INSERT INTO partes (tipo, nome, email, telefone, rg, orgao_emissor, cpf) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(tipo, nome, email, telefone || null, rg || null, orgaoEmissor || null, cpf);

      const parteId = result.lastInsertRowid as number;

      const senhaInicial = "senha123";
      const hashedSenha = await bcrypt.hash(senhaInicial, 10);
      db.prepare(
        `INSERT INTO usuarios (email, senha, nome, papel, parte_id) VALUES (?, ?, ?, ?, ?)`
      ).run(email, hashedSenha, nome, tipo, parteId);

      if (files && files.length > 0) {
        for (const file of files) {
          db.prepare(
            `INSERT INTO arquivos (nome_original, caminho, mime, tamanho, criado_em, entidade, entidade_id, tipo) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
          ).run(
            file.originalname,
            file.path,
            file.mimetype,
            file.size,
            new Date().toISOString(),
            "parte",
            parteId,
            "anexo"
          );
        }
      }

      const parte = db.prepare("SELECT * FROM partes WHERE id = ?").get(parteId) as Parte;
      res.json(parte);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.patch("/api/partes/:id", authMiddleware, requireProprietario, upload.array("arquivos", 3), async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { tipo, nome, email, telefone, rg, orgaoEmissor, cpf } = req.body;

      const updates: string[] = [];
      const values: any[] = [];

      if (tipo) {
        updates.push("tipo = ?");
        values.push(tipo);
      }
      if (nome) {
        updates.push("nome = ?");
        values.push(nome);
      }
      if (email) {
        updates.push("email = ?");
        values.push(email);
      }
      if (telefone !== undefined) {
        updates.push("telefone = ?");
        values.push(telefone || null);
      }
      if (rg !== undefined) {
        updates.push("rg = ?");
        values.push(rg || null);
      }
      if (orgaoEmissor !== undefined) {
        updates.push("orgao_emissor = ?");
        values.push(orgaoEmissor || null);
      }
      if (cpf) {
        updates.push("cpf = ?");
        values.push(cpf);
      }

      if (updates.length > 0) {
        values.push(id);
        db.prepare(`UPDATE partes SET ${updates.join(", ")} WHERE id = ?`).run(...values);
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
          db.prepare(
            `INSERT INTO arquivos (nome_original, caminho, mime, tamanho, criado_em, entidade, entidade_id, tipo) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
          ).run(
            file.originalname,
            file.path,
            file.mimetype,
            file.size,
            new Date().toISOString(),
            "parte",
            id,
            "anexo"
          );
        }
      }

      const parte = db.prepare("SELECT * FROM partes WHERE id = ?").get(id) as Parte;
      res.json(parte);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.delete("/api/partes/:id", authMiddleware, requireProprietario, (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      db.prepare("DELETE FROM partes WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/imovel", authMiddleware, (req: AuthRequest, res) => {
    try {
      const imovel = db.prepare("SELECT * FROM imoveis LIMIT 1").get() as Imovel | undefined;
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
      const existingImovel = db.prepare("SELECT id FROM imoveis").get();
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

      const result = db.prepare(
        `INSERT INTO imoveis (nome, endereco, valor_imovel, valor_aluguel) 
         VALUES (?, ?, ?, ?)`
      ).run(nome, endereco, parseFloat(valor_imovel), parseFloat(valor_aluguel));

      const imovelId = result.lastInsertRowid as number;

      if (files.contrato && files.contrato[0]) {
        const file = files.contrato[0];
        const arquivoResult = db.prepare(
          `INSERT INTO arquivos (nome_original, caminho, mime, tamanho, criado_em, entidade, entidade_id, tipo) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          file.originalname,
          file.path,
          file.mimetype,
          file.size,
          new Date().toISOString(),
          "imovel",
          imovelId,
          "contrato"
        );
        contratoId = arquivoResult.lastInsertRowid as number;
      }

      if (files.fotoCapa && files.fotoCapa[0]) {
        const file = files.fotoCapa[0];
        const arquivoResult = db.prepare(
          `INSERT INTO arquivos (nome_original, caminho, mime, tamanho, criado_em, entidade, entidade_id, tipo) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          file.originalname,
          file.path,
          file.mimetype,
          file.size,
          new Date().toISOString(),
          "imovel",
          imovelId,
          "foto_capa"
        );
        fotoCapaId = arquivoResult.lastInsertRowid as number;
      }

      if (files.anexos && files.anexos.length > 0) {
        for (const file of files.anexos) {
          db.prepare(
            `INSERT INTO arquivos (nome_original, caminho, mime, tamanho, criado_em, entidade, entidade_id, tipo) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
          ).run(
            file.originalname,
            file.path,
            file.mimetype,
            file.size,
            new Date().toISOString(),
            "imovel",
            imovelId,
            "anexo"
          );
        }
      }

      if (contratoId || fotoCapaId) {
        const updates: string[] = [];
        const values: any[] = [];
        if (contratoId) {
          updates.push("contrato_arquivo_id = ?");
          values.push(contratoId);
        }
        if (fotoCapaId) {
          updates.push("foto_capa_id = ?");
          values.push(fotoCapaId);
        }
        values.push(imovelId);
        db.prepare(`UPDATE imoveis SET ${updates.join(", ")} WHERE id = ?`).run(...values);
      }

      const imovel = db.prepare("SELECT * FROM imoveis WHERE id = ?").get(imovelId) as Imovel;
      res.json(imovel);
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
      const imovel = db.prepare("SELECT * FROM imoveis LIMIT 1").get() as Imovel | undefined;
      if (!imovel) {
        return res.status(404).send("Imóvel não encontrado");
      }

      const { nome, endereco, valor_imovel, valor_aluguel } = req.body;

      const updates: string[] = [];
      const values: any[] = [];

      if (nome) {
        updates.push("nome = ?");
        values.push(nome);
      }
      if (endereco) {
        updates.push("endereco = ?");
        values.push(endereco);
      }
      if (valor_imovel) {
        updates.push("valor_imovel = ?");
        values.push(parseFloat(valor_imovel));
      }
      if (valor_aluguel) {
        updates.push("valor_aluguel = ?");
        values.push(parseFloat(valor_aluguel));
      }

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      if (files.contrato && files.contrato[0]) {
        const validation = validateFiles(files.contrato, {
          maxCount: 1,
          maxSizeMB: 10,
          allowedTypes: ["pdf", "doc", "docx", "rtf"],
        });
        if (validation) return res.status(400).send(validation);

        const file = files.contrato[0];
        const arquivoResult = db.prepare(
          `INSERT INTO arquivos (nome_original, caminho, mime, tamanho, criado_em, entidade, entidade_id, tipo) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          file.originalname,
          file.path,
          file.mimetype,
          file.size,
          new Date().toISOString(),
          "imovel",
          imovel.id,
          "contrato"
        );
        const contratoId = arquivoResult.lastInsertRowid as number;
        updates.push("contrato_arquivo_id = ?");
        values.push(contratoId);
      }

      if (files.fotoCapa && files.fotoCapa[0]) {
        const validation = validateFiles(files.fotoCapa, {
          maxCount: 1,
          maxSizeMB: 10,
          allowedTypes: ["jpeg", "jpg", "png"],
        });
        if (validation) return res.status(400).send(validation);

        const file = files.fotoCapa[0];
        const arquivoResult = db.prepare(
          `INSERT INTO arquivos (nome_original, caminho, mime, tamanho, criado_em, entidade, entidade_id, tipo) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          file.originalname,
          file.path,
          file.mimetype,
          file.size,
          new Date().toISOString(),
          "imovel",
          imovel.id,
          "foto_capa"
        );
        const fotoCapaId = arquivoResult.lastInsertRowid as number;
        updates.push("foto_capa_id = ?");
        values.push(fotoCapaId);
      }

      if (files.anexos && files.anexos.length > 0) {
        const validation = validateFiles(files.anexos, {
          maxCount: 10,
          maxSizeMB: 20,
          allowedTypes: ["pdf", "zip", "jpeg", "jpg", "png", "doc", "docx", "rtf"],
        });
        if (validation) return res.status(400).send(validation);

        for (const file of files.anexos) {
          db.prepare(
            `INSERT INTO arquivos (nome_original, caminho, mime, tamanho, criado_em, entidade, entidade_id, tipo) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
          ).run(
            file.originalname,
            file.path,
            file.mimetype,
            file.size,
            new Date().toISOString(),
            "imovel",
            imovel.id,
            "anexo"
          );
        }
      }

      if (updates.length > 0) {
        values.push(imovel.id);
        db.prepare(`UPDATE imoveis SET ${updates.join(", ")} WHERE id = ?`).run(...values);
      }

      const updatedImovel = db.prepare("SELECT * FROM imoveis WHERE id = ?").get(imovel.id) as Imovel;
      res.json(updatedImovel);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/parcelas", authMiddleware, (req: AuthRequest, res) => {
    try {
      const parcelas = db.prepare("SELECT * FROM parcelas ORDER BY numero ASC").all() as Parcela[];
      res.json(parcelas);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/parcelas", authMiddleware, upload.single("comprovante"), async (req: AuthRequest, res) => {
    try {
      const imovel = db.prepare("SELECT id FROM imoveis LIMIT 1").get() as { id: number } | undefined;
      if (!imovel) {
        return res.status(400).send("É necessário cadastrar um imóvel primeiro");
      }

      const { valor } = req.body;
      if (!valor) {
        return res.status(400).send("Valor é obrigatório");
      }

      const lastParcela = db.prepare(
        "SELECT numero, vencimento FROM parcelas WHERE imovel_id = ? ORDER BY numero DESC LIMIT 1"
      ).get(imovel.id) as { numero: number; vencimento: string } | undefined;

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

      const result = db.prepare(
        `INSERT INTO parcelas (imovel_id, numero, vencimento, valor, pago) 
         VALUES (?, ?, ?, ?, ?)`
      ).run(imovel.id, numero, vencimento.toISOString(), parseFloat(valor), 0);

      const parcelaId = result.lastInsertRowid as number;

      if (req.file) {
        const validation = validateFiles([req.file], {
          maxCount: 1,
          maxSizeMB: 2,
          allowedTypes: ["pdf", "jpg", "jpeg", "png"],
        });
        if (validation) return res.status(400).send(validation);

        const arquivoResult = db.prepare(
          `INSERT INTO arquivos (nome_original, caminho, mime, tamanho, criado_em, entidade, entidade_id, tipo) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          req.file.originalname,
          req.file.path,
          req.file.mimetype,
          req.file.size,
          new Date().toISOString(),
          "parcela",
          parcelaId,
          "comprovante"
        );
        const comprovanteId = arquivoResult.lastInsertRowid as number;
        db.prepare("UPDATE parcelas SET comprovante_id = ? WHERE id = ?").run(comprovanteId, parcelaId);
      }

      const parcela = db.prepare("SELECT * FROM parcelas WHERE id = ?").get(parcelaId) as Parcela;
      res.json(parcela);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.patch("/api/parcelas/:id", authMiddleware, requireProprietario, upload.single("comprovante"), async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { pago, pagoEm } = req.body;

      const updates: string[] = [];
      const values: any[] = [];

      if (pago !== undefined) {
        updates.push("pago = ?");
        values.push(parseInt(pago));
      }
      if (pagoEm !== undefined) {
        updates.push("pago_em = ?");
        values.push(pagoEm || null);
      }

      if (req.file) {
        const validation = validateFiles([req.file], {
          maxCount: 1,
          maxSizeMB: 2,
          allowedTypes: ["pdf", "jpg", "jpeg", "png"],
        });
        if (validation) return res.status(400).send(validation);

        const arquivoResult = db.prepare(
          `INSERT INTO arquivos (nome_original, caminho, mime, tamanho, criado_em, entidade, entidade_id, tipo) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          req.file.originalname,
          req.file.path,
          req.file.mimetype,
          req.file.size,
          new Date().toISOString(),
          "parcela",
          id,
          "comprovante"
        );
        const comprovanteId = arquivoResult.lastInsertRowid as number;
        updates.push("comprovante_id = ?");
        values.push(comprovanteId);
      }

      if (updates.length > 0) {
        values.push(id);
        db.prepare(`UPDATE parcelas SET ${updates.join(", ")} WHERE id = ?`).run(...values);
      }

      const parcela = db.prepare("SELECT * FROM parcelas WHERE id = ?").get(id) as Parcela;
      res.json(parcela);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/alugueis", authMiddleware, (req: AuthRequest, res) => {
    try {
      const alugueis = db.prepare("SELECT * FROM alugueis ORDER BY ano DESC, mes DESC").all() as Aluguel[];
      res.json(alugueis);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/alugueis", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const imovel = db.prepare("SELECT id, valor_aluguel FROM imoveis LIMIT 1").get() as { id: number; valor_aluguel: number } | undefined;
      if (!imovel) {
        return res.status(400).send("É necessário cadastrar um imóvel primeiro");
      }

      const lastAluguel = db.prepare(
        "SELECT mes, ano FROM alugueis WHERE imovel_id = ? ORDER BY ano DESC, mes DESC LIMIT 1"
      ).get(imovel.id) as { mes: number; ano: number } | undefined;

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

      const result = db.prepare(
        `INSERT INTO alugueis (imovel_id, mes, ano, valor, pago) 
         VALUES (?, ?, ?, ?, ?)`
      ).run(imovel.id, mes, ano, imovel.valor_aluguel, 0);

      const aluguel = db.prepare("SELECT * FROM alugueis WHERE id = ?").get(result.lastInsertRowid) as Aluguel;
      res.json(aluguel);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.patch("/api/alugueis/:id", authMiddleware, requireProprietario, upload.single("comprovante"), async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { pago, pagoEm } = req.body;

      const updates: string[] = [];
      const values: any[] = [];

      if (pago !== undefined) {
        updates.push("pago = ?");
        values.push(parseInt(pago));
      }
      if (pagoEm !== undefined) {
        updates.push("pago_em = ?");
        values.push(pagoEm || null);
      }

      if (req.file) {
        const validation = validateFiles([req.file], {
          maxCount: 1,
          maxSizeMB: 2,
          allowedTypes: ["pdf", "jpg", "jpeg", "png"],
        });
        if (validation) return res.status(400).send(validation);

        const arquivoResult = db.prepare(
          `INSERT INTO arquivos (nome_original, caminho, mime, tamanho, criado_em, entidade, entidade_id, tipo) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          req.file.originalname,
          req.file.path,
          req.file.mimetype,
          req.file.size,
          new Date().toISOString(),
          "aluguel",
          id,
          "comprovante"
        );
        const comprovanteId = arquivoResult.lastInsertRowid as number;
        updates.push("comprovante_id = ?");
        values.push(comprovanteId);
      }

      if (updates.length > 0) {
        values.push(id);
        db.prepare(`UPDATE alugueis SET ${updates.join(", ")} WHERE id = ?`).run(...values);
      }

      const aluguel = db.prepare("SELECT * FROM alugueis WHERE id = ?").get(id) as Aluguel;
      res.json(aluguel);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/condominios", authMiddleware, (req: AuthRequest, res) => {
    try {
      const condominios = db.prepare("SELECT * FROM condominios ORDER BY ano DESC, mes DESC").all() as Condominio[];
      res.json(condominios);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/condominios", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const imovel = db.prepare("SELECT id FROM imoveis LIMIT 1").get() as { id: number } | undefined;
      if (!imovel) {
        return res.status(400).send("É necessário cadastrar um imóvel primeiro");
      }

      const { valor } = req.body;
      if (!valor) {
        return res.status(400).send("Valor é obrigatório");
      }

      const lastCondominio = db.prepare(
        "SELECT mes, ano FROM condominios WHERE imovel_id = ? ORDER BY ano DESC, mes DESC LIMIT 1"
      ).get(imovel.id) as { mes: number; ano: number } | undefined;

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

      const result = db.prepare(
        `INSERT INTO condominios (imovel_id, mes, ano, valor, pago) 
         VALUES (?, ?, ?, ?, ?)`
      ).run(imovel.id, mes, ano, parseFloat(valor), 0);

      const condominio = db.prepare("SELECT * FROM condominios WHERE id = ?").get(result.lastInsertRowid) as Condominio;
      res.json(condominio);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.patch("/api/condominios/:id", authMiddleware, requireProprietario, upload.single("comprovante"), async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { pago, pagoEm } = req.body;

      const updates: string[] = [];
      const values: any[] = [];

      if (pago !== undefined) {
        updates.push("pago = ?");
        values.push(parseInt(pago));
      }
      if (pagoEm !== undefined) {
        updates.push("pago_em = ?");
        values.push(pagoEm || null);
      }

      if (req.file) {
        const validation = validateFiles([req.file], {
          maxCount: 1,
          maxSizeMB: 2,
          allowedTypes: ["pdf", "jpg", "jpeg", "png"],
        });
        if (validation) return res.status(400).send(validation);

        const arquivoResult = db.prepare(
          `INSERT INTO arquivos (nome_original, caminho, mime, tamanho, criado_em, entidade, entidade_id, tipo) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          req.file.originalname,
          req.file.path,
          req.file.mimetype,
          req.file.size,
          new Date().toISOString(),
          "condominio",
          id,
          "comprovante"
        );
        const comprovanteId = arquivoResult.lastInsertRowid as number;
        updates.push("comprovante_id = ?");
        values.push(comprovanteId);
      }

      if (updates.length > 0) {
        values.push(id);
        db.prepare(`UPDATE condominios SET ${updates.join(", ")} WHERE id = ?`).run(...values);
      }

      const condominio = db.prepare("SELECT * FROM condominios WHERE id = ?").get(id) as Condominio;
      res.json(condominio);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/dashboard/stats", authMiddleware, (req: AuthRequest, res) => {
    try {
      const parcelas = db.prepare("SELECT * FROM parcelas").all() as Parcela[];
      const totalParcelas = parcelas.length;
      const parcelasPagas = parcelas.filter(p => p.pago).length;
      const parcelasPendentes = totalParcelas - parcelasPagas;
      const valorTotalParcelas = parcelas.reduce((sum, p) => sum + p.valor, 0);
      const valorPago = parcelas.filter(p => p.pago).reduce((sum, p) => sum + p.valor, 0);

      const proximoVencimentoParcela = parcelas
        .filter(p => !p.pago)
        .sort((a, b) => new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime())[0];

      const ultimas5Parcelas = parcelas.slice(-5).map(p => ({
        numero: p.numero,
        valor: p.valor,
        vencimento: p.vencimento,
        pago: !!p.pago,
      }));

      const mesAtual = new Date().getMonth() + 1;
      const anoAtual = new Date().getFullYear();

      const aluguelMesAtual = db.prepare(
        "SELECT * FROM alugueis WHERE mes = ? AND ano = ? LIMIT 1"
      ).get(mesAtual, anoAtual) as Aluguel | undefined;

      const condominioMesAtual = db.prepare(
        "SELECT * FROM condominios WHERE mes = ? AND ano = ? LIMIT 1"
      ).get(mesAtual, anoAtual) as Condominio | undefined;

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

  const httpServer = createServer(app);
  return httpServer;
}
