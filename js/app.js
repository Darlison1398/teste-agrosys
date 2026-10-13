/**
 * app.js
 * Inicialização da área logada: proteção de acesso, navegação entre as
 * telas (via hash da URL) e ações globais (exportar banco / sair).
 *
 * Rotas:
 *   #             -> listagem de clientes
 *   #cliente/{id} -> endereços do cliente
 */
$(function () {
  'use strict';

  DB.iniciar();

  var usuario = Sessao.usuarioAtual();
  if (!usuario) {
    window.location.replace('index.html');
    return;
  }

  $('#nome-usuario').text(usuario.nome.split(' ')[0]);
  $('#login-usuario').text(usuario.nome + ' (@' + usuario.usuario + ')');

  // Todas as telas usam apenas os dados do usuário logado.
  var dados = DB.doUsuario(usuario.id);
  Clientes.iniciar(dados);
  Enderecos.iniciar(dados);

  function navegar() {
    var rota = window.location.hash.replace(/^#\/?/, '');
    var m = rota.match(/^cliente\/(\d+)$/);

    // Fecha qualquer modal aberto ao trocar de tela.
    $('.modal.show').each(function () {
      var formulario = $(this).closest('app-modal-formulario')[0];
      if (formulario) formulario.fechar();
      else bootstrap.Modal.getInstance(this).hide();
    });

    if (m && Enderecos.mostrar(Number(m[1]))) {
      $('#view-clientes').addClass('d-none');
      $('#view-enderecos').removeClass('d-none');
      document.title = 'Endereços | Agrosys';
    } else {
      if (m) {
        Aviso.alerta('O cliente solicitado não existe ou foi excluído.', 'Cliente não encontrado');
        history.replaceState(null, '', window.location.pathname);
      }
      Clientes.renderizar();
      $('#view-enderecos').addClass('d-none');
      $('#view-clientes').removeClass('d-none');
      document.title = 'Clientes | Agrosys';
    }
    window.scrollTo(0, 0);
  }

  $(window).on('hashchange', navegar);
  navegar();

  // Na área logada, exporta somente os dados do próprio usuário.
  $('#btn-exportar').on('click', function () {
    BancoArquivo.exportar(dados.exportar(), 'agrosys-' + usuario.usuario);
  });

  $('#btn-sair').on('click', function () {
    Sessao.encerrar();
    window.location.replace('index.html');
  });
});
