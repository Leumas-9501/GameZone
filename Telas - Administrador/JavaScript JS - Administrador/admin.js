/* ==========================================
   GAMEZONE — PAINEL ADMINISTRATIVO
   NAVEGAÇÃO E MENU RESPONSIVO
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* ==========================================
       1. ELEMENTOS
    ========================================== */

    const sidebar = document.getElementById("sidebar-admin");
    const overlay = document.getElementById("overlay-admin");
    const botaoMenu = document.getElementById("abrir-menu-admin");
    const tituloPagina = document.getElementById("titulo-pagina-admin");

    const botoesNavegacao = document.querySelectorAll("[data-secao-admin]");
    const secoesAdmin = document.querySelectorAll("[data-conteudo-admin]");
    const botoesAtalho = document.querySelectorAll("[data-abrir-secao]");


    /* ==========================================
       2. TÍTULOS DAS SEÇÕES
    ========================================== */

    const titulosSecoes = {
        dashboard: "Dashboard",
        produtos: "Produtos",
        estoque: "Estoque"
    };


    /* ==========================================
       3. NAVEGAR ENTRE SEÇÕES
    ========================================== */

    function abrirSecao(nomeSecao) {

        // Verifica se a seção solicitada existe
        const secaoExiste = document.querySelector(
            `[data-conteudo-admin="${nomeSecao}"]`
        );

        if (!secaoExiste) {
            return;
        }

        // Atualiza as seções
        secoesAdmin.forEach(secao => {

            const estaAtiva =
                secao.dataset.conteudoAdmin === nomeSecao;

            secao.classList.toggle("ativa", estaAtiva);
            secao.hidden = !estaAtiva;

        });

        // Atualiza os botões da navegação
        botoesNavegacao.forEach(botao => {

            const estaAtivo =
                botao.dataset.secaoAdmin === nomeSecao;

            botao.classList.toggle("ativo", estaAtivo);

            if (estaAtivo) {
                botao.setAttribute("aria-current", "page");
            } else {
                botao.removeAttribute("aria-current");
            }

        });

        // Atualiza o título da página
        if (tituloPagina) {
            tituloPagina.textContent =
                titulosSecoes[nomeSecao] || "Painel Administrativo";
        }

        // Fecha o menu mobile após a navegação
        fecharMenuMobile();

    }


    /* ==========================================
       4. EVENTOS DA NAVEGAÇÃO
    ========================================== */

    botoesNavegacao.forEach(botao => {

        botao.addEventListener("click", () => {

            abrirSecao(botao.dataset.secaoAdmin);

        });

    });


    /* ==========================================
       5. BOTÕES DE ATALHO
    ========================================== */

    botoesAtalho.forEach(botao => {

        botao.addEventListener("click", () => {

            abrirSecao(botao.dataset.abrirSecao);

        });

    });


    /* ==========================================
       6. ABRIR MENU MOBILE
    ========================================== */

    function abrirMenuMobile() {

        if (!sidebar) return;

        sidebar.classList.add("aberto");

        if (overlay) {
            overlay.classList.add("ativo");
        }

        if (botaoMenu) {
            botaoMenu.setAttribute("aria-expanded", "true");
        }

        document.body.style.overflow = "hidden";

    }


    /* ==========================================
       7. FECHAR MENU MOBILE
    ========================================== */

    function fecharMenuMobile() {

        if (!sidebar) return;

        sidebar.classList.remove("aberto");

        if (overlay) {
            overlay.classList.remove("ativo");
        }

        if (botaoMenu) {
            botaoMenu.setAttribute("aria-expanded", "false");
        }

        document.body.style.overflow = "";

    }


    /* ==========================================
       8. EVENTO DO BOTÃO MENU
    ========================================== */

    if (botaoMenu) {

        botaoMenu.addEventListener("click", () => {

            const menuAberto = sidebar.classList.contains("aberto");

            if (menuAberto) {
                fecharMenuMobile();
            } else {
                abrirMenuMobile();
            }

        });

    }


    /* ==========================================
       9. EVENTO DO OVERLAY
    ========================================== */

    if (overlay) {

        overlay.addEventListener("click", fecharMenuMobile);

    }


    /* ==========================================
       10. FECHAR COM ESC
    ========================================== */

    document.addEventListener("keydown", evento => {

        if (evento.key === "Escape") {
            fecharMenuMobile();
        }

    });


    /* ==========================================
       11. FECHAR AO AUMENTAR A TELA
    ========================================== */

    window.addEventListener("resize", () => {

        if (window.innerWidth > 768) {
            fecharMenuMobile();
        }

    });


    /* ==========================================
       12. INICIALIZAÇÃO
    ========================================== */

    const secaoInicial = document.querySelector(
        "[data-conteudo-admin].ativa"
    );

    if (secaoInicial) {
        abrirSecao(secaoInicial.dataset.conteudoAdmin);
    } else {
        abrirSecao("dashboard");
    }

});

/* ========================================
   PAINEL ADMINISTRATIVO — GAMEZONE
======================================== */

// Firebase
import { db } from "../../JavaScript - JS/firebase-config.js";

// Firestore
import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

// ========================================
// ELEMENTOS DO FORMULÁRIO
// ========================================

const formulario = document.getElementById("form-produto-admin");
const containerFormulario = document.getElementById("formulario-produto-admin");

const botaoNovoProduto = document.getElementById("btn-novo-produto");
const botaoFecharFormulario = document.getElementById("fechar-form-produto");
const botaoCancelar = document.getElementById("cancelar-form-produto");

const inputImagem = document.getElementById("imagem-produto-admin");
const imagemPreview = document.getElementById("imagem-preview-admin");
const placeholderImagem = document.getElementById("placeholder-imagem-produto");

const tituloFormulario = document.getElementById("titulo-form-produto");

// ========================================
// CAMPOS DO PRODUTO
// ========================================

const campoId = document.getElementById("produto-id-admin");
const campoNome = document.getElementById("nome-produto-admin");
const campoMarca = document.getElementById("marca-produto-admin");
const campoCategoria = document.getElementById("categoria-produto-admin");
const campoPreco = document.getElementById("preco-produto-admin");
const campoEstoque = document.getElementById("estoque-produto-admin");
const campoStatus = document.getElementById("status-produto-admin");
const campoDescricao = document.getElementById("descricao-produto-admin");

// ========================================
// ESTADO LOCAL
// ========================================

let imagemSelecionada = null;
let urlPreviewImagem = null;
let imagemAtualProduto = "";

// ========================================
// ABRIR FORMULÁRIO
// ========================================

function abrirFormulario() {

    formulario.reset();

    campoId.value = "";
    imagemAtualProduto = "";

    tituloFormulario.textContent = "Cadastrar produto";

    const botaoSalvar = document.getElementById("salvar-produto-admin");
    botaoSalvar.textContent = "Salvar produto";

    limparPreviewImagem();

    containerFormulario.hidden = false;

    containerFormulario.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

// ========================================
// FECHAR FORMULÁRIO
// ========================================

function fecharFormulario() {

    containerFormulario.hidden = true;

    formulario.reset();

    campoId.value = "";
    imagemAtualProduto = "";

    limparPreviewImagem();

    tituloFormulario.textContent = "Cadastrar produto";

    const botaoSalvar = document.getElementById("salvar-produto-admin");
    botaoSalvar.textContent = "Salvar produto";
}

// ========================================
// LIMPAR PRÉ-VISUALIZAÇÃO
// ========================================

function limparPreviewImagem() {

    imagemSelecionada = null;

    if (urlPreviewImagem) {
        URL.revokeObjectURL(urlPreviewImagem);
        urlPreviewImagem = null;
    }

    imagemPreview.src = "";
    imagemPreview.hidden = true;

    placeholderImagem.hidden = false;
}

// ========================================
// PRÉ-VISUALIZAR IMAGEM
// ========================================

inputImagem.addEventListener("change", () => {

    const arquivo = inputImagem.files[0];

    if (!arquivo) {
        limparPreviewImagem();
        return;
    }

    // Verifica se é uma imagem
    if (!arquivo.type.startsWith("image/")) {

        alert("Selecione um arquivo de imagem válido.");

        inputImagem.value = "";
        limparPreviewImagem();

        return;
    }

    // Limite de 5 MB
    if (arquivo.size > 5 * 1024 * 1024) {

        alert("A imagem deve ter no máximo 5 MB.");

        inputImagem.value = "";
        limparPreviewImagem();

        return;
    }

    limparPreviewImagem();

    imagemSelecionada = arquivo;

    urlPreviewImagem = URL.createObjectURL(arquivo);

    imagemPreview.src = urlPreviewImagem;
    imagemPreview.hidden = false;

    placeholderImagem.hidden = true;
});

// ========================================
// EVENTOS DOS BOTÕES
// ========================================

botaoNovoProduto.addEventListener("click", abrirFormulario);

botaoFecharFormulario.addEventListener("click", fecharFormulario);

botaoCancelar.addEventListener("click", fecharFormulario);

// ========================================
// LIMPAR CAMPOS
// ========================================

formulario.addEventListener("reset", () => {

    campoId.value = "";
    imagemAtualProduto = "";

    limparPreviewImagem();

    tituloFormulario.textContent = "Cadastrar produto";

    const botaoSalvar = document.getElementById("salvar-produto-admin");

    botaoSalvar.textContent = "Salvar produto";

});

/* ========================================
   CADASTRAR E EDITAR PRODUTOS — FIRESTORE
======================================== */

formulario.addEventListener("submit", async (evento) => {

    evento.preventDefault();

    const nome = campoNome.value.trim();
    const marca = campoMarca.value.trim();
    const categoria = campoCategoria.value;
    const preco = Number(campoPreco.value);
    const estoque = Number(campoEstoque.value);
    const status = campoStatus.value;
    const descricao = campoDescricao.value.trim();

    // ========================================
    // VALIDAÇÕES
    // ========================================

    if (!nome || !categoria || !descricao) {
        alert("Preencha todos os campos obrigatórios.");
        return;
    }

    if (!Number.isFinite(preco) || preco <= 0) {
        alert("Informe um preço válido.");
        return;
    }

    if (!Number.isInteger(estoque) || estoque < 0) {
        alert("Informe uma quantidade de estoque válida.");
        return;
    }

    // ========================================
    // DADOS DO PRODUTO
    // ========================================

    const produto = {
        nome,
        marca,
        modelo: modeloProduto,
        categoria,
        preco,
        estoque,
        status,
        garantia: garantiaProduto,
        descricao,
        imagem: imagemAtualProduto,
        atualizadoEm: serverTimestamp()
    };

    const botaoSalvar = document.getElementById("salvar-produto-admin");
    const estaEditando = campoId.value !== "";

    try {

        botaoSalvar.disabled = true;
        botaoSalvar.textContent = estaEditando
            ? "Atualizando..."
            : "Salvando...";

        // ========================================
        // EDITAR PRODUTO EXISTENTE
        // ========================================

        if (estaEditando) {

            const referenciaProduto = doc(db, "produtos", campoId.value);

            await updateDoc(referenciaProduto, produto);

            alert("Produto atualizado com sucesso!");

        }

        // ========================================
        // CADASTRAR NOVO PRODUTO
        // ========================================

        else {

            produto.criadoEm = serverTimestamp();

            await addDoc(collection(db, "produtos"), produto);

            alert("Produto cadastrado com sucesso!");

        }

        // Atualiza a tabela
        await carregarProdutos();

        // Fecha e limpa o formulário
        fecharFormulario();

    } catch (erro) {

        console.error("Erro ao salvar produto:", erro);

        alert(
            estaEditando
                ? "Não foi possível atualizar o produto. Tente novamente."
                : "Não foi possível cadastrar o produto. Tente novamente."
        );

    } finally {

        botaoSalvar.disabled = false;
        botaoSalvar.textContent = "Salvar produto";

    }

});

/* ========================================
   ETAPA 4 E 5 — CATÁLOGO E FILTROS
======================================== */

const tabelaProdutos = document.getElementById("lista-produtos-admin");
const campoBuscaProduto = document.getElementById("buscar-produto-admin");
const filtroCategoriaProduto = document.getElementById("filtro-categoria-admin");
const contadorProdutos = document.getElementById("contador-produtos-admin");

let produtosAdmin = [];

const categoriasProdutos = {
    hardware: "Hardware",
    perifericos: "Periféricos",
    acessorios: "Acessórios",
    computadores: "Computadores",
    consoles: "Consoles",
    jogos: "Jogos",
    outros: "Outros"
};

// Renderiza a tabela com os produtos recebidos
function renderizarProdutos(lista) {
    tabelaProdutos.replaceChildren();

    if (lista.length === 0) {
        const linha = document.createElement("tr");
        const celula = document.createElement("td");

        celula.colSpan = 6;
        celula.textContent = produtosAdmin.length === 0
            ? "Nenhum produto cadastrado."
            : "Nenhum produto encontrado com esses filtros.";

        celula.style.textAlign = "center";

        linha.appendChild(celula);
        tabelaProdutos.appendChild(linha);
    }

    lista.forEach((produto) => {

        const modeloProduto = document.getElementById("modelo-produto-admin");
        const garantiaProduto = document.getElementById("garantia-produto-admin");

        const linha = document.createElement("tr");

        // Produto (nome e marca)
        const celulaProduto = document.createElement("td");

        const nomeProduto = document.createElement("strong");
        nomeProduto.textContent = produto.nome || "Sem nome";

        const marcaProduto = document.createElement("small");
        marcaProduto.textContent = produto.marca || "Sem marca";
        marcaProduto.style.display = "block";

        celulaProduto.append(nomeProduto, marcaProduto);

        // Categoria
        const celulaCategoria = document.createElement("td");
        celulaCategoria.textContent =
            categoriasProdutos[produto.categoria] || produto.categoria || "Não definida";

        // Preço
        const celulaPreco = document.createElement("td");
        celulaPreco.textContent = Number(produto.preco || 0).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });

        // Estoque
        const celulaEstoque = document.createElement("td");
        celulaEstoque.textContent = produto.estoque ?? 0;

        // Status
        const celulaStatus = document.createElement("td");
        const status = produto.status || (produto.ativo ? "ativo" : "inativo");

        celulaStatus.textContent =
            status === "ativo" ? "Ativo" : "Inativo";

        // Ações
        const celulaAcoes = document.createElement("td");

        const botaoEditar = document.createElement("button");
        botaoEditar.type = "button";
        botaoEditar.textContent = "Editar";
        botaoEditar.classList.add("btn-editar-produto");

        botaoEditar.addEventListener("click", () => {
            preencherFormularioEdicao(produto);
        });

        celulaAcoes.appendChild(botaoEditar);

        linha.append(
            celulaProduto,
            celulaCategoria,
            celulaPreco,
            celulaEstoque,
            celulaStatus,
            celulaAcoes
        );

        tabelaProdutos.appendChild(linha);
    });

    // Atualiza o contador
    if (contadorProdutos) {
        contadorProdutos.textContent =
            `${lista.length} ${lista.length === 1 ? "produto encontrado" : "produtos encontrados"}`;
    }
}

// Aplica pesquisa e categoria simultaneamente
function aplicarFiltrosProdutos() {
    const termo = (campoBuscaProduto?.value || "")
        .trim()
        .toLowerCase();

    const categoriaSelecionada = filtroCategoriaProduto?.value || "";

    const produtosFiltrados = produtosAdmin.filter((produto) => {
        const nome = (produto.nome || "").toLowerCase();
        const marca = (produto.marca || "").toLowerCase();

        const correspondeBusca =
            nome.includes(termo) || marca.includes(termo);

        const correspondeCategoria =
            !categoriaSelecionada || produto.categoria === categoriaSelecionada;

        return correspondeBusca && correspondeCategoria;
    });

    renderizarProdutos(produtosFiltrados);
}

// Busca os produtos no Firestore
async function carregarProdutos() {
    try {
        const consulta = await getDocs(collection(db, "produtos"));

        produtosAdmin = consulta.docs.map((documento) => ({
            id: documento.id,
            ...documento.data()
        }));

        aplicarFiltrosProdutos();

    } catch (erro) {
        console.error("Erro ao carregar produtos:", erro);

        tabelaProdutos.replaceChildren();

        const linha = document.createElement("tr");
        const celula = document.createElement("td");

        celula.colSpan = 6;
        celula.textContent = "Erro ao carregar os produtos.";
        celula.style.textAlign = "center";

        linha.appendChild(celula);
        tabelaProdutos.appendChild(linha);
    }
}

// Eventos da pesquisa e do filtro
campoBuscaProduto?.addEventListener("input", aplicarFiltrosProdutos);
filtroCategoriaProduto?.addEventListener("change", aplicarFiltrosProdutos);

// Carrega os produtos ao abrir o painel
carregarProdutos();


/* ========================================
   ETAPA 6 — PREPARAR EDIÇÃO DE PRODUTOS
======================================== */


function preencherFormularioEdicao(produto) {

    // Identifica o produto que será editado
    campoId.value = produto.id;

    // Preenche os campos
    campoNome.value = produto.nome || "";
    campoMarca.value = produto.marca || "";
    modeloProduto.value = produto.modelo || "";
    campoCategoria.value = produto.categoria || "";
    campoPreco.value = produto.preco ?? "";
    campoEstoque.value = produto.estoque ?? 0;
    campoStatus.value = produto.status || "ativo";
    campoDescricao.value = produto.descricao || "";
    garantiaProduto.value = produto.garantia || "";

    // Configura o título
    tituloFormulario.textContent = "Editar produto";

    // Altera o texto do botão
    const botaoSalvar = document.getElementById("salvar-produto-admin");
    botaoSalvar.textContent = "Salvar alterações";

    // Preserva a imagem atual
    imagemAtualProduto = produto.imagem || "";

    // Exibe a imagem atual, caso exista
    limparPreviewImagem();

    if (imagemAtualProduto) {
        imagemPreview.src = imagemAtualProduto;
        imagemPreview.hidden = false;
        placeholderImagem.hidden = true;
    }

    // Abre o formulário
    containerFormulario.hidden = false;

    containerFormulario.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}
