document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000/users';
    const formLogin = document.getElementById('form-login');
    const formCadastro = document.getElementById('form-cadastro');

    // Função para fazer login
    formLogin?.addEventListener('submit', (e) => {
        e.preventDefault();
        const login = document.getElementById('login').value;
        const senha = document.getElementById('senha').value;

        fetch(`${API_URL}?login=${login}&senha=${senha}`)
            .then(res => res.json())
            .then(users => {
                if (users.length > 0) {
                    sessionStorage.setItem('usuarioLogado', JSON.stringify(users[0]));
                    alert('Login realizado com sucesso!');
                    window.location.href = 'index.html';
                } else {
                    alert('Login ou senha inválidos.');
                }
            });
    });

    // Função para cadastrar novo usuário
    formCadastro?.addEventListener('submit', (e) => {
        e.preventDefault();
        const login = document.getElementById('cad-login').value;
        const senha = document.getElementById('cad-senha').value;
        const nome = document.getElementById('cad-nome').value;

        const novoUsuario = {
            login,
            senha,
            nome,
            admin: false
        };

        fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novoUsuario)
        })
        .then(() => {
            alert('Cadastro realizado com sucesso! Faça o login.');
            window.location.href = 'login.html';
        });
    });
});
document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000/users';
    const formLogin = document.getElementById('form-login');
    const formCadastro = document.getElementById('form-cadastro');

    // Função de Login
    formLogin?.addEventListener('submit', (e) => {
        e.preventDefault();
        const login = document.getElementById('login').value;
        const senha = document.getElementById('senha').value;

        fetch(`${API_URL}?login=${login}&senha=${senha}`)
            .then(res => res.json())
            .then(users => {
                if (users.length > 0) {
                    sessionStorage.setItem('usuarioLogado', JSON.stringify(users[0]));
                    alert('Login realizado com sucesso!');
                    window.location.href = 'index.html';
                } else {
                    alert('Login ou senha inválidos.');
                }
            });
    });

    // Função de Cadastro de Novo Usuário
    formCadastro?.addEventListener('submit', (e) => {
        e.preventDefault();
        const nome = document.getElementById('cad-nome').value.trim();
        const login = document.getElementById('cad-login').value.trim();
        const senha = document.getElementById('cad-senha').value.trim();

        if (!nome || !login || !senha) {
            alert('Preencha todos os campos!');
            return;
        }

        // Primeiro, verifica se já existe um usuário com esse login
        fetch(`${API_URL}?login=${login}`)
            .then(res => res.json())
            .then(users => {
                if (users.length > 0) {
                    alert('Este login já existe! Escolha outro.');
                } else {
                    const novoUsuario = {
                        nome: nome,
                        login: login,
                        senha: senha,
                        admin: false
                    };

                    fetch(API_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(novoUsuario)
                    })
                    .then(() => {
                        alert('Usuário cadastrado com sucesso! Agora faça o login.');
                        // Voltar para o formulário de login
                        document.getElementById('form-cadastro').style.display = 'none';
                        document.getElementById('form-login').style.display = 'block';
                    });
                }
            });
    });
});
