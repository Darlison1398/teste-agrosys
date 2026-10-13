(function () {
  'use strict';

  class AppCampoSenha extends ComponenteBase {
    renderizar() {
      var id = this.attrSeguro('campo-id');
      var icone = this.attr('icone') ? '<i class="bi ' + this.attrSeguro('icone') + ' me-1"></i> ' : '';
      var rotulo = this.attrSeguro('rotulo', 'Senha');
      return (
        '<div class="form-floating mb-3 campo-senha">' +
          '<input type="password" class="form-control" id="' + id + '" name="' + this.attrSeguro('nome', 'senha') + '"' +
          ' placeholder="' + rotulo + '" autocomplete="' + this.attrSeguro('autocomplete', 'current-password') + '" required>' +
          '<label for="' + id + '">' + icone + rotulo + '</label>' +
          '<button type="button" class="btn btn-link btn-ver-senha" aria-label="Mostrar senha"><i class="bi bi-eye"></i></button>' +
          '<div class="invalid-feedback">' + this.attrSeguro('erro', 'Informe a senha.') + '</div>' +
        '</div>'
      );
    }

    aposRenderizar() {
      var input = this.querySelector('input');
      var botao = this.querySelector('.btn-ver-senha');
      botao.addEventListener('click', function () {
        var mostrar = input.type === 'password';
        input.type = mostrar ? 'text' : 'password';
        botao.querySelector('i').className = 'bi ' + (mostrar ? 'bi-eye-slash' : 'bi-eye');
        botao.setAttribute('aria-label', mostrar ? 'Ocultar senha' : 'Mostrar senha');
        input.focus();
      });
    }
  }

  customElements.define('app-campo-senha', AppCampoSenha);
})();
