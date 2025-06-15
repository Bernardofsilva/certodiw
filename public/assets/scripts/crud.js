document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000/items';
    const usuarioLogado = JSON.parse(sessionStorage.getItem('usuarioLogado'));
    const formItem = document.getElementById('form-item');
    const listaCRUD = document.getElementById('lista-itens-crud');

    // Se não for admin, bloquear acesso
    if (!usuarioLogado || !usuarioLogado.admin) {
        alert('Acesso negado. Apenas administradores podem acessar.');
        window.location.href = 'index.html';
        return;
    }

    // Carregar lista de filmes
    function carregarItens() {
        fetch(API_URL)
            .then(res => res.json())
            .then(data => {
                listaCRUD.innerHTML = '';
                data.forEach(item => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <strong>${item.titulo}</strong> (${item.genero})<br>
                        <button onclick="editarItem(${item.id})">Editar</button>
                        <button onclick="excluirItem(${item.id})">Excluir</button>
                        <hr>
                    `;
                    listaCRUD.appendChild(li);
                });
            });
    }

    carregarItens();

    // Salvar (add ou update)
    formItem.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('item-id').value;
        const novoItem = {
            titulo: document.getElementById('titulo').value,
            descricao: document.getElementById('descricao').value,
            genero: document.getElementById('genero').value,
            imagem: document.getElementById('imagem').value
        };

        if (id) {
            // Atualizar
            fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(novoItem)
            }).then(() => {
                alert('Filme atualizado!');
                formItem.reset();
                carregarItens();
            });
        } else {
            // Criar novo
            fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(novoItem)
            }).then(() => {
                alert('Filme cadastrado!');
                formItem.reset();
                carregarItens();
            });
        }
    });

    // Expor funções no escopo global
    window.editarItem = (id) => {
        fetch(`${API_URL}/${id}`)
            .then(res => res.json())
            .then(item => {
                document.getElementById('item-id').value = item.id;
                document.getElementById('titulo').value = item.titulo;
                document.getElementById('descricao').value = item.descricao;
                document.getElementById('genero').value = item.genero;
                document.getElementById('imagem').value = item.imagem;
            });
    };

    window.excluirItem = (id) => {
        if (confirm('Tem certeza que deseja excluir este filme?')) {
            fetch(`${API_URL}/${id}`, { method: 'DELETE' })
                .then(() => {
                    alert('Filme excluído!');
                    carregarItens();
                });
        }
    };
});
