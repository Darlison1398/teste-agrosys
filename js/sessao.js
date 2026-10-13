var Sessao = (function () {
  'use strict';

  var CHAVE = 'agrosys.sessao';

  function iniciar(usuario) {
    sessionStorage.setItem(CHAVE, JSON.stringify({ id: usuario.id, inicio: new Date().toISOString() }));
  }

  function encerrar() {
    sessionStorage.removeItem(CHAVE);
  }

  /** Retorna o usuário logado (validando que ele ainda existe no banco). */
  function usuarioAtual() {
    try {
      var dados = JSON.parse(sessionStorage.getItem(CHAVE));
      return dados && dados.id ? DB.buscarUsuarioPorId(dados.id) : null;
    } catch (e) {
      return null;
    }
  }

  return { iniciar: iniciar, encerrar: encerrar, usuarioAtual: usuarioAtual };
})();
