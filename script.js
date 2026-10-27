
"use strict";

// ========================================
// 1. ARMAZENAMENTO
// ========================================

const STORAGE_KEY = "taskflow_tasks";

function loadTasks() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) return [];

        const data = JSON.parse(saved);

        if (!Array.isArray(data)) return [];

        // Verifica os dados carregados do navegador.
        return data.filter(task =>
            task &&
            typeof task.id === "string" &&
            typeof task.title === "string" &&
            ["Pendente", "Em andamento", "Concluída"].includes(task.status)
        ).map(task => ({
            id: task.id,
            title: task.title,
            description: typeof task.description === "string"
                ? task.description : "",
            priority: ["Alta", "Média", "Baixa"].includes(task.priority)
                ? task.priority : "Média",
            status: task.status,
            date: typeof task.date === "string" ? task.date : "",
            createdAt: Number(task.createdAt) || 0
        }));
    } catch (error) {
        console.error("Erro ao carregar as tarefas:", error);
        return [];
    }
}

let tasks = loadTasks();

function saveTasks() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        return true;
    } catch (error) {
        console.error("Erro ao salvar as tarefas:", error);
        alert("Não foi possível salvar. Verifique o armazenamento do navegador.");
        return false;
    }
}

// ========================================
// 2. ELEMENTOS DO HTML
// ========================================

const taskForm = document.getElementById("task-form");
const taskModal = document.getElementById("task-modal");
const taskId = document.getElementById("task-id");
const taskTitle = document.getElementById("task-title");
const taskDescription = document.getElementById("task-description");
const taskPriority = document.getElementById("task-priority");
const taskStatus = document.getElementById("task-status");
const taskDate = document.getElementById("task-date");

// ========================================
// 3. FUNÇÕES AUXILIARES
// ========================================

// Protege os textos inseridos pelo usuário ao montar o HTML.
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}

// Obtém a data de hoje no horário local do computador.
function getToday() {
    const today = new Date();

    return new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
    );
}

// Converte YYYY-MM-DD em uma data local, sem problemas de fuso horário.
function parseLocalDate(dateString) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString || "")) {
        return null;
    }

    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    // Evita aceitar datas inexistentes, como 31 de fevereiro.
    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return null;
    }

    return date;
}

function formatDate(dateString) {
    if (!dateString) return "Sem prazo definido";

    const date = parseLocalDate(dateString);

    if (!date) return "Data inválida";

    return date.toLocaleDateString("pt-BR");
}

// Verifica se a tarefa passou do prazo.
function isTaskOverdue(task) {
    if (!task.date || task.status === "Concluída") {
        return false;
    }

    const deadline = parseLocalDate(task.date);

    if (!deadline) return false;

    return deadline < getToday();
}

function statusClass(status) {
    if (status === "Concluída") return "status-concluida";
    if (status === "Em andamento") return "status-em-andamento";

    return "status-pendente";
}

function priorityClass(priority) {
    if (priority === "Alta") return "priority-alta";
    if (priority === "Baixa") return "priority-baixa";

    return "priority-media";
}

// ========================================
// 4. ABRIR E FECHAR O FORMULÁRIO
// ========================================

function openNewTask() {
    taskForm.reset();
    taskId.value = "";

    document.getElementById("modal-title").textContent = "Nova tarefa";
    document.getElementById("save-task-btn").textContent = "Salvar tarefa";

    taskModal.classList.remove("hidden");
    taskTitle.focus();
}

function openEditTask(id) {
    const task = tasks.find(item => item.id === id);

    if (!task) return;

    taskId.value = task.id;
    taskTitle.value = task.title;
    taskDescription.value = task.description;
    taskPriority.value = task.priority;
    taskStatus.value = task.status;
    taskDate.value = task.date || "";

    document.getElementById("modal-title").textContent = "Editar tarefa";
    document.getElementById("save-task-btn").textContent = "Salvar alterações";

    taskModal.classList.remove("hidden");
    taskTitle.focus();
}

function closeModal() {
    taskModal.classList.add("hidden");
}

document.getElementById("new-task-btn")
    .addEventListener("click", openNewTask);

document.getElementById("close-modal")
    .addEventListener("click", closeModal);

document.getElementById("cancel-modal")
    .addEventListener("click", closeModal);

taskModal.addEventListener("click", event => {
    if (event.target === taskModal) {
        closeModal();
    }
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeModal();
    }
});

// ========================================
// 5. CADASTRAR E EDITAR TAREFAS
// ========================================

taskForm.addEventListener("submit", event => {
    event.preventDefault();

    const title = taskTitle.value.trim();

    if (!title) {
        alert("Digite o título da tarefa.");
        taskTitle.focus();
        return;
    }

    const dateValue = taskDate.value;

    if (dateValue && !parseLocalDate(dateValue)) {
        alert("Selecione uma data válida para o prazo.");
        taskDate.focus();
        return;
    }

    const existingId = taskId.value;

    const taskData = {
        title: title,
        description: taskDescription.value.trim(),
        priority: taskPriority.value,
        status: taskStatus.value,
        date: dateValue
    };

    // Guarda uma cópia para recuperar os dados se o salvamento falhar.
    const previousTasks = tasks.map(task => ({ ...task }));

    if (existingId) {
        const index = tasks.findIndex(task => task.id === existingId);

        if (index === -1) {
            alert("Essa tarefa não foi encontrada. Atualize a página e tente novamente.");
            return;
        }

        tasks[index] = {
            ...tasks[index],
            ...taskData
        };
    } else {
        tasks.push({
            id: Date.now().toString() + "-" +
                Math.random().toString(36).slice(2, 9),
            ...taskData,
            createdAt: Date.now()
        });
    }

    if (!saveTasks()) {
        tasks = previousTasks;
        renderTasks();
        return;
    }

    renderTasks();
    closeModal();
});

// ========================================
// 6. CRIAR O VISUAL DE CADA TAREFA
// ========================================

function createTaskHTML(task) {
    const completed = task.status === "Concluída";
    const overdue = isTaskOverdue(task);

    return `
        <article class="task-item
            ${completed ? "is-complete" : ""}
            ${overdue ? "is-overdue" : ""}">

            <input
                class="task-check"
                type="checkbox"
                data-action="toggle"
                data-id="${escapeHTML(task.id)}"
                ${completed ? "checked" : ""}
                aria-label="Marcar tarefa como concluída"
            >

            <div class="task-info">
                <h3>${escapeHTML(task.title)}</h3>

                ${
                    task.description
                        ? `<p>${escapeHTML(task.description)}</p>`
                        : ""
                }

                <div class="task-meta">
                    <span class="tag ${statusClass(task.status)}">
                        ${escapeHTML(task.status)}
                    </span>

                    <span class="tag ${priorityClass(task.priority)}">
                        Prioridade ${escapeHTML(task.priority)}
                    </span>
                </div>

                <div class="task-date">
                    Prazo: ${escapeHTML(formatDate(task.date))}

                    ${
                        overdue
                            ? '<span class="tag overdue-tag">⚠ Atrasada</span>'
                            : ""
                    }
                </div>
            </div>

            <div class="task-actions">
                <button
                    type="button"
                    class="action-button"
                    data-action="edit"
                    data-id="${escapeHTML(task.id)}"
                >Editar</button>

                <button
                    type="button"
                    class="action-button delete"
                    data-action="delete"
                    data-id="${escapeHTML(task.id)}"
                >Excluir</button>
            </div>
        </article>
    `;
}

function renderTaskList(container, list, message) {
    if (list.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <strong>Nenhuma tarefa encontrada.</strong>
                <p>${escapeHTML(message)}</p>
            </div>
        `;

        return;
    }

    container.innerHTML = list.map(createTaskHTML).join("");
}

// ========================================
// 7. DASHBOARD
// ========================================

function updateDashboard() {
    const total = tasks.length;

    const pending = tasks.filter(
        task => task.status === "Pendente"
    ).length;

    const inProgress = tasks.filter(
        task => task.status === "Em andamento"
    ).length;

    const completed = tasks.filter(
        task => task.status === "Concluída"
    ).length;

    const percent = total === 0
        ? 0
        : Math.round((completed / total) * 100);

    document.getElementById("total-tasks").textContent = total;
    document.getElementById("pending-tasks").textContent = pending;
    document.getElementById("progress-tasks").textContent = inProgress;
    document.getElementById("completed-tasks").textContent = completed;

    document.getElementById("progress-percent").textContent = percent + "%";
    document.getElementById("progress-bar").style.width = percent + "%";

    let caption = "Cadastre uma tarefa para começar.";

    if (total > 0 && completed === total) {
        caption = "Parabéns! Você concluiu todas as tarefas.";
    } else if (total > 0) {
        caption = `Você concluiu ${completed} de ${total} tarefas.`;
    }

    document.getElementById("progress-caption").textContent = caption;
}

// ========================================
// 8. ESTATÍSTICAS
// ========================================

function updateStatistics() {
    const total = tasks.length;

    const pending = tasks.filter(
        task => task.status === "Pendente"
    ).length;

    const inProgress = tasks.filter(
        task => task.status === "Em andamento"
    ).length;

    const completed = tasks.filter(
        task => task.status === "Concluída"
    ).length;

    const overdue = tasks.filter(isTaskOverdue).length;

    const rate = total === 0
        ? 0
        : Math.round((completed / total) * 100);

    document.getElementById("stats-total").textContent = total;
    document.getElementById("completion-rate").textContent = rate + "%";
    document.getElementById("overdue-tasks").textContent = overdue;

    document.getElementById("dist-pending").textContent = pending;
    document.getElementById("dist-progress").textContent = inProgress;
    document.getElementById("dist-completed").textContent = completed;

    document.getElementById("bar-pending").style.width =
        (total === 0 ? 0 : pending / total * 100) + "%";

    document.getElementById("bar-progress").style.width =
        (total === 0 ? 0 : inProgress / total * 100) + "%";

    document.getElementById("bar-completed").style.width =
        (total === 0 ? 0 : completed / total * 100) + "%";
}

// ========================================
// 9. PESQUISA E FILTROS
// ========================================

function getFilteredTasks() {
    const search = document.getElementById("search-task")
        .value.trim().toLocaleLowerCase("pt-BR");

    const status = document.getElementById("filter-status").value;
    const priority = document.getElementById("filter-priority").value;

    return tasks.filter(task => {
        const title = task.title.toLocaleLowerCase("pt-BR");
        const description = task.description.toLocaleLowerCase("pt-BR");

        const matchesSearch =
            title.includes(search) || description.includes(search);

        const matchesStatus =
            status === "todos" || task.status === status;

        const matchesPriority =
            priority === "todas" || task.priority === priority;

        return matchesSearch && matchesStatus && matchesPriority;
    });
}

// ========================================
// 10. ATUALIZAR TODA A INTERFACE
// ========================================

function renderTasks() {
    const sortedTasks = [...tasks].sort(
        (a, b) => b.createdAt - a.createdAt
    );

    renderTaskList(
        document.getElementById("recent-tasks"),
        sortedTasks.slice(0, 5),
        "Clique em Nova tarefa para cadastrar sua primeira atividade."
    );

    const filteredTasks = getFilteredTasks().sort(
        (a, b) => b.createdAt - a.createdAt
    );

    renderTaskList(
        document.getElementById("all-tasks"),
        filteredTasks,
        "Experimente mudar os filtros ou cadastrar uma nova tarefa."
    );

    updateDashboard();
    updateStatistics();
}

// ========================================
// 11. NAVEGAÇÃO
// ========================================

function showPage(pageName) {
    const pages = ["dashboard", "tarefas", "estatisticas"];

    if (!pages.includes(pageName)) {
        pageName = "dashboard";
    }

    pages.forEach(page => {
        document.getElementById(page + "-page")
            .classList.toggle("hidden", page !== pageName);
    });

    document.querySelectorAll(".nav-link").forEach(link => {
        const active = link.dataset.page === pageName;

        link.classList.toggle("active", active);

        if (active) {
            link.setAttribute("aria-current", "page");
        } else {
            link.removeAttribute("aria-current");
        }
    });

    const titles = {
        dashboard: "Dashboard",
        tarefas: "Minhas tarefas",
        estatisticas: "Estatísticas"
    };

    document.getElementById("page-title").textContent = titles[pageName];
}

document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", event => {
        event.preventDefault();
        showPage(link.dataset.page);
    });
});

document.querySelectorAll("[data-go]").forEach(button => {
    button.addEventListener("click", () => {
        showPage(button.dataset.go);
    });
});

// ========================================
// 12. AÇÕES DAS TAREFAS
// ========================================

document.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const id = button.dataset.id;
    const action = button.dataset.action;

    if (action === "edit") {
        openEditTask(id);
    }

    if (action === "delete") {
        const task = tasks.find(item => item.id === id);

        if (!task) return;

        const confirmed = confirm(
            `Deseja excluir a tarefa "${task.title}"?`
        );

        if (!confirmed) return;

        const previousTasks = tasks.map(item => ({ ...item }));

        tasks = tasks.filter(item => item.id !== id);

        if (!saveTasks()) {
            tasks = previousTasks;
        }

        renderTasks();
    }
});

// ========================================
// 13. MARCAR TAREFA COMO CONCLUÍDA
// ========================================

document.addEventListener("change", event => {
    const checkbox = event.target.closest(
        'input[data-action="toggle"]'
    );

    if (!checkbox) return;

    const task = tasks.find(item => item.id === checkbox.dataset.id);

    if (!task) return;

    const previousStatus = task.status;

    task.status = checkbox.checked
        ? "Concluída"
        : "Pendente";

    if (!saveTasks()) {
        task.status = previousStatus;
    }

    renderTasks();
});

// ========================================
// 14. FILTROS AUTOMÁTICOS
// ========================================

document.getElementById("search-task")
    .addEventListener("input", renderTasks);

document.getElementById("filter-status")
    .addEventListener("change", renderTasks);

document.getElementById("filter-priority")
    .addEventListener("change", renderTasks);

// ========================================
// 15. INICIALIZAÇÃO DO SISTEMA
// ========================================

showPage("dashboard");
renderTasks();
