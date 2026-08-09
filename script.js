const state = {
    terms: [],
    query: "",
    category: "all",
    letter: "all",
    sort: "az",
    selectedId: ""
};

const featuredIds = [
    "cost-value-reconciliation-cvr",
    "retention",
    "variation",
    "extension-of-time-eot",
    "bill-of-quantities-boq",
    "final-account"
];

const starterIds = [
    "qs-quantity-surveyor",
    "tender",
    "valuation",
    "practical-completion",
    "snagging-list",
    "boq-bill-of-quantities"
];

const elements = {
    totalTerms: document.getElementById("totalTerms"),
    resultCount: document.getElementById("resultCount"),
    searchBox: document.getElementById("searchBox"),
    categoryFilter: document.getElementById("categoryFilter"),
    sortFilter: document.getElementById("sortFilter"),
    quickFilters: document.getElementById("quickFilters"),
    alphabetRail: document.getElementById("alphabetRail"),
    results: document.getElementById("results"),
    emptyState: document.getElementById("emptyState"),
    detailCategory: document.getElementById("detailCategory"),
    detailTerm: document.getElementById("detailTerm"),
    detailDefinition: document.getElementById("detailDefinition"),
    detailAliases: document.getElementById("detailAliases"),
    copyLinkButton: document.getElementById("copyLinkButton"),
    popularTerms: document.getElementById("popularTerms"),
    newTerms: document.getElementById("newTerms"),
    starterTerms: document.getElementById("starterTerms"),
    submitForm: document.getElementById("submitForm"),
    submitStatus: document.getElementById("submitStatus")
};

function normalise(value) {
    return value.toLowerCase().trim();
}

function escapeHtml(value) {
    return value.replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[char]));
}

function highlight(value) {
    const safe = escapeHtml(value);
    if (!state.query) return safe;

    const words = state.query
        .split(/\s+/)
        .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .filter(Boolean);

    if (!words.length) return safe;

    return safe.replace(new RegExp(`(${words.join("|")})`, "gi"), "<mark>$1</mark>");
}

function termMatches(term) {
    const haystack = normalise([
        term.term,
        term.definition,
        term.category,
        ...(term.aliases || [])
    ].join(" "));

    const firstLetter = term.term.charAt(0).toUpperCase();
    const queryMatch = !state.query || state.query.split(/\s+/).every((word) => haystack.includes(word));
    const categoryMatch = state.category === "all" || term.category === state.category;
    const letterMatch = state.letter === "all" || firstLetter === state.letter;

    return queryMatch && categoryMatch && letterMatch;
}

function sortedTerms(terms) {
    return [...terms].sort((a, b) => {
        if (state.sort === "za") return b.term.localeCompare(a.term, "en-GB");
        if (state.sort === "category") {
            return a.category.localeCompare(b.category, "en-GB") || a.term.localeCompare(b.term, "en-GB");
        }
        return a.term.localeCompare(b.term, "en-GB");
    });
}

function updateUrl(term) {
    if (!term) return;
    const url = new URL(window.location.href);
    url.searchParams.set("term", term.id);
    window.history.replaceState({}, "", url);
}

function selectTerm(id, shouldUpdateUrl = true) {
    const term = state.terms.find((item) => item.id === id) || state.terms[0];
    if (!term) return;

    state.selectedId = term.id;
    elements.detailCategory.textContent = term.category;
    elements.detailTerm.textContent = term.term;
    elements.detailDefinition.textContent = term.definition;
    elements.detailAliases.innerHTML = "";

    (term.aliases || []).forEach((alias) => {
        const pill = document.createElement("span");
        pill.className = "alias-pill";
        pill.textContent = alias;
        elements.detailAliases.appendChild(pill);
    });

    document.querySelectorAll(".term-row").forEach((row) => {
        row.classList.toggle("is-selected", row.dataset.id === term.id);
    });

    if (shouldUpdateUrl) updateUrl(term);
}

function renderResults() {
    const filtered = sortedTerms(state.terms.filter(termMatches));
    elements.results.innerHTML = "";
    elements.emptyState.hidden = filtered.length > 0;

    elements.resultCount.textContent = `${filtered.length} of ${state.terms.length} terms`;

    const fragment = document.createDocumentFragment();

    filtered.forEach((term) => {
        const row = document.createElement("button");
        row.type = "button";
        row.className = "term-row";
        row.dataset.id = term.id;
        row.innerHTML = `
            <span>
                <h3>${highlight(term.term)}</h3>
            </span>
            <p>${highlight(term.definition)}</p>
            <span class="category-badge">${escapeHtml(term.category)}</span>
        `;
        row.addEventListener("click", () => selectTerm(term.id));
        fragment.appendChild(row);
    });

    elements.results.appendChild(fragment);

    const stillVisible = filtered.some((term) => term.id === state.selectedId);
    if (filtered.length && !stillVisible) selectTerm(filtered[0].id, false);
    if (filtered.length && stillVisible) selectTerm(state.selectedId, false);
}

function renderCategoryControls() {
    const categories = [...new Set(state.terms.map((term) => term.category))].sort((a, b) => a.localeCompare(b, "en-GB"));
    const priority = ["Commercial", "Contracts", "Measurement", "Construction Tech", "M&E", "Legal", "Groundworks", "Acronyms"];

    categories.forEach((category) => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        elements.categoryFilter.appendChild(option);
    });

    priority.filter((category) => categories.includes(category)).forEach((category) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "filter-chip";
        chip.textContent = category;
        chip.addEventListener("click", () => {
            state.category = state.category === category ? "all" : category;
            elements.categoryFilter.value = state.category;
            syncActiveControls();
            renderResults();
        });
        elements.quickFilters.appendChild(chip);
    });
}

function renderAlphabetRail() {
    ["All", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].forEach((letter) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "letter-chip";
        button.textContent = letter;
        button.dataset.letter = letter === "All" ? "all" : letter;
        button.addEventListener("click", () => {
            state.letter = button.dataset.letter;
            syncActiveControls();
            renderResults();
        });
        elements.alphabetRail.appendChild(button);
    });
}

function syncActiveControls() {
    document.querySelectorAll(".filter-chip").forEach((chip) => {
        chip.classList.toggle("is-active", chip.textContent === state.category);
    });

    document.querySelectorAll(".letter-chip").forEach((chip) => {
        chip.classList.toggle("is-active", chip.dataset.letter === state.letter);
    });
}

function createSideLink(term) {
    const link = document.createElement("a");
    link.className = "side-link";
    link.href = `?term=${encodeURIComponent(term.id)}`;
    link.textContent = term.term;
    link.addEventListener("click", (event) => {
        event.preventDefault();
        selectTerm(term.id);
        document.getElementById("dictionary-heading").scrollIntoView({ block: "start" });
    });
    return link;
}

function renderCollections() {
    const byId = new Map(state.terms.map((term) => [term.id, term]));
    const findByTerm = (name) => state.terms.find((term) => normalise(term.term).includes(normalise(name)));

    const popular = featuredIds
        .map((id) => byId.get(id))
        .filter(Boolean);

    ["Cost Value Reconciliation", "Retention", "Variation", "Extension of Time", "Bill of Quantities", "Final Account"].forEach((name) => {
        const term = findByTerm(name);
        if (term && !popular.some((item) => item.id === term.id)) popular.push(term);
    });

    const latest = state.terms.slice(-6).reverse();
    const starters = starterIds.map((id) => byId.get(id)).filter(Boolean);

    ["Quantity Surveyor", "Tender", "Valuation", "Practical Completion", "Snagging List", "Bill of Quantities"].forEach((name) => {
        const term = findByTerm(name);
        if (term && !starters.some((item) => item.id === term.id)) starters.push(term);
    });

    popular.slice(0, 6).forEach((term) => elements.popularTerms.appendChild(createSideLink(term)));
    latest.slice(0, 6).forEach((term) => elements.newTerms.appendChild(createSideLink(term)));
    starters.slice(0, 6).forEach((term) => elements.starterTerms.appendChild(createSideLink(term)));
}

async function copySelectedLink() {
    const term = state.terms.find((item) => item.id === state.selectedId);
    if (!term) return;

    const url = new URL(window.location.href);
    url.searchParams.set("term", term.id);

    try {
        await navigator.clipboard.writeText(url.toString());
        elements.copyLinkButton.textContent = "Copied";
        window.setTimeout(() => {
            elements.copyLinkButton.textContent = "Copy Link";
        }, 1400);
    } catch {
        elements.copyLinkButton.textContent = "Link Ready";
        window.setTimeout(() => {
            elements.copyLinkButton.textContent = "Copy Link";
        }, 1400);
    }
}

function setupEvents() {
    elements.searchBox.addEventListener("input", (event) => {
        state.query = normalise(event.target.value);
        renderResults();
    });

    elements.categoryFilter.addEventListener("change", (event) => {
        state.category = event.target.value;
        syncActiveControls();
        renderResults();
    });

    elements.sortFilter.addEventListener("change", (event) => {
        state.sort = event.target.value;
        renderResults();
    });

    elements.copyLinkButton.addEventListener("click", copySelectedLink);

    elements.submitForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const term = document.getElementById("suggestedTerm").value.trim();
        const definition = document.getElementById("suggestedDefinition").value.trim();
        const category = document.getElementById("suggestedCategory").value;
        const email = document.getElementById("suggestedEmail").value.trim();
        const subject = encodeURIComponent(`QS Dictionary term suggestion: ${term}`);
        const body = encodeURIComponent([
            `Term: ${term}`,
            `Category: ${category}`,
            `Definition/context: ${definition}`,
            `Submitted by: ${email || "Not provided"}`
        ].join("\n\n"));

        window.location.href = `mailto:hello@theqscollection.com?subject=${subject}&body=${body}`;
        elements.submitStatus.textContent = "Submission draft prepared for review.";
    });
}

async function initialise() {
    try {
        const response = await fetch("terms.json");
        if (!response.ok) throw new Error("Unable to load terms");

        state.terms = await response.json();
        elements.totalTerms.textContent = `${state.terms.length}+`;

        renderCategoryControls();
        renderAlphabetRail();
        renderCollections();
        setupEvents();

        const requestedTerm = new URLSearchParams(window.location.search).get("term");
        state.selectedId = requestedTerm || state.terms[0]?.id || "";
        syncActiveControls();
        renderResults();
    } catch (error) {
        elements.resultCount.textContent = "Terms could not be loaded";
        elements.emptyState.hidden = false;
        console.error(error);
    }
}

initialise();
