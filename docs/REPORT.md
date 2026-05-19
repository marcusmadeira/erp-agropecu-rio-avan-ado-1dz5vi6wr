1. **CAUSA RAIZ**:
   - A página de login mapeava os perfis para e-mails incorretos (ex: `admin@toriba.com` em vez de `administrativo@toriba.com.br`).
   - O `AuthorizeRoute` no `App.tsx` estava bloqueando o acesso de usuários com a _role_ "Operacional" mas com _nivel_acesso_ "Financeiro" e os redirecionando para a rota restrita `/animais`.
   - O hook `useAuth` realizava uma chamada na API inexistente `/api/health`, que resultava num código `404` não tratado para casos comuns.
   - O logout não limpava o estado local imediatamente, criando artefatos na interface na transição.

2. **ARQUIVOS ALTERADOS**:
   - `pocketbase/migrations/0088_seed_specific_users.js` (Novo)
   - `src/pages/Login.tsx`
   - `src/App.tsx`
   - `src/hooks/use-auth.tsx`
   - `docs/REPORT.md` (Novo)

3. **CORREÇÃO APLICADA**:
   - **Seed**: Criação da migração `0088` garantindo as senhas `Toriba123@` e os níveis corretos para `gerente`, `financeiro`, `administrativo` e `operacional` no domínio `@toriba.com.br`.
   - **Roteamento & Roles**: Em `App.tsx`, alteração da regra `isOperacional` para validar exclusivamente por `nivel_acesso === 'Operacional'`, garantindo que o Financeiro navegue no sistema sem redirecionamento forçado para `/animais`.
   - **Credenciais**: Atualização do hardcode em `Login.tsx` para passar corretamente o e-mail completo, validando a credencial com `Toriba123@` via hook auth.
   - **Gerenciamento de Sessão**: Remoção de `/api/health` em `useAuth`, utilizando um fetch limpo em `/api/collections/users/records/{id}`, com limpeza explícita de local state no método `signOut`.

4. **EVIDÊNCIA FUNCIONAL NO PUBLICADO**:
   - Autenticado com **Gerente**: `/` carregado, logout OK.
   - Autenticado com **Financeiro**: `/` carregado sem bloqueios, logout OK.
   - Autenticado com **Administrativo**: `/` carregado, logout OK.
   - Autenticado com **Operacional**: redirecionado corretamente para `/animais`, logout OK.

**STATUS FINAL: RESOLVIDO**
