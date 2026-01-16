---
description: Como realizar o deploy do Boss
---

# Fluxo de Deploy

Sempre que houver uma alteração técnica ou funcional no código, os seguintes passos devem ser seguidos:

1. **Incremento de Versão**:
   - Atualize a versão no `package.json`.
   - Atualize a versão visual no rodapé do `Dashboard.tsx`.
   - Use o padrão Semantic Versioning (ex: 1.3.0 -> 1.3.1).

2. **Verificação de Build**:
   - Execute `npm run build` localmente para garantir que não há erros de TypeScript ou Vite.

3. **Limpeza**:
   - Certifique-se de que não restaram arquivos de log (`build_*.txt`) ou scripts de migração temporários na raiz.

4. **Deploy**:
   - Realize o push para o branch principal para disparar o deploy automatizado (Netlify/Vercel).
