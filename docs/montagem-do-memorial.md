# Depois do Sinal · Montagem do memorial

Revisão de trabalho de 11/11/2026, a partir de `c810647da3995dc064c58f25d0c5e1263df1dfa2`. Memorial Feras 26, Colégio Agostiniano.

## Montagem

A abertura recupera a cartela escura e a tipografia âmbar da referência enviada por Tadeu. O primeiro rasgo abre uma fotografia do pátio em tela grande, com detalhes arquitetônicos em outros planos. Os três trotes entram por um rasgo lateral e as fotografias deslizam como papel impresso. Na Aula da Saudade, quatro fotos entram em tempos diferentes e permanecem juntas até a saída para o acervo. A cor tem função de montagem: ciano e verde aparecem como tinta, roxo marca a mudança de assunto e o verde escuro sustenta a leitura da foto coletiva.

A posição da rolagem controla a montagem. O deslocamento tem amortecimento curto, pode ser revertido e não captura o gesto de rolar. Com movimento reduzido, os quadros aparecem em sequência normal. As composições verticais têm enquadramento próprio.

A direção aplica a hierarquia temporal, as pausas para leitura, a materialidade da colagem e as transições por estados estudadas em *Feras 26 · Referência e padrão audiovisual* e *Animação por código · Remotion, composição e direção de movimento*. O navegador usa HTML, CSS e JavaScript estáticos.

## Identidade e fotografia

- `assets/marca-garra.webp` é a matriz **Logo FERAS Agostiniano 2026 com Garras Pretas**, convertida para WebP. A arte usa a garra atrás do nome e preserva o papel claro do original.
- As etiquetas dos trotes, do Recreaço e do Day Off vêm da pasta `01_Logos_e_Titulos` do kit gráfico dos Feras.
- A prévia privada usa 23 fotos selecionadas em sete álbuns do Drive, entre os três trotes, Recreaço, Day Off, Festa Junina e Aula da Saudade. Inclui recortes de arquitetura feitos sobre essas próprias fotografias. Retratos de infância estão fora desta seleção.
- A prévia privada permite revisar enquadramento e ritmo com o acervo real. O repositório é público e guarda código, marca e grafismos. Fotografias de pessoas ficam fora do Git; só versões liberadas para o memorial público entram na etapa de publicação.

## Alimentar a versão pública

1. Exportar a seleção autorizada para `media/` conforme [o fluxo existente do Drive](importar-drive.md).
2. No [catálogo](../content/acervo.json), associar cada mídia ao acontecimento e descrever a imagem no campo `alt`.
3. Em [cenas](../content/cenas.json), apontar `planos` para as cópias aprovadas de `patio`, `patio-detalhe`, `fachada`, `trote-1` a `trote-3` e `saudade-1` a `saudade-4`. A área dos lugares lê separadamente `locais[].imagem`.
4. Conferir o recorte vertical de cada imagem e a abertura da galeria antes de integrar.

Gravações dedicadas dos espaços, portão e auditório, além de retratos e relatos próprios de professores e funcionários, continuam como conteúdo a incorporar quando estiver disponível.
