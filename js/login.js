$(function () {
  'use strict';

  DB.iniciar();

  // Já está logado? Vai direto para o sistema.
  if (Sessao.usuarioAtual()) {
    window.location.replace('app.html');
    return;
  }

  var $formLogin = $('#form-login');
  var $formCadastro = $('#form-cadastro');
  var $erroLogin = $('#login-erro');

  $('input').on('input', function () { $(this).removeClass('is-invalid'); $erroLogin.addClass('d-none'); });

  /* ---------------------------------- Login ---------------------------------- */
  $formLogin.on('submit', function (e) {
    e.preventDefault();
    Utils.limparValidacao($formLogin);

    var $usuario = $('#login-usuario');
    var $senha = $('#login-senha');
    var valido = true;

    if (!$usuario.val().trim()) { Utils.marcarInvalido($usuario); valido = false; }
    if (!$senha.val()) { Utils.marcarInvalido($senha); valido = false; }
    if (!valido) return;

    var usuario = DB.autenticar($usuario.val(), $senha.val());
    if (!usuario) {
      $erroLogin.html('<i class="bi bi-exclamation-circle me-1"></i> Usuário ou senha inválidos.').removeClass('d-none');
      $senha.val('').trigger('focus');
      return;
    }

    Sessao.iniciar(usuario);
    window.location.href = 'app.html';
  });

  /* ------------------------------ Cadastro de usuário ------------------------------ */
  $formCadastro.on('submit', function (e) {
    e.preventDefault();
    Utils.limparValidacao($formCadastro);

    var dados = {
      nome: $('#cad-nome').val(),
      usuario: $('#cad-usuario').val(),
      senha: $('#cad-senha').val()
    };

    if (dados.senha !== $('#cad-confirmacao').val()) {
      Utils.marcarInvalido($('#cad-confirmacao'), 'As senhas não conferem.');
      return;
    }

    try {
      var usuario = DB.cadastrarUsuario(dados);
      Aviso.criado('Usuário "' + usuario.usuario + '" cadastrado! Faça login para continuar.', 'Conta criada');
      $formCadastro[0].reset();
      bootstrap.Tab.getOrCreateInstance($('#aba-login')[0]).show();
      $('#login-usuario').val(usuario.usuario);
      setTimeout(function () { $('#login-senha').trigger('focus'); }, 200);
    } catch (erro) {
      if (erro instanceof DB.ErroValidacao) {
        var mapa = { nome: '#cad-nome', usuario: '#cad-usuario', senha: '#cad-senha' };
        if (erro.campo && mapa[erro.campo]) Utils.marcarInvalido($(mapa[erro.campo]), erro.message);
        else Aviso.erro(erro.message);
      } else {
        console.error(erro);
        Aviso.erro('Erro inesperado ao cadastrar usuário.');
      }
    }
  });

  /* ------------------------------- Configurações ------------------------------- */
  function atualizarEstatisticas() {
    var est = DB.estatisticas();
    $('#estatisticas-banco [data-tabela]').each(function () {
      $(this).text(est[$(this).data('tabela')]);
    });
  }

  $('#modalConfiguracoes').on('show.bs.modal', atualizarEstatisticas);

  BancoArquivo.configurarUpload({
    $zona: $('#zona-upload'),
    $input: $('#arquivo-banco'),
    $nome: $('#nome-arquivo'),
    $botao: $('#btn-importar'),
    aoImportar: atualizarEstatisticas
  });

  $('#btn-exportar').on('click', function () { BancoArquivo.exportar(); });
});
