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

## Continuação: da cena ao álbum

Na sequência da Aula da Saudade, “Ver as fotos” leva ao álbum daquele dia. A área da escola usa os registros reais de pátio e salas na prévia privada. As capas dos acontecimentos ampliam a imagem de cada álbum, e a mesa de fotos alterna um quadro maior com conjuntos de registros menores.

Ao selecionar um registro, o visor abre naquele item e permite percorrer o álbum por setas, miniaturas ou teclado. Fotos e vídeos usam a proporção original no visor. Fechar devolve o foco à foto ou à capa do acontecimento que abriu o visor.

## Continuação editorial: o que ficou fora da foto

O memorial ganhou capítulos para a infância, as pessoas e a despedida. A ação de reunir fotos de infância aparece apenas como história da turma. As imagens continuam fora do site. A homenagem inicial registra a escolha da música do baile pela professora Aryana, tradição relatada pelo representante. O capítulo do aulão usa o horário e o ponto de encontro do aviso original. As legendas dos sete álbuns partem dos nomes dos eventos e dos registros selecionados.

O caderno de memórias gera um arquivo de texto no aparelho do visitante. O formulário não salva nem envia dados. A turma pode enviar o arquivo aos representantes, que decidem o que entra no memorial junto com quem fez o relato. Perfis adicionais, falas, imagens de infância e registros da cerimônia continuam dependendo de material próprio e autorização.

## História contada pelos Feras

O relato do Tadeu organiza a passagem do encerramento do JICA ao último semestre: anúncio da identidade, estreia do andar, camisa, provas e simulados, últimos rituais e despedidas. O texto preserva os detalhes da turma, como os ensaios de sexta, o Manteigão, a pergunta da Juju e a última aula do André. “Metralhadora” é citada como a música escolhida pela professora Aryana. O vídeo e a faixa seguem fora do código até haver arquivo e autorização adequados.

A escola tem nove lugares, incluindo Guarita e Salão de Palestras como ambientes próprios. Os planos que Tadeu ainda vai fotografar entram pelo campo `imagem` em `content/cenas.json`. Os retratos da equipe e os nomes dos Feras de Medalha entram quando forem enviados.

Os Mini Feras usam a estrutura e os estilos das Polaroids do mural original. A galeria integrada lê `content/mini-feras.json`, com `nome`, `apelido` e o caminho `src` de cada imagem em `media/mini-feras/`. A prévia privada incorpora os arquivos; o manifest versionado no repositório público fica vazio até a publicação das cópias autorizadas. O álbum geral apresenta lotes de 42 registros por filtro. A paginação organiza o carregamento e mantém os registros restantes acessíveis pelo botão “Mostrar mais fotos”.

## Ampliação da linha do tempo e do acervo

A narrativa ganhou o convite à Poly, Feira de Ciências, Espaço das Profissões, Maratona UFG, Time Olímpico e aprovações. A homenagem à Aryana inclui a surpresa da turma. Os agradecimentos distinguem professores, funcionários, representantes e vices. A despedida acompanha o fim das provas, os Sprints, André, Juju, a Aula da Saudade e a música do baile.

As variantes clara e escura da marca com garra usam transparência. O mosaico do ano usa fotos de capítulos do acervo quando disponíveis, carregadas pelo mesmo catálogo do álbum. As mídias continuam privadas na prévia. As subdivisões do Drive foram aplicadas por evidência visual ou contexto de data e pasta. A triagem de outros registros continua em aberto.

## Linha do tempo em sequência única

A história do terceirão, antes distribuída entre abertura editorial, capítulos avulsos, faixa horizontal e despedida, agora segue numa seção vertical. Os períodos separam JICA de 2025, começo de 2026, maio e junho, volta das férias, outubro e reta final. O convite à Poly e as maratonas aparecem numa entrada do segundo semestre com datas ainda a confirmar. Os registros datados do acervo orientaram a ordenação dos momentos de outubro, sem atribuição de dia exato aos eventos.

As fotos da linha do tempo são lidas pelo catálogo do álbum. Os registros de começo de ano são ligados por `planos.turma-comeco-1` e `planos.turma-comeco-2`. O quadro de agradecimento espera a foto coletiva dos funcionários em `planos.foto-funcionarios`; a imagem só substitui o espaço reservado depois de carregar. Os Mini Feras abrem no capítulo da camisa e mantêm o acesso pelo menu.

## Colagens da linha do tempo

Outubro volta a ter uma montagem lateral dentro da ordem do ano. Cinco cenas reúnem fotos do acervo e recortes do kit original. Em telas amplas com espaço vertical suficiente, a posição da rolagem conduz o deslocamento. As abas, as setas e o teclado permitem escolher uma cena. No toque e com movimento reduzido, a faixa usa rolagem horizontal nativa.

A apresentação da marca, as fotos da camisa, a Festa Junina, a Feira, o convite à Poly e a Aula da Saudade ganharam composições próprias. Os textos acompanham o ano da turma. A despedida do André, o convite à madrinha e a escolha da música pela Ary entram nos acontecimentos correspondentes. A lembrança do Bohr aparece brevemente à margem da cronologia. O quadro da comunidade de WhatsApp saiu da seção de pessoas, que continua reservando o espaço para a foto dos funcionários.

## Abertura a partir das referências de 12/11

A demonstração de movimento orienta a sobreposição das transições. A cartela âmbar abre por um rasgo de papel. Um recorte orgânico revela a turma e os azulejos entram em sequência. A mancha azul e verde atravessa o quadro para abrir a faixa de trotes. O mosaico fecha em oito peças e se abre sobre as fotos da Aula da Saudade. O papel claro, os arcos, os triângulos, os pontos e os raios vieram das artes de identidade. O vídeo da turma orienta as cores e o enquadramento de fotos como papel recortado. Os vídeos de referência não integram a distribuição do memorial.

A animação acompanha o mesmo progresso nos dois sentidos de rolagem. Os quatro quadros têm composição estática quando a preferência de movimento reduzido está ativa.

## Revisão de fotos, legendas e leitura

A seleção da linha do tempo usa o caminho de cada foto no álbum. Isso mantém a legenda ligada à imagem quando o catálogo muda de ordem. As legendas das fotos selecionadas aparecem também no visor. Os botões de álbum dizem quais fotos abrem. Os textos do JICA, da camisa, da Junina, da despedida e das aprovações retomam o relato da turma com frases mais curtas.

## Mural, revisão editorial e seleção

O mural guarda lembranças no navegador por padrão. Para compartilhar entre dispositivos, execute `supabase/feras_memorias.sql` no projeto dedicado e defina `window.ferasMemorias = {url: "https://SEU_PROJETO.supabase.co", key: "sb_publishable_..."}` antes de `main.js`. A tabela precisa estar exposta pela Data API. A chave deve ser publicável. As submissões começam pendentes e somente as aprovadas aparecem no mural. A aprovação pode ser feita na tabela por quem administra o projeto. Os relatos locais continuam no navegador e não são enviados automaticamente.

A montagem de outubro encerra no Day-Off, após o terceiro trote. A ordem do álbum geral alterna eventos e intercala séries de câmera. Os Mini Feras mantêm o álbum em ordem de nome, com um modo de adivinhação embaralhado. As fotos e nomes do Drive privado são incorporados à prévia. Os manifestos públicos permanecem preparados para receber mídias liberadas.

## Cartela e álbum aberto

A cartela da abertura segue o ritmo do vídeo da Aryana, com três linhas digitadas e cursor em bloco. A rolagem é liberada ao final. A preferência por movimento reduzido e a abertura de links para capítulos mostram a página sem espera. O plano `turma-abertura` recebe a foto coletiva selecionada para a abertura. A prévia privada usa o registro mais cheio entre as fotos coletivas comparadas.

O visor usa a composição de um álbum aberto, com miolo de papel, cantoneiras, elementos do mosaico e miniaturas. A foto preserva sua proporção. O visor mantém navegação por teclado e volta ao ponto em que foi aberto.
