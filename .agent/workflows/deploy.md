---
description: Fluxo de deploy do Boss
---

1. **Incremento de Versão**:
   - Atualize a versão no `package.json`.
   - Atualize a versão visual no rodapé do `Dashboard.tsx`.
   - Use o padrão Semantic Versioning.

// turbo
2. **Verificação de Build**:
   - Execute `npm run build` localmente.

3. **Limpeza**:
   - Remova arquivos temporários (`build_*.txt`, etc).

4. **Deploy**:
   - Realize o `git push` para o branch `main`.
   - Acompanhe no Netlify: https://app.netlify.com/projects/boss-assistant/overview
