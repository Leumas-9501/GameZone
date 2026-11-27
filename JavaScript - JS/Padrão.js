import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";


// ==================================================
// IDENTIFICAÇÃO DO USUÁRIO + ACESSO ADMIN
// ==================================================

const loginLink = document.getElementById("login-link");
const adminLink = document.getElementById("admin-link");

// Esconde o acesso administrativo por padrão
if (adminLink) {
    adminLink.hidden = true;
}

onAuthStateChanged(auth, async (usuario) => {

    // ==============================================
    // USUÁRIO NÃO ESTÁ LOGADO
    // ==============================================

    if (!usuario) {

        if (loginLink) {
            loginLink.textContent = "Entrar";
            loginLink.href = "login.html";
        }

        if (adminLink) {
            adminLink.hidden = true;
        }

        return;
    }

    // ==============================================
    // USUÁRIO ESTÁ LOGADO
    // ==============================================

    try {

        const referenciaUsuario = doc(
            db,
            "usuarios",
            usuario.uid
        );

        const documentoUsuario = await getDoc(
            referenciaUsuario
        );

        if (documentoUsuario.exists()) {

            const dadosUsuario = documentoUsuario.data();

            // Identificação no cabeçalho
            if (loginLink) {
                loginLink.textContent =
                    dadosUsuario.nome || "Minha conta";

                loginLink.href = "perfil.html";
            }

            // ======================================
            // VERIFICAÇÃO DE ADMINISTRADOR
            // ======================================

            if (adminLink) {

                const ehAdministrador =
                    dadosUsuario.tipoUsuario === "administrador";

                adminLink.hidden = !ehAdministrador;

            }

        } else {

            if (loginLink) {
                loginLink.textContent = "Minha conta";
                loginLink.href = "perfil.html";
            }

            if (adminLink) {
                adminLink.hidden = true;
            }

        }

    } catch (erro) {

        console.error(
            "Erro ao carregar informações do usuário:",
            erro
        );

        if (loginLink) {
            loginLink.textContent = "Minha conta";
            loginLink.href = "perfil.html";
        }

        if (adminLink) {
            adminLink.hidden = true;
        }

    }

});


// ==================================================
// MENU RESPONSIVO
// ==================================================

document.addEventListener("DOMContentLoaded", () => {

    const menuToggle = document.getElementById("menu-toggle");
    const mainNav = document.getElementById("main-nav");

    if (!menuToggle || !mainNav) {
        return;
    }

    menuToggle.addEventListener("click", () => {

        const menuEstaAberto =
            mainNav.classList.toggle("is-open");

        menuToggle.setAttribute(
            "aria-expanded",
            String(menuEstaAberto)
        );

        menuToggle.setAttribute(
            "aria-label",
            menuEstaAberto
                ? "Fechar menu de navegação"
                : "Abrir menu de navegação"
        );

    });

    const linksDoMenu = mainNav.querySelectorAll("a");

    linksDoMenu.forEach((link) => {

        link.addEventListener("click", () => {

            mainNav.classList.remove("is-open");

            menuToggle.setAttribute(
                "aria-expanded",
                "false"
            );

            menuToggle.setAttribute(
                "aria-label",
                "Abrir menu de navegação"
            );

        });

    });

});


// ==================================================
// GERENCIAMENTO GLOBAL DE TEMA
// ==================================================

const THEME_KEY = "gamezone-theme";

const html = document.documentElement;


// Aplica o tema escolhido
function aplicarTema(tema, salvar = false) {

    const temaValido =
        tema === "light" ? "light" : "dark";

    html.dataset.theme = temaValido;

    // Salva somente quando solicitado
    if (salvar) {
        localStorage.setItem(THEME_KEY, temaValido);
    }

    // Atualiza o seletor da página de perfil
    const seletorTema = document.getElementById(
        "tema-aparencia"
    );

    if (seletorTema) {

        seletorTema.value =
            temaValido === "dark" ? "escuro" : "claro";

    }

    // Atualiza a cor da interface do navegador
    const themeColor = document.querySelector(
        'meta[name="theme-color"]'
    );

    if (themeColor) {

        themeColor.setAttribute(
            "content",
            temaValido === "dark"
                ? "#0d0d12"
                : "#f4f3f8"
        );

    }

}


// Recupera o tema salvo
const temaSalvo = localStorage.getItem(THEME_KEY);

// Define o tema inicial
const temaInicial =
    temaSalvo === "light" || temaSalvo === "dark"
        ? temaSalvo
        : "dark";

// Aplica o tema inicial
aplicarTema(temaInicial);


// ==================================================
// SELETOR DE TEMA NA PÁGINA DE PERFIL
// ==================================================

const seletorTema = document.getElementById(
    "tema-aparencia"
);

if (seletorTema) {

    seletorTema.addEventListener("change", () => {

        const novoTema =
            seletorTema.value === "claro"
                ? "light"
                : "dark";

        // Aplica e salva a preferência
        aplicarTema(novoTema, true);

        const mensagem = document.getElementById(
            "mensagem-aparencia"
        );

        if (mensagem) {

            mensagem.textContent =
                "Tema atualizado com sucesso!";

        }

    });

}

/* ==================================================
   GAMEZONE — GERENCIAMENTO GLOBAL DO CARRINHO
================================================== */

const CHAVE_CARRINHO = "gamezone-cart";


/* ==================================================
   1. CARREGAR CARRINHO
================================================== */

function carregarCarrinho() {

    try {

        const carrinhoSalvo = localStorage.getItem(CHAVE_CARRINHO);

        return carrinhoSalvo ? JSON.parse(carrinhoSalvo) : [];

    } catch (erro) {

        console.error("Erro ao carregar carrinho:", erro);

        return [];

    }

}


/* ==================================================
   2. SALVAR CARRINHO
================================================== */

function salvarCarrinho(carrinho) {

    try {

        localStorage.setItem(
            CHAVE_CARRINHO,
            JSON.stringify(carrinho)
        );

        atualizarContadorCarrinho();

    } catch (erro) {

        console.error("Erro ao salvar carrinho:", erro);

    }

}


/* ==================================================
   3. CONTADOR DO CARRINHO
================================================== */

function atualizarContadorCarrinho() {

    const contador = document.getElementById("cart-count");

    if (!contador) return;

    const carrinho = carregarCarrinho();

    const quantidadeTotal = carrinho.reduce(
        (total, produto) => total + (Number(produto.quantidade) || 0),
        0
    );

    contador.textContent = quantidadeTotal;

}


/* ==================================================
   4. ADICIONAR PRODUTO
================================================== */

function adicionarAoCarrinho(produto, quantidade = 1) {

    const carrinho = carregarCarrinho();

    const quantidadeSolicitada = Number(quantidade);

    if (!produto?.id || !Number.isFinite(quantidadeSolicitada) || quantidadeSolicitada <= 0) {
        return false;
    }

    const indice = carrinho.findIndex(
        item => item.id === produto.id
    );

    const estoque = Number(produto.estoque);

    const limiteEstoque = Number.isFinite(estoque)
        ? Math.max(0, estoque)
        : Infinity;

    if (indice !== -1) {

        const quantidadeAtual = Number(carrinho[indice].quantidade) || 0;

        const novaQuantidade = Math.min(
            quantidadeAtual + quantidadeSolicitada,
            limiteEstoque
        );

        if (novaQuantidade <= quantidadeAtual) {
            return false;
        }

        carrinho[indice].quantidade = novaQuantidade;

    } else {

        const quantidadeFinal = Math.min(
            quantidadeSolicitada,
            limiteEstoque
        );

        if (quantidadeFinal <= 0) {
            return false;
        }

        carrinho.push({
            id: produto.id,
            nome: produto.nome || "Produto sem nome",
            preco: Number(produto.preco) || 0,
            imagem: produto.imagem || "",
            quantidade: quantidadeFinal
        });

    }

    salvarCarrinho(carrinho);

    return true;

}


/* ==================================================
   5. REMOVER PRODUTO
================================================== */

function removerDoCarrinho(idProduto) {

    const carrinho = carregarCarrinho();

    const novoCarrinho = carrinho.filter(
        produto => produto.id !== idProduto
    );

    salvarCarrinho(novoCarrinho);

}


/* ==================================================
   6. ATUALIZAR QUANTIDADE
================================================== */

function atualizarQuantidadeCarrinho(idProduto, quantidade) {

    const carrinho = carregarCarrinho();

    const indice = carrinho.findIndex(
        produto => produto.id === idProduto
    );

    if (indice === -1) return false;

    const novaQuantidade = Number(quantidade);

    if (!Number.isFinite(novaQuantidade) || novaQuantidade <= 0) {
        removerDoCarrinho(idProduto);
        return true;
    }

    carrinho[indice].quantidade = Math.floor(novaQuantidade);

    salvarCarrinho(carrinho);

    return true;

}


/* ==================================================
   7. ESVAZIAR CARRINHO
================================================== */

function limparCarrinho() {

    salvarCarrinho([]);

}


/* ==================================================
   8. API GLOBAL GAMEZONE
================================================== */

window.GameZoneCarrinho = {

    carregar: carregarCarrinho,
    salvar: salvarCarrinho,
    adicionar: adicionarAoCarrinho,
    remover: removerDoCarrinho,
    atualizarQuantidade: atualizarQuantidadeCarrinho,
    limpar: limparCarrinho,
    atualizarContador: atualizarContadorCarrinho

};


/* ==================================================
   9. INICIALIZAR CONTADOR
================================================== */

atualizarContadorCarrinho();