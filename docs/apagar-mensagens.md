# Apagar mensagens do mural · 19/11/2026

Mandato: botão para apagar uma mensagem, com confirmação por senha escolhida por Tadeu.

A senha é verificada na RPC feras_apagar_memoria, com hash bcrypt em tabela privada. Nenhuma senha é incorporada à página, aos scripts ou ao Git. A configuração inicial foi feita separadamente no banco.

Cada confirmação afeta somente o ID selecionado. A mensagem sai da leitura pública por deleted_at, preservando recuperação administrativa. Leitura pública continua restrita às mensagens aprovadas e ativas. Não foram concedidos UPDATE ou DELETE diretos. Cancelamento, senha incorreta, falha de rede e limite de dez falhas por minuto mantêm a mensagem.

O formulário é modal, com campo de senha, retorno de erro e foco acessível. Mensagens antigas salvas no navegador também exigem validação do servidor antes de sair do armazenamento local. A senha é apagada do campo ao fechar ou finalizar a tentativa.

Verificações: sintaxe, revisão distinta de código e transações revertidas com mensagem sintética para senha errada, correta, repetição e limite de tentativas. Nenhuma mensagem real foi removida nos testes.

Advisors: as tabelas privadas têm RLS sem políticas, bloqueando acesso direto. A RPC SECURITY DEFINER é deliberadamente acessível a visitantes para a confirmação por senha; seu escopo é limitado a um ID, com validação anterior à escrita e search_path vazio. Os avisos genéricos sobre RPC privilegiada são esperados nesse modelo de confirmação sem login. Referência https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable .
