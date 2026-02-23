const itemPool = [{
    name: "Rusty Nail",
    cat: "Hardware",
    val: 0.10,
    icon: "📍"
},
{
    name: "Sticky Penny",
    cat: "Currency",
    val: 0.01,
    icon: "🪙"
},
{
    name: "Bent Paperclip",
    cat: "Office",
    val: 0.05,
    icon: "📎"
},
{
    name: "AA Battery",
    cat: "Tech",
    val: 1.50,
    icon: "🔋"
},
{
    name: "Blue Marble",
    cat: "Toy",
    val: 2.00,
    icon: "🔮"
},
{
    name: "Old Key",
    cat: "Hardware",
    val: 5.00,
    icon: "🔑"
},
{
    name: "Broken Earbud",
    cat: "Tech",
    val: 0.50,
    icon: "🎧"
},
{
    name: "Cracked D20",
    cat: "Toy",
    val: 12.00,
    icon: "🎲"
},
{
    name: "Silver Ring",
    cat: "Valuable",
    val: 50.00,
    icon: "💍"
},
{
    name: "Rare Stamp",
    cat: "Office",
    val: 100.00,
    icon: "🏷️"
}
];
let inventory = Array(28).fill(null);
let stats = {
    total: 0,
    unique: new Set(),
    drawerValue: 0
};
let isModalOpen = false;
const inventoryEl = document.getElementById('inventory');
const infoContent = document.getElementById('info-content');
// Init Inventory
function createGrid() {
    inventoryEl.innerHTML = '';
    inventory.forEach((item, index) => {
        const slot = document.createElement('div');
        slot.className = `slot ${item ? 'filled' : ''}`;
        slot.dataset.index = index;
        if (item) slot.innerHTML = item.icon;
        slot.onmouseenter = () => !isModalOpen && showDetails(index);
        slot.onmouseleave = () => !isModalOpen && resetDetails();
        slot.oncontextmenu = (e) => {
            e.preventDefault();
            if (item) openTrashModal(index);
        };
        inventoryEl.appendChild(slot);
    });
    updateStats();
}

function findItem() {
    if (isModalOpen) return;
    const emptyIndex = inventory.indexOf(null);
    if (emptyIndex === -1) {
        infoContent.innerHTML = "<span style='color:var(--danger)'>Drawer is full!</span>";
        return;
    }
    const newItem = itemPool[Math.floor(Math.random() * itemPool.length)];
    inventory[emptyIndex] = newItem;
    stats.total++;
    stats.unique.add(newItem.name);
    createGrid();
}

function showDetails(index) {
    const item = inventory[index];
    if (!item) return;
    infoContent.innerHTML = `
            <div class="item-icon">${item.icon}</div>
            <div class="item-name">${item.name}</div>
            <div class="item-cat">${item.cat}</div>
            <div class="item-val">$${item.val.toFixed(2)}</div>
        `;
    // Highlight others in category
    document.querySelectorAll('.slot').forEach(s => {
        const i = inventory[s.dataset.index];
        if (i && i.cat === item.cat) s.classList.add('highlight');
    });
}

function resetDetails() {
    infoContent.innerHTML = "Hover an item to view details";
    document.querySelectorAll('.slot').forEach(s => s.classList.remove('highlight'));
}

function openTrashModal(index) {
    isModalOpen = true;
    const item = inventory[index];
    showDetails(index);
    const actionDiv = document.createElement('div');
    actionDiv.innerHTML = `
            <p>Trash this item?</p>
            <button class="confirm-btn" onclick="confirmTrash(${index})">YES</button>
            <button class="cancel-btn" onclick="closeModal()">NO</button>
        `;
    infoContent.appendChild(actionDiv);
}

function confirmTrash(index) {
    inventory[index] = null;
    closeModal();
    createGrid();
}

function closeModal() {
    isModalOpen = false;
    resetDetails();
}

function updateStats() {
    let val = inventory.reduce((acc, curr) => acc + (curr ? curr.val : 0), 0);
    document.getElementById('stat-total').innerText = stats.total;
    document.getElementById('stat-unique').innerText = stats.unique.size;
    document.getElementById('stat-value').innerText = `$${val.toFixed(2)}`;
}
createGrid();