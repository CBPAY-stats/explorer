# Guia de Implantação no GitHub Pages

Este guia explica como implantar o XDB Chain Wallet Explorer no GitHub Pages.

## Opção 1: Implantação Automática com GitHub Actions (Recomendado)

### Pré-requisitos
- Conta no GitHub
- Repositório público (GitHub Pages gratuito apenas para repositórios públicos)

### Passos:

1. **Criar Repositório no GitHub**
   - Acesse [GitHub](https://github.com) e faça login
   - Clique em "New repository"
   - Nomeie o repositório (ex: `xdb-wallet-explorer`)
   - Marque como público
   - Clique em "Create repository"

2. **Fazer Upload do Código**
   ```bash
   # No diretório do projeto
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/xdb-wallet-explorer.git
   git push -u origin main
   ```

3. **Configurar GitHub Pages**
   - Vá para as configurações do repositório (Settings)
   - Role até a seção "Pages"
   - Em "Source", selecione "GitHub Actions"
   - O workflow será executado automaticamente

4. **Verificar Implantação**
   - Vá para a aba "Actions" do repositório
   - Aguarde o workflow completar
   - A aplicação estará disponível em: `https://SEU_USUARIO.github.io/xdb-wallet-explorer`

## Opção 2: Implantação Manual

### Passos:

1. **Fazer Build Local**
   ```bash
   pnpm run build
   ```

2. **Criar Branch gh-pages**
   ```bash
   git checkout --orphan gh-pages
   git rm -rf .
   cp -r dist/* .
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin gh-pages
   ```

3. **Configurar GitHub Pages**
   - Vá para Settings > Pages
   - Em "Source", selecione "Deploy from a branch"
   - Selecione "gh-pages" como branch
   - Clique em "Save"

## Opção 3: Usando GitHub Desktop

1. **Instalar GitHub Desktop**
   - Baixe em [desktop.github.com](https://desktop.github.com)

2. **Clonar/Criar Repositório**
   - File > New Repository
   - Ou File > Clone Repository

3. **Fazer Upload dos Arquivos**
   - Copie todos os arquivos do projeto para a pasta do repositório
   - Commit e push as mudanças

4. **Configurar Pages**
   - Siga os passos da Opção 1, etapa 3

## Configurações Importantes

### Arquivo vite.config.js
Certifique-se de que o arquivo `vite.config.js` tem a configuração correta para o GitHub Pages:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/xdb-wallet-explorer/', // Substitua pelo nome do seu repositório
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### CORS e API
A aplicação faz chamadas para a API da XDB Chain (`https://horizon.livenet.xdbchain.com`). Esta API suporta CORS, então não há problemas de segurança para executar no browser.

## Solução de Problemas

### Erro 404 ao Acessar a Página
- Verifique se o GitHub Pages está configurado corretamente
- Confirme que o repositório é público
- Aguarde alguns minutos para a propagação

### Erro de Build no GitHub Actions
- Verifique os logs na aba Actions
- Confirme que todas as dependências estão no package.json
- Verifique se não há erros de sintaxe no código

### Página em Branco
- Verifique o console do browser para erros JavaScript
- Confirme que o `base` no vite.config.js está correto
- Verifique se todos os assets foram carregados corretamente

## URLs de Exemplo

Após a implantação, sua aplicação estará disponível em:
- `https://SEU_USUARIO.github.io/xdb-wallet-explorer/`

## Atualizações

Para atualizar a aplicação:
1. Faça as alterações no código
2. Commit e push para o branch main
3. O GitHub Actions fará o deploy automaticamente (Opção 1)
4. Ou refaça o build e atualize o branch gh-pages (Opção 2)

## Domínio Personalizado (Opcional)

Para usar um domínio personalizado:
1. Adicione um arquivo `CNAME` na pasta `public/` com seu domínio
2. Configure o DNS do seu domínio para apontar para o GitHub Pages
3. Configure o domínio personalizado nas configurações do repositório

---

Para mais informações, consulte a [documentação oficial do GitHub Pages](https://docs.github.com/en/pages).

