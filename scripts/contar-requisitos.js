#!/usr/bin/env node
// Conta arquivos e funcoes/metodos do codigo de PRODUCAO (src/) usando o compilador do TypeScript.
// Criterio: declaracoes de funcao, metodos de classe/objeto e funcoes (arrow/expression)
// atribuidas a uma variavel ou propriedade. NAO conta construtores nem callbacks anonimos.
// Uso: node scripts/contar-requisitos.js
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function listar(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? listar(p) : p.endsWith('.ts') ? [p] : [];
  });
}

function contar(arquivo) {
  const src = ts.createSourceFile(arquivo, fs.readFileSync(arquivo, 'utf8'), ts.ScriptTarget.ES2022, true);
  const nomes = [];
  const visitar = (n) => {
    if (ts.isFunctionDeclaration(n) && n.name && n.body) nomes.push(n.name.text);
    else if ((ts.isMethodDeclaration(n) || ts.isMethodSignature(n)) && n.name && (ts.isMethodDeclaration(n) ? n.body : false)) {
      nomes.push(n.name.getText(src));
    } else if (
      (ts.isVariableDeclaration(n) || ts.isPropertyAssignment(n) || ts.isPropertyDeclaration(n)) &&
      n.initializer && (ts.isArrowFunction(n.initializer) || ts.isFunctionExpression(n.initializer)) &&
      n.name
    ) nomes.push(n.name.getText(src));
    ts.forEachChild(n, visitar);
  };
  visitar(src);
  return nomes;
}

const arquivos = listar('src').sort();
let total = 0;
console.log('arquivo | funcoes/metodos');
for (const a of arquivos) {
  const n = contar(a);
  total += n.length;
  console.log(`${a} | ${n.length}${n.length ? '  (' + n.join(', ') + ')' : ''}`);
}
console.log(`\nARQUIVOS: ${arquivos.length} (minimo 10)`);
console.log(`FUNCOES/METODOS: ${total} (minimo 20)`);
