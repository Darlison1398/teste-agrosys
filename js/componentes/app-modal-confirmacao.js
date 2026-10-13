var Confirmacao = (function () {
  'use strict';

  var ID = 'modalConfirmacao';

  /** Aparência de cada tipo de confirmação. */
  var TIPOS = {
    excluir:   { icone: 'bi-trash3',               cor: 'danger',  botao: 'btn-danger',  texto: 'Excluir' },
    importar:  { icone: 'bi-database-up',          cor: 'primary', botao: 'btn-primary', texto: 'Importar' },
    descartar: { icone: 'bi-exclamation-triangle', cor: 'warning', botao: 'btn-warning', texto: 'Descartar' },
    padrao:    { icone: 'bi-question-circle',      cor: 'primary', botao: 'btn-primary', texto: 'Confirmar' }
  };

  class AppModalConfirmacao extends ComponenteBase {
    renderizar() {
      return (
        '<div class="modal fade" id="' + ID + '" tabindex="-1" aria-labelledby="' + ID + '-titulo" aria-hidden="true">' +
          '<div class="modal-dialog modal-dialog-centered modal-sm-confirmacao">' +
            '<div class="modal-content">' +
              '<div class="modal-body text-center p-4">' +
                '<div class="confirmacao-icone mb-3"><i class="bi"></i></div>' +
                '<h2 class="modal-title fs-5 mb-2" id="' + ID + '-titulo">Confirmar</h2>' +
                '<div class="confirmacao-mensagem text-muted"></div>' +
              '</div>' +
              '<div class="modal-footer justify-content-center border-0 pt-0 pb-4">' +
                '<button type="button" class="btn btn-light border px-4" data-bs-dismiss="modal">Cancelar</button>' +
                '<button type="button" class="btn px-4 btn-confirmar">Confirmar</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }
  }

  customElements.define('app-modal-confirmacao', AppModalConfirmacao);

  function abrir(opcoes) {
    opcoes = opcoes || {};
    var tipo = TIPOS[opcoes.tipo] || TIPOS.padrao;

    return new Promise(function (resolve) {
      var $modal = $('#' + ID);
      $modal.find('.modal-title').text(opcoes.titulo || 'Confirmar');
      $modal.find('.confirmacao-mensagem').html(opcoes.mensagem || '');
      $modal.find('.confirmacao-icone')
        .attr('class', 'confirmacao-icone mb-3 text-' + tipo.cor + ' bg-' + tipo.cor + '-subtle')
        .find('i').attr('class', 'bi ' + tipo.icone);

      var $btn = $modal.find('.btn-confirmar');
      $btn.text(opcoes.textoBotao || tipo.texto).attr('class', 'btn px-4 btn-confirmar ' + tipo.botao);

      var confirmado = false;
      var modal = bootstrap.Modal.getOrCreateInstance($modal[0]);

      $btn.off('click').on('click', function () {
        confirmado = true;
        modal.hide();
      });
      $modal.off('shown.bs.modal').on('shown.bs.modal', function () { $btn.trigger('focus'); });
      $modal.off('hidden.bs.modal').on('hidden.bs.modal', function () {
        // Mantém o bloqueio de rolagem se houver outro modal aberto por baixo.
        if ($('.modal.show').length) $('body').addClass('modal-open');
        resolve(confirmado);
      });
      modal.show();
    });
  }

  return { abrir: abrir };
})();
