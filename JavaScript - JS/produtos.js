import { db } from "./firebase-config.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

// ==================================================
// ELEMENTOS DO CATÁLOGO
// ==================================================

const listaProdutos = document.getElementById("lista-produtos");
const quantidadeResultados = document.getElementById("quantidade-resultados");
const nenhumProduto = document.getElementById("nenhum-produto");
const campoPesquisa = document.getElementById("pesquisa-produtos");
const ordenarPor = document.getElementById("ordenar-por");
const limparFiltros = document.getElementById("limpar-filtros");

// Filtros de categoria
const filtrosCategoria = document.querySelectorAll('input[name="categoria"]');
const precoMinimo = document.getElementById("preco-minimo");
const precoMaximo = document.getElementById("preco-maximo");
const filtroDisponibilidade = document.querySelector('input[name="disponivel"]');

// ==================================================
// ESTADO DO CATÁLOGO
// ==================================================

let produtosAtivos = [];

// ==================================================
// CARREGAR PRODUTOS DO FIRESTORE
// ==================================================

async function carregarProdutos() {

    if (!listaProdutos) {
        return;
    }

    listaProdutos.textContent = "Carregando produtos...";

    try {

        const consultaProdutos = await getDocs(
            collection(db, "produtos")
        );

        const produtos = consultaProdutos.docs.map(documento => ({
            id: documento.id,
            ...documento.data()
        }));

        produtosAtivos = produtos.filter(produto =>
            produto.status === "ativo"
        );

        console.log("Produtos encontrados:", produtos);
        console.log("Produtos ativos:", produtosAtivos);

        renderizarProdutos(produtosAtivos);

    } catch (erro) {

        console.error("Erro ao carregar catálogo:", erro);

        listaProdutos.textContent =
            "Não foi possível carregar os produtos. Tente novamente mais tarde.";

    }

}

// ==================================================
// RENDERIZAR PRODUTOS
// ==================================================

function renderizarProdutos(lista) {

    listaProdutos.innerHTML = "";

    // Atualiza quantidade
    if (quantidadeResultados) {
        quantidadeResultados.textContent =
            `${lista.length} produtos disponíveis no catálogo`;
    }

    // Verifica se existem produtos
    if (lista.length === 0) {

        if (nenhumProduto) {
            nenhumProduto.hidden = false;
        }

        return;
    }

    if (nenhumProduto) {
        nenhumProduto.hidden = true;
    }

    // Cria os cards
    lista.forEach(produto => {

        const card = document.createElement("article");
        card.classList.add("produto-card");

        // Imagem
        const imagem = document.createElement("img");
        imagem.classList.add("produto-imagem");
        imagem.alt = produto.nome || "Produto";
        imagem.loading = "lazy";

        if (produto.imagem && produto.imagem.trim() !== "") {

            imagem.src = produto.imagem;

        } else {

            imagem.alt = "Imagem não disponível para " + (produto.nome || "produto");

        }

        // Marca
        const marca = document.createElement("p");
        marca.classList.add("produto-marca");
        marca.textContent = produto.marca || "Marca não informada";

        // Nome
        const nome = document.createElement("h3");
        nome.classList.add("produto-nome");
        nome.textContent = produto.nome || "Produto sem nome";

        // Preço
        const preco = document.createElement("p");
        preco.classList.add("produto-preco");

        preco.textContent = Number(produto.preco || 0).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });

        // Disponibilidade
        const disponibilidade = document.createElement("span");
        disponibilidade.classList.add("produto-disponibilidade");

        if (produto.estoque > 0) {

            disponibilidade.textContent = "Em estoque";
            disponibilidade.classList.add("disponivel");

        } else {

            disponibilidade.textContent = "Esgotado";
            disponibilidade.classList.add("esgotado");

        }

        // ==================================================
        // LINK PARA A PÁGINA INDIVIDUAL DO PRODUTO
        // ==================================================

        const linkProduto = document.createElement("a");

        linkProduto.classList.add("produto-card-link");

        // Passa o ID do documento do Firestore pela URL
        linkProduto.href = `produto.html?id=${encodeURIComponent(produto.id)}`;

        // ==================================================
        // MONTAGEM DO CARD
        // ==================================================

        linkProduto.appendChild(imagem);
        linkProduto.appendChild(marca);
        linkProduto.appendChild(nome);
        linkProduto.appendChild(preco);
        linkProduto.appendChild(disponibilidade);

        card.appendChild(linkProduto);

        listaProdutos.appendChild(card);

    });

}

// ==================================================
// APLICAR FILTROS DO CATÁLOGO
// ==================================================

function aplicarFiltros() {

    // ==============================================
    // PESQUISA
    // ==============================================

    const termo = campoPesquisa
        ? campoPesquisa.value.trim().toLowerCase()
        : "";

    // ==============================================
    // CATEGORIA
    // ==============================================

    const categoriaSelecionada = document.querySelector(
        'input[name="categoria"]:checked'
    );

    const categoria = categoriaSelecionada
        ? categoriaSelecionada.value
        : "todas";

    // ==============================================
    // PREÇO MÍNIMO E MÁXIMO
    // ==============================================

    const valorMinimo = precoMinimo && precoMinimo.value !== ""
        ? Number(precoMinimo.value)
        : null;

    const valorMaximo = precoMaximo && precoMaximo.value !== ""
        ? Number(precoMaximo.value)
        : null;

    // ==============================================
    // DISPONIBILIDADE
    // ==============================================

    const somenteDisponiveis = filtroDisponibilidade
        ? filtroDisponibilidade.checked
        : false;

    // ==============================================
    // FILTRAGEM
    // ==============================================

    const produtosFiltrados = produtosAtivos.filter(produto => {

        const nome = (produto.nome || "").toLowerCase();
        const marca = (produto.marca || "").toLowerCase();
        const preco = Number(produto.preco || 0);
        const estoque = Number(produto.estoque || 0);

        // Pesquisa
        const correspondePesquisa =
            nome.includes(termo) || marca.includes(termo);

        // Categoria
        const correspondeCategoria =
            categoria === "todas" || produto.categoria === categoria;

        // Preço mínimo
        const correspondePrecoMinimo =
            valorMinimo === null || preco >= valorMinimo;

        // Preço máximo
        const correspondePrecoMaximo =
            valorMaximo === null || preco <= valorMaximo;

        // Disponibilidade
        const correspondeDisponibilidade =
            !somenteDisponiveis || estoque > 0;

        // Combinação dos filtros
        return (
            correspondePesquisa &&
            correspondeCategoria &&
            correspondePrecoMinimo &&
            correspondePrecoMaximo &&
            correspondeDisponibilidade
        );

    });

    // ==============================================
    // ATUALIZAR CATÁLOGO
    // ==============================================

    const produtosOrdenados = ordenarProdutos(produtosFiltrados);

    renderizarProdutos(produtosOrdenados);

}

// ==================================================
// ORDENAÇÃO DOS PRODUTOS
// ==================================================

function ordenarProdutos(lista) {

    // Cria uma cópia para não alterar a lista original
    const produtosOrdenados = [...lista];

    const criterio = ordenarPor
        ? ordenarPor.value
        : "relevancia";

    switch (criterio) {

        // Ordem original
        case "relevancia":
            return produtosOrdenados;

        // Menor preço para maior
        case "menor-preco":
            return produtosOrdenados.sort((a, b) =>
                Number(a.preco || 0) - Number(b.preco || 0)
            );

        // Maior preço para menor
        case "maior-preco":
            return produtosOrdenados.sort((a, b) =>
                Number(b.preco || 0) - Number(a.preco || 0)
            );

        // Ordem alfabética A-Z
        case "nome-az":
            return produtosOrdenados.sort((a, b) =>
                (a.nome || "").localeCompare(b.nome || "", "pt-BR")
            );

        // Ordem alfabética Z-A
        case "nome-za":
            return produtosOrdenados.sort((a, b) =>
                (b.nome || "").localeCompare(a.nome || "", "pt-BR")
            );

        default:
            return produtosOrdenados;

    }

}

// ==================================================
// EVENTOS DE PESQUISA E CATEGORIA
// ==================================================

function configurarFiltros() {

    // Pesquisa em tempo real
    if (campoPesquisa) {
        campoPesquisa.addEventListener("input", aplicarFiltros);
    }

    // Mudança de categoria
    filtrosCategoria.forEach(filtro => {

        filtro.addEventListener("change", aplicarFiltros);

    });

    // Preço mínimo
    if (precoMinimo) {
        precoMinimo.addEventListener("input", aplicarFiltros);
    }

    // Preço máximo
    if (precoMaximo) {
        precoMaximo.addEventListener("input", aplicarFiltros);
    }

    // Filtro de disponibilidade
    if (filtroDisponibilidade) {
    filtroDisponibilidade.addEventListener("change", aplicarFiltros);

        // Ordenação
        if (ordenarPor) {
            ordenarPor.addEventListener("change", aplicarFiltros);
        }
    }

    // Botão limpar filtros
    if (limparFiltros) {
        limparFiltros.addEventListener("click", (evento) => {
            evento.preventDefault();
            limparTodosFiltros();
        });
    }

}

// ==================================================
// LIMPAR FILTROS
// ==================================================

function limparTodosFiltros() {

    // Limpa pesquisa
    if (campoPesquisa) {
        campoPesquisa.value = "";
    }

    // Reseta categoria para "Todas"
    const categoriaTodas = document.querySelector(
        'input[name="categoria"][value="todas"]'
    );

    if (categoriaTodas) {
        categoriaTodas.checked = true;
    }

    // Limpa preço mínimo
    if (precoMinimo) {
        precoMinimo.value = "";
    }

    // Limpa preço máximo
    if (precoMaximo) {
        precoMaximo.value = "";
    }

    // Desmarca disponibilidade
    if (filtroDisponibilidade) {
        filtroDisponibilidade.checked = false;
    }

    // Reseta ordenação
    if (ordenarPor) {
        ordenarPor.value = "relevancia";
    }

    // Atualiza o catálogo
    aplicarFiltros();

}

// ==================================================
// INICIALIZAÇÃO
// ==================================================

configurarFiltros();
carregarProdutos();