import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { slugify } from "../src/lib/slug";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_INITIAL_EMAIL ?? "admin@wcheckbrasil.com.br";
  const password = process.env.ADMIN_INITIAL_PASSWORD ?? "Wcheck@2026";
  const name = process.env.ADMIN_INITIAL_NAME ?? "Administrador W Check";

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name,
      email,
      passwordHash: await hash(password, 12),
      role: "ADMIN",
    },
  });
  console.log(`✔ Admin inicial: ${email}`);

  const editorEmail = "editor@wcheckbrasil.com.br";
  await prisma.user.upsert({
    where: { email: editorEmail },
    update: {},
    create: {
      name: "Editor de Conteúdo",
      email: editorEmail,
      passwordHash: await hash("Editor@2026", 12),
      role: "EDITOR",
    },
  });
  console.log(`✔ Editor de exemplo: ${editorEmail}`);

  const categories = [
    {
      name: "ERP Veicular",
      icon: "Truck",
      order: 1,
      articles: [
        {
          title: "Como cadastrar um veículo no sistema",
          excerpt:
            "Aprenda passo a passo como cadastrar um veículo na plataforma W Check Brasil, preenchendo placa, chassi, documentos e dados do proprietário.",
          content: `
<p>Cadastrar um veículo é o primeiro passo para realizar consultas, emitir documentos digitais e acompanhar o histórico dentro da W Check Brasil. O cadastro foi desenvolvido para ser rápido e completo, permitindo que você organize sua frota ou carteira de clientes com poucos cliques.</p>
<p>Neste artigo, você vai aprender <strong>como cadastrar um veículo no ERP Veicular</strong>, desde a consulta inicial até o preenchimento das informações complementares.</p>
<h2>Antes de começar</h2>
<ul>
  <li>Tenha em mãos a <strong>placa</strong> do veículo e, se possível, o <strong>chassi</strong>;</li>
  <li>Verifique se seu usuário possui permissão de cadastro no módulo;</li>
  <li>Confirme se a placa não está previamente cadastrada (o sistema avisará automaticamente).</li>
</ul>
<h2>Passo a passo do cadastro</h2>
<h3>1. Acesse o módulo de veículos</h3>
<p>No menu lateral, clique em <strong>Veículos</strong> e depois em <strong>Novo veículo</strong>.</p>
<h3>2. Informe a placa e consulte os dados</h3>
<p>Digite a placa e clique em <strong>Consultar</strong>. O sistema preenche automaticamente marca, modelo, ano, cor e demais informações básicas.</p>
<h3>3. Complete as informações complementares</h3>
<p>Revise os dados do proprietário, anexe documentos digitalizados, se necessário, e clique em <strong>Salvar</strong>.</p>
<blockquote>Desligue o preenchimento automático apenas quando for cadastrar veículos estrangeiros ou com placas antigas não localizadas na base.</blockquote>
<h2>Próximos passos</h2>
<p>Após o cadastro, você pode emitir documentos digitais, consultar restrições e acompanhar o histórico completo do veículo.</p>
`,
        },
        {
          title: "Como emitir o CRLV-e (documento digital do veículo)",
          excerpt:
            "Veja como emitir o CRLV-e pela plataforma W Check Brasil de forma 100% digital, com entrega direta no e-mail e no painel do cliente.",
          content: `
<p>O <strong>CRLV-e</strong> é a versão digital do Certificado de Registro e Licenciamento de Veículo. Com a W Check Brasil, você emite o documento sem sair da plataforma, com acompanhamento do status em tempo real.</p>
<h2>Requisitos para emissão</h2>
<ul>
  <li>Licenciamento quitado ou em dia;</li>
  <li>Sem restrições impeditivas de licenciamento;</li>
  <li>RENAVAM e placa válidos na base do Detran.</li>
</ul>
<h2>Como emitir</h2>
<h3>1. Abra a ficha do veículo</h3>
<p>Acesse <strong>Veículos</strong>, localize o veículo pela placa e abra a ficha completa.</p>
<h3>2. Selecione a emissão do CRLV-e</h3>
<p>No bloco <strong>Documentos digitais</strong>, clique em <strong>Emitir CRLV-e</strong>.</p>
<h3>3. Confirme e acompanhe</h3>
<p>Revise os dados, confirme a emissão e acompanhe o status na aba <strong>Solicitações</strong>. O PDF fica disponível para download assim que o Detran processar.</p>
<h2>Prazos</h2>
<p>A emissão costuma ser concluída em poucos minutos. Em períodos de fechamento de frota, pode levar até 24 horas úteis.</p>
`,
        },
        {
          title: "Como consultar o histórico de proprietários de um veículo",
          excerpt:
            "Descubra como consultar o histórico completo de proprietários, leilões, sinistros e restrições de um veículo na W Check Brasil.",
          content: `
<p>A consulta de <strong>Histórico de Proprietários</strong> reúne todas as transferências registradas do veículo, além de passagens por leilão, sinistros e mudanças de estado.</p>
<h2>Quando usar esta consulta</h2>
<ul>
  <li>Avaliação de veículos usados antes da compra;</li>
  <li>Auditoria de frota própria ou de terceiros;</li>
  <li>Due diligence em processos de crédito e garantia.</li>
</ul>
<h2>Como consultar</h2>
<h3>1. Informe a placa ou o chassi</h3>
<p>No menu <strong>Consultas</strong>, escolha <strong>Histórico de Proprietários</strong> e informe a placa ou o chassi.</p>
<h3>2. Confirme os dados do veículo</h3>
<p>O sistema exibe um resumo para você confirmar que o veículo é o correto antes de consumir o crédito.</p>
<h3>3. Analise o relatório</h3>
<p>O relatório traz a linha do tempo de proprietários, datas de transferência, forte indicação de leilão, sinistros e restrições ativas.</p>
<blockquote>Consultas consumem créditos da sua conta. Confira sempre o resumo antes de confirmar.</blockquote>
`,
        },
      ],
    },
    {
      name: "Financeiro",
      icon: "Wallet",
      order: 2,
      articles: [
        {
          title: "Como emitir uma fatura para o cliente",
          excerpt:
            "Aprenda a gerar faturas no módulo financeiro da W Check Brasil, definir vencimento, forma de pagamento e enviar ao cliente por e-mail.",
          content: `
<p>O módulo <strong>Financeiro</strong> centraliza faturamento, recebimentos e conciliação da sua operação. Neste artigo, você aprende a emitir uma fatura do zero.</p>
<h2>Passo a passo</h2>
<h3>1. Acesse o módulo financeiro</h3>
<p>No menu lateral, clique em <strong>Financeiro</strong> e depois em <strong>Nova fatura</strong>.</p>
<h3>2. Preencha os dados da fatura</h3>
<ul>
  <li>Selecione o <strong>cliente</strong> (PF ou PJ) já cadastrado;</li>
  <li>Adicione os <strong>itens</strong> com descrição, quantidade e valor;</li>
  <li>Defina o <strong>vencimento</strong> e a <strong>forma de pagamento</strong>.</li>
</ul>
<h3>3. Emita e envie</h3>
<p>Clique em <strong>Emitir fatura</strong>. Você pode enviar automaticamente por e-mail ou copiar o link de pagamento.</p>
<h2>Status possíveis de uma fatura</h2>
<ul>
  <li><strong>Aberta:</strong> aguardando pagamento;</li>
  <li><strong>Paga:</strong> baixa automática via conciliação ou manual;</li>
  <li><strong>Vencida:</strong> passou do vencimento sem pagamento;</li>
  <li><strong>Cancelada:</strong> fatura inutilizada.</li>
</ul>
`,
        },
        {
          title: "Como comprar e acompanhar créditos de consulta",
          excerpt:
            "Entenda como funcionam os créditos de consulta da W Check Brasil: pacotes disponíveis, compra, validade e extrato de consumo.",
          content: `
<p>Cada consulta realizada na plataforma consome <strong>créditos</strong>. Este artigo explica como comprar pacotes, acompanhar o saldo e auditar o consumo por usuário.</p>
<h2>Como comprar créditos</h2>
<h3>1. Abra a página de créditos</h3>
<p>Clique no <strong>saldo de créditos</strong> no topo do painel e depois em <strong>Comprar créditos</strong>.</p>
<h3>2. Escolha o pacote</h3>
<p>Selecione o pacote desejado e a forma de pagamento. Após a confirmação, os créditos entram na conta na hora.</p>
<h2>Como acompanhar o consumo</h2>
<p>No menu <strong>Créditos &gt; Extrato</strong>, você vê cada consulta realizada, o usuário responsável, o custo e o saldo restante.</p>
<h2>Validade</h2>
<p>Os créditos não expiram enquanto a conta estiver ativa. Pacotes promocionais podem ter validade específica indicada no ato da compra.</p>
`,
        },
      ],
    },
  ];

  for (const cat of categories) {
    const category = await prisma.category.upsert({
      where: { slug: slugify(cat.name) },
      update: {},
      create: {
        name: cat.name,
        slug: slugify(cat.name),
        icon: cat.icon,
        order: cat.order,
      },
    });
    console.log(`✔ Categoria: ${category.name}`);

    let order = 1;
    for (const art of cat.articles) {
      const slug = slugify(art.title);
      const existing = await prisma.article.findUnique({ where: { slug } });
      if (existing) continue;
      await prisma.article.create({
        data: {
          categoryId: category.id,
          title: art.title,
          slug,
          excerpt: art.excerpt,
          content: art.content.trim(),
          status: "PUBLISHED",
          order: order++,
          publishedAt: new Date(),
        },
      });
      console.log(`  ✔ Artigo: ${art.title}`);
    }
  }

  console.log("Seed concluído.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
