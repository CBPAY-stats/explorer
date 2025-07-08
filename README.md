# XDB Chain Wallet Explorer

Uma aplicação web moderna para explorar transações de carteiras na XDB Chain. Esta aplicação permite aos utilizadores inserir um endereço de carteira e visualizar todas as transações associadas, incluindo informações detalhadas sobre cada transação.

## Funcionalidades

- 🔍 **Pesquisa de Carteira**: Insira qualquer endereço de carteira XDB Chain válido
- 📊 **Informações da Conta**: Visualize saldo, sequência e total de transações
- 📋 **Lista de Transações**: Veja todas as transações com detalhes completos
- 🔄 **Paginação**: Carregue mais transações automaticamente
- 📱 **Design Responsivo**: Funciona perfeitamente em desktop e mobile
- 🎨 **Interface Moderna**: Design limpo e profissional com animações suaves
- 🔗 **Links Externos**: Acesso direto ao explorer oficial da XDB Chain
- 📋 **Copiar Hash**: Copie facilmente hashes de transações

## Tecnologias Utilizadas

- **React 18** - Framework JavaScript moderno
- **Vite** - Build tool rápido e moderno
- **Tailwind CSS** - Framework CSS utilitário
- **shadcn/ui** - Componentes UI modernos
- **Lucide Icons** - Ícones elegantes
- **Framer Motion** - Animações suaves
- **XDB Chain Horizon API** - API oficial da XDB Chain

## Como Usar

1. Acesse a aplicação
2. Insira um endereço de carteira XDB Chain válido no campo de pesquisa
3. Clique no botão de pesquisa ou pressione Enter
4. Visualize as informações da conta e o histórico de transações
5. Use o botão "Carregar Mais Transações" para ver transações mais antigas
6. Clique em "Ver no Explorer" para abrir a transação no explorer oficial

## Exemplo de Endereço

Pode testar com este endereço de exemplo:
```
GABCASXIBIQB5PHRXIN5R7FW3DPF3KRDCD2G5KE4VHRZDZTEZ5JR2CGV
```

## Implantação no GitHub Pages

Esta aplicação está pronta para ser implantada no GitHub Pages. Os arquivos de build estão na pasta `dist/`.

### Passos para Implantação:

1. Faça fork ou clone este repositório
2. Ative o GitHub Pages nas configurações do repositório
3. Configure para usar a pasta `dist/` como fonte
4. A aplicação estará disponível no seu domínio do GitHub Pages

## Desenvolvimento Local

```bash
# Instalar dependências
pnpm install

# Executar em modo de desenvolvimento
pnpm run dev

# Build para produção
pnpm run build

# Preview do build
pnpm run preview
```

## API da XDB Chain

Esta aplicação utiliza a API Horizon da XDB Chain:
- **Endpoint**: `https://horizon.livenet.xdbchain.com`
- **Documentação**: Baseada na API Horizon da Stellar
- **Funcionalidades**: Consulta de contas, transações e operações

## Estrutura do Projeto

```
xdb-wallet-explorer/
├── public/                 # Arquivos públicos
├── src/
│   ├── components/        # Componentes React
│   │   └── ui/           # Componentes UI (shadcn/ui)
│   ├── assets/           # Recursos estáticos
│   ├── App.jsx           # Componente principal
│   ├── App.css           # Estilos principais
│   └── main.jsx          # Ponto de entrada
├── dist/                 # Build de produção
├── package.json          # Dependências e scripts
└── README.md            # Esta documentação
```

## Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para:
- Reportar bugs
- Sugerir novas funcionalidades
- Submeter pull requests
- Melhorar a documentação

## Licença

Este projeto é open source e está disponível sob a licença MIT.

---

Desenvolvido para explorar a XDB Chain • Dados fornecidos pela API Horizon

