import { db, initDatabase } from "./db";
import bcrypt from "bcrypt";

export async function initializeDatabase() {
  initDatabase();

  const existingUsers = db.prepare("SELECT COUNT(*) as count FROM usuarios").get() as any;
  
  if (existingUsers.count === 0) {
    console.log("🌱 Seeding initial data...");
    
    const hashedSenha = await bcrypt.hash("senha123", 10);

    db.prepare(
      `INSERT INTO usuarios (email, senha, nome, papel) VALUES (?, ?, ?, ?)`
    ).run("proprietario@teste.com", hashedSenha, "João Silva", "Proprietário");

    db.prepare(
      `INSERT INTO usuarios (email, senha, nome, papel) VALUES (?, ?, ?, ?)`
    ).run("comprador@teste.com", hashedSenha, "Maria Santos", "Comprador");

    db.prepare(
      `INSERT INTO partes (tipo, nome, email, telefone, cpf, rg, orgao_emissor) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      "Proprietário",
      "Carlos Eduardo Silva",
      "carlos@email.com",
      "(11) 98765-4321",
      "123.456.789-00",
      "12.345.678-9",
      "SSP/SP"
    );

    db.prepare(
      `INSERT INTO partes (tipo, nome, email, telefone, cpf, rg, orgao_emissor) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      "Comprador",
      "Ana Paula Oliveira",
      "ana@email.com",
      "(11) 91234-5678",
      "987.654.321-00",
      "98.765.432-1",
      "SSP/SP"
    );

    const result = db.prepare(
      `INSERT INTO imoveis (nome, endereco, valor_imovel, valor_aluguel) 
       VALUES (?, ?, ?, ?)`
    ).run(
      "Casa no Centro",
      "Rua das Flores, 123 - Centro - São Paulo/SP - CEP 01234-567",
      450000.00,
      2500.00
    );
    
    const imovelId = result.lastInsertRowid as number;

    const baseDate = new Date(2024, 0, 15);
    for (let i = 1; i <= 8; i++) {
      const vencimento = new Date(baseDate);
      vencimento.setMonth(baseDate.getMonth() + i - 1);
      
      const isPago = i <= 3 ? 1 : 0;
      const pagoEm = isPago ? new Date(vencimento.getTime() - 86400000 * 2).toISOString() : null;

      db.prepare(
        `INSERT INTO parcelas (imovel_id, numero, vencimento, valor, pago, pago_em) 
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(imovelId, i, vencimento.toISOString(), 5625.00, isPago, pagoEm);
    }

    for (let i = 1; i <= 6; i++) {
      const mes = i;
      const ano = 2024;
      const isPago = i <= 4 ? 1 : 0;
      const pagoEm = isPago ? new Date(2024, mes - 1, 10).toISOString() : null;

      db.prepare(
        `INSERT INTO alugueis (imovel_id, mes, ano, valor, pago, pago_em) 
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(imovelId, mes, ano, 2500.00, isPago, pagoEm);
    }

    for (let i = 1; i <= 6; i++) {
      const mes = i;
      const ano = 2024;
      const valor = 450 + Math.random() * 100;
      const isPago = i <= 4 ? 1 : 0;
      const pagoEm = isPago ? new Date(2024, mes - 1, 10).toISOString() : null;

      db.prepare(
        `INSERT INTO condominios (imovel_id, mes, ano, valor, pago, pago_em) 
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(imovelId, mes, ano, valor, isPago, pagoEm);
    }

    console.log("✅ Database seeded successfully!");
    console.log("\n📋 Test credentials:");
    console.log("   Proprietário: proprietario@teste.com / senha123");
    console.log("   Comprador: comprador@teste.com / senha123\n");
  } else {
    console.log("✅ Database already initialized");
  }
}
