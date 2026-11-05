# Catálogo e Drive · publicação responsável

## Por que não mostrar diretamente imagens privadas do Drive?

O repositório GitHub é público. URLs de miniaturas do Drive são temporárias, e o site estático não deve carregar credenciais ou depender de arquivos privados. A primeira versão implementa os componentes de visualização, mas mantém os campos de imagem vazios até a seleção autorizada.

## Fluxo de integração proposto

1. O Drive continua sendo o arquivo original; pastas de trotes, Day-Off, Recreaço, Festa Junina e demais eventos permanecem como estão.
2. Um catálogo editorial (mantido fora do GitHub público) registra arquivo original, autor, turma, data, pessoas identificáveis e abrangência da autorização.
3. Só os itens com permissão específica para o memorial são exportados para uma área pública de exibição, de preferência versões comprimidas em R2.
4. O manifest \`content/acervo.json\` aponta para mídias já publicadas e autorizadas. Não contém e-mails, nomes completos de responsáveis ou IDs privados.
5. Retirada de autorização: excluir da distribuição pública, do manifest e invalidar cache, preservando apenas o original se houver fundamento para conservá-lo.

## Exemplo de item de mídia publicado

Adicione à lista \`midias\` de um evento após preparar o arquivo \`media/trote-1/foto-01.webp\`:

\`\`\`json
{
  "src": "./media/trote-1/foto-01.webp",
  "alt": "Descrição objetiva do conteúdo da fotografia",
  "legenda": "Legenda real, revisada e contextualizada"
}
\`\`\`

O script do site só aceita caminhos locais de \`media/\`, justamente para não fazer hotlink de Drive privado.

## Preparação da integração

Quando as permissões estiverem definidas, podemos implementar uma rotina autenticada Drive API → seleção privada → R2 → atualização do manifest. Credenciais ficam em segredos do pipeline, jamais no HTML ou no commit.

Não incorporar automaticamente o conteúdo da pasta privada de fotos de infância, nem considerar as permissões concedidas para o vídeo como autorização de divulgação permanente do memorial.
