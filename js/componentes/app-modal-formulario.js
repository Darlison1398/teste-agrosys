(function () {
  'use strict';

  class AppModalFormulario extends ComponenteBase {
    renderizar(campos) {
      var modalId = this.attrSeguro('modal-id');
      var icone = this.attr('icone') ? '<i class="bi ' + this.attrSeguro('icone') + ' me-2 text-success"></i>' : '';
      return (
        '<div class="modal fade" id="' + modalId + '" tabindex="-1" aria-labelledby="' + modalId + '-titulo" aria-hidden="true" data-bs-backdrop="static">' +
          '<div class="modal-dialog modal-dialog-centered modal-lg modal-fullscreen-sm-down">' +
            '<form class="modal-content" id="' + this.attrSeguro('form-id') + '" novalidate autocomplete="off">' +
              '<div class="modal-header">' +
                '<h2 class="modal-title fs-5 d-flex align-items-center flex-wrap gap-2" id="' + modalId + '-titulo">' +
                  icone + '<span class="modal-formulario-titulo">' + this.attrSeguro('titulo') + '</span>' +
                  '<span class="badge modal-formulario-modo d-none"></span>' +
                '</h2>' +
                '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>' +
              '</div>' +
              '<div class="modal-body">' +
                campos +
                '<p class="small text-muted mt-3 mb-0"><span class="text-danger">*</span> Campos obrigatórios</p>' +
              '</div>' +
              '<div class="modal-footer">' +
                '<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>' +
                '<button type="submit" class="btn btn-success btn-salvar"><i class="bi bi-check-lg me-1"></i> <span>Salvar</span></button>' +
              '</div>' +
            '</form>' +
          '</div>' +
        '</div>'
      );
    }

    aposRenderizar() {
      var self = this;
      this.$modal = $(this).children('.modal');
      this.$form = this.$modal.find('form');
      this.modal = bootstrap.Modal.getOrCreateInstance(this.$modal[0]);
      this._podeFechar = false;

      // Foto do formulário ao abrir, para detectar alterações.
      this.$modal.on('show.bs.modal', function (e) {
        if (e.target !== self.$modal[0]) return;
        self._podeFechar = false;
        self._estadoInicial = self.$form.serialize();
      });

      // Pergunta antes de descartar alterações não salvas.
      this.$modal.on('hide.bs.modal', function (e) {
        if (e.target !== self.$modal[0] || self._podeFechar) return;
        if (self.$form.serialize() === self._estadoInicial) return;
        e.preventDefault();
        Confirmacao.abrir({
          tipo: 'descartar',
          titulo: 'Descartar alterações?',
          mensagem: 'Existem alterações que ainda não foram salvas. Deseja sair mesmo assim?'
        }).then(function (ok) { if (ok) self.fechar(); });
      });
    }

    /** Ajusta o título e o selo indicando se é inclusão ou edição. */
    definirModo(modo, titulo) {
      var editar = modo === 'editar';
      this.$modal.find('.modal-formulario-titulo').text(titulo);
      this.$modal.find('.modal-formulario-modo')
        .removeClass('d-none text-bg-success text-bg-primary')
        .addClass(editar ? 'text-bg-primary' : 'text-bg-success')
        .html(editar ? '<i class="bi bi-pencil me-1"></i>Editando' : '<i class="bi bi-plus-lg me-1"></i>Novo');
      this.$modal.find('.btn-salvar span').text(editar ? 'Salvar alterações' : 'Cadastrar');
    }

    abrir() {
      this.modal.show();
    }
    fechar() {
      this._podeFechar = true;
      this.modal.hide();
    }
  }

  customElements.define('app-modal-formulario', AppModalFormulario);
})();
