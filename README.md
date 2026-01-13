# Boss - Seu Assistente Pessoal Inteligente

Boss é um gerenciador de tarefas moderno, minimalista e inteligente. Organize sua vida, gerencie projetos e tenha controle total das suas atividades com uma interface elegante e fluida.

## 🚀 Funcionalidades

### Gerenciamento de Tarefas
- **Criação rápida**: Adicione tarefas instantaneamente com um input intuitivo
- **Status visual**: Marque tarefas como concluídas com um clique
- **Edição inline**: Clique no título para editar diretamente
- **Lixeira inteligente**: Tarefas excluídas vão para a lixeira, podendo ser restauradas

### Listas Personalizáveis
- **Cores vibrantes**: 20+ opções de cores para organizar visualmente
- **Ícones únicos**: Escolha entre dezenas de ícones para identificar cada lista
- **Filtros rápidos**: Filtre tarefas por uma ou múltiplas listas

### Interface Premium
- **Design Material You**: Interface inspirada no Google Material Design 3
- **Animações suaves**: Transições fluidas com Framer Motion
- **Sidebar dinâmica**: Navegação colapsável estilo Google Tasks
- **Modo claro**: Tema clean e profissional

### Autenticação Segura
- **Login social**: Entre com Google, GitHub ou LinkedIn
- **Email/senha**: Cadastro tradicional com confirmação por email
- **Perfil customizável**: Escolha seu avatar entre diversos ícones

### Recursos Avançados
- **PWA**: Instale como app no seu dispositivo
- **Sincronização em tempo real**: Seus dados sempre atualizados via Supabase
- **Persistência na nuvem**: Acesse de qualquer lugar

## 🛠️ Tecnologias

- **Frontend**: React 18, TypeScript, Vite
- **Estilização**: Tailwind CSS
- **Estado**: Zustand
- **Animações**: Framer Motion
- **Ícones**: Lucide React
- **Backend**: Supabase (Auth & Database & Realtime)
- **IA** *(em desenvolvimento)*: Google Generative AI

## 📦 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/alisondmiranda/boss.git
cd boss
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente (`.env.local`):
```env
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

## 🚀 Deploy

Este projeto está configurado para deploy automático na **Netlify**.

[![Netlify Status](https://api.netlify.com/api/v1/badges/your-badge-id/deploy-status)](https://app.netlify.com)

---

**Boss v1.2.0** • Desenvolvido com ❤️ por Alison Miranda
