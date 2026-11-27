/* ==========================================
   GAMEZONE — DETALHES DO PRODUTO
   CARREGAMENTO DE DADOS DO FIRESTORE
========================================== */

import { auth, db } from "./firebase-config.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";


/* ==========================================
   1. ELEMENTOS DA PÁGINA
========================================== */

const imagemProduto = document.getElementById("produto-imagem-principal");

const categoriaProduto = document.getElementById("produto-categoria");
const nomeProduto = document.getElementById("produto-nome");
const codigoProduto = document.getElementById("produto-sku");

const descricaoCurta = document.getElementById("produto-descricao-curta");
const descricaoCompleta = document.getElementById("produto-descricao-completa");

const precoProduto = document.getElementById("produto-preco");
const precoAnterior = document.getElementById("produto-preco-anterior");
const condicaoPagamento = document.getElementById("produto-condicao-pagamento");

const disponibilidade = document.getElementById("produto-disponibilidade");

const marcaProduto = document.getElementById("produto-marca");
const modeloProduto = document.getElementById("produto-modelo");
const categoriaDetalhe = document.getElementById("produto-categoria-detalhe");
const garantiaProduto = document.getElementById("produto-garantia");

const quantidadeProduto = document.getElementById("produto-quantidade");
const botaoCarrinho = document.getElementById("adicionar-carrinho");

const mensagemProduto = document.getElementById("mensagem-produto");


/* ==========================================
   2. CATEGORIAS
========================================== */

const categorias = {
    hardware: "Hardware",
    perifericos: "Periféricos",
    acessorios: "Acessórios",
    computadores: "Computadores",
    consoles: "Consoles",
    jogos: "Jogos",
    outros: "Outros"
};


/* ==========================================
   3. FORMATAÇÃO DE PREÇO
========================================== */

function formatarPreco(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

/* ==========================================
   PRODUTO ATUAL
========================================== */

let produtoAtual = null;

/* ==========================================
   4. CARREGAR PRODUTO
========================================== */

async function carregarProduto() {

    const parametros = new URLSearchParams(window.location.search);
    const idProduto = parametros.get("id");

    // Verifica se existe ID na URL
    if (!idProduto) {
        exibirErro("Produto não especificado.");
        return;
    }

    try {

        // Busca o documento no Firestore
        const referenciaProduto = doc(db, "produtos", idProduto);

        const resultado = await getDoc(referenciaProduto);

        // Verifica se o produto existe
        if (!resultado.exists()) {
            exibirErro("Produto não encontrado.");
            return;
        }

        const produto = resultado.data();

        // Verifica se o produto está ativo
        if (produto.status !== "ativo") {
            exibirErro("Este produto não está disponível.");
            return;
        }

        // Preenche a página
        preencherProduto(produto, idProduto);

    } catch (erro) {

        console.error("Erro ao carregar produto:", erro);

        exibirErro("Não foi possível carregar os dados do produto.");

    }

}


/* ==========================================
   5. PREENCHER INFORMAÇÕES
========================================== */

function preencherProduto(produto, idProduto) {

    produtoAtual = {
        ...produto,
        id: idProduto
    };

    // Nome
    nomeProduto.textContent = produto.nome || "Produto sem nome";

    // Título da aba do navegador
    document.title = `${produto.nome || "Produto"} | GameZone`;

    // Categoria
    const categoria = categorias[produto.categoria] || "Outros";

    categoriaProduto.textContent = categoria;
    categoriaDetalhe.textContent = categoria;

    // Código do produto (ID do documento)
    codigoProduto.textContent = idProduto;

    // Marca
    marcaProduto.textContent = produto.marca || "Não informada";

    // Modelo e garantia ainda não cadastrados no Firestore
    modeloProduto.textContent = "Não informado";
    garantiaProduto.textContent = "Não informada";

    // Descrição
    const descricao = produto.descricao || "Este produto não possui descrição cadastrada.";

    descricaoCurta.textContent = descricao;
    descricaoCompleta.textContent = descricao;

    // Preço
    precoProduto.textContent = formatarPreco(produto.preco);

    // Remove condição de pagamento que ainda não foi implementada
    condicaoPagamento.textContent = "";

    // Imagem
    if (produto.imagem) {
        imagemProduto.src = produto.imagem;
        imagemProduto.alt = produto.nome || "Imagem do produto";
    } else {
        imagemProduto.removeAttribute("src");
        imagemProduto.alt = "Imagem não disponível";
    }

    // Estoque
    const estoque = Number(produto.estoque) || 0;

    if (estoque > 0) {

        disponibilidade.textContent = `Em estoque — ${estoque} unidade(s)`;
        disponibilidade.className = "disponivel";

        // Limita a quantidade escolhida ao estoque
        quantidadeProduto.max = estoque;
        quantidadeProduto.value = 1;
        quantidadeProduto.disabled = false;

        botaoCarrinho.disabled = false;

    } else {

        disponibilidade.textContent = "Produto esgotado";
        disponibilidade.className = "esgotado";

        quantidadeProduto.max = 0;
        quantidadeProduto.value = 0;
        quantidadeProduto.disabled = true;

        botaoCarrinho.disabled = true;

    }

}


/* ==========================================
   6. EXIBIR ERROS
========================================== */

function exibirErro(mensagem) {

    nomeProduto.textContent = mensagem;

    mensagemProduto.textContent = mensagem;
    mensagemProduto.style.display = "block";

    // Desativa a compra quando não é possível carregar o produto
    botaoCarrinho.disabled = true;
    quantidadeProduto.disabled = true;

    precoProduto.textContent = "";

    disponibilidade.textContent = "";

}

/* ==========================================
   7. ADICIONAR AO CARRINHO
========================================== */

botaoCarrinho.addEventListener("click", () => {

    // Verifica se o usuário está logado
    if (!auth.currentUser) {

        mensagemProduto.textContent =
            "Você precisa entrar na sua conta para adicionar produtos ao carrinho.";

        mensagemProduto.style.display = "block";

        setTimeout(() => {
            window.location.href = "login.html";
        }, 1500);

        return;
    }

    // Verifica se o produto foi carregado
    if (!produtoAtual) {
        mensagemProduto.textContent =
            "Não foi possível identificar o produto.";

        mensagemProduto.style.display = "block";
        return;
    }

    // Obtém a quantidade selecionada
    const quantidade = Number(quantidadeProduto.value);

    // Valida a quantidade
    if (!Number.isInteger(quantidade) || quantidade <= 0) {

        mensagemProduto.textContent =
            "Informe uma quantidade válida.";

        mensagemProduto.style.display = "block";
        return;

    }

    // Verifica se há estoque suficiente
    if (quantidade > Number(produtoAtual.estoque)) {

        mensagemProduto.textContent =
            "Quantidade maior que o estoque disponível.";

        mensagemProduto.style.display = "block";
        return;

    }

    // Verifica se o gerenciamento global está disponível
    if (!window.GameZoneCarrinho) {

        mensagemProduto.textContent =
            "O sistema de carrinho não está disponível.";

        mensagemProduto.style.display = "block";
        return;

    }

    // Adiciona o produto
    const sucesso = window.GameZoneCarrinho.adicionar(
        produtoAtual,
        quantidade
    );

    // Resultado
    if (sucesso) {

        mensagemProduto.textContent =
            "Produto adicionado ao carrinho com sucesso!";

        mensagemProduto.style.display = "block";

    } else {

        mensagemProduto.textContent =
            "Não foi possível adicionar o produto. Verifique o estoque e a quantidade.";

        mensagemProduto.style.display = "block";

    }

});

/* ==========================================
   8. INICIALIZAÇÃO
========================================== */

carregarProduto();