# Publicação imediata no mural · 19/11/2026

Mandato: Tadeu pediu remover a revisão manual e manter a censura de ofensas.

Novas mensagens passam pelo filtro lexical do banco, substituindo termos ofensivos por *** no texto e na assinatura. A publicação é imediata e a interface exibe a resposta já filtrada, preservando o botão Apagar com validação de senha.

O filtro usa limites de palavras para não alterar trechos internos de palavras comuns. Não interpreta toda ofensa dependente de contexto, ironia ou grafia disfarçada. Nenhuma API de IA ou serviço adicional é utilizado.

Duas mensagens antigas permanecem pendentes. A tentativa inicial de liberá-las foi rejeitada pela revisão automática por ausência de autorização específica de divulgação retroativa. A migração aplicada não as altera. As mensagens removidas continuam fora do mural.

Testes de texto comum, ofensa explícita, falsos positivos e inserção com papel anon foram executados em transação revertida, sem publicar teste real. A revisão de interface usa respostas simuladas do servidor.
