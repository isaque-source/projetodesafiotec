# Visu — Gestão Comercial Inteligente & Organizada

**Visu** é um sistema completo e moderno de gestão comercial estruturado para ajudar empreendedores a organizarem suas operações, controlarem vendas, monitorarem estoque e definirem metas de crescimento de forma clara e visual.

A aplicação é **Multi-Tenant**, garantindo que cada usuário cadastrado possua uma conta isolada e privada, onde dados corporativos, históricos de vendas, catálogo de estoque e indicadores de crescimento permanecem rigorosamente protegidos e acessíveis apenas ao respectivo dono via autenticação segura.

---

## 🎯 Objetivos do Aplicativo

O principal propósito do **Visu** é simplificar a administração diária do seu negócio reunindo as seguintes funcionalidades em uma única interface elegante, intuitiva e de alta performance:

1. **Autenticação Segura e Controle Multi-Tenant**: Cadastro, Login, Recuperação de Senha e encerramento de sessão com isolamento robusto de dados baseado no UID único do usuário.
2. **Dashboard Financeiro Dinâmico**: Visualização consolidada de faturamento diário/mensal, quantidade de transações em tempo real e monitoramento percentual de progresso em relação às metas estabelecidas.
3. **Registro e Histórico de Vendas**: Lançamento ágil de novas vendas contendo descrição, valor unitário, quantidade e data. Histórico completo com paginação e busca.
4. **Controle Inteligente de Estoque**: Catálogo detalhado de mercadorias com alertas automáticos para produtos operando abaixo do estoque mínimo de segurança.
5. **Definição de Metas**: Planejamento e acompanhamento de metas financeiras mensais e periódicas integradas aos gráficos de evolução.
6. **Integração Social e Análises (Instagram Progress)**: Ferramentas de análise de performance em redes sociais e dicas estratégicas com auxílio de inteligência artificial.

---

## 🛠️ Tecnologias Utilizadas

O Visu foi construído seguindo os melhores padrões do ecossistema moderno de desenvolvimento web, utilizando uma arquitetura full-stack integrada:

### Frontend
- **React 19 & TypeScript**: Interface estruturada por componentes funcionais rápidos e tipagem estática que previne erros em tempo de compilação.
- **Tailwind CSS (v4)**: Estilização utilitária responsiva e modular, proporcionando uma experiência uniforme e polida em desktops, tablets e smartphones.
- **Motion (framer-motion)**: Micro-animações fluidas, transições de tela suaves e feedback de interface envolvente.
- **Lucide React**: Biblioteca de ícones minimalistas e consistentes para facilitar a navegabilidade.

### Backend / API Proxy
- **Node.js + Express**: Servidor backend integrado de alto desempenho responsável por centralizar lógicas sensíveis e gerenciar o fluxo principal.
- **tsx & esbuild**: Pipeline de desenvolvimento instantâneo com transpilação nativa de TypeScript e empacotamento ultrarrápido do servidor para produção.

### Banco de Dados & Autenticação
- **Firebase Authentication**: Sistema robusto de verificação de identidade suportando credenciais de e-mail e persistência automatizada de sessão.
- **Cloud Firestore**: Banco de dados NoSQL resiliente em tempo real para armazenamento estruturado de perfis, vendas, metas e estoques.
- **Segurança Nativa (Firestore Security Rules)**: Regras declarativas avançadas aplicadas diretamente no modelo do Firestore, garantindo absoluto isolamento dos dados de cada tenant.

---

## 🔒 Segurança e Isolamento Multi-Tenant

A integridade e confidencialidade dos dados comerciais de cada lojista são pilares centrais do **Visu**. O isolamento seguro é executado em duas frentes complementares:

### 1. Filtragem no Cliente (Código da Aplicação)
Todos os registros de coleções lógicas (Vendas, Produtos do Estoque, Metas) e dados de perfil são organizados e consultados utilizando o identificador único e exclusivo (`uid`) disponibilizado pelo Firebase Auth:
```typescript
// Exemplo de isolamento por subcoleções dedicadas
const userSalesRef = collection(db, "usuarios", currentUser.uid, "sales");
const userInventoryRef = collection(db, "usuarios", currentUser.uid, "inventory");
```

### 2. Validação Rígida no Servidor (Regras de Segurança do Firebase)
Mesmo que um agente externo tente injetar requisições alterando o caminho das requisições, as regras declarativas criadas em `firestore.rules` validam em nível do banco de dados que um usuário autenticado só pode ler ou gravar documentos localizados sob o seu próprio `userId`:
```javascript
// firestore.rules
match /usuarios/{userId} {
  allow get, create, update: if request.auth != null && request.auth.uid == userId;
  
  match /sales/{saleId} {
    allow read, write: if request.auth != null && request.auth.uid == userId;
  }
  
  match /inventory/{itemId} {
    allow read, write: if request.auth != null && request.auth.uid == userId;
  }
}
```

---

## 🏃 Como Executar o Projeto

Para rodar a aplicação localmente ou em ambiente de desenvolvimento, siga as instruções abaixo:

### Pré-requisitos
Certifique-se de possuir em seu sistema:
- **Node.js** (recomenda-se versão 18 ou superior)
- **npm** (incluso com o Node.js)

### 1. Instalação das Dependências
Navegue até a pasta raiz do projeto e execute:
```bash
npm install
```

### 2. Configurações de Ambiente (Variáveis)
Crie um arquivo chamado `.env` no diretório raiz do projeto (ou utilize um `.env.local`). Use como referência o arquivo `.env.example`. Preencha com as credenciais do seu projeto Firebase e demais integrações:
```env
# Exemplo das variáveis exigidas no .env (não expor em produção)
VITE_FIREBASE_API_KEY=seu_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu_auth_domain
VITE_FIREBASE_PROJECT_ID=seu_project_id
VITE_FIREBASE_STORAGE_BUCKET=seu_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
VITE_FIREBASE_APP_ID=seu_app_id

# Backend & Integrações Privadas
GEMINI_API_KEY=sua_chave_gemini_opcional
GMAIL_USER=seu_e-mail_do_gmail
GMAIL_APP_PASSWORD=seu_app_password
```

### 3. Execução em Desenvolvimento
Para iniciar o servidor de desenvolvimento Express + Vite com atualização instantânea automática, execute o comando:
```bash
npm run dev
```
O console exibirá as informações de inicialização e o endereço local para acesso à aplicação no navegador (geralmente `http://localhost:3000`).

---

## 🚀 Preparação para Produção & Build

Para construir a aplicação otimizada para o ambiente de produção:

1. **Compilar e Otimizar**:
   Seu código TypeScript e os arquivos estáticos e de rota serão empacotados em um único arquivo de distribuição backend robusto. Rode o comando:
   ```bash
   npm run build
   ```
   Isso compilará o frontend para código estático otimizado na pasta `dist/` e gerará o servidor transpilado e encapsulado em `dist/server.cjs`.

2. **Iniciar Servidor de Produção**:
   Para testar ou rodar a aplicação em servidores web (como Cloud Run, AWS, Heroku, etc.), basta executar o script de inicialização padrão:
   ```bash
   npm run start
   ```

---

## 📁 Estrutura de Diretórios Recomendada

Abaixo está listada de forma visível a arquitetura principal adotada pela nossa equipe para garantir legibilidade e escalabilidade do projeto:
```text
├── src/
│   ├── components/       # Componentes React reutilizáveis e modulares (Login, Cadastro, Dashboard, Estoque)
│   ├── assets/           # Imagens, logotipos e vetores estáticos do app
│   ├── lib/              # Inicialização de banco de dados e utilitários auxiliares
│   ├── firebase.ts       # Configuração e bootstrap da conexão com o cliente Firebase
│   ├── types.ts          # Definições globais de tipos e interfaces do TypeScript
│   ├── index.css         # Ponto de entrada de estilos globais combinados com o Tailwind CSS
│   ├── App.tsx           # Fluxo de roteamento, controle de sessão ativa e layout container do app
│   └── main.tsx          # Ponto de bootstrap e montagem do React na DOM
├── firestore.rules       # Regras ativas de segurança do banco de dados (regras Multi-Tenant)
├── tsconfig.json         # Configuração detalhada do TypeScript Compiler
├── vite.config.ts        # Arquivo de configuração avançado do bundler Vite
├── package.json          # Manifesto com scripts de automação e dependências utilizadas
└── README.md             # Documentação técnica e de negócio da plataforma (este arquivo)
```
