import { auth, db } from "./firebase-config.js";

import {
    createUserWithEmailAndPassword,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup,
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";

import {
    doc,
    setDoc,
    getDoc,
    serverTimestamp,
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("form-cadastro");

    const nomeInput = document.getElementById("cadastro-nome");
    const sobrenomeInput = document.getElementById("cadastro-sobrenome");
    const emailInput = document.getElementById("cadastro-email");
    const cpfInput = document.getElementById("cadastro-cpf");

    const dataNascimentoInput = document.getElementById("cadastro-nascimento");

    const senhaInput = document.getElementById("cadastro-senha");

    const confirmarSenhaInput = document.getElementById(
        "cadastro-confirmar-senha",
    );

    const termosInput = document.getElementById("aceitar-termos");

    const mensagem = document.getElementById("mensagem-cadastro");

    const botaoCadastro = document.getElementById("botao-cadastro");

    const botaoGoogle = document.getElementById("botao-google");

    console.log("CPF encontrado:", cpfInput);
    console.log("Form encontrado:", form);

    if (
        !form ||
        !nomeInput ||
        !sobrenomeInput ||
        !emailInput ||
        !cpfInput ||
        !dataNascimentoInput ||
        !senhaInput ||
        !confirmarSenhaInput ||
        !termosInput ||
        !mensagem ||
        !botaoCadastro
    ) {
        console.error(
            "Cadastro: não foi possível encontrar todos os elementos do formulário.",
        );
        return;
    }

    const provedorGoogle = new GoogleAuthProvider();

    // ========================================
    // LOGIN / CADASTRO COM GOOGLE
    // ========================================

    botaoGoogle.addEventListener("click", async () => {
        limparMensagem();

        botaoGoogle.disabled = true;
        botaoGoogle.textContent = "Conectando com o Google...";

        try {
            const resultado = await signInWithPopup(auth, provedorGoogle);

            const usuario = resultado.user;

            // Verifica se o usuário já possui um documento no Firestore
            const documentoUsuario = await getDoc(
                doc(db, "usuarios", usuario.uid),
            );

            // Se ainda não existir, cria o perfil
            if (!documentoUsuario.exists()) {
                const partesNome = (usuario.displayName || "")
                    .trim()
                    .split(" ");

                const nome = partesNome.shift() || "Usuário";
                const sobrenome = partesNome.join(" ");

                await setDoc(doc(db, "usuarios", usuario.uid), {
                    nome,
                    sobrenome,
                    email: usuario.email || "",
                    cpf: "",
                    dataNascimento: "",
                    imagem: usuario.photoURL || null,
                    criadoEm: serverTimestamp(),
                    provider: "google",
                    tipoUsuario: "cliente"
                });
            }

            mostrarMensagem(
                "Login realizado com sucesso! Redirecionando...",
                "sucesso",
            );

            setTimeout(() => {
                window.location.href = "perfil.html";
            }, 1000);
        } catch (erro) {
            console.error(
                "Erro ao entrar com Google:",
                erro.code || erro.message,
            );

            if (erro.code === "auth/popup-closed-by-user") {
                mostrarMensagem("O login com Google foi cancelado.");
            } else if (erro.code === "auth/popup-blocked") {
                mostrarMensagem(
                    "O navegador bloqueou a janela de login. Permita pop-ups e tente novamente.",
                );
            } else {
                mostrarMensagem(
                    "Não foi possível entrar com o Google. Tente novamente.",
                );
            }
        } finally {
            botaoGoogle.disabled = false;
            botaoGoogle.textContent = "Continuar com o Google";
        }
    });

    // ========================================
    // CONFIGURAÇÕES
    // ========================================

    const TAMANHO_MINIMO_SENHA = 8;
    const TAMANHO_MAXIMO_SENHA = 128;

    // ========================================
    // MENSAGENS
    // ========================================

    function mostrarMensagem(texto, tipo = "erro") {
        mensagem.textContent = texto;
        mensagem.dataset.tipo = tipo;
        mensagem.setAttribute("role", tipo === "erro" ? "alert" : "status");
    }

    function limparMensagem() {
        mensagem.textContent = "";
        delete mensagem.dataset.tipo;
        mensagem.setAttribute("role", "status");
    }

    // ========================================
    // NORMALIZAÇÃO
    // ========================================

    function normalizarNome(nome) {
        return nome.trim().replace(/\s+/g, " ");
    }

    function normalizarEmail(email) {
        return email.trim().toLowerCase();
    }

    function somenteNumeros(valor) {
        return valor.replace(/\D/g, "");
    }

    // ========================================
    // CPF
    // ========================================

    function formatarCPF(valor) {
        const numeros = somenteNumeros(valor).slice(0, 11);

        return numeros
            .replace(/^(\d{3})(\d)/, "$1.$2")
            .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
            .replace(/\.(\d{3})(\d)/, ".$1-$2");
    }

    function cpfValido(cpf) {
        const numeros = somenteNumeros(cpf);

        if (numeros.length !== 11) return false;

        // Rejeita CPFs compostos pelo mesmo dígito.
        if (/^(\d)\1{10}$/.test(numeros)) return false;

        const calcularDigito = (base, pesoInicial) => {
            let soma = 0;

            for (let i = 0; i < base.length; i++) {
                soma += Number(base[i]) * (pesoInicial - i);
            }

            const resto = (soma * 10) % 11;
            return resto === 10 ? 0 : resto;
        };

        const primeiroDigito = calcularDigito(numeros.slice(0, 9), 10);

        if (primeiroDigito !== Number(numeros[9])) {
            return false;
        }

        const segundoDigito = calcularDigito(numeros.slice(0, 10), 11);

        return segundoDigito === Number(numeros[10]);
    }

    cpfInput.addEventListener("input", () => {
        const inicio = cpfInput.selectionStart;
        const valorAnterior = cpfInput.value;

        cpfInput.value = formatarCPF(valorAnterior);

        // Mantém uma experiência de digitação simples.
        if (inicio !== null && document.activeElement === cpfInput) {
            const diferenca = cpfInput.value.length - valorAnterior.length;

            const novaPosicao = Math.max(0, inicio + diferenca);

            cpfInput.setSelectionRange(novaPosicao, novaPosicao);
        }

        limparMensagem();
    });

    // ========================================
    // SENHA
    // ========================================

    function validarSenha(senha) {
        if (senha.length < TAMANHO_MINIMO_SENHA) {
            return "A senha precisa ter pelo menos 8 caracteres.";
        }

        if (senha.length > TAMANHO_MAXIMO_SENHA) {
            return "A senha não pode ultrapassar 128 caracteres.";
        }

        return null;
    }

    // ========================================
    // VALIDAÇÃO DO FORMULÁRIO
    // ========================================

    function validarFormulario() {
        const nome = normalizarNome(nomeInput.value);
        const sobrenome = sobrenomeInput.value.trim();
        const email = normalizarEmail(emailInput.value);
        const cpf = cpfInput.value;
        const dataNascimento = dataNascimentoInput.value;
        const senha = senhaInput.value;
        const confirmarSenha = confirmarSenhaInput.value;

        if (nome.length < 3) {
            return {
                campo: nomeInput,
                mensagem: "Digite seu primeiro nome completo.",
            };
        }

        if (nome.length > 15) {
            return {
                campo: nomeInput,
                mensagem: "O nome deve ter no máximo 15 caracteres.",
            };
        }

        if (!sobrenome) {
            return {
                campo: sobrenomeInput,
                mensagem: "Informe seu sobrenome.",
            };
        }

        if (!emailInput.validity.valid || !email) {
            return {
                campo: emailInput,
                mensagem: "Digite um endereço de e-mail válido.",
            };
        }

        if (!cpfValido(cpf)) {
            return {
                campo: cpfInput,
                mensagem: "Digite um CPF válido.",
            };
        }

        if (!dataNascimento) {
            return {
                campo: dataNascimentoInput,
                mensagem: "Informe sua data de nascimento.",
            };
        }

        const partesData = dataNascimento.split("-").map(Number);

        const [ano, mes, dia] = partesData;

        const dataInformada = new Date(ano, mes - 1, dia);

        const dataValida =
            partesData.length === 3 &&
            dataInformada.getFullYear() === ano &&
            dataInformada.getMonth() === mes - 1 &&
            dataInformada.getDate() === dia &&
            dataInformada <= new Date();

        if (!dataValida) {
            return {
                campo: dataNascimentoInput,
                mensagem: "Informe uma data de nascimento válida.",
            };
        }

        const erroSenha = validarSenha(senha);

        if (erroSenha) {
            return {
                campo: senhaInput,
                mensagem: erroSenha,
            };
        }

        if (senha !== confirmarSenha) {
            return {
                campo: confirmarSenhaInput,
                mensagem: "As senhas não coincidem.",
            };
        }

        if (!termosInput.checked) {
            return {
                campo: termosInput,
                mensagem: "Você precisa aceitar os termos para continuar.",
            };
        }

        return {
            dados: {
                nome,
                sobrenome,
                email,
                cpf: somenteNumeros(cpf),
                dataNascimento,
            },
        };
    }

    // Limpa a mensagem quando o usuário corrige os campos.
    form.addEventListener("input", limparMensagem);
    form.addEventListener("change", limparMensagem);

    // ========================================
    // ENVIO DO CADASTRO
    // ========================================

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        limparMensagem();

        const resultado = validarFormulario();

        if (resultado.mensagem) {
            mostrarMensagem(resultado.mensagem);
            resultado.campo.focus();
            return;
        }

        const { nome, sobrenome, email, cpf, dataNascimento } = resultado.dados;
        const senha = senhaInput.value;

        botaoCadastro.disabled = true;
        botaoCadastro.textContent = "Criando conta...";

        let usuarioCriado = null;

        try {
            // 1. Cria a conta no Firebase Authentication.
            const credencial = await createUserWithEmailAndPassword(
                auth,
                email,
                senha,
            );

            usuarioCriado = credencial.user;

            // 2. Define o nome de exibição do usuário.
            await updateProfile(usuarioCriado, {
                displayName: nome,
            });

            // 3. Salva os dados adicionais no Firestore.
            await setDoc(doc(db, "usuarios", usuarioCriado.uid), {
                nome,
                sobrenome,
                email,
                cpf,
                dataNascimento,
                imagem: null,
                provider: "password",
                tipoUsuario: "cliente",
                criadoEm: serverTimestamp(),
            });

            mostrarMensagem(
                "Cadastro realizado com sucesso! Redirecionando para o login...",
                "sucesso",
            );

            setTimeout(() => {
                window.location.href = "login.html";
            }, 1500);

            form.reset();
        } catch (erro) {
            console.error("Erro no cadastro:", erro.code || erro.message);

            if (usuarioCriado) {
                mostrarMensagem(
                    "A conta foi criada, mas houve um erro ao salvar o perfil. Entre em contato com o suporte.",
                    "erro",
                );
            } else {
                switch (erro.code) {
                    case "auth/email-already-in-use":
                        mostrarMensagem("Este e-mail já está cadastrado.");
                        emailInput.focus();
                        break;

                    case "auth/invalid-email":
                        mostrarMensagem("O endereço de e-mail é inválido.");
                        emailInput.focus();
                        break;

                    case "auth/weak-password":
                        mostrarMensagem(
                            "A senha não atende aos requisitos do Firebase.",
                        );
                        senhaInput.focus();
                        break;

                    case "auth/network-request-failed":
                        mostrarMensagem(
                            "Falha de conexão. Verifique sua internet e tente novamente.",
                        );
                        break;

                    default:
                        mostrarMensagem(
                            "Não foi possível concluir o cadastro. Verifique a configuração do Firebase.",
                        );
                }
            }
        } finally {
            botaoCadastro.disabled = false;
            botaoCadastro.textContent = "Criar conta";
        }
    });
});
