/**
 * banco-arquivo.js
 * Exportação (download JSON) e importação (upload JSON) do banco de dados.
 */
var BancoArquivo = (function () {
  'use strict';

  /**
   * Gera o download do JSON.
   * @param {string} [json]    conteúdo; padrão: banco completo (DB.exportar)
   * @param {string} [prefixo] início do nome do arquivo
   */
  function exportar(json, prefixo) {
    try {
      if (typeof json !== 'string') json = DB.exportar();
      var data = new Date();
      var carimbo = data.getFullYear() +
        String(data.getMonth() + 1).padStart(2, '0') +
        String(data.getDate()).padStart(2, '0') + '-' +
        String(data.getHours()).padStart(2, '0') +
        String(data.getMinutes()).padStart(2, '0');
      Utils.baixarArquivo(json, (prefixo || 'agrosys-banco') + '-' + carimbo + '.json', 'application/json');
      Aviso.sucesso('O arquivo JSON foi gerado e o download iniciado.', 'Banco exportado');
    } catch (e) {
      console.error(e);
      Aviso.erro('Erro ao exportar o banco de dados.');
    }
  }

  /**
   * Liga os elementos de upload (zona de arrastar/soltar, input file e botão).
   * @param {object} opcoes { $zona, $input, $nome, $botao, aoImportar }
   */
  function configurarUpload(opcoes) {
    var arquivoSelecionado = null;

    function selecionar(arquivo) {
      if (!arquivo) return;
      if (!/\.json$/i.test(arquivo.name)) {
        Aviso.alerta('Selecione um arquivo com extensão .json.');
        return;
      }
      arquivoSelecionado = arquivo;
      opcoes.$nome.html('<i class="bi bi-file-earmark-code me-1"></i>' + Utils.escapeHtml(arquivo.name));
      opcoes.$zona.addClass('selecionado');
      opcoes.$botao.prop('disabled', false);
    }

    function limpar() {
      arquivoSelecionado = null;
      opcoes.$input.val('');
      opcoes.$nome.text('Clique ou arraste um arquivo JSON aqui');
      opcoes.$zona.removeClass('selecionado');
      opcoes.$botao.prop('disabled', true);
    }

    opcoes.$zona.on('click', function () { opcoes.$input.trigger('click'); });
    opcoes.$zona.on('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); opcoes.$input.trigger('click'); }
    });
    opcoes.$zona.on('dragover dragenter', function (e) {
      e.preventDefault();
      opcoes.$zona.addClass('arrastando');
    });
    opcoes.$zona.on('dragleave drop', function (e) {
      e.preventDefault();
      opcoes.$zona.removeClass('arrastando');
      if (e.type === 'drop') selecionar(e.originalEvent.dataTransfer.files[0]);
    });
    opcoes.$input.on('change', function () { selecionar(this.files[0]); });

    opcoes.$botao.on('click', function () {
      if (!arquivoSelecionado) return;
      Confirmacao.abrir({
        tipo: 'importar',
        titulo: 'Importar banco de dados?',
        mensagem: 'Todos os dados atuais (usuários, clientes e endereços) serão <strong>substituídos</strong> pelo conteúdo de <code>' +
          Utils.escapeHtml(arquivoSelecionado.name) + '</code>.'
      }).then(function (ok) {
        if (!ok) return;
        return Utils.lerArquivoTexto(arquivoSelecionado).then(function (conteudo) {
          var r = DB.importar(conteudo);
          Aviso.sucesso(r.usuarios + ' usuário(s), ' + r.clientes + ' cliente(s) e ' + r.enderecos + ' endereço(s).', 'Banco importado');
          limpar();
          if (opcoes.aoImportar) opcoes.aoImportar(r);
        });
      }).catch(function (e) {
        console.error(e);
        Aviso.erro(e instanceof DB.ErroValidacao ? e.message : 'Erro ao importar o arquivo.', 'Falha na importação');
      });
    });

    return { limpar: limpar };
  }

  return { exportar: exportar, configurarUpload: configurarUpload };
})();
