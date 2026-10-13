var Utils = (function () {
  'use strict';

  /* ------------------------------------------------------------------ *
   * Strings / HTML
   * ------------------------------------------------------------------ */

  /** Escapa caracteres especiais para evitar injeção de HTML (XSS). */
  function escapeHtml(valor) {
    if (valor === null || valor === undefined) return '';
    return String(valor)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /** Mantém apenas os dígitos de uma string. */
  function somenteDigitos(valor) {
    return String(valor || '').replace(/\D/g, '');
  }

  /** Remove acentos e coloca em minúsculas (usado na busca). */
  function normalizar(valor) {
    return String(valor || '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .trim();
  }

  /* ------------------------------------------------------------------ *
   * Máscaras
   * ------------------------------------------------------------------ */

  function mascaraCPF(valor) {
    var d = somenteDigitos(valor).slice(0, 11);
    return d
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2');
  }

  /** Telefone fixo: (00) 0000-0000 */
  function mascaraTelefone(valor) {
    var d = somenteDigitos(valor).slice(0, 10);
    if (d.length <= 2) return d.length ? '(' + d : '';
    if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
  }

  /** Celular: (00) 00000-0000 */
  function mascaraCelular(valor) {
    var d = somenteDigitos(valor).slice(0, 11);
    if (d.length <= 2) return d.length ? '(' + d : '';
    if (d.length <= 7) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
  }

  function mascaraCEP(valor) {
    var d = somenteDigitos(valor).slice(0, 8);
    return d.length > 5 ? d.slice(0, 5) + '-' + d.slice(5) : d;
  }

  /* ------------------------------------------------------------------ *
   * Validações
   * ------------------------------------------------------------------ */

  /** Valida CPF pelos dígitos verificadores. */
  function validarCPF(valor) {
    var cpf = somenteDigitos(valor);
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

    var soma = 0, resto, i;
    for (i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i), 10) * (10 - i);
    resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;
    if (resto !== parseInt(cpf.charAt(9), 10)) return false;

    soma = 0;
    for (i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i), 10) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;
    return resto === parseInt(cpf.charAt(10), 10);
  }

  function validarTelefone(valor) {
    return somenteDigitos(valor).length === 10;
  }

  function validarCelular(valor) {
    var d = somenteDigitos(valor);
    return d.length === 11 && d.charAt(2) === '9';
  }

  function validarCEP(valor) {
    return somenteDigitos(valor).length === 8;
  }

  /* ------------------------------------------------------------------ *
   * Datas
   * ------------------------------------------------------------------ */

  /** Data de hoje no formato ISO (AAAA-MM-DD), no fuso local. */
  function hojeISO() {
    var d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  /** AAAA-MM-DD -> DD/MM/AAAA */
  function formatarData(iso) {
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || '';
    var p = iso.split('-');
    return p[2] + '/' + p[1] + '/' + p[0];
  }

  function calcularIdade(iso) {
    if (!iso) return null;
    var p = iso.split('-').map(Number);
    var hoje = new Date();
    var idade = hoje.getFullYear() - p[0];
    var m = hoje.getMonth() + 1 - p[1];
    if (m < 0 || (m === 0 && hoje.getDate() < p[2])) idade--;
    return idade;
  }

  function validarDataNascimento(iso) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || '')) return false;
    var p = iso.split('-').map(Number);
    var d = new Date(p[0], p[1] - 1, p[2]);
    var valida = d.getFullYear() === p[0] && d.getMonth() === p[1] - 1 && d.getDate() === p[2];
    return valida && iso <= hojeISO() && p[0] >= 1900;
  }

  /* ------------------------------------------------------------------ *
   * Hash de senha (SHA-256 em JavaScript puro)
   * Implementação síncrona para funcionar também via file://, onde a
   * Web Crypto API (crypto.subtle) pode não estar disponível.
   * ------------------------------------------------------------------ */
  function sha256(texto) {
    function rotr(n, x) { return (x >>> n) | (x << (32 - n)); }

    var K = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];
    var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];

    // UTF-8
    var bytes = [];
    var utf8 = unescape(encodeURIComponent(String(texto)));
    for (var i = 0; i < utf8.length; i++) bytes.push(utf8.charCodeAt(i));

    var bitLen = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    for (i = 7; i >= 0; i--) bytes.push(i >= 4 ? 0 : (bitLen >>> (i * 8)) & 0xff);

    var W = new Array(64);
    for (var off = 0; off < bytes.length; off += 64) {
      for (i = 0; i < 16; i++) {
        W[i] = (bytes[off + i * 4] << 24) | (bytes[off + i * 4 + 1] << 16) |
               (bytes[off + i * 4 + 2] << 8) | bytes[off + i * 4 + 3];
      }
      for (i = 16; i < 64; i++) {
        var s0 = rotr(7, W[i - 15]) ^ rotr(18, W[i - 15]) ^ (W[i - 15] >>> 3);
        var s1 = rotr(17, W[i - 2]) ^ rotr(19, W[i - 2]) ^ (W[i - 2] >>> 10);
        W[i] = (W[i - 16] + s0 + W[i - 7] + s1) | 0;
      }

      var a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (i = 0; i < 64; i++) {
        var S1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
        var ch = (e & f) ^ (~e & g);
        var t1 = (h + S1 + ch + K[i] + W[i]) | 0;
        var S0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
        var maj = (a & b) ^ (a & c) ^ (b & c);
        var t2 = (S0 + maj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0;
        d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
      H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }

    return H.map(function (x) { return ('00000000' + (x >>> 0).toString(16)).slice(-8); }).join('');
  }

  /** Gera um "salt" aleatório em hexadecimal. */
  function gerarSalt() {
    var arr = new Uint8Array(16);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(arr);
    } else {
      for (var i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
    }
    return Array.prototype.map.call(arr, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
  }

  function hashSenha(senha, salt) {
    return sha256(salt + ':' + senha);
  }

  /* ------------------------------------------------------------------ *
   * Arquivos
   * ------------------------------------------------------------------ */

  function baixarArquivo(conteudo, nomeArquivo, tipoMime) {
    var blob = new Blob([conteudo], { type: tipoMime || 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function lerArquivoTexto(arquivo) {
    return new Promise(function (resolve, reject) {
      var leitor = new FileReader();
      leitor.onload = function () { resolve(leitor.result); };
      leitor.onerror = function () { reject(new Error('Não foi possível ler o arquivo.')); };
      leitor.readAsText(arquivo, 'UTF-8');
    });
  }

  /* ------------------------------------------------------------------ *
   * Formulários
   * ------------------------------------------------------------------ */

  /** Marca um campo como inválido exibindo a mensagem no .invalid-feedback. */
  function marcarInvalido($campo, mensagem) {
    $campo.addClass('is-invalid');
    var $fb = $campo.siblings('.invalid-feedback');
    if (!$fb.length) $fb = $campo.closest('.input-group, .form-floating, .mb-3, [class*="col"]').find('.invalid-feedback').first();
    if (mensagem) $fb.text(mensagem);
  }

  function limparValidacao($form) {
    $form.find('.is-invalid').removeClass('is-invalid');
  }

  return {
    escapeHtml: escapeHtml,
    somenteDigitos: somenteDigitos,
    normalizar: normalizar,
    mascaraCPF: mascaraCPF,
    mascaraTelefone: mascaraTelefone,
    mascaraCelular: mascaraCelular,
    mascaraCEP: mascaraCEP,
    validarCPF: validarCPF,
    validarTelefone: validarTelefone,
    validarCelular: validarCelular,
    validarCEP: validarCEP,
    validarDataNascimento: validarDataNascimento,
    hojeISO: hojeISO,
    formatarData: formatarData,
    calcularIdade: calcularIdade,
    sha256: sha256,
    gerarSalt: gerarSalt,
    hashSenha: hashSenha,
    baixarArquivo: baixarArquivo,
    lerArquivoTexto: lerArquivoTexto,
    marcarInvalido: marcarInvalido,
    limparValidacao: limparValidacao
  };
})();
