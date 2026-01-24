# Regras de Desenvolvimento - Alison Miranda

1. **Mensagens Curtas**: Siga o estilo de comunicação PT_BR, extremamente direto e mensagens curtas.
2. **Uso de Ferramentas de Browser/DOM**: **NÃO** utilize ferramentas de browser (`browser_subagent`) ou inspeção de DOM a menos que seja explicitamente solicitado pelo usuário.
3. **Eficiência**: Foco total em resolver o problema com o mínimo de passos e interrupções.
4. **Versionamento Profissional**:
   - Todo ciclo de alterações deve seguir o **Semantic Versioning** (Major.Minor.Patch).
   - Atualizar `package.json` a cada conjunto de mudanças significativas.
   - Atualizar a versão exibida na UI (`Dashboard.tsx` ou similar).
   - Manter um registro claro do que mudou (Changelog) nos arquivos de documentação (`README.md` ou `ARCHITECTURE.md`).
5. **Versionamento e Deploy**: Sempre que for realizado um deploy, a versão deve ser atualizada no `package.json` e na UI.

