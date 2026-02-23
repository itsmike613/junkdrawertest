(() => {
	"use strict";

	const CONFIG = {
		ROWS: 7,
		COLS: 4,
		MAX_SLOTS: 28,
		RARITY_WEIGHTS: {
			common: 55,
			uncommon: 25,
			rare: 12,
			epic: 6,
			legendary: 2
		}
	};

	/** @typedef {"common"|"uncommon"|"rare"|"epic"|"legendary"} Rarity */

	/** @type {Array<{id:string,name:string,category:string,rarity:Rarity,value:number,icon:string}>} */
	const JUNK_POOL = [
		{ id: "paperclip", name: "Paper Clip", category: "Office", rarity: "common", value: 0.25, icon: "📎" },
		{ id: "thumbtack", name: "Thumbtack", category: "Office", rarity: "common", value: 0.15, icon: "📍" },
		{ id: "sticky_note", name: "Sticky Note", category: "Office", rarity: "common", value: 0.35, icon: "🗒️" },
		{ id: "pencil_stub", name: "Pencil Stub", category: "Office", rarity: "common", value: 0.20, icon: "✏️" },

		{ id: "allen_key", name: "Allen Wrench", category: "Hardware", rarity: "common", value: 1.10, icon: "🔧" },
		{ id: "hex_nut", name: "Hex Nut", category: "Hardware", rarity: "common", value: 0.40, icon: "🔩" },
		{ id: "spare_screw", name: "Spare Screw", category: "Hardware", rarity: "common", value: 0.30, icon: "🪛" },
		{ id: "house_key", name: "Old House Key", category: "Hardware", rarity: "uncommon", value: 4.50, icon: "🔑" },

		{ id: "usb_drive", name: "USB Drive", category: "Tech", rarity: "uncommon", value: 8.00, icon: "💾" },
		{ id: "earbud", name: "Single Earbud", category: "Tech", rarity: "uncommon", value: 6.75, icon: "🎧" },
		{ id: "battery", name: "AA Battery", category: "Tech", rarity: "common", value: 1.25, icon: "🔋" },
		{ id: "ethernet", name: "Ethernet Coupler", category: "Tech", rarity: "rare", value: 14.50, icon: "🌐" },
		{ id: "resistor", name: "Mystery Component", category: "Tech", rarity: "rare", value: 12.80, icon: "⚙️" },

		{ id: "yoyo", name: "Yo-Yo", category: "Toys", rarity: "uncommon", value: 5.40, icon: "🪀" },
		{ id: "marble", name: "Shiny Marble", category: "Toys", rarity: "common", value: 0.95, icon: "🔮" },
		{ id: "toy_car", name: "Tiny Toy Car", category: "Toys", rarity: "rare", value: 11.25, icon: "🚗" },
		{ id: "dice", name: "Lucky Die", category: "Toys", rarity: "uncommon", value: 3.70, icon: "🎲" },

		{ id: "arcade_token", name: "Arcade Token", category: "Collectible", rarity: "rare", value: 16.00, icon: "🪙" },
		{ id: "name_tag", name: "Vintage Name Tag", category: "Collectible", rarity: "rare", value: 18.20, icon: "🏷️" },
		{ id: "charm", name: "Star Charm", category: "Collectible", rarity: "epic", value: 29.95, icon: "✨" },
		{ id: "mystery_key", name: "Brass Skeleton Key", category: "Collectible", rarity: "epic", value: 37.50, icon: "🗝️" },
		{ id: "microchip", name: "Retro Microchip", category: "Tech", rarity: "epic", value: 44.00, icon: "🧠" },
		{ id: "golden_clip", name: "Golden Binder Clip", category: "Office", rarity: "legendary", value: 65.00, icon: "📌" },
		{ id: "mini_trophy", name: "Mini Trophy", category: "Collectible", rarity: "legendary", value: 88.80, icon: "🏆" }
	];

	const GRADE_TABLE = [
		{ min: 140, grade: "S", label: "Legendary Hoard" },
		{ min: 80, grade: "A", label: "Buried Treasure" },
		{ min: 50, grade: "B", label: "Great Stash" },
		{ min: 28, grade: "C", label: "Promising Pile" },
		{ min: 12, grade: "D", label: "Loose Odds" },
		{ min: 0, grade: "F", label: "Dust Bunnies" }
	];

	const ui = {
		searchBtn: document.getElementById("searchBtn"),
		statTotalFound: document.getElementById("statTotalFound"),
		statUniqueFound: document.getElementById("statUniqueFound"),
		statDrawerValue: document.getElementById("statDrawerValue"),
		statGrade: document.getElementById("statGrade"),
		statGradeLabel: document.getElementById("statGradeLabel"),
		infoCard: document.getElementById("infoCard"),
		inventoryGrid: document.getElementById("inventoryGrid")
	};

	const state = {
		inventory: Array(CONFIG.MAX_SLOTS).fill(null), // { instanceId, ...item } | null
		totalItemsEverFound: 0,
		uniqueFoundIds: new Set(),
		mode: "normal", // "normal" | "trashConfirm"
		hoveredIndex: null,
		selectedTrashIndex: null,
		nextInstanceId: 1
	};

	function money(value) {
		return value.toFixed(2);
	}

	function sumDrawerValue() {
		return state.inventory.reduce((sum, item) => sum + (item ? item.value : 0), 0);
	}

	function getGrade(totalValue) {
		for (const row of GRADE_TABLE) {
			if (totalValue >= row.min) return row;
		}
		return GRADE_TABLE[GRADE_TABLE.length - 1];
	}

	function isFull() {
		return state.inventory.every(Boolean);
	}

	function firstEmptySlotIndex() {
		return state.inventory.findIndex(slot => slot === null);
	}

	function getRarityWeight(item) {
		return CONFIG.RARITY_WEIGHTS[item.rarity] ?? 1;
	}

	function pickRandomJunk() {
		const totalWeight = JUNK_POOL.reduce((sum, item) => sum + getRarityWeight(item), 0);
		let roll = Math.random() * totalWeight;

		for (const item of JUNK_POOL) {
			roll -= getRarityWeight(item);
			if (roll <= 0) return item;
		}
		return JUNK_POOL[JUNK_POOL.length - 1];
	}

	function getDisplayedItemForInfo() {
		if (state.mode === "trashConfirm" && state.selectedTrashIndex !== null) {
			return state.inventory[state.selectedTrashIndex];
		}
		if (state.hoveredIndex !== null) {
			return state.inventory[state.hoveredIndex];
		}
		return null;
	}

	function getHighlightCategory() {
		const item = getDisplayedItemForInfo();
		return item ? item.category : null;
	}

	function buildSlots() {
		ui.inventoryGrid.innerHTML = "";
		for (let i = 0; i < CONFIG.MAX_SLOTS; i++) {
			const slot = document.createElement("button");
			slot.type = "button";
			slot.className = "slot empty";
			slot.dataset.index = String(i);
			slot.setAttribute("role", "gridcell");
			slot.setAttribute("aria-label", `Empty slot ${i + 1}`);
			slot.addEventListener("mouseenter", onSlotMouseEnter);
			slot.addEventListener("mouseleave", onSlotMouseLeave);
			slot.addEventListener("click", onSlotClick);
			ui.inventoryGrid.appendChild(slot);
		}
	}

	function renderStats() {
		const drawerValue = sumDrawerValue();
		const grade = getGrade(drawerValue);

		ui.statTotalFound.textContent = String(state.totalItemsEverFound);
		ui.statUniqueFound.textContent = `${state.uniqueFoundIds.size} / ${JUNK_POOL.length}`;
		ui.statDrawerValue.textContent = `$${money(drawerValue)}`;

		ui.statGrade.innerHTML = `
          <span class="grade-letter">${grade.grade}</span>
          <span id="statGradeLabel">${grade.label}</span>
        `;
	}

	function renderInfoCard() {
		const item = getDisplayedItemForInfo();

		if (!item) {
			ui.infoCard.classList.add("default");
			const defaultText = isFull()
				? "Drawer is full — trash an item to keep searching"
				: "Hover an item to view details";
			ui.infoCard.textContent = defaultText;
			return;
		}

		ui.infoCard.classList.remove("default");

		const promptHtml = state.mode === "trashConfirm"
			? `
            <div class="trash-question">
              Would you like to trash this item?
              <div class="confirm-actions">
                <button type="button" class="ui-btn confirm" data-action="confirm-trash">Confirm</button>
                <button type="button" class="ui-btn cancel" data-action="cancel-trash">Cancel</button>
              </div>
            </div>
          `
			: "";

		ui.infoCard.innerHTML = `
          <div class="info-wrap">
            <div class="info-header">
              <div class="info-icon" aria-hidden="true">${item.icon}</div>
              <div>
                <h3 class="info-title">${item.name}</h3>
                <p class="info-subtitle">${item.rarity.toUpperCase()} • ${item.category}</p>
              </div>
            </div>

            <div class="info-grid">
              <div class="key">Name</div>     <div class="val">${item.name}</div>
              <div class="key">Category</div> <div class="val">${item.category}</div>
              <div class="key">Value</div>    <div class="val">$${money(item.value)}</div>
              <div class="key">Icon</div>     <div class="val">${item.icon}</div>
            </div>

            ${promptHtml}
          </div>
        `;
	}

	function renderInventory() {
		const highlightCategory = getHighlightCategory();
		const slots = ui.inventoryGrid.children;

		for (let i = 0; i < CONFIG.MAX_SLOTS; i++) {
			const slotEl = slots[i];
			const item = state.inventory[i];

			slotEl.className = "slot";
			slotEl.innerHTML = "";
			slotEl.disabled = false;

			if (!item) {
				slotEl.classList.add("empty");
				slotEl.setAttribute("aria-label", `Empty slot ${i + 1}`);
				continue;
			}

			slotEl.classList.add("filled");
			slotEl.setAttribute(
				"aria-label",
				`${item.name}, ${item.category}, ${item.rarity}, value $${money(item.value)}`
			);

			const icon = document.createElement("span");
			icon.className = "icon";
			icon.textContent = item.icon;

			const dot = document.createElement("span");
			dot.className = `rarity-dot dot-${item.rarity}`;
			dot.title = `${item.rarity} rarity`;

			slotEl.append(icon, dot);

			const isHovered = state.hoveredIndex === i;
			const isSelected = state.selectedTrashIndex === i;
			const sameCategory = highlightCategory && item.category === highlightCategory;

			if (sameCategory && !isHovered) slotEl.classList.add("highlight-match");
			if (isHovered) slotEl.classList.add("hovered");
			if (isSelected) slotEl.classList.add("selected-trash");
		}

		const locked = state.mode === "trashConfirm";
		ui.inventoryGrid.classList.toggle("locked", locked);
	}

	function renderSearchButton() {
		const full = isFull();
		const locked = state.mode === "trashConfirm";
		ui.searchBtn.disabled = full || locked;

		if (locked) {
			ui.searchBtn.title = "Finish the trash confirmation first";
		} else if (full) {
			ui.searchBtn.title = "Inventory is full — trash an item first";
		} else {
			ui.searchBtn.title = "Search the junk drawer";
		}
	}

	function renderAll() {
		renderStats();
		renderInfoCard();
		renderInventory();
		renderSearchButton();
	}

	function addRandomItemToInventory() {
		if (state.mode !== "normal") return;
		const slotIndex = firstEmptySlotIndex();
		if (slotIndex === -1) return;

		const baseItem = pickRandomJunk();
		const instance = {
			...baseItem,
			instanceId: state.nextInstanceId++
		};

		state.inventory[slotIndex] = instance;
		state.totalItemsEverFound += 1;
		state.uniqueFoundIds.add(baseItem.id);

		// Optional tiny feedback: show newly found item details immediately
		state.hoveredIndex = slotIndex;

		renderAll();
	}

	function enterTrashMode(index) {
		if (state.mode !== "normal") return;
		const item = state.inventory[index];
		if (!item) return;

		state.mode = "trashConfirm";
		state.selectedTrashIndex = index;
		state.hoveredIndex = index;
		renderAll();
	}

	function cancelTrashMode() {
		if (state.mode !== "trashConfirm") return;
		state.mode = "normal";
		state.selectedTrashIndex = null;
		state.hoveredIndex = null;
		renderAll();
	}

	function confirmTrash() {
		if (state.mode !== "trashConfirm") return;
		const index = state.selectedTrashIndex;
		if (index === null) return;

		state.inventory[index] = null;
		state.mode = "normal";
		state.selectedTrashIndex = null;
		state.hoveredIndex = null;
		renderAll();
	}

	function onSlotMouseEnter(event) {
		if (state.mode !== "normal") return;
		const slotEl = event.currentTarget;
		const index = Number(slotEl.dataset.index);
		if (!state.inventory[index]) return;
		state.hoveredIndex = index;
		renderAll();
	}

	function onSlotMouseLeave(event) {
		if (state.mode !== "normal") return;
		const slotEl = event.currentTarget;
		const index = Number(slotEl.dataset.index);
		if (state.hoveredIndex === index) {
			state.hoveredIndex = null;
			renderAll();
		}
	}

	function onSlotClick(event) {
		if (state.mode !== "normal") return;
		const slotEl = event.currentTarget;
		const index = Number(slotEl.dataset.index);
		if (!state.inventory[index]) return;
		enterTrashMode(index);
	}

	function onSearchClick() {
		addRandomItemToInventory();
	}

	function onInfoCardClick(event) {
		const target = event.target;
		if (!(target instanceof HTMLElement)) return;

		const action = target.dataset.action;
		if (!action) return;

		if (action === "confirm-trash") {
			confirmTrash();
		} else if (action === "cancel-trash") {
			cancelTrashMode();
		}
	}

	function seedDemo(optionalCount = 0) {
		// Set >0 if you want to prefill for testing; left at 0 for clean start.
		for (let i = 0; i < optionalCount && !isFull(); i++) addRandomItemToInventory();
		if (optionalCount === 0) renderAll();
	}

	function init() {
		buildSlots();
		ui.searchBtn.addEventListener("click", onSearchClick);
		ui.infoCard.addEventListener("click", onInfoCardClick);
		seedDemo(0);
	}

	init();
})();