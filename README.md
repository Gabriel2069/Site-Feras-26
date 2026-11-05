# FERAS 26 · Depois do Sinal

Memorial audiovisual do Terceirão do Agostiniano 2026.

**Estado:** fundação e primeiro protótipo. A experiência visual já funciona, mas ainda não representa o memorial final. Fotografias dos estudantes, vídeos oficiais, relatos e depoimentos só serão publicados após triagem, autorização e edição.

## Princípio editorial

Não tratar a turma como uma peça publicitária. Narrar o que realmente aconteceu por meio de lugares, sons, objetos e pessoas. A voz deve parecer a de quem esteve lá, não a de uma instituição falando em nome de todos.

- Sem frases vagas de homenagem, superlativos ou promessas de emoção.
- Nenhuma fala, história, data ou característica pessoal inventada.
- Humor espontâneo quando couber; espaço para silêncio quando necessário.
- Professores e funcionários merecem espaço próprio e não figurativo.
- Legendas breves junto às cenas. Histórias completas nos capítulos e retratos.
- Textos finais serão revisados com integrantes da turma.

## Experiência

1. **Jornada:** prólogo, antes do terceiro ano, espaços, eventos, pessoas, cotidiano, despedida.
2. **Explorar:** acontecimentos, lugares e pessoas sem precisar seguir a ordem do filme.
3. **Acervo:** mídias organizadas, autoria, data e autorizações rastreáveis.

## Arquitetura deste início

- HTML/CSS/JS estáticos, sem login, servidor ou banco de dados.
- Componentes de rolagem e montagem responsiva, com alternativa de movimento reduzido.
- Arquivo `content/acervo.json` para dados editoriais e imagens autorizadas.
- `assets/feras26.png` do kit gráfico original fornecido pela organização.
- `docs/roteiro-editorial.md` contém as cenas propostas e lacunas a preencher.
- Não colocamos imagens pessoais no repositório público.

A arquitetura pode evoluir para Astro e GSAP quando o roteiro audiovisual e as filmagens reais estiverem consolidados. Os arquivos atuais são inteiramente editáveis e não dependem de bibliotecas externas para funcionar; a fonte pode ser carregada do Google Fonts.

## Publicação Cloudflare Pages

1. **Workers & Pages → Create application → Pages → Connect to Git**.
2. Escolha `Gabriel2069/SiteFeras`, branch `main`.
3. **Framework preset:** None; **Build command:** `exit 0`; **Output directory:** `.`.
4. Publique e teste a URL fornecida pela Cloudflare. Commits seguintes podem gerar novas versões automaticamente.

**Cuidado:** este repositório é público. Conectar o Google Drive não significa tornar todo o conteúdo dele publicável. A integração deverá selecionar um conjunto autorizado, exportar versões de exibição e produzir um manifesto público; imagens privadas e credenciais não entram no GitHub.

## Adicionar mídias

Em `content/acervo.json`, cada capítulo contém um campo `midias`. Só adicione caminhos para arquivos dentro de `media/` depois de obter autorização apropriada para o memorial público; os detalhes de origem e consentimento são documentados fora do repositório público.

Arquivos futuros que ainda não chegaram do marketing escolar ou das gravações de ambiente aparecem como **em preparação**, nunca como fatos concluídos.

## Próximas prioridades

- Levantamento de pessoas, lugares, histórias e captação complementar.
- Prova cinematográfica com fotografias reais e sons autorizados do colégio.
- Integração de publicação do Drive para Cloudflare R2, com seleção editorial e consentimento.
- Testes de desempenho em iPhone/iPad e ajustes de escrita com alunos, professores e funcionários.
