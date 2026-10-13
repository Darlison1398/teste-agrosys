var Aviso = (function () {
  'use strict';

  var DURACAO = 4000;

  var TIPOS = {
    criado:  { titulo: 'Cadastrado', icone: 'bi-plus-circle-fill',          classe: 'aviso-criado' },
    editado: { titulo: 'Atualizado', icone: 'bi-pencil-square',             classe: 'aviso-editado' },
    excluido:{ titulo: 'Excluído',   icone: 'bi-trash3-fill',               classe: 'aviso-excluido' },
    sucesso: { titulo: 'Sucesso',    icone: 'bi-check-circle-fill',         classe: 'aviso-criado' },
    erro:    { titulo: 'Erro',       icone: 'bi-x-octagon-fill',            classe: 'aviso-erro' },
    alerta:  { titulo: 'Atenção',    icone: 'bi-exclamation-triangle-fill', classe: 'aviso-alerta' },
    info:    { titulo: 'Informação', icone: 'bi-info-circle-fill',          classe: 'aviso-info' }
  };

  function container() {
    var $c = $('#aviso-container');
    if (!$c.length) {
      $c = $('<div id="aviso-container" class="toast-container position-fixed bottom-0 end-0 p-3" aria-live="polite"></div>');
      $('body').append($c);
    }
    return $c;
  }

  /**
   * Exibe uma notificação.
   * @param {string} tipo     chave de TIPOS
   * @param {string} mensagem texto (será escapado)
   * @param {string} [titulo] substitui o título padrão do tipo
   */
  function mostrar(tipo, mensagem, titulo) {
    var t = TIPOS[tipo] || TIPOS.info;
    var $toast = $(
      '<div class="toast aviso ' + t.classe + '" role="' + (tipo === 'erro' ? 'alert' : 'status') + '" aria-atomic="true">' +
        '<div class="d-flex align-items-start p-3 gap-3">' +
          '<i class="bi ' + t.icone + ' aviso-icone"></i>' +
          '<div class="flex-grow-1">' +
            '<strong class="d-block">' + Utils.escapeHtml(titulo || t.titulo) + '</strong>' +
            '<span class="small">' + Utils.escapeHtml(mensagem) + '</span>' +
          '</div>' +
          '<button type="button" class="btn-close btn-sm" data-bs-dismiss="toast" aria-label="Fechar"></button>' +
        '</div>' +
        '<div class="aviso-progresso"><span style="animation-duration:' + DURACAO + 'ms"></span></div>' +
      '</div>'
    );
    container().append($toast);
    var instancia = new bootstrap.Toast($toast[0], { delay: DURACAO });
    $toast.on('hidden.bs.toast', function () { $toast.remove(); });
    // Pausa a barra de tempo enquanto o mouse estiver sobre o aviso.
    $toast.on('mouseenter', function () { $toast.addClass('pausado'); })
          .on('mouseleave', function () { $toast.removeClass('pausado'); });
    instancia.show();
  }

  /** Realça os elementos indicados com uma animação (criado | editado). */
  function destacar(seletor, tipo) {
    var classe = tipo === 'editado' ? 'destaque-editado' : 'destaque-criado';
    var $el = $(seletor).filter(':visible');
    if (!$el.length) return;
    $el.removeClass('destaque-criado destaque-editado');
    void $el[0].offsetWidth; // reinicia a animação
    $el.addClass(classe);
    $el[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    setTimeout(function () { $el.removeClass(classe); }, 2200);
  }

  /** Anima a saída dos elementos (exclusão). Resolve quando terminar. */
  function animarSaida(seletor) {
    return new Promise(function (resolve) {
      var $el = $(seletor);
      if (!$el.length) return resolve();
      $el.addClass('saindo');
      setTimeout(resolve, 450);
    });
  }

  var api = { mostrar: mostrar, destacar: destacar, animarSaida: animarSaida };
  Object.keys(TIPOS).forEach(function (tipo) {
    api[tipo] = function (mensagem, titulo) { mostrar(tipo, mensagem, titulo); };
  });
  return api;
})();
