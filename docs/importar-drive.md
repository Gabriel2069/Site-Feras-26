# Drive → memorial · primeira integração

O site tem um leitor real de fotografias declaradas em \`content/acervo.json\`. O importador \`tools/importar-drive.mjs\` acrescenta a etapa de recuperar **apenas fotos aprovadas** do Drive e criar versões locais para a galeria.

## Antes de importar

1. Obter autorização de uso específica para publicação no memorial, inclusive para menores.
2. Selecionar as fotografias e redigir descrição objetiva da imagem e legenda.
3. Criar um arquivo privado \`private/aprovadas.json\` seguindo o exemplo abaixo.
4. Obter um token OAuth 2.0 temporário do Google com acesso de leitura ao Drive da pessoa que está fazendo o processo. **Não compartilhar o token e não inseri-lo em commits.**

Exemplo de \`private/aprovadas.json\`:

\`\`\`json
[
  {
    "driveFileId": "ID_DO_ARQUIVO_NO_DRIVE",
    "evento": "day-off",
    "nomePublicacao": "registro-selecionado-01",
    "alt": "Descrição factual da fotografia",
    "legenda": "Legenda revisada por quem esteve no evento",
    "autorizadoParaMemorial": true,
    "menor": false,
    "responsavelAutorizou": false,
    "revisadoPor": "organizacao"
  }
]
\`\`\`

A verificação de autorização no arquivo é uma conferência operacional, **não comprova juridicamente o consentimento**. A organização precisa guardar as autorizações e permitir solicitações de retirada fora do repositório.

## Uso

Com Node.js 20+ e um token válido no ambiente:

\`\`\`sh
node tools/importar-drive.mjs
node tools/importar-drive.mjs --publish
\`\`\`

Sem \`--publish\`, apenas valida a lista local. Na publicação, o script baixa cada imagem selecionada e atualiza o catálogo público. Por enquanto aceita JPEG, PNG e WebP, máximo 20 MB por arquivo. Não há otimização automática nem atualização contínua. Antes do envio público, converter para WebP/AVIF quando apropriado e conferir resolução, crédito e legibilidade.

## Próximo passo técnico

Para publicação recorrente, trocar o token manual por uma rotina autenticada com acesso restrito, enviar cópias otimizadas ao Cloudflare R2 e gerar versões responsivas; o Drive segue privado. Nunca publicar URLs de thumbnail efêmeras do Drive em páginas públicas.
