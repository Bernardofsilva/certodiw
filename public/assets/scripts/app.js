document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000/items';
    const FAVORITOS_URL = 'http://localhost:3000/favorites';
    const usuarioLogado = JSON.parse(sessionStorage.getItem('usuarioLogado'));
    const listaItens = document.getElementById('lista-itens');
    const campoPesquisa = document.getElementById('campo-pesquisa');
    const btnPesquisar = document.getElementById('btn-pesquisar');
    const btnLimpar = document.getElementById('btn-limpar');
    const selectGenero = document.getElementById('genero');
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modal-body');
    const closeModal = document.querySelector('.close-modal');

    // Variáveis do carrossel
    let currentSlide = 0;
    let slides = [];
    let intervalId;
    let items = []; // Cache dos filmes

    // Verificação de usuário
    if (usuarioLogado) {
        document.getElementById('menu-login').style.display = 'none';
        document.getElementById('menu-logout').style.display = 'inline';
        document.getElementById('menu-favoritos').style.display = 'inline';
        document.getElementById('menu-cadastro').style.display = usuarioLogado.admin ? 'inline' : 'none';
    }

    // Event Listeners
    document.getElementById('menu-logout')?.addEventListener('click', () => {
        sessionStorage.removeItem('usuarioLogado');
        window.location.reload();
    });

    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Funções principais
    function carregarFilmes(filtroGenero = 'todos', textoPesquisa = '') {
        fetchWithErrorHandling(API_URL)
            .then(data => {
                items = data; // Armazena os filmes em cache
                listaItens.innerHTML = '';
                
                // Criar gráfico de pizza
                criarGraficoPizza(data);

                if (usuarioLogado) {
                    fetchWithErrorHandling(`${FAVORITOS_URL}?userId=${usuarioLogado.id}`)
                        .then(favs => {
                            const favoritos = favs.length > 0 ? favs[0].favoritos : [];
                            renderizarFilmes(data, favoritos, filtroGenero, textoPesquisa);
                        });
                } else {
                    renderizarFilmes(data, [], filtroGenero, textoPesquisa);
                }
            });
    }

    // Nova função para criar o gráfico de pizza
    function criarGraficoPizza(filmes) {
        // Contar filmes por gênero
        const generos = {};
        filmes.forEach(filme => {
            generos[filme.genero] = (generos[filme.genero] || 0) + 1;
        });

        const ctx = document.getElementById('grafico-generos');
        if (!ctx) return;

        // Destruir gráfico anterior se existir
        if (ctx.chart) {
            ctx.chart.destroy();
        }

        ctx.chart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(generos),
                datasets: [{
                    data: Object.values(generos),
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF',
                        '#FF9F40',
                        '#8AC24A',
                        '#FF5722',
                        '#607D8B',
                        '#9C27B0'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                    },
                    title: {
                        display: true,
                        text: 'Distribuição de Filmes por Gênero',
                        font: {
                            size: 16
                        }
                    }
                }
            }
        });
    }

    function renderizarFilmes(data, favoritos, filtroGenero, textoPesquisa) {
        let filmesFiltrados = data;

        if (filtroGenero !== 'todos') {
            filmesFiltrados = filmesFiltrados.filter(f => f.genero === filtroGenero);
        }

        if (textoPesquisa.trim() !== '') {
            filmesFiltrados = filmesFiltrados.filter(f =>
                f.titulo.toLowerCase().includes(textoPesquisa.toLowerCase()) ||
                f.descricao.toLowerCase().includes(textoPesquisa.toLowerCase())
            );
        }

        filmesFiltrados.forEach(filme => {
            const card = document.createElement('div');
            card.classList.add('card-item');

            card.innerHTML = `
                <img src="${filme.imagem}" alt="${filme.titulo}" loading="lazy">
                <h3>${filme.titulo}</h3>
                <p>${filme.descricao.substring(0, 100)}...</p>
                ${usuarioLogado ? `<button class="btn-favorito" data-id="${filme.id}">
                    ${favoritos.includes(filme.id) ? '❤️' : '🤍'}
                </button>` : ''}
            `;

            card.addEventListener('click', (e) => {
                if (!e.target.classList.contains('btn-favorito')) {
                    abrirModal(filme);
                }
            });

            if (usuarioLogado) {
                card.querySelector('.btn-favorito')?.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleFavorito(filme.id, e.target);
                });
            }

            listaItens.appendChild(card);
        });
    }

    function abrirModal(filme) {
        modalBody.innerHTML = `
            <div class="modal-poster">
                <img src="${filme.imagem}" alt="${filme.titulo}">
            </div>
            <div class="modal-info">
                <h2>${filme.titulo}</h2>
                <p><strong>Gênero:</strong> ${filme.genero}</p>
                <p>${filme.descricao}</p>
            </div>
        `;
        modal.style.display = 'block';
    }

    function toggleFavorito(idFilme, btn) {
        if (!usuarioLogado) {
            showToast('Você precisa estar logado para favoritar filmes', 'error');
            return;
        }

        // Desabilita o botão durante a requisição
        btn.disabled = true;

        fetchWithErrorHandling(`${FAVORITOS_URL}?userId=${usuarioLogado.id}`)
            .then(favs => {
                let favsDoUsuario = favs[0];

                if (!favsDoUsuario) {
                    favsDoUsuario = { 
                        userId: usuarioLogado.id, 
                        favoritos: [] 
                    };
                    return fetchWithErrorHandling(FAVORITOS_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(favsDoUsuario)
                    }).then(() => favsDoUsuario);
                }

                return Promise.resolve(favsDoUsuario);
            })
            .then(favsDoUsuario => {
                const jaFavoritado = favsDoUsuario.favoritos.includes(idFilme);
                const filme = items.find(item => item.id === idFilme);

                if (jaFavoritado) {
                    favsDoUsuario.favoritos = favsDoUsuario.favoritos.filter(id => id !== idFilme);
                    btn.textContent = '🤍';
                    showToast(`${filme.titulo} removido dos favoritos`);
                } else {
                    favsDoUsuario.favoritos.push(idFilme);
                    btn.textContent = '❤️';
                    showToast(`${filme.titulo} adicionado aos favoritos`);
                }

                return fetchWithErrorHandling(`${FAVORITOS_URL}/${favsDoUsuario.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(favsDoUsuario)
                });
            })
            .then(() => {
                // Atualiza apenas o card do filme em vez de recarregar tudo
                const cards = document.querySelectorAll('.card-item');
                cards.forEach(card => {
                    const btnFav = card.querySelector('.btn-favorito');
                    if (btnFav && btnFav.dataset.id === idFilme) {
                        btnFav.textContent = btn.textContent;
                    }
                });
            })
            .catch(error => {
                console.error('Erro ao atualizar favoritos:', error);
                showToast('Ocorreu um erro ao atualizar favoritos', 'error');
            })
            .finally(() => {
                btn.disabled = false;
            });
    }

    function fetchWithErrorHandling(url, options) {
        return fetch(url, options)
            .then(res => {
                if (!res.ok) throw new Error('Erro na requisição');
                return res.json();
            })
            .catch(error => {
                console.error('Erro:', error);
                showToast('Ocorreu um erro. Por favor, tente novamente.', 'error');
                throw error;
            });
    }

    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }

    // Funções do carrossel - ATUALIZADAS com novas imagens
    function iniciarCarrossel() {
        // Usando imagens específicas para o carrossel
        slides = [
            {
                imagem: 'https://m.media-amazon.com/images/I/81-i6J7AqpL.jpg',
                titulo: 'Disney Pixar Collector\'s Edition',
                descricao: 'Edição especial de colecionador'
            },
            {
                imagem: 'https://m.media-amazon.com/images/I/71+mhWHnBdL._UF894,1000_QL80_.jpg',
                titulo: 'Disney Pixar DVD Collection',
                descricao: 'Coleção completa em DVD'
            },
            {
                imagem: 'https://m.media-amazon.com/images/I/91J7VHbAwBL._UF894,1000_QL80_.jpg',
                titulo: 'Marvel Vingadores Ultimato',
                descricao: 'O confronto final'
            }
        ];
        renderizarCarrossel();
        iniciarAutoPlay();
    }

    function renderizarCarrossel() {
        const carrosselSlides = document.querySelector('.carrossel-slides');
        const carrosselDots = document.querySelector('.carrossel-dots');

        if (!carrosselSlides || !carrosselDots) return;

        carrosselSlides.innerHTML = '';
        carrosselDots.innerHTML = '';

        slides.forEach((filme, index) => {
            const slide = document.createElement('div');
            slide.className = 'carrossel-slide';
            slide.innerHTML = `
                <img src="${filme.imagem}" alt="${filme.titulo}" class="carrossel-image">
                <div class="carrossel-slide-info">
                    <h3>${filme.titulo}</h3>
                    <p>${filme.descricao}</p>
                </div>
            `;
            carrosselSlides.appendChild(slide);

            const dot = document.createElement('div');
            dot.className = `carrossel-dot ${index === 0 ? 'active' : ''}`;
            dot.addEventListener('click', () => goToSlide(index));
            carrosselDots.appendChild(dot);
        });

        // Ajusta a largura do container de slides
        carrosselSlides.style.width = `${slides.length * 100}%`;
    }

    function goToSlide(index) {
        const carrosselSlides = document.querySelector('.carrossel-slides');
        const dots = document.querySelectorAll('.carrossel-dot');
        
        if (!carrosselSlides || !dots.length) return;

        currentSlide = index;
        carrosselSlides.style.transform = `translateX(-${currentSlide * (100 / slides.length)}%)`;
        
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentSlide);
        });
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        goToSlide(currentSlide);
        resetAutoPlay();
    }

    function prevSlide() {
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        goToSlide(currentSlide);
        resetAutoPlay();
    }

    function iniciarAutoPlay() {
        clearInterval(intervalId);
        intervalId = setInterval(nextSlide, 5000);
    }

    function resetAutoPlay() {
        iniciarAutoPlay();
    }

    // Event Listeners para filtros
    selectGenero.addEventListener('change', () => {
        carregarFilmes(selectGenero.value, campoPesquisa.value);
    });

    btnPesquisar.addEventListener('click', () => {
        carregarFilmes(selectGenero.value, campoPesquisa.value);
    });

    btnLimpar.addEventListener('click', () => {
        campoPesquisa.value = '';
        selectGenero.value = 'todos';
        carregarFilmes();
    });

    // Event Listeners do carrossel
    document.querySelector('.carrossel-btn.prev')?.addEventListener('click', prevSlide);
    document.querySelector('.carrossel-btn.next')?.addEventListener('click', nextSlide);

    // Inicialização
    carregarFilmes();
    iniciarCarrossel();
});