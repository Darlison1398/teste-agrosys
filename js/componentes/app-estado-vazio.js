(function () {
  'use strict';

  class AppEstadoVazio extends ComponenteBase {
    renderizar(conteudo) {
      return (
        '<div class="estado-vazio' + (this.attr('tom') === 'alerta' ? ' estado-vazio-alerta' : '') + '">' +
          '<i class="bi ' + this.attrSeguro('icone', 'bi-inbox') + '"></i>' +
          '<p class="mb-2 estado-vazio-mensagem">' + this.attrSeguro('mensagem') + '</p>' +
          conteudo +
        '</div>'
      );
    }

    definirMensagem(texto) {
      this.querySelector('.estado-vazio-mensagem').textContent = texto;
    }

    exibir(visivel) {
      this.classList.toggle('d-none', !visivel);
    }
  }

  customElements.define('app-estado-vazio', AppEstadoVazio);
})();
