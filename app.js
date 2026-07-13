// Splitwise App State & Core Logic

// 1. SEED DATA (Used if localStorage is empty)
const DEFAULT_FRIENDS = [
    { id: "you", name: "You (Shaunak)", email: "shaunak@example.com" },
    { id: "alice", name: "Alice Smith", email: "alice@example.com" },
    { id: "bob", name: "Bob Jones", email: "bob@example.com" },
    { id: "charlie", name: "Charlie Brown", email: "charlie@example.com" }
];

const DEFAULT_GROUPS = [
    { id: "group-trip", name: "Road Trip 2026", members: ["you", "alice", "bob"] },
    { id: "group-apartment", name: "Apartment 3B", members: ["you", "alice", "charlie"] }
];

const DEFAULT_EXPENSES = [
    {
        id: "exp-1",
        description: "Gas & Snacks",
        amount: 60.00,
        payerId: "you",
        groupId: "group-trip",
        category: "travel",
        date: "2026-07-04",
        splitType: "equal",
        splits: [
            { friendId: "you", amount: 20.00 },
            { friendId: "alice", amount: 20.00 },
            { friendId: "bob", amount: 20.00 }
        ],
        timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000
    },
    {
        id: "exp-2",
        description: "Cabin Rental",
        amount: 300.00,
        payerId: "alice",
        groupId: "group-trip",
        category: "travel",
        date: "2026-07-05",
        splitType: "equal",
        splits: [
            { friendId: "you", amount: 100.00 },
            { friendId: "alice", amount: 100.00 },
            { friendId: "bob", amount: 100.00 }
        ],
        timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000
    },
    {
        id: "exp-3",
        description: "Rent & Internet",
        amount: 1200.00,
        payerId: "you",
        groupId: "group-apartment",
        category: "rent",
        date: "2026-07-01",
        splitType: "percentage",
        splits: [
            { friendId: "you", amount: 600.00, percent: 50 },
            { friendId: "alice", amount: 360.00, percent: 30 },
            { friendId: "charlie", amount: 240.00, percent: 20 }
        ],
        timestamp: Date.now() - 6 * 24 * 60 * 60 * 1000
    },
    {
        id: "exp-4",
        description: "Pizza Party",
        amount: 45.00,
        payerId: "bob",
        groupId: null,
        category: "food",
        date: "2026-07-06",
        splitType: "equal",
        splits: [
            { friendId: "you", amount: 22.50 },
            { friendId: "bob", amount: 22.50 }
        ],
        timestamp: Date.now() - 12 * 60 * 60 * 1000
    }
];

const DEFAULT_SETTLEMENTS = [];

const DEFAULT_ACTIVITIES = [
    { id: "act-1", type: "group", text: "You created group 'Apartment 3B'", timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000 },
    { id: "act-2", type: "expense", text: "You added 'Rent & Internet' in 'Apartment 3B'", timestamp: Date.now() - 6 * 24 * 60 * 60 * 1000 },
    { id: "act-3", type: "group", text: "You created group 'Road Trip 2026'", timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000 },
    { id: "act-4", type: "expense", text: "You added 'Gas & Snacks' in 'Road Trip 2026'", timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000 },
    { id: "act-5", type: "expense", text: "Alice Smith added 'Cabin Rental' in 'Road Trip 2026'", timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000 },
    { id: "act-6", type: "expense", text: "Bob Jones added 'Pizza Party'", timestamp: Date.now() - 12 * 60 * 60 * 1000 }
];

// STATE CLASS
class AppState {
    constructor() {
        this.friends = [];
        this.groups = [];
        this.expenses = [];
        this.settlements = [];
        this.activities = [];
        this.currentUserId = "you";
        this.categoryChart = null;
        this.loadState();
    }

    loadState() {
        const stored = localStorage.getItem("splitwise_app_state");
        if (stored) {
            try {
                const data = JSON.parse(stored);
                this.friends = data.friends || [];
                this.groups = data.groups || [];
                this.expenses = data.expenses || [];
                this.settlements = data.settlements || [];
                this.activities = data.activities || [];
                this.currentUserId = data.currentUserId || "you";
            } catch (e) {
                console.error("Error loading localStorage state. Resetting...", e);
                this.resetToDefault();
            }
        } else {
            this.resetToDefault();
        }
    }

    saveState() {
        const data = {
            friends: this.friends,
            groups: this.groups,
            expenses: this.expenses,
            settlements: this.settlements,
            activities: this.activities,
            currentUserId: this.currentUserId
        };
        localStorage.setItem("splitwise_app_state", JSON.stringify(data));
    }

    resetToDefault() {
        this.friends = [...DEFAULT_FRIENDS];
        this.groups = [...DEFAULT_GROUPS];
        this.expenses = [...DEFAULT_EXPENSES];
        this.settlements = [...DEFAULT_SETTLEMENTS];
        this.activities = [...DEFAULT_ACTIVITIES];
        this.currentUserId = "you";
        this.saveState();
    }

    clearActivities() {
        this.activities = [];
        this.saveState();
    }

    // STATE OPERATIONS
    addFriend(name, email) {
        const id = "friend-" + Date.now();
        const newFriend = { id, name, email: email || "" };
        this.friends.push(newFriend);
        this.logActivity("friend", `Added friend '${name}'`);
        this.saveState();
        return newFriend;
    }

    addGroup(name, memberIds) {
        const id = "group-" + Date.now();
        const newGroup = { id, name, members: ["you", ...memberIds] };
        this.groups.push(newGroup);
        this.logActivity("group", `Created group '${name}'`);
        this.saveState();
        return newGroup;
    }

    addExpense(desc, amount, payerId, groupId, category, date, splitType, splits) {
        const id = "exp-" + Date.now();
        const newExpense = {
            id,
            description: desc,
            amount: parseFloat(amount),
            payerId,
            groupId: groupId || null,
            category,
            date,
            splitType,
            splits,
            timestamp: Date.now()
        };
        this.expenses.push(newExpense);

        // Build activity log text
        const payerName = this.getFriendName(payerId);
        const groupSuffix = groupId ? ` in '${this.getGroupName(groupId)}'` : "";
        this.logActivity("expense", `${payerName} added '${desc}' (₹${amount.toFixed(2)})${groupSuffix}`);
        
        this.saveState();
        return newExpense;
    }

    addSettlement(payerId, receiverId, amount, groupId, date) {
        const id = "settle-" + Date.now();
        const newSettlement = {
            id,
            payerId,
            receiverId,
            amount: parseFloat(amount),
            groupId: groupId || null,
            date
        };
        this.settlements.push(newSettlement);

        const payerName = this.getFriendName(payerId);
        const receiverName = this.getFriendName(receiverId);
        const groupSuffix = groupId ? ` in '${this.getGroupName(groupId)}'` : "";
        this.logActivity("settlement", `${payerName} paid ${receiverName} ₹${amount.toFixed(2)}${groupSuffix}`);

        this.saveState();
        return newSettlement;
    }

    deleteFriend(friendId) {
        const friend = this.friends.find(f => f.id === friendId);
        if (!friend) return;
        const name = friend.name;
        // Remove the friend
        this.friends = this.friends.filter(f => f.id !== friendId);
        // Remove expenses where this friend is involved (payer or in splits)
        this.expenses = this.expenses.filter(exp =>
            exp.payerId !== friendId && !exp.splits.some(s => s.friendId === friendId)
        );
        // Remove settlements involving this friend
        this.settlements = this.settlements.filter(s =>
            s.payerId !== friendId && s.receiverId !== friendId
        );
        // Remove from group members
        this.groups.forEach(g => {
            g.members = g.members.filter(m => m !== friendId);
        });
        this.logActivity("friend", `Removed friend '${name}'`);
        this.saveState();
    }

    deleteExpense(expenseId) {
        const exp = this.expenses.find(e => e.id === expenseId);
        if (!exp) return;
        this.expenses = this.expenses.filter(e => e.id !== expenseId);
        this.logActivity("expense", `Deleted expense '${exp.description}'`);
        this.saveState();
    }

    deleteGroup(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;
        const name = group.name;
        this.groups = this.groups.filter(g => g.id !== groupId);
        // Remove all expenses belonging to this group
        this.expenses = this.expenses.filter(e => e.groupId !== groupId);
        // Remove settlements in this group
        this.settlements = this.settlements.filter(s => s.groupId !== groupId);
        this.logActivity("group", `Deleted group '${name}'`);
        this.saveState();
    }

    logActivity(type, text) {
        this.activities.unshift({
            id: "act-" + Date.now(),
            type,
            text,
            timestamp: Date.now()
        });
    }

    // HELPERS
    getFriendName(id) {
        if (id === "you") return "You";
        const f = this.friends.find(x => x.id === id);
        return f ? f.name : "Unknown";
    }

    getGroupName(id) {
        const g = this.groups.find(x => x.id === id);
        return g ? g.name : "Unknown Group";
    }

    // CALCULATE NET BALANCES
    // Returns key-value store of: friendId -> net balance for the currently active user
    // A positive value means the active user is OWED money by the friend.
    // A negative value means the active user OWES money to the friend.
    getNetBalances() {
        const activeUser = this.currentUserId;
        const balances = {};

        // Initialize everyone to 0
        this.friends.forEach(f => {
            if (f.id !== activeUser) {
                balances[f.id] = 0;
            }
        });

        // 1. Process Expenses
        this.expenses.forEach(exp => {
            const payer = exp.payerId;
            const amount = exp.amount;

            // Check if active user is involved
            const activeUserSplit = exp.splits.find(s => s.friendId === activeUser);
            const activeUserIsPayer = (payer === activeUser);

            if (activeUserIsPayer) {
                // Active user paid the full bill, so they are owed by everyone else in the split
                exp.splits.forEach(s => {
                    if (s.friendId !== activeUser) {
                        if (balances[s.friendId] !== undefined) {
                            balances[s.friendId] += s.amount;
                        } else {
                            balances[s.friendId] = s.amount;
                        }
                    }
                });
            } else if (activeUserSplit) {
                // Someone else paid, and active user shares the expense
                // So active user owes their share to the payer
                if (balances[payer] !== undefined) {
                    balances[payer] -= activeUserSplit.amount;
                } else {
                    balances[payer] = -activeUserSplit.amount;
                }
            }
        });

        // 2. Process Settlements
        this.settlements.forEach(set => {
            const payer = set.payerId;
            const receiver = set.receiverId;
            const amount = set.amount;

            if (payer === activeUser) {
                // Active user paid someone else (reduced their debt, or lent money)
                if (balances[receiver] !== undefined) {
                    balances[receiver] += amount;
                }
            } else if (receiver === activeUser) {
                // Active user received money from someone (reduced what is owed to them)
                if (balances[payer] !== undefined) {
                    balances[payer] -= amount;
                }
            }
        });

        return balances;
    }

    // Get group balance details for a specific group ID
    // Computes net position of each member in the group
    // Net Position = Paid Amount - Share Amount + SettlementsReceived - SettlementsPaid
    getGroupMembersBalances(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return {};

        const balances = {};
        group.members.forEach(m => {
            balances[m] = 0;
        });

        // Process expenses in group
        this.expenses.forEach(exp => {
            if (exp.groupId === groupId) {
                // Add full amount paid to payer
                if (balances[exp.payerId] !== undefined) {
                    balances[exp.payerId] += exp.amount;
                }
                // Subtract split shares from members
                exp.splits.forEach(s => {
                    if (balances[s.friendId] !== undefined) {
                        balances[s.friendId] -= s.amount;
                    }
                });
            }
        });

        // Process settlements in group
        this.settlements.forEach(set => {
            if (set.groupId === groupId) {
                // Payer gave money, so their balance goes up relative to the group pool
                if (balances[set.payerId] !== undefined) {
                    balances[set.payerId] += set.amount;
                }
                // Receiver got money, so their balance goes down relative to the group pool
                if (balances[set.receiverId] !== undefined) {
                    balances[set.receiverId] -= set.amount;
                }
            }
        });

        return balances;
    }

    // Debt Simplification Algorithm (Greedy approach)
    // Takes the net balances of everyone in a pool (e.g. within a group, or global)
    // Returns a list of minimized payments: [{ from: id, to: id, amount: number }]
    getSimplifiedDebts(memberBalances) {
        const debts = [];
        
        // Convert to array of { memberId, balance } and filter out zero balances
        let pool = Object.entries(memberBalances)
            .map(([memberId, balance]) => ({
                id: memberId,
                balance: Math.round(balance * 100) / 100 // Avoid float errors
            }))
            .filter(x => Math.abs(x.balance) > 0.01);

        // Sort: lowest balance first (greatest debtor), highest balance last (greatest creditor)
        pool.sort((a, b) => a.balance - b.balance);

        let i = 0; // Pointer to debtor
        let j = pool.length - 1; // Pointer to creditor

        // Loop until pointers meet
        while (i < j) {
            const debtor = pool[i];
            const creditor = pool[j];

            // How much can we settle?
            const amountToSettle = Math.min(-debtor.balance, creditor.balance);

            if (amountToSettle > 0.01) {
                debts.push({
                    from: debtor.id,
                    to: creditor.id,
                    amount: amountToSettle
                });

                // Update balances
                debtor.balance += amountToSettle;
                creditor.balance -= amountToSettle;
            }

            // Move pointers if fully settled
            if (Math.abs(debtor.balance) < 0.01) {
                i++;
            }
            if (Math.abs(creditor.balance) < 0.01) {
                j--;
            }
        }

        return debts;
    }

    // Returns unsimplified, direct balances within a group
    // In Splitwise, standard debts show directly who owes whom if they don't simplify.
    // If not simplified, we just construct direct pairings based on group expenses
    getDirectDebts(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return [];

        const netDirect = {}; // Pair string "memberA->memberB" -> amount A owes B

        this.expenses.forEach(exp => {
            if (exp.groupId === groupId) {
                const payer = exp.payerId;
                exp.splits.forEach(s => {
                    if (s.friendId !== payer) {
                        const pairKey = `${s.friendId}->${payer}`;
                        netDirect[pairKey] = (netDirect[pairKey] || 0) + s.amount;
                    }
                });
            }
        });

        // Apply settlements to direct pairings
        this.settlements.forEach(set => {
            if (set.groupId === groupId) {
                const pairKey = `${set.payerId}->${set.receiverId}`;
                const reverseKey = `${set.receiverId}->${set.payerId}`;
                
                // Subtract settlement from debt
                netDirect[pairKey] = (netDirect[pairKey] || 0) - set.amount;
            }
        });

        // Condense direct mutual debts
        const directDebts = [];
        const processed = new Set();

        Object.keys(netDirect).forEach(key => {
            const [debtor, creditor] = key.split("->");
            const reverseKey = `${creditor}->${debtor}`;

            if (processed.has(key) || processed.has(reverseKey)) return;

            const debtorOwesCreditor = netDirect[key] || 0;
            const creditorOwesDebtor = netDirect[reverseKey] || 0;

            const netDiff = debtorOwesCreditor - creditorOwesDebtor;

            if (netDiff > 0.01) {
                directDebts.push({ from: debtor, to: creditor, amount: netDiff });
            } else if (netDiff < -0.01) {
                directDebts.push({ from: creditor, to: debtor, amount: -netDiff });
            }

            processed.add(key);
            processed.add(reverseKey);
        });

        return directDebts;
    }
}

// 2. UI CONTROLLER CLASS
class UIController {
    constructor(state) {
        this.state = state;
        this.activeTab = "dashboard";
        this.selectedGroupId = null;
        this.selectedFriendId = null;
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupUserSimulator();
        this.setupThemeToggle();
        this.setupModals();
        this.setupForms();
        
        // Initial Rendering
        this.renderAll();
    }

    // TABS AND NAVIGATION
    setupNavigation() {
        document.querySelectorAll(".nav-item").forEach(item => {
            item.addEventListener("click", () => {
                const tab = item.getAttribute("data-tab");
                this.switchTab(tab);
            });
        });

        document.getElementById("btn-back-to-groups").addEventListener("click", () => {
            this.selectedGroupId = null;
            document.getElementById("groups-grid").classList.remove("hidden");
            document.getElementById("group-details").classList.add("hidden");
            this.renderGroupsTab();
        });

        document.getElementById("btn-back-to-friends").addEventListener("click", () => {
            this.selectedFriendId = null;
            document.getElementById("friends-list-container").classList.remove("hidden");
            document.getElementById("friend-details").classList.add("hidden");
            this.renderFriendsTab();
        });
    }

    switchTab(tab) {
        this.activeTab = tab;
        
        // Reset subviews
        this.selectedGroupId = null;
        this.selectedFriendId = null;
        document.getElementById("groups-grid").classList.remove("hidden");
        document.getElementById("group-details").classList.add("hidden");
        document.getElementById("friends-list-container").classList.remove("hidden");
        document.getElementById("friend-details").classList.add("hidden");

        // Update nav UI
        document.querySelectorAll(".nav-item").forEach(item => {
            item.classList.remove("active");
            if (item.getAttribute("data-tab") === tab) {
                item.classList.add("active");
            }
        });

        // Update view panel
        document.querySelectorAll(".tab-view").forEach(view => {
            view.classList.remove("active");
        });
        document.getElementById(`view-${tab}`).classList.add("active");

        // Update header titles
        const titles = {
            dashboard: { title: "Dashboard", sub: "Welcome back to your financial control center." },
            groups: { title: "Groups", sub: "Track shared bills by trips, houses, or projects." },
            friends: { title: "Friends", sub: "Individual IOUs and personal balances." },
            activity: { title: "Recent Activity", sub: "Keep tabs on who added expenses or paid you back." }
        };

        document.getElementById("page-title").textContent = titles[tab].title;
        document.getElementById("page-subtitle").textContent = titles[tab].sub;

        // Render tab data
        this.renderActiveTab();
    }

    // USER SIMULATOR
    setupUserSimulator() {
        const select = document.getElementById("active-user-select");
        this.populateUserSelect();

        select.value = this.state.currentUserId;
        select.addEventListener("change", (e) => {
            this.state.currentUserId = e.target.value;
            this.state.saveState();
            
            // Re-render everything from this user's perspective
            this.renderAll();
        });
    }

    populateUserSelect() {
        const select = document.getElementById("active-user-select");
        select.innerHTML = "";
        
        this.state.friends.forEach(f => {
            const opt = document.createElement("option");
            opt.value = f.id;
            opt.textContent = f.id === "you" ? f.name : `${f.name} (Simulate)`;
            select.appendChild(opt);
        });
    }

    // THEME TOGGLER
    setupThemeToggle() {
        const btn = document.getElementById("theme-toggle");
        const html = document.documentElement;

        btn.addEventListener("click", () => {
            const currentTheme = html.getAttribute("data-theme");
            const newTheme = currentTheme === "dark" ? "light" : "dark";
            html.setAttribute("data-theme", newTheme);

            const icon = btn.querySelector("i");
            const label = btn.querySelector("span");

            if (newTheme === "light") {
                icon.className = "fa-solid fa-sun";
                label.textContent = "Light Mode";
            } else {
                icon.className = "fa-solid fa-moon";
                label.textContent = "Dark Mode";
            }

            // Re-draw chart to adapt grid colors
            this.renderCategoryChart();
        });
    }

    // MODAL DIALOGS ACTION
    setupModals() {
        // Modal buttons
        const btnExpense = document.getElementById("btn-open-expense-modal");
        const btnSettle = document.getElementById("btn-open-settle-modal");
        const btnGroup = document.getElementById("btn-create-group-modal");
        const btnFriend = document.getElementById("btn-add-friend-modal");

        // Backdrops
        const modExpense = document.getElementById("modal-expense");
        const modSettle = document.getElementById("modal-settle");
        const modGroup = document.getElementById("modal-group");
        const modFriend = document.getElementById("modal-friend");

        // Set date inputs to today
        const today = new Date().toISOString().split("T")[0];
        document.getElementById("exp-date").value = today;
        document.getElementById("settle-date").value = today;

        // Add expense open
        btnExpense.addEventListener("click", () => {
            this.openModal(modExpense);
            this.prepareExpenseModal();
        });

        // Settle up open
        btnSettle.addEventListener("click", () => {
            this.openModal(modSettle);
            this.prepareSettleModal();
        });

        // Create group open
        btnGroup.addEventListener("click", () => {
            this.openModal(modGroup);
            this.prepareGroupModal();
        });

        // Add friend open
        btnFriend.addEventListener("click", () => {
            this.openModal(modFriend);
        });

        // Close handlers for all modals
        document.querySelectorAll(".modal-backdrop").forEach(backdrop => {
            backdrop.addEventListener("click", (e) => {
                if (e.target === backdrop) this.closeModal(backdrop);
            });
        });

        document.querySelectorAll(".btn-close-modal").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                const modal = btn.closest(".modal-backdrop");
                this.closeModal(modal);
            });
        });
    }

    openModal(modal) {
        modal.classList.add("open");
    }

    closeModal(modal) {
        modal.classList.remove("open");
    }

    // FORMS PROCESSING
    setupForms() {
        // Add Friend Form
        document.getElementById("form-add-friend").addEventListener("submit", (e) => {
            e.preventDefault();
            const name = document.getElementById("friend-name").value;
            const email = document.getElementById("friend-email").value;

            this.state.addFriend(name, email);
            this.populateUserSelect();
            this.closeModal(document.getElementById("modal-friend"));
            
            // Clear fields
            document.getElementById("friend-name").value = "";
            document.getElementById("friend-email").value = "";

            this.renderAll();
        });

        // Create Group Form
        document.getElementById("form-create-group").addEventListener("submit", (e) => {
            e.preventDefault();
            const name = document.getElementById("group-name").value;
            
            const selectedMemberCheckboxes = document.querySelectorAll("#group-members-selection input[type='checkbox']:checked");
            const memberIds = Array.from(selectedMemberCheckboxes).map(cb => cb.value);

            if (memberIds.length === 0) {
                alert("Please select at least one friend to include in the group.");
                return;
            }

            this.state.addGroup(name, memberIds);
            this.closeModal(document.getElementById("modal-group"));
            
            // Clear fields
            document.getElementById("group-name").value = "";

            this.renderAll();
        });

        // Expense Form logic: Split updates dynamically when Amount, Group, Split Type or Inputs change
        const expAmountInput = document.getElementById("exp-amount");
        const expGroupSelect = document.getElementById("exp-group");
        const expSplitSelect = document.getElementById("exp-split-type");
        const expPayerSelect = document.getElementById("exp-payer");

        const triggerRecalculation = () => {
            this.recalculateExpenseSplits();
        };

        expAmountInput.addEventListener("input", triggerRecalculation);
        expGroupSelect.addEventListener("change", () => {
            this.prepareExpensePayerSelect();
            this.prepareExpenseSplitsContainer();
            this.recalculateExpenseSplits();
        });
        expSplitSelect.addEventListener("change", () => {
            this.prepareExpenseSplitsContainer();
            this.recalculateExpenseSplits();
        });
        expPayerSelect.addEventListener("change", triggerRecalculation);

        // Submit Expense
        document.getElementById("form-add-expense").addEventListener("submit", (e) => {
            e.preventDefault();
            const desc = document.getElementById("exp-desc").value;
            const amount = parseFloat(expAmountInput.value);
            const payerId = expPayerSelect.value;
            const groupId = expGroupSelect.value;
            const category = document.getElementById("exp-category").value;
            const date = document.getElementById("exp-date").value;
            const splitType = expSplitSelect.value;

            // Generate split values based on method
            const splits = [];
            const members = this.getGroupMembersOrAll(groupId);

            if (splitType === "equal") {
                const checkedCheckboxes = document.querySelectorAll("#split-participants-container input[type='checkbox']:checked");
                const checkedIds = Array.from(checkedCheckboxes).map(cb => cb.value);

                if (checkedIds.length === 0) {
                    alert("At least one person must be selected for the split.");
                    return;
                }

                const share = Math.round((amount / checkedIds.length) * 100) / 100;
                // Handling decimal leftovers
                let totalAssigned = 0;
                
                checkedIds.forEach((id, idx) => {
                    let personShare = share;
                    if (idx === checkedIds.length - 1) {
                        personShare = Math.round((amount - totalAssigned) * 100) / 100;
                    }
                    splits.push({ friendId: id, amount: personShare });
                    totalAssigned += personShare;
                });

            } else if (splitType === "exact") {
                let sum = 0;
                members.forEach(m => {
                    const inp = document.getElementById(`split-amt-${m.id}`);
                    const val = inp ? parseFloat(inp.value) || 0 : 0;
                    if (val > 0) {
                        splits.push({ friendId: m.id, amount: val });
                        sum += val;
                    }
                });

                if (Math.abs(sum - amount) > 0.02) {
                    alert(`The sum of exact split amounts (₹${sum.toFixed(2)}) must equal the total expense amount (₹${amount.toFixed(2)})`);
                    return;
                }
            } else if (splitType === "percentage") {
                let sumPct = 0;
                members.forEach(m => {
                    const inp = document.getElementById(`split-pct-${m.id}`);
                    const pct = inp ? parseFloat(inp.value) || 0 : 0;
                    if (pct > 0) {
                        const calculatedAmt = Math.round((amount * (pct / 100)) * 100) / 100;
                        splits.push({ friendId: m.id, amount: calculatedAmt, percent: pct });
                        sumPct += pct;
                    }
                });

                if (Math.abs(sumPct - 100) > 0.1) {
                    alert("Percentages must sum to exactly 100%");
                    return;
                }
            }

            this.state.addExpense(desc, amount, payerId, groupId, category, date, splitType, splits);
            this.closeModal(document.getElementById("modal-expense"));
            
            // Reset
            document.getElementById("exp-desc").value = "";
            expAmountInput.value = "";
            
            this.renderAll();
        });

        // Submit Settle Up Form
        document.getElementById("form-settle").addEventListener("submit", (e) => {
            e.preventDefault();
            const payerId = document.getElementById("settle-payer").value;
            const receiverId = document.getElementById("settle-receiver").value;
            const amount = parseFloat(document.getElementById("settle-amount").value);
            const groupId = document.getElementById("settle-group").value;
            const date = document.getElementById("settle-date").value;

            if (payerId === receiverId) {
                alert("A payer cannot settle up with themselves! Choose two different people.");
                return;
            }

            this.state.addSettlement(payerId, receiverId, amount, groupId, date);
            this.closeModal(document.getElementById("modal-settle"));
            
            document.getElementById("settle-amount").value = "";

            this.renderAll();
        });

        // Clear activity log button
        document.getElementById("btn-clear-activity").addEventListener("click", () => {
            if (confirm("Are you sure you want to clear the logs?")) {
                this.state.clearActivities();
                this.renderActivityTab();
            }
        });

        // Settle simplify toggle change inside Group detail view
        document.getElementById("simplify-debts-toggle").addEventListener("change", () => {
            this.renderGroupSettlements();
        });
    }

    // PREPARING MODAL DROPDOWNS
    getGroupMembersOrAll(groupId) {
        if (!groupId) {
            // Return all friends (including simulated user)
            return this.state.friends;
        }
        const g = this.state.groups.find(x => x.id === groupId);
        if (!g) return this.state.friends;
        return this.state.friends.filter(f => g.members.includes(f.id));
    }

    prepareExpenseModal() {
        // 1. Populate Group Select
        const grpSelect = document.getElementById("exp-group");
        grpSelect.innerHTML = '<option value="">No Group (Individual Expense)</option>';
        this.state.groups.forEach(g => {
            const opt = document.createElement("option");
            opt.value = g.id;
            opt.textContent = g.name;
            grpSelect.appendChild(opt);
        });

        // Check if inside group details view to auto-select that group
        if (this.activeTab === "groups" && this.selectedGroupId) {
            grpSelect.value = this.selectedGroupId;
        }

        this.prepareExpensePayerSelect();
        this.prepareExpenseSplitsContainer();
        this.recalculateExpenseSplits();
    }

    prepareExpensePayerSelect() {
        const groupId = document.getElementById("exp-group").value;
        const payerSelect = document.getElementById("exp-payer");
        payerSelect.innerHTML = "";

        const members = this.getGroupMembersOrAll(groupId);
        members.forEach(m => {
            const opt = document.createElement("option");
            opt.value = m.id;
            opt.textContent = m.id === this.state.currentUserId ? "You" : m.name;
            payerSelect.appendChild(opt);
        });

        // Auto select current active simulator user
        payerSelect.value = this.state.currentUserId;
    }

    prepareExpenseSplitsContainer() {
        const groupId = document.getElementById("exp-group").value;
        const splitType = document.getElementById("exp-split-type").value;
        const container = document.getElementById("split-participants-container");
        container.innerHTML = "";

        const members = this.getGroupMembersOrAll(groupId);

        members.forEach(m => {
            const row = document.createElement("div");
            row.className = "participant-split-row";

            const nameSpan = document.createElement("div");
            nameSpan.className = "participant-checkbox-label";

            const nameText = m.id === this.state.currentUserId ? "You" : m.name;

            if (splitType === "equal") {
                // Chechbox to toggle inclusion
                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.value = m.id;
                checkbox.checked = true;
                checkbox.id = `split-chk-${m.id}`;
                checkbox.addEventListener("change", () => this.recalculateExpenseSplits());
                
                const label = document.createElement("label");
                label.htmlFor = `split-chk-${m.id}`;
                label.textContent = nameText;
                
                nameSpan.appendChild(checkbox);
                nameSpan.appendChild(label);
                row.appendChild(nameSpan);

                const amtSpan = document.createElement("span");
                amtSpan.id = `split-amt-lbl-${m.id}`;
                amtSpan.className = "debt-item-amt";
                amtSpan.textContent = "₹0.00";
                row.appendChild(amtSpan);
            } else if (splitType === "exact") {
                // Number input for exact amount
                const label = document.createElement("span");
                label.textContent = nameText;
                nameSpan.appendChild(label);
                row.appendChild(nameSpan);

                const input = document.createElement("input");
                input.type = "number";
                input.className = "participant-split-input";
                input.id = `split-amt-${m.id}`;
                input.min = "0";
                input.step = "0.01";
                input.placeholder = "₹0.00";
                input.addEventListener("input", () => this.recalculateExpenseSplits());
                row.appendChild(input);
            } else if (splitType === "percentage") {
                // Number input for percentage
                const label = document.createElement("span");
                label.textContent = nameText;
                nameSpan.appendChild(label);
                row.appendChild(nameSpan);

                const fieldSet = document.createElement("div");
                fieldSet.className = "flex-row align-center";

                const input = document.createElement("input");
                input.type = "number";
                input.className = "participant-split-input";
                input.id = `split-pct-${m.id}`;
                input.min = "0";
                input.max = "100";
                input.placeholder = "0%";
                input.style.width = "70px";
                input.addEventListener("input", () => this.recalculateExpenseSplits());

                const calculatedAmt = document.createElement("span");
                calculatedAmt.id = `split-pct-amt-${m.id}`;
                calculatedAmt.className = "debt-item-amt margin-left-sm";
                calculatedAmt.textContent = "(₹0.00)";

                fieldSet.appendChild(input);
                fieldSet.appendChild(calculatedAmt);
                row.appendChild(fieldSet);
            }

            container.appendChild(row);
        });
    }

    recalculateExpenseSplits() {
        const amount = parseFloat(document.getElementById("exp-amount").value) || 0;
        const splitType = document.getElementById("exp-split-type").value;
        const groupId = document.getElementById("exp-group").value;
        const msg = document.getElementById("split-summary-msg");

        msg.className = "split-summary-msg";
        msg.textContent = "";

        if (amount <= 0) {
            msg.textContent = "Enter an expense amount to see split distribution.";
            return;
        }

        const members = this.getGroupMembersOrAll(groupId);

        if (splitType === "equal") {
            const checkedCheckboxes = document.querySelectorAll("#split-participants-container input[type='checkbox']:checked");
            const checkedIds = Array.from(checkedCheckboxes).map(cb => cb.value);

            if (checkedIds.length === 0) {
                msg.textContent = "Please select at least one person to split with.";
                msg.classList.add("error");
                return;
            }

            const share = Math.round((amount / checkedIds.length) * 100) / 100;
            let sum = 0;

            members.forEach((m, idx) => {
                const label = document.getElementById(`split-amt-lbl-${m.id}`);
                const isChecked = checkedIds.includes(m.id);
                if (label) {
                    if (isChecked) {
                        let finalShare = share;
                        // leftovers distributed to final person
                        if (idx === members.length - 1 || (idx === members.indexOf(members.find(x => checkedIds.includes(x.id) && checkedIds.indexOf(x.id) === checkedIds.length - 1)))) {
                            finalShare = Math.round((amount - sum) * 100) / 100;
                        }
                        label.textContent = `₹${finalShare.toFixed(2)}`;
                        sum += finalShare;
                    } else {
                        label.textContent = "₹0.00";
                    }
                }
            });

            msg.textContent = `All selected members split equally: ₹${share.toFixed(2)} each.`;
            msg.classList.add("success");

        } else if (splitType === "exact") {
            let sum = 0;
            members.forEach(m => {
                const inp = document.getElementById(`split-amt-${m.id}`);
                const val = inp ? parseFloat(inp.value) || 0 : 0;
                sum += val;
            });

            const diff = amount - sum;
            if (Math.abs(diff) < 0.015) {
                msg.textContent = "Total split amounts match expense amount perfectly!";
                msg.classList.add("success");
            } else if (diff > 0) {
                msg.textContent = `₹${diff.toFixed(2)} left to assign.`;
                msg.classList.add("error");
            } else {
                msg.textContent = `Over-allocated by ₹${Math.abs(diff).toFixed(2)}.`;
                msg.classList.add("error");
            }

        } else if (splitType === "percentage") {
            let sumPct = 0;
            members.forEach(m => {
                const inp = document.getElementById(`split-pct-${m.id}`);
                const pct = inp ? parseFloat(inp.value) || 0 : 0;
                sumPct += pct;

                const label = document.getElementById(`split-pct-amt-${m.id}`);
                if (label) {
                    const share = (amount * (pct / 100));
                    label.textContent = `(₹${share.toFixed(2)})`;
                }
            });

            const diffPct = 100 - sumPct;
            if (Math.abs(diffPct) < 0.05) {
                msg.textContent = "Percentage splits sum to 100%!";
                msg.classList.add("success");
            } else if (diffPct > 0) {
                msg.textContent = `${diffPct.toFixed(1)}% remaining to assign.`;
                msg.classList.add("error");
            } else {
                msg.textContent = `Over-allocated percentage by ${Math.abs(diffPct).toFixed(1)}%.`;
                msg.classList.add("error");
            }
        }
    }

    prepareSettleModal(initialPayerId = null, initialReceiverId = null, initialGroupId = null) {
        // Group Select
        const grpSelect = document.getElementById("settle-group");
        grpSelect.innerHTML = '<option value="">No Group (Individual Debt)</option>';
        this.state.groups.forEach(g => {
            const opt = document.createElement("option");
            opt.value = g.id;
            opt.textContent = g.name;
            grpSelect.appendChild(opt);
        });

        // Set initial group selection
        if (initialGroupId) {
            grpSelect.value = initialGroupId;
        } else if (this.activeTab === "groups" && this.selectedGroupId) {
            grpSelect.value = this.selectedGroupId;
        }

        const loadParties = () => {
            const groupId = grpSelect.value;
            const payerSelect = document.getElementById("settle-payer");
            const receiverSelect = document.getElementById("settle-receiver");
            
            payerSelect.innerHTML = "";
            receiverSelect.innerHTML = "";

            const members = this.getGroupMembersOrAll(groupId);

            members.forEach(m => {
                const optPayer = document.createElement("option");
                optPayer.value = m.id;
                optPayer.textContent = m.id === this.state.currentUserId ? "You" : m.name;
                payerSelect.appendChild(optPayer);

                const optRecv = document.createElement("option");
                optRecv.value = m.id;
                optRecv.textContent = m.id === this.state.currentUserId ? "You" : m.name;
                receiverSelect.appendChild(optRecv);
            });

            // Set defaults or initial pairings
            if (initialPayerId) {
                payerSelect.value = initialPayerId;
            } else {
                payerSelect.value = this.state.currentUserId;
            }

            if (initialReceiverId) {
                receiverSelect.value = initialReceiverId;
            } else {
                // Find a friend that isn't the payer
                const other = members.find(m => m.id !== payerSelect.value);
                if (other) receiverSelect.value = other.id;
            }
        };

        loadParties();
        grpSelect.addEventListener("change", loadParties);
    }

    prepareGroupModal() {
        const selectionDiv = document.getElementById("group-members-selection");
        selectionDiv.innerHTML = "";

        // Offer all friends except "you" (as you are auto-included)
        this.state.friends.forEach(f => {
            if (f.id === "you") return;

            const label = document.createElement("label");
            label.className = "checklist-item";

            const chk = document.createElement("input");
            chk.type = "checkbox";
            chk.value = f.id;
            
            const txt = document.createTextNode(` ${f.name}`);

            label.appendChild(chk);
            label.appendChild(txt);
            selectionDiv.appendChild(label);
        });
    }

    // MAIN RENDER DIRECTORS
    renderAll() {
        this.populateUserSelect(); // Update simulated user dropdown text
        this.renderActiveTab();
    }

    renderActiveTab() {
        switch (this.activeTab) {
            case "dashboard":
                this.renderDashboardTab();
                break;
            case "groups":
                this.renderGroupsTab();
                break;
            case "friends":
                this.renderFriendsTab();
                break;
            case "activity":
                this.renderActivityTab();
                break;
        }
    }

    // RENDERING 1. DASHBOARD VIEW
    renderDashboardTab() {
        const balances = this.state.getNetBalances();
        
        let totalOwe = 0;
        let totalOwed = 0;

        const oweList = document.getElementById("dash-owe-list");
        const owedList = document.getElementById("dash-owed-list");

        oweList.innerHTML = "";
        owedList.innerHTML = "";

        Object.entries(balances).forEach(([friendId, balance]) => {
            if (balance < -0.01) {
                totalOwe += Math.abs(balance);
                
                // Add to Owe list UI
                const li = document.createElement("li");
                li.className = "debt-item owe-list";
                li.innerHTML = `
                    <div class="debt-item-info">
                        <span class="debt-item-name">${this.state.getFriendName(friendId)}</span>
                        <span class="debt-item-desc">personal balance</span>
                    </div>
                    <span class="debt-item-amt negative">₹${Math.abs(balance).toFixed(2)}</span>
                `;
                oweList.appendChild(li);
            } else if (balance > 0.01) {
                totalOwed += balance;

                // Add to Owed list UI
                const li = document.createElement("li");
                li.className = "debt-item owed-list";
                li.innerHTML = `
                    <div class="debt-item-info">
                        <span class="debt-item-name">${this.state.getFriendName(friendId)}</span>
                        <span class="debt-item-desc">personal balance</span>
                    </div>
                    <span class="debt-item-amt positive">₹${balance.toFixed(2)}</span>
                `;
                owedList.appendChild(li);
            }
        });

        // Empty state check
        if (oweList.children.length === 0) {
            oweList.innerHTML = '<li class="debt-item"><span class="debt-item-desc">You do not owe anyone!</span></li>';
        }
        if (owedList.children.length === 0) {
            owedList.innerHTML = '<li class="debt-item"><span class="debt-item-desc">No one owes you!</span></li>';
        }

        const netBalance = totalOwed - totalOwe;

        // Populate upper balance stat-cards
        const totalNode = document.getElementById("dash-total-balance");
        totalNode.textContent = `${netBalance >= 0 ? "+" : "-"}₹${Math.abs(netBalance).toFixed(2)}`;
        totalNode.className = `stat-val ${netBalance > 0.01 ? 'positive' : (netBalance < -0.01 ? 'negative' : 'neutral')}`;

        document.getElementById("dash-you-owe").textContent = `₹${totalOwe.toFixed(2)}`;
        document.getElementById("dash-you-are-owed").textContent = `₹${totalOwed.toFixed(2)}`;

        // Render category distribution chart
        this.renderCategoryChart();
    }

    renderCategoryChart() {
        const canvas = document.getElementById("expense-category-chart");
        const noData = document.getElementById("chart-no-data");
        const container = canvas.parentNode;

        // Reset canvas to avoid chart redraw glitched overlap
        canvas.style.display = "block";
        noData.classList.add("hidden");

        // Sum categories of expenses that involve current simulator user
        const categorySums = {
            general: 0,
            food: 0,
            travel: 0,
            rent: 0,
            entertainment: 0
        };

        let hasData = false;
        const activeUser = this.state.currentUserId;

        this.state.expenses.forEach(exp => {
            const userInvolved = exp.splits.some(s => s.friendId === activeUser) || exp.payerId === activeUser;
            if (userInvolved) {
                const userSplit = exp.splits.find(s => s.friendId === activeUser);
                const userShare = userSplit ? userSplit.amount : 0;
                
                // If they paid, their personal actual spend is (Total Amount - Owed by others) = userShare
                // If they didn't pay, they owe userShare
                // In both cases, their category spending share is userShare
                if (userShare > 0) {
                    categorySums[exp.category] = (categorySums[exp.category] || 0) + userShare;
                    hasData = true;
                }
            }
        });

        if (this.state.categoryChart) {
            this.state.categoryChart.destroy();
        }

        if (!hasData) {
            canvas.style.display = "none";
            noData.classList.remove("hidden");
            return;
        }

        const isDark = document.documentElement.getAttribute("data-theme") === "dark";
        const gridColor = isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(15, 23, 42, 0.7)";

        this.state.categoryChart = new Chart(canvas, {
            type: "doughnut",
            data: {
                labels: ["General", "Food & Drink", "Travel & Lodging", "Rent & Utilities", "Entertainment"],
                datasets: [{
                    data: [
                        categorySums.general,
                        categorySums.food,
                        categorySums.travel,
                        categorySums.rent,
                        categorySums.entertainment
                    ],
                    backgroundColor: [
                        "#6b7280", // grey
                        "#f59e0b", // yellow
                        "#3b82f6", // blue
                        "#10b981", // green
                        "#8b5cf6"  // purple
                    ],
                    borderColor: isDark ? "#1e1b4b" : "#f1f5f9",
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: {
                            color: gridColor,
                            font: {
                                family: "Outfit",
                                size: 12,
                                weight: 500
                            }
                        }
                    }
                }
            }
        });
    }

    // RENDERING 2. GROUPS VIEW
    renderGroupsTab() {
        if (this.selectedGroupId) {
            this.renderGroupDetails(this.selectedGroupId);
            return;
        }

        const grid = document.getElementById("groups-grid");
        grid.innerHTML = "";

        if (this.state.groups.length === 0) {
            grid.innerHTML = `<div class="glass-card" style="grid-column: 1/-1; padding: 40px; text-align: center; color: var(--text-secondary);">
                <i class="fa-solid fa-users-slash placeholder-icon"></i>
                <p style="margin-top: 10px;">No groups found. Create one to start tracking bills together.</p>
            </div>`;
            return;
        }

        this.state.groups.forEach(g => {
            const card = document.createElement("div");
            card.className = "group-card";
            
            // Calculate active user net balance in group
            const memberBalances = this.state.getGroupMembersBalances(g.id);
            const userBal = memberBalances[this.state.currentUserId] || 0;

            let balanceText = "Settle";
            let statusClass = "neutral";

            if (userBal > 0.01) {
                balanceText = `You are owed ₹${userBal.toFixed(2)}`;
                statusClass = "positive";
            } else if (userBal < -0.01) {
                balanceText = `You owe ₹${Math.abs(userBal).toFixed(2)}`;
                statusClass = "negative";
            } else {
                balanceText = "Settled up";
            }

            card.innerHTML = `
                <div class="group-card-banner"></div>
                <div class="group-card-content">
                    <span class="group-card-title">${g.name}</span>
                    <div class="group-card-meta">
                        <span>${g.members.length} members</span>
                        <span class="group-card-status ${statusClass}">${balanceText}</span>
                    </div>
                </div>
                <button class="btn-delete-item btn-delete-group" title="Delete group" onclick="event.stopPropagation(); window.uiController.confirmDeleteGroup('${g.id}')"><i class="fa-solid fa-trash"></i></button>
            `;

            card.addEventListener("click", () => {
                this.selectedGroupId = g.id;
                document.getElementById("groups-grid").classList.add("hidden");
                document.getElementById("group-details").classList.remove("hidden");
                this.renderGroupDetails(g.id);
            });

            grid.appendChild(card);
        });
    }

    renderGroupDetails(groupId) {
        const group = this.state.groups.find(g => g.id === groupId);
        if (!group) return;

        document.getElementById("detail-group-name").textContent = group.name;

        // Render Group Expenses list
        const expList = document.getElementById("group-expenses-list");
        expList.innerHTML = "";

        const groupExpenses = this.state.expenses.filter(e => e.groupId === groupId);
        // Sort descending by date/time
        groupExpenses.sort((a,b) => b.date.localeCompare(a.date) || b.timestamp - a.timestamp);

        if (groupExpenses.length === 0) {
            expList.innerHTML = '<li class="expense-item"><div class="exp-details-text"><span class="exp-title">No expenses logged yet in this group.</span></div></li>';
        } else {
            groupExpenses.forEach(exp => {
                const li = document.createElement("li");
                li.className = "expense-item";

                // Format date bubble
                const dateObj = new Date(exp.date);
                const month = dateObj.toLocaleString("en-US", { month: "short" });
                const day = dateObj.getDate() + 1; // Correction for timezone shift offset

                const payerName = exp.payerId === this.state.currentUserId ? "You" : this.state.getFriendName(exp.payerId);
                
                // Calculate simulated user's specific split in this expense
                const userSplit = exp.splits.find(s => s.friendId === this.state.currentUserId);
                const userShare = userSplit ? userSplit.amount : 0;
                
                let userOwesText = "";
                let userOwesAmtClass = "";

                if (exp.payerId === this.state.currentUserId) {
                    const othersOwe = exp.amount - userShare;
                    userOwesText = "you lent";
                    userOwesAmtClass = "owed";
                    userOwesTextValue = `₹${othersOwe.toFixed(2)}`;
                } else if (userShare > 0) {
                    userOwesText = "you borrowed";
                    userOwesAmtClass = "owe";
                    userOwesTextValue = `₹${userShare.toFixed(2)}`;
                } else {
                    userOwesText = "not involved";
                    userOwesAmtClass = "neutral";
                    userOwesTextValue = "—";
                }

                li.innerHTML = `
                    <div class="exp-left">
                        <div class="exp-date-block">
                            <span class="exp-date-month">${month}</span>
                            <span>${day}</span>
                        </div>
                        <div class="exp-category-icon cat-${exp.category}">
                            <i class="${this.getCategoryIconClass(exp.category)}"></i>
                        </div>
                        <div class="exp-details-text">
                            <span class="exp-title">${exp.description}</span>
                            <span class="exp-payer-info">paid by <strong>${payerName}</strong> &bull; ₹${exp.amount.toFixed(2)}</span>
                        </div>
                    </div>
                    <div class="exp-right">
                        <div class="exp-stats-box">
                            <span class="exp-stats-label">${userOwesText}</span>
                            <span class="exp-stats-amt ${userOwesAmtClass}">${userOwesTextValue}</span>
                        </div>
                        <button class="btn-delete-item" title="Delete expense" onclick="window.uiController.confirmDeleteExpense('${exp.id}')"><i class="fa-solid fa-trash"></i></button>
                    </div>
                `;
                expList.appendChild(li);
            });
        }

        // Render Group Members List with their calculated group pools balances
        const memberList = document.getElementById("group-members-list");
        memberList.innerHTML = "";

        const memberBalances = this.state.getGroupMembersBalances(groupId);

        group.members.forEach(mId => {
            const bal = memberBalances[mId] || 0;
            const li = document.createElement("li");
            li.className = "member-balance-item";

            const isYou = mId === this.state.currentUserId;
            const name = isYou ? "You" : this.state.getFriendName(mId);

            let balClass = "neutral";
            let balText = "settled";

            if (bal > 0.01) {
                balClass = "positive";
                balText = `+₹${bal.toFixed(2)}`;
            } else if (bal < -0.01) {
                balClass = "negative";
                balText = `-₹${Math.abs(bal).toFixed(2)}`;
            } else {
                balText = "₹0.00";
            }

            li.innerHTML = `
                <span class="member-name">${name}</span>
                <span class="member-bal ${balClass}">${balText}</span>
            `;
            memberList.appendChild(li);
        });

        // Render Group Settlement instructions
        this.renderGroupSettlements();
    }

    renderGroupSettlements() {
        const groupId = this.selectedGroupId;
        if (!groupId) return;

        const simplify = document.getElementById("simplify-debts-toggle").checked;
        const container = document.getElementById("group-settlement-paths");
        container.innerHTML = "";

        let transactions = [];
        const balances = this.state.getGroupMembersBalances(groupId);

        if (simplify) {
            transactions = this.state.getSimplifiedDebts(balances);
        } else {
            transactions = this.state.getDirectDebts(groupId);
        }

        if (transactions.length === 0) {
            container.innerHTML = '<p class="debt-item-desc" style="padding: 12px; text-align: center;">Everyone is settled up in this group!</p>';
            return;
        }

        transactions.forEach(t => {
            const div = document.createElement("div");
            div.className = "settlement-path-item";

            const fromName = t.from === this.state.currentUserId ? "You" : this.state.getFriendName(t.from);
            const toName = t.to === this.state.currentUserId ? "You" : this.state.getFriendName(t.to);

            let actionButtonHtml = "";
            // Show "Record Payment" button if the currently active simulated user is either involved
            if (t.from === this.state.currentUserId || t.to === this.state.currentUserId) {
                actionButtonHtml = `
                    <button class="btn-settle-action" onclick="window.uiController.triggerDirectSettle('${t.from}', '${t.to}', ${t.amount}, '${groupId}')">
                        Settle Up
                    </button>
                `;
            }

            div.innerHTML = `
                <div class="settlement-text">
                    <strong>${fromName}</strong> owes <strong>${toName}</strong> <span class="negative">₹${t.amount.toFixed(2)}</span>
                </div>
                ${actionButtonHtml}
            `;
            container.appendChild(div);
        });
    }

    // Helper triggered via direct settlement click from group list
    triggerDirectSettle(fromId, toId, amount, groupId) {
        const modal = document.getElementById("modal-settle");
        this.openModal(modal);
        this.prepareSettleModal(fromId, toId, groupId);
        
        // Auto input amount
        document.getElementById("settle-amount").value = amount.toFixed(2);
    }

    getCategoryIconClass(cat) {
        const icons = {
            general: "fa-solid fa-file-invoice",
            food: "fa-solid fa-utensils",
            travel: "fa-solid fa-plane",
            rent: "fa-solid fa-house",
            entertainment: "fa-solid fa-film"
        };
        return icons[cat] || icons.general;
    }

    // RENDERING 3. FRIENDS VIEW
    renderFriendsTab() {
        if (this.selectedFriendId) {
            this.renderFriendDetails(this.selectedFriendId);
            return;
        }

        const container = document.getElementById("friends-list-container");
        container.innerHTML = "";

        const balances = this.state.getNetBalances();

        // Filter out "you" from the friends list rendering
        const displayFriends = this.state.friends.filter(f => f.id !== this.state.currentUserId);

        if (displayFriends.length === 0) {
            container.innerHTML = `<div class="glass-card" style="grid-column: 1/-1; padding: 40px; text-align: center; color: var(--text-secondary);">
                <i class="fa-solid fa-user-group placeholder-icon"></i>
                <p style="margin-top: 10px;">No friends found. Add friends to share individual balances.</p>
            </div>`;
            return;
        }

        displayFriends.forEach(f => {
            const card = document.createElement("div");
            
            const bal = balances[f.id] || 0;
            let balClass = "neutral";
            let balText = "settled up";
            let balLabel = "settled";
            let stateClass = "";

            if (bal > 0.01) {
                balClass = "positive";
                balText = `+₹${bal.toFixed(2)}`;
                balLabel = "owes you";
                stateClass = "net-owed";
            } else if (bal < -0.01) {
                balClass = "negative";
                balText = `-₹${Math.abs(bal).toFixed(2)}`;
                balLabel = "you owe";
                stateClass = "net-owe";
            }

            card.className = `friend-card ${stateClass}`;
            card.innerHTML = `
                <div class="friend-info">
                    <div class="friend-avatar">${f.name.charAt(0).toUpperCase()}</div>
                    <div>
                        <div class="friend-meta-name">${f.name}</div>
                        <div class="friend-email">${f.email || "No email"}</div>
                    </div>
                </div>
                <div class="friend-card-right">
                    <div class="friend-balance-display">
                        <span class="friend-bal-label">${balLabel}</span>
                        <span class="friend-bal-val ${balClass}">${balText}</span>
                    </div>
                    ${f.id !== "you" ? `<button class="btn-delete-item" title="Remove friend" onclick="event.stopPropagation(); window.uiController.confirmDeleteFriend('${f.id}')"><i class="fa-solid fa-trash"></i></button>` : ""}
                </div>
            `;

            card.addEventListener("click", () => {
                this.selectedFriendId = f.id;
                container.classList.add("hidden");
                document.getElementById("friend-details").classList.remove("hidden");
                this.renderFriendDetails(f.id);
            });

            container.appendChild(card);
        });
    }

    renderFriendDetails(friendId) {
        const friend = this.state.friends.find(f => f.id === friendId);
        if (!friend) return;

        document.getElementById("detail-friend-name").textContent = friend.name;

        // Calculate direct net balance
        const balances = this.state.getNetBalances();
        const bal = balances[friendId] || 0;
        const statusNode = document.getElementById("detail-friend-net-status");
        
        if (bal > 0.01) {
            statusNode.innerHTML = `Owes you <strong class="positive">₹${bal.toFixed(2)}</strong> overall`;
        } else if (bal < -0.01) {
            statusNode.innerHTML = `You owe them <strong class="negative">₹${Math.abs(bal).toFixed(2)}</strong> overall`;
        } else {
            statusNode.textContent = "Settled up";
        }

        // Render Shared Expenses with this specific friend (individual or inside groups)
        const expList = document.getElementById("friend-expenses-list");
        expList.innerHTML = "";

        const sharedExpenses = this.state.expenses.filter(exp => {
            const hasFriendInSplit = exp.splits.some(s => s.friendId === friendId);
            const isFriendPayer = exp.payerId === friendId;
            const hasUserInSplit = exp.splits.some(s => s.friendId === this.state.currentUserId);
            const isUserPayer = exp.payerId === this.state.currentUserId;

            return (hasFriendInSplit || isFriendPayer) && (hasUserInSplit || isUserPayer);
        });

        const sharedSettlements = this.state.settlements.filter(set => {
            return (set.payerId === friendId && set.receiverId === this.state.currentUserId) ||
                   (set.payerId === this.state.currentUserId && set.receiverId === friendId);
        });

        // Combine and sort events
        const events = [];
        sharedExpenses.forEach(exp => {
            events.push({ type: "expense", date: exp.date, data: exp, timestamp: exp.timestamp });
        });
        sharedSettlements.forEach(set => {
            events.push({ type: "settlement", date: set.date, data: set, timestamp: Date.parse(set.date) });
        });

        // Sort descending
        events.sort((a,b) => b.date.localeCompare(a.date) || b.timestamp - a.timestamp);

        if (events.length === 0) {
            expList.innerHTML = '<li class="expense-item"><div class="exp-details-text"><span class="exp-title">No transactions logged yet with this friend.</span></div></li>';
        } else {
            events.forEach(evt => {
                const li = document.createElement("li");
                li.className = "expense-item";

                const dateObj = new Date(evt.date);
                const month = dateObj.toLocaleString("en-US", { month: "short" });
                const day = dateObj.getDate() + 1;

                if (evt.type === "expense") {
                    const exp = evt.data;
                    const payerName = exp.payerId === this.state.currentUserId ? "You" : this.state.getFriendName(exp.payerId);
                    
                    const userSplit = exp.splits.find(s => s.friendId === this.state.currentUserId);
                    const friendSplit = exp.splits.find(s => s.friendId === friendId);

                    const userShare = userSplit ? userSplit.amount : 0;
                    const friendShare = friendSplit ? friendSplit.amount : 0;

                    let statText = "";
                    let statAmt = "";
                    let statClass = "neutral";

                    if (exp.payerId === this.state.currentUserId) {
                        statText = `you lent ${friend.name}`;
                        statClass = "positive";
                        statAmt = `₹${friendShare.toFixed(2)}`;
                    } else if (exp.payerId === friendId) {
                        statText = `${friend.name} lent you`;
                        statClass = "negative";
                        statAmt = `₹${userShare.toFixed(2)}`;
                    } else {
                        // Someone else paid
                        statText = "both split bill";
                        statAmt = "—";
                    }

                    li.innerHTML = `
                        <div class="exp-left">
                            <div class="exp-date-block">
                                <span class="exp-date-month">${month}</span>
                                <span>${day}</span>
                            </div>
                            <div class="exp-category-icon cat-${exp.category}">
                                <i class="${this.getCategoryIconClass(exp.category)}"></i>
                            </div>
                            <div class="exp-details-text">
                                <span class="exp-title">${exp.description}</span>
                                <span class="exp-payer-info">paid by <strong>${payerName}</strong> &bull; ₹${exp.amount.toFixed(2)}</span>
                            </div>
                        </div>
                        <div class="exp-right">
                            <div class="exp-stats-box">
                                <span class="exp-stats-label">${statText}</span>
                                <span class="exp-stats-amt ${statClass}">${statAmt}</span>
                            </div>
                        </div>
                    `;
                } else {
                    // Settlement Payment
                    const set = evt.data;
                    const payerName = set.payerId === this.state.currentUserId ? "You" : this.state.getFriendName(set.payerId);
                    const recvName = set.receiverId === this.state.currentUserId ? "You" : this.state.getFriendName(set.receiverId);

                    let statText = set.payerId === this.state.currentUserId ? "you settled" : "settled with you";
                    let statClass = "positive";

                    li.innerHTML = `
                        <div class="exp-left">
                            <div class="exp-date-block">
                                <span class="exp-date-month">${month}</span>
                                <span>${day}</span>
                            </div>
                            <div class="exp-category-icon cat-rent" style="background: rgba(16, 185, 129, 0.15); color: var(--color-positive);">
                                <i class="fa-solid fa-handshake-simple"></i>
                            </div>
                            <div class="exp-details-text">
                                <span class="exp-title">Payment Recorded</span>
                                <span class="exp-payer-info"><strong>${payerName}</strong> paid <strong>${recvName}</strong></span>
                            </div>
                        </div>
                        <div class="exp-right">
                            <div class="exp-stats-box">
                                <span class="exp-stats-label">${statText}</span>
                                <span class="exp-stats-amt owed">₹${set.amount.toFixed(2)}</span>
                            </div>
                        </div>
                    `;
                }

                expList.appendChild(li);
            });
        }
    }

    // RENDERING 4. RECENT ACTIVITY VIEW
    renderActivityTab() {
        const list = document.getElementById("activity-log-list");
        list.innerHTML = "";

        if (this.state.activities.length === 0) {
            list.innerHTML = '<li class="activity-log-item"><span class="activity-text">No activity logged yet.</span></li>';
            return;
        }

        const icons = {
            expense: { class: "fa-solid fa-receipt act-expense", type: "expense" },
            settlement: { class: "fa-solid fa-handshake-simple act-settlement", type: "settlement" },
            group: { class: "fa-solid fa-users act-group", type: "group" },
            friend: { class: "fa-solid fa-user-plus act-friend", type: "friend" }
        };

        this.state.activities.forEach(act => {
            const li = document.createElement("li");
            li.className = "activity-log-item";

            const meta = icons[act.type] || icons.expense;
            const timeStr = new Date(act.timestamp).toLocaleString();

            li.innerHTML = `
                <div class="activity-icon ${act.type}">
                    <i class="${meta.class}"></i>
                </div>
                <div class="activity-meta">
                    <span class="activity-text">${act.text}</span>
                    <span class="activity-time">${timeStr}</span>
                </div>
            `;
            list.appendChild(li);
        });
    }

    confirmDeleteFriend(friendId) {
        const friend = this.state.friends.find(f => f.id === friendId);
        if (!friend) return;
        if (confirm(`Remove "${friend.name}"?\n\nThis will also delete all expenses and settlements involving them.`)) {
            this.state.deleteFriend(friendId);
            this.renderAll();
        }
    }

    confirmDeleteExpense(expenseId) {
        const exp = this.state.expenses.find(e => e.id === expenseId);
        if (!exp) return;
        if (confirm(`Delete expense "${exp.description}" (₹${exp.amount.toFixed(2)})?`)) {
            this.state.deleteExpense(expenseId);
            this.renderAll();
            // Re-render group detail if we're inside one
            if (this.selectedGroupId) {
                this.renderGroupDetails(this.selectedGroupId);
            }
        }
    }

    confirmDeleteGroup(groupId) {
        const group = this.state.groups.find(g => g.id === groupId);
        if (!group) return;
        if (confirm(`Delete group "${group.name}"?\n\nThis will also delete all expenses in this group.`)) {
            this.state.deleteGroup(groupId);
            this.selectedGroupId = null;
            this.renderAll();
        }
    }
}

// 3. PAGE INITIALIZATION
window.addEventListener("DOMContentLoaded", () => {
    const state = new AppState();
    window.uiController = new UIController(state);
});
