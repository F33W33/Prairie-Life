(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const SAVE_KEY = "mapleLifeSaveV1";
  const initialState = {
    name: "", avatar: "🧑🏽", province: "Saskatchewan", cash: 0, cashResetForZeroStart: true, job: null, home: "starter",
    day: 1, hunger: 82, energy: 90, happiness: 76, inventory: [], applications: [],
    visited: [], rentPaid: false, tasks: []
  };
  let state = loadState();
  let toastTimer;
  let currentPlace = null;
  let editingProfile = false;

  const jobs = {
    retail: { title: "Store Associate", wage: 18, place: "Midtown Plaza", siteId: "midtown", tasks: [{id:"retail_stock",label:"Restock the shelves"},{id:"retail_customer",label:"Help a customer"},{id:"retail_till",label:"Complete a checkout"}] },
    cafe: { title: "Café Crew Member", wage: 17, place: "Hotel Senator · Café", siteId: "senator", tasks: [{id:"cafe_prep",label:"Prepare an order"},{id:"cafe_serve",label:"Serve a customer"},{id:"cafe_clean",label:"Clear a table"}] },
    delivery: { title: "Delivery Rider", wage: 20, place: "City-wide · Dispatch", siteId: "cityhall", tasks: [{id:"delivery_pickup",label:"Collect a parcel"},{id:"delivery_drop1",label:"Deliver the first order"},{id:"delivery_drop2",label:"Deliver the second order"}] },
    office: { title: "Office Assistant", wage: 22, place: "Nutrien Tower", siteId: "nutrien", tasks: [{id:"office_documents",label:"Sort incoming documents"},{id:"office_computer",label:"Enter information"},{id:"office_mail",label:"Deliver the paperwork"}] }
  };
  const homes = {
    starter: { title: "Starter Apartment", rent: 650, type: "Apartment", description: "A simple, comfortable place to begin your Canadian story." },
    condo: { title: "Downtown Condo", rent: 1150, type: "Condo", description: "A modern space close to downtown shops, cafés, and city life." },
    house: { title: "Suburban House", rent: 1750, type: "House", description: "A little more room, a quiet street, and a backyard to enjoy." }
  };
  const products = {
    sandwich: { name: "Sandwich", price: 12, hunger: 28, happiness: 2, icon: "🥪" },
    coffee: { name: "Hot Coffee", price: 4.5, energy: 14, happiness: 3, icon: "☕" },
    soup: { name: "Soup & Bread", price: 9, hunger: 22, happiness: 3, icon: "🍲" },
    scarf: { name: "Warm Scarf", price: 24, happiness: 8, icon: "🧣" },
    book: { name: "Paperback Book", price: 16, happiness: 7, energy: 2, icon: "📚" },
    plant: { name: "Little Houseplant", price: 18, happiness: 9, icon: "🪴" }
  };
  const places = {
    cafe: { name: "Northstar Café", type: "FOOD & DRINK", icon: "☕", description: "A cosy neighbourhood café. Grab a coffee, enjoy a snack, and take a little break.", actions: [{ label: "Buy a coffee · $4.50", action: "coffee" }, { label: "Have a sandwich · $12", action: "sandwich" }] },
    park: { name: "Evergreen Park", type: "OUTDOORS", icon: "🌲", description: "A peaceful green space with walking paths and room to enjoy the fresh Canadian air.", actions: [{ label: "Take a walk · Free", action: "walk" }, { label: "Relax on a bench · Free", action: "relax" }] },
    market: { name: "Maple Market", type: "SHOPPING", icon: "🛒", description: "Your local stop for groceries, everyday essentials, and a few treats.", actions: [{ label: "Buy a sandwich · $12", action: "sandwich" }, { label: "Browse marketplace", action: "shop" }] },
    gym: { name: "Community Centre", type: "FITNESS", icon: "🏋️", description: "A friendly place to move, unwind, and feel part of the community.", actions: [{ label: "Work out · Free", action: "workout" }, { label: "Take a break · Free", action: "relax" }] },
    library: { name: "Public Library", type: "COMMUNITY", icon: "📚", description: "Find a quiet corner, discover a new book, or spend some time learning.", actions: [{ label: "Read for a while · Free", action: "read" }, { label: "Rest · Free", action: "rest" }] },
    square: { name: "City Square", type: "DOWNTOWN", icon: "🏙️", description: "The heart of Maplewood. Take in the city, meet people, and see what's happening.", actions: [{ label: "Explore downtown · Free", action: "walk" }, { label: "Enjoy the view · Free", action: "relax" }] }
  };

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (saved && typeof saved === "object") {
        // Existing saves get a one-time reset so every resident begins with $0.
        if (saved.cashResetForZeroStart !== true) {
          saved.cash = 0;
          saved.cashResetForZeroStart = true;
          localStorage.setItem(SAVE_KEY, JSON.stringify({ ...initialState, ...saved }));
        }
        return { ...initialState, ...saved };
      }
      return { ...initialState };
    } catch { return { ...initialState }; }
  }
  function saveState() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch { /* local storage may be unavailable */ }
  }
  function money(amount) {
    return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 2 }).format(amount);
  }
  function toast(message) {
    const el = $("#toast");
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
  }
  function clamp(value) { return Math.max(0, Math.min(100, value)); }
  function changeNeed(key, amount) { state[key] = clamp(state[key] + amount); }
  function setText(selector, value) { const el = $(selector); if (el) el.textContent = value; }
  function render() {
    const home = homes[state.home] || homes.starter;
    setText("#sideName", state.name || "New Resident");
    setText("#sideAvatar", state.avatar);
    setText("#sideProvince", state.province || "Canada");
    setText("#topCash", money(state.cash));
    setText("#balanceStat", money(state.cash));
    setText("#jobsCash", money(state.cash));
    setText("#shopCash", money(state.cash));
    setText("#housingStat", home.title);
    setText("#housingSub", home.type + " · " + money(home.rent) + "/mo");
    setText("#careerStat", state.job ? state.job.title : "Unemployed");
    setText("#careerSub", state.job ? money(state.job.wage) + " per hour" : "Find your first job");
    setText("#dayStat", "Day " + state.day);
    setText("#seasonStat", seasonName() + " in Maplewood");
    setText("#homeTitle", home.title);
    setText("#homeDescription", home.description);
    setText("#rentValue", money(home.rent));
    setText("#homeType", home.type);
    setText("#greeting", state.name ? "A new chapter\nbegins, " + state.name + "." : "A new chapter\nbegins, today.");
    setText("#dateLabel", dateLabel());
    ["hunger", "energy", "happiness"].forEach(key => {
      setText("#" + key + "Value", Math.round(state[key]) + "%");
      const bar = $("#" + key + "Bar");
      if (bar) bar.style.width = state[key] + "%";
    });
    const mood = state.happiness >= 65 ? "Doing well ✨" : state.happiness >= 35 ? "Could use a boost" : "Needs a little care";
    setText("#moodBadge", mood);
    setText("#needTip", state.hunger < 35 ? "You're getting hungry. Pick up something to eat." : state.energy < 35 ? "You're running low on energy. Take a rest at home." : state.happiness < 35 ? "Try a walk in the park or a little treat." : "A good meal and a little rest can make all the difference.");
    setText("#topLocation", "Maplewood, Canada");
    setText("#weatherLabel", weather().label);
    setText("#weatherIcon", weather().icon);
    setText("#weatherTemp", weather().temp + "°C · " + seasonName());
    updateJobButtons();
    updateHomeButtons();
    updateTaskCards();
    saveState();
    $("#welcomeModal").classList.remove("open");
  }

  function openProfileEditor() {
    editingProfile = true;
    $("#playerName").value = state.name || "";
    $("#playerProvince").value = state.province || "Saskatchewan";
    const selectedAvatar = $('input[name="avatar"][value="' + (state.avatar || "🧑🏽") + '"]');
    if (selectedAvatar) selectedAvatar.checked = true;
    $("#profileEyebrow").textContent = "YOUR CHARACTER";
    $("#profileModalTitle").textContent = "Edit your character.";
    $("#profileModalDescription").textContent = "Update your name, avatar, or home province. Your game progress will stay the same.";
    $("#profileSubmit").innerHTML = "Save character <span>→</span>";
    $(".welcome-modal").classList.add("editing");
    $("#welcomeModal").classList.add("open");
  }
  function closeProfileEditor() {
    if (!state.name) return;
    $("#welcomeModal").classList.remove("open");
    $(".welcome-modal").classList.remove("editing");
    editingProfile = false;
  }
  function seasonName() {
    const month = new Date().getMonth();
    if ([11, 0, 1].includes(month)) return "Winter";
    if ([2, 3, 4].includes(month)) return "Spring";
    if ([5, 6, 7].includes(month)) return "Summer";
    return "Autumn";
  }
  function weather() {
    const season = seasonName();
    if (season === "Winter") return { icon: "❄️", label: "Snowy skies", temp: -8 };
    if (season === "Summer") return { icon: "☀️", label: "Clear skies", temp: 24 };
    if (season === "Autumn") return { icon: "🍂", label: "Crisp & cool", temp: 9 };
    return { icon: "🌤️", label: "Partly cloudy", temp: 18 };
  }
  function dateLabel() {
    const d = new Date();
    return new Intl.DateTimeFormat("en-CA", { weekday: "long", month: "long", day: "numeric" }).format(d).toUpperCase();
  }
  function navigate(view) {
    const id = view === "home-life" ? "home-lifeView" : view + "View";
    $$(".view").forEach(el => el.classList.toggle("active-view", el.id === id));
    $$(".nav-item").forEach(el => el.classList.toggle("active", el.dataset.view === view));
    $(".sidebar").classList.remove("mobile-open");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function applicationFor(key) { return (state.applications || []).find(item => item.jobKey === key); }
  function updateJobButtons() {
    $("[data-job]").forEach(button => {
      button.textContent = state.job ? "Go to workplace" : "Not employed";
      button.disabled = !state.job;
    });
    $$("[data-apply]").forEach(button => {
      const app = applicationFor(button.dataset.apply);
      button.textContent = state.job ? "Already employed" : app ? (app.status === "pending" ? "Pending" : app.status === "offer" ? "Offer received" : app.status === "accepted" ? "Hired" : "Apply again") : "Apply now";
      button.disabled = !!state.job || !!(app && app.status !== "rejected");
    });
    renderCareerApplications();
  }
  function renderCareerApplications() {
    const host = $("#careerApplications"); if (!host) return;
    const apps = state.applications || []; if (!apps.length) { host.innerHTML = ""; return; }
    host.innerHTML = '<div class="section-heading"><div><div class="eyebrow">YOUR JOB SEARCH</div><h2>Applications</h2></div></div><div class="application-list">' + apps.map(app => {
      const job = jobs[app.jobKey]; if (!job) return "";
      const label = app.status === "pending" ? "Awaiting employer response" : app.status === "offer" ? "Job offer received" : app.status === "accepted" ? "Offer accepted" : "Application not selected";
      return '<article class="application-card"><div><b>' + job.title + '</b><small>' + job.place + ' · ' + money(job.wage) + '/hr</small></div><span class="application-status ' + app.status + '">' + label + '</span>' + (app.status === "offer" ? '<button class="primary-button small-button" data-accept-job="' + app.jobKey + '">Accept offer</button>' : "") + '</article>';
    }).join("") + (apps.some(app => app.status === "pending") ? '<button class="outline-button" data-wait-employer>Wait until tomorrow · 1 day</button>' : "") + '</div>';
  }
  function respondToApplications() {
    (state.applications || []).forEach(app => {
      if (app.status !== "pending" || app.submittedDay >= state.day) return;
      const score = (app.jobKey.length * 17 + app.submittedDay * 13 + state.day * 7) % 10;
      app.status = score < 7 ? "offer" : "rejected"; app.respondedDay = state.day;
    });
  }
  function applyForJob(key) {
    if (!jobs[key] || state.job) { toast("You already have a job."); return; }
    const old = applicationFor(key); if (old && old.status !== "rejected") return;
    state.applications = (state.applications || []).filter(app => app.jobKey !== key);
    state.applications.push({ jobKey: key, submittedDay: state.day, status: "pending" });
    render(); if ($("#gamePanel")?.classList.contains("open")) openGamePanel("jobs");
    toast("Application sent! The employer will respond after the next day.");
  }
  function acceptJobOffer(key) {
    const app = applicationFor(key), job = jobs[key]; if (!app || app.status !== "offer" || !job || state.job) return;
    state.job = job; state.workShift=null; app.status = "accepted";
    state.applications = state.applications.filter(item => item.jobKey === key);
    render(); if ($("#gamePanel")?.classList.contains("open")) openGamePanel("jobs");
    toast("Offer accepted! Travel to "+job.place+" to start your first shift.");
  }
  function waitForEmployer() {
    state.day += 1; changeNeed("energy", -3);
    respondToApplications();
    (state.applications||[]).forEach(app=>{if(app.status==="pending"&&app.submittedDay<state.day){app.status="offer";app.respondedDay=state.day;}});
    render();
    if ($("#gamePanel")?.classList.contains("open")) openGamePanel("jobs");
    toast("A new day in Maplewood. Employer replies have arrived — check Careers.");
  }

  function updateHomeButtons() {
    $$("[data-home]").forEach(button => {
      const home = homes[button.dataset.home];
      button.textContent = state.home === button.dataset.home ? "Current home" : "Move in";
      button.disabled = state.home === button.dataset.home;
      button.style.opacity = button.disabled ? ".65" : "1";
    });
    setText("#payRentButton", state.rentPaid ? "Rent paid this month ✓" : "Pay monthly rent →");
    $("#payRentButton").disabled = state.rentPaid;
  }
  function updateTaskCards() {
    const tasks = [
      { title: "Find a job", sub: state.job ? "You're employed — nice work!" : "Start earning your own money", done: !!state.job, view: "jobs" },
      { title: "Explore downtown", sub: state.visited.includes("square") ? "You've visited City Square" : "See what's around you", done: state.visited.includes("square"), view: "city" },
      { title: "Settle into your home", sub: state.home !== "starter" ? "You've found a new home" : "Make your place feel like yours", done: state.home !== "starter", view: "home-life" }
    ];
    const list = $("#taskList");
    if (!list) return;
    list.innerHTML = tasks.map((task, i) => '<button class="task-card" data-go="' + task.view + '"><span class="task-check">' + (task.done ? "✓" : i + 1) + '</span><span><strong>' + task.title + '</strong><small>' + task.sub + '</small></span><span>→</span></button>').join("");
  }
  function showWorkPanel() {
    const panel=$("#gamePanel"),content=$("#gamePanelContent");
    if(!panel||!content||!state.workShift)return;
    const job=state.job,shift=state.workShift,task=job.tasks[shift.progress];
    content.innerHTML='<div class="phone-screen-heading"><span class="eyebrow">ON THE JOB</span><h2>'+job.title+'</h2><p>'+job.place+'</p></div><div class="career-current"><small>SHIFT IN PROGRESS</small><h3>'+shift.progress+' / '+job.tasks.length+' tasks complete</h3><p>'+(task?'Next task: '+task.label:'All tasks complete')+'</p><p>Walk to the matching work station and press E.</p><button class="career-work-button" data-work-close>Return to work area</button></div>';
    panel.classList.add("open");
  }
  function beginWorkShift() {
    if(!state.job)return;
    if(state.workShift){showWorkPanel();return;}
    if(state.energy<20){toast("You're too tired for a shift. Rest first.");return;}
    state.workShift={progress:0,startedDay:state.day};document.dispatchEvent(new CustomEvent("maple:work-shift-state",{detail:{active:true}}));saveState();showWorkPanel();
    toast("Shift started. Complete each task at its marked work station.");
  }
  function completeWorkStation(id) {
    if(!state.job||!state.workShift)return;
    const task=state.job.tasks[state.workShift.progress];
    if(!task)return;
    if(task.id!==id){toast("Not the next station. "+task.label+" first.");return;}
    state.workShift.progress++;
    if(state.workShift.progress<state.job.tasks.length){saveState();toast("Task complete! "+state.workShift.progress+"/"+state.job.tasks.length);if($("#gamePanel")?.classList.contains("open"))showWorkPanel();return;}
    const earned=state.job.wage*4;state.cash+=earned;changeNeed("energy",-24);changeNeed("hunger",-12);changeNeed("happiness",3);
    state.day++;respondToApplications();state.rentPaid=false;state.workShift=null;document.dispatchEvent(new CustomEvent("maple:work-shift-state",{detail:{active:false}}));render();
    toast("Shift complete! You earned "+money(earned)+".");
    if($("#gamePanel")?.classList.contains("open"))openGamePanel("jobs");
  }
  function buyProduct(id) {
    const item = products[id];
    if (!item) return;
    if (state.cash < item.price) { toast("Not enough money for that item."); return; }
    state.cash -= item.price;
    state.inventory.push({ id, name: item.name, icon: item.icon });
    if (item.hunger) changeNeed("hunger", item.hunger);
    if (item.energy) changeNeed("energy", item.energy);
    if (item.happiness) changeNeed("happiness", item.happiness);
    render();
    toast(item.name + " purchased. Thanks for shopping locally!");
  }
  function activity(action) {
    switch (action) {
      case "eat": buyProduct("sandwich"); return;
      case "coffee": buyProduct("coffee"); return;
      case "sandwich": buyProduct("sandwich"); return;
      case "rest": changeNeed("energy", 35); changeNeed("happiness", 2); toast("You had a good rest. Energy restored."); break;
      case "relax": changeNeed("happiness", 12); changeNeed("energy", 5); toast("That was a lovely way to unwind."); break;
      case "walk": changeNeed("happiness", 13); changeNeed("energy", -7); changeNeed("hunger", -4); toast("A refreshing walk around Maplewood!"); break;
      case "workout": changeNeed("happiness", 9); changeNeed("energy", -15); changeNeed("hunger", -8); toast("Nice workout! You feel accomplished."); break;
      case "read": changeNeed("happiness", 8); changeNeed("energy", 4); toast("A little reading time did you good."); break;
      case "shop": navigate("shop"); return;
      default: return;
    }
    render();
  }
  function openPlace(id) {
    const place = places[id];
    if (!place) return;
    currentPlace = id;
    if (!state.visited.includes(id)) state.visited.push(id);
    setText("#placeModalIcon", place.icon);
    setText("#placeModalType", place.type);
    setText("#placeModalTitle", place.name);
    setText("#placeModalDescription", place.description);
    $("#placeActions").innerHTML = place.actions.map(item => '<button class="primary-button" data-place-action="' + item.action + '">' + item.label + '</button>').join("");
    $("#placeModal").classList.add("open");
    render();
  }
  function moveHome(id) {
    const home = homes[id];
    if (!home || state.home === id) return;
    if (state.cash < home.rent) { toast("You'll need at least one month's rent (" + money(home.rent) + ") to move in."); return; }
    state.cash -= home.rent;
    state.home = id;
    state.rentPaid = true;
    render();
    if ($("#gamePanel")?.classList.contains("open")) openGamePanel("home-life");
    toast("Welcome to your new home! First month's rent paid.");
  }
  function payRent() {
    const rent = homes[state.home].rent;
    if (state.rentPaid) return;
    if (state.cash < rent) { toast("You need " + money(rent) + " to pay your monthly rent."); return; }
    state.cash -= rent;
    state.rentPaid = true;
    render();
    toast("Monthly rent paid. Your home is all yours for now.");
  }

  document.addEventListener("click", event => {
    const nav = event.target.closest("[data-view]");
    if (nav) { navigate(nav.dataset.view); return; }
    const go = event.target.closest("[data-go]");
    if (go) { navigate(go.dataset.go); return; }
    const actionButton = event.target.closest("[data-action]");
    if (actionButton) { activity(actionButton.dataset.action); return; }
    const placeButton = event.target.closest("[data-place]");
    if (placeButton) { openPlace(placeButton.dataset.place); return; }
    const applyButton = event.target.closest("[data-apply]");
    if (applyButton) { applyForJob(applyButton.dataset.apply); return; }
    const acceptButton = event.target.closest("[data-accept-job]");
    if (acceptButton) { acceptJobOffer(acceptButton.dataset.acceptJob); return; }
    const waitButton = event.target.closest("[data-wait-employer]");
    if (waitButton) { waitForEmployer(); return; }
    const jobButton = event.target.closest("[data-job]");
    if (jobButton) {
      if (!state.job) { toast("Apply for a position and wait for the employer's response."); return; }
      $("#gamePanel")?.classList.remove("open");
      navigate("city");
      toast("Travel to "+state.job.place+" and press E at the workplace to clock in.");
      return;
    }
    const homeButton = event.target.closest("[data-home]");
    if (homeButton) { moveHome(homeButton.dataset.home); return; }
    const buyButton = event.target.closest("[data-buy]");
    if (buyButton) { buyProduct(buyButton.dataset.buy); return; }
    const placeAction = event.target.closest("[data-place-action]");
    if (placeAction) {
      const action = placeAction.dataset.placeAction;
      $("#placeModal").classList.remove("open");
      activity(action);
      return;
    }
  });

  $("#startForm").addEventListener("submit", event => {
    event.preventDefault();
    const name = $("#playerName").value.trim();
    if (!name) { toast("Please enter your name to begin."); return; }
    state.name = name;
    state.avatar = $('input[name="avatar"]:checked')?.value || "🧑🏽";
    state.province = $("#playerProvince").value || "Saskatchewan";
    const wasEditing = editingProfile;
    editingProfile = false;
    $(".welcome-modal").classList.remove("editing");
    render();
    toast(wasEditing ? "Character updated! Your progress is safe." : "Welcome to Maplewood, " + state.name + "! Your story starts now.");
  });
  $("#editProfileButton").addEventListener("click", openProfileEditor);
  $("#closeProfileModal").addEventListener("click", closeProfileEditor);
  $("#payRentButton").addEventListener("click", payRent);
  $("#closePlace").addEventListener("click", () => $("#placeModal").classList.remove("open"));
  $("#placeModal").addEventListener("click", event => { if (event.target === $("#placeModal")) $("#placeModal").classList.remove("open"); });
  $("#welcomeModal").addEventListener("click", event => { if (event.target === $("#welcomeModal")) closeProfileEditor(); });
  $("#resetButton").addEventListener("click", () => {
    if (!window.confirm("Start over? This will erase your Maple Life save on this device.")) return;
    state = { ...initialState };
    saveState();
    render();
    navigate("home");
    $("#playerName").value = "";
    toast("A fresh start! Welcome to Maple Life.");
  });
  $("#mobileMenu").addEventListener("click", () => $(".sidebar").classList.toggle("mobile-open"));
  $("#taskList").addEventListener("click", event => {
    const button = event.target.closest("[data-go]");
    if (button) navigate(button.dataset.go);
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      $("#placeModal").classList.remove("open");
      if (state.name) closeProfileEditor();
    }
  });

  function gameToast(message){const el=$("#gameToast");if(!el)return;el.textContent=message;el.classList.add("show");clearTimeout(gameToast.timer);gameToast.timer=setTimeout(()=>el.classList.remove("show"),2400);}
  function renderGameHud(){const put=(id,v)=>{const e=$("#"+id);if(e)e.textContent=v;};put("gameCash",money(state.cash));put("gameProvince",state.province||"Saskatchewan");put("gameDate","MAPLEWOOD · DAY "+state.day);[["Happy","happiness"],["Hunger","hunger"],["Energy","energy"]].forEach(([n,k])=>{put("game"+n+"Value",Math.round(state[k])+"%");const b=$("#game"+n+"Bar");if(b)b.style.width=clamp(state[k])+"%";});}
  function openGamePanel(type){
    const panel=$("#gamePanel"),content=$("#gamePanelContent");if(!panel||!content)return;
    const button=(label,screen)=>'<button class="phone-app-card" data-phone-screen="'+screen+'">'+label+' <span>›</span></button>';
    const go=(label,view)=>'<button class="phone-action" data-phone-go="'+view+'">'+label+' <span>→</span></button>';
    let title="Maple Life",subtitle="YOUR POCKET COMPANION",body="";
    if(type==="jobs"){
      title="💼 Careers";subtitle="FIND WORK IN MAPLEWOOD";
      const icons={retail:"🛍️",cafe:"☕",delivery:"🚲",office:"💻"};
      const descriptions={retail:"Help customers and keep the shelves organized.",cafe:"Prepare orders and welcome café guests.",delivery:"Deliver local orders around Maplewood.",office:"Support a team with everyday office tasks."};
      const current=state.job;
      body='<div class="career-phone-balance"><span>AVAILABLE BALANCE</span><b>'+money(state.cash)+'</b></div>';
      if(current){
        const currentKey=Object.keys(jobs).find(key=>jobs[key].title===current.title);
        body+='<div class="career-current"><small>YOUR CURRENT POSITION</small><div><span>'+((icons[currentKey])||"💼")+'</span><section><b>'+current.title+'</b><small>'+current.place+' · '+money(current.wage)+'/hr</small></section></div><p>Travel to your workplace in the 3D city and press E at the building to clock in. Complete three work tasks to earn a four-hour shift.</p></div>';
      }else{
        body+='<div class="career-welcome"><span>🌱</span><b>Your next chapter starts here.</b><small>Choose an open position below to get hired and start earning.</small></div>';
      }
      const pendingApps=(state.applications||[]).filter(app=>app.status==="pending");
      const offerApps=(state.applications||[]).filter(app=>app.status==="offer");
      if(offerApps.length)body+='<div class="career-current"><b>📩 Employer response</b>'+offerApps.map(app=>'<p>'+jobs[app.jobKey].title+' — offer received</p><button class="career-work-button" data-accept-job="'+app.jobKey+'">Accept job offer</button>').join("")+'</div>';
      if(pendingApps.length)body+='<div class="career-current"><b>⏳ Applications awaiting a reply</b><p>Employers respond after one in-game day.</p><button class="career-work-button" data-wait-employer>Advance one day · Check replies</button></div>';
      body+='<div class="career-section-label">OPEN POSITIONS <span>4 JOBS</span></div><div class="career-phone-list">'+Object.entries(jobs).map(([key,job])=>{const app=applicationFor(key);const label=current?'Already employed':app?(app.status==='pending'?'Pending':app.status==='offer'?'Offer received':app.status==='accepted'?'Hired':'Apply again'):'Apply';return '<article class="career-phone-card"><div class="career-phone-icon">'+icons[key]+'</div><div class="career-phone-info"><b>'+job.title+'</b><small>'+job.place+'</small><p>'+descriptions[key]+'</p><strong>'+money(job.wage)+' <small>/ hour</small></strong></div><button class="career-apply-button" data-apply="'+key+'" '+(current||app&&app.status!=="rejected"?'disabled':'')+'>'+label+'</button></article>';}).join("")+'</div>';
    }else if(type==="home-life"){
      title="🏡 My home";subtitle="HOMES IN MAPLEWOOD";
      body='<div class="career-phone-balance"><span>AVAILABLE BALANCE</span><b>'+money(state.cash)+'</b></div>';
      const currentHome=homes[state.home]||homes.starter;
      body+='<div class="home-phone-current"><small>YOUR CURRENT HOME</small><b>🏠 '+currentHome.title+'</b><span>'+money(currentHome.rent)+' / month</span></div>';
      body+='<div class="career-section-label">AVAILABLE LISTINGS <span>'+Object.keys(homes).length+' HOMES</span></div><div class="career-phone-list">'+Object.entries(homes).map(([key,home])=>'<article class="home-phone-card"><div class="home-phone-art">'+(home.type==="Apartment"?"🏢":home.type==="Condo"?"🏙️":"🏡")+'</div><div class="career-phone-info"><b>'+home.title+'</b><small>'+home.type+' · '+money(home.rent)+'/month</small><p>'+home.description+'</p></div><button class="career-apply-button" data-home="'+key+'" '+(state.home===key?'disabled':'')+'>'+(state.home===key?'Your home':'Move in')+'</button></article>').join("")+'</div>';
    }else if(type==="inventory"){
      title="🎒 Inventory";subtitle="YOUR BELONGINGS";
      body=state.inventory.length?'<div class="phone-item-list">'+state.inventory.map(item=>'<div class="phone-item"><span>'+item.icon+'</span><b>'+item.name+'</b><small>In your bag</small></div>').join("")+'</div>':'<div class="phone-empty"><span>🎒</span><b>Your backpack is empty</b><small>Visit the marketplace to pick up a few essentials.</small></div>'+go("Browse marketplace","shop");
    }else if(type==="profile"){
      title="⚙️ Settings & profile";subtitle="YOUR ACCOUNT";
      body='<div class="phone-profile"><span>'+(state.avatar||"🙂")+'</span><b>'+(state.name||"New Resident")+'</b><small>'+(state.province||"Saskatchewan")+'</small></div>'+go("Edit character","profile-edit")+'<p class="phone-note">Settings and character options will live here.</p>';
    }else if(type==="settings"){
      title="⚙️ Settings";subtitle="YOUR PREFERENCES";
      body=go("Edit character profile","profile-edit") + '<div class="phone-feature"><span>🍁</span><b>Maple Life settings</b><small>Personalize your resident profile and game preferences.</small></div>';
    }else if(type==="map"){
      title="📍 City map";subtitle="EXPLORE MAPLEWOOD";
      body='<div class="phone-feature"><span>🏙️</span><b>Maplewood, Saskatchewan</b><small>Explore neighbourhoods, parks, shops and community places.</small></div>'+go("Open city view","city");
    }else if(type==="shop"){
      title="🛍️ Marketplace";subtitle="LOCAL FINDS";
      body='<div class="phone-balance">YOUR CASH <b>'+money(state.cash)+'</b></div>'+go("Browse all items","shop");
    }else if(type==="quests"){
      title="🏆 Quests";subtitle="YOUR NEXT STEPS";
      body='<div class="phone-quest"><span>'+(state.job?"✓":"1")+'</span><div><b>Find a job</b><small>'+(state.job?"You have a job!":"Start earning your own money")+'</small></div></div><div class="phone-quest"><span>'+(state.visited.includes("square")?"✓":"2")+'</span><div><b>Explore downtown</b><small>'+(state.visited.includes("square")?"City Square visited":"Visit City Square")+'</small></div></div><div class="phone-quest"><span>'+(state.home!=="starter"?"✓":"3")+'</span><div><b>Settle into your home</b><small>'+(state.home!=="starter"?"You found a new home":"Make your place feel like yours")+'</small></div></div>'+go("View your progress","home");
    }else{
      title=type==="phone"?"📱 My phone":"🏠 Home";subtitle="MAPLE LIFE APPS";
      body='<div class="phone-profile compact"><span>'+(state.avatar||"🙂")+'</span><div><b>'+(state.name||"New Resident")+'</b><small>Maplewood resident</small></div><strong>'+money(state.cash)+'</strong></div><div class="phone-app-grid">'+button("🎒<b>Inventory</b>","inventory")+button("📍<b>City map</b>","map")+button("🛍️<b>Marketplace</b>","shop")+button("🏆<b>Quests</b>","quests")+button("💼<b>Careers</b>","jobs")+button("🏡<b>My home</b>","home-life")+button("⚙️<b>Settings</b>","settings")+'</div>';
    }
    content.innerHTML='<div class="phone-shell"><div class="phone-speaker"></div><div class="phone-status"><span>🍁 MAPLE LIFE</span><span>● ● ●</span></div><div class="phone-heading"><div><small>'+subtitle+'</small><h2>'+title+'</h2></div><button class="phone-close" id="phoneClose" aria-label="Close phone">×</button></div><div class="phone-screen-content">'+body+'</div><div class="phone-nav"><span>⌂<small>HOME</small></span><span>▦<small>APPS</small></span><span>●<small>YOU</small></span></div></div>';
    panel.classList.add("open");
  }
    document.addEventListener("click",e=>{const settingsButton=e.target.closest("[data-sidebar-settings]");if(settingsButton){openProfileEditor();return;}const phoneScreen=e.target.closest("[data-phone-screen]");if(phoneScreen){openGamePanel(phoneScreen.dataset.phoneScreen);return;}const phoneGo=e.target.closest("[data-phone-go]");if(phoneGo){const target=phoneGo.dataset.phoneGo;$("#gamePanel").classList.remove("open");if(target==="profile-edit"){openProfileEditor();return;}navigate(target);return;}const t=e.target.closest("[data-game-panel]");if(t){openGamePanel(t.dataset.gamePanel);return;}const hot=e.target.closest("[data-hotbar]");if(hot){const a=hot.dataset.hotbar;if(a==="eat")activity("eat");else if(a==="coffee")activity("coffee");else if(a==="rest")activity("rest");else openGamePanel(a);return;}const a=e.target.closest("[data-panel-action]");if(a){const v=a.dataset.panelAction;$("#gamePanel").classList.remove("open");if(v==="profile-edit"){openProfileEditor();return;}navigate(v);}});
  $("#gamePanelClose")?.addEventListener("click",()=>$("#gamePanel").classList.remove("open"));
  document.addEventListener("click",e=>{if(e.target.closest("#phoneClose"))$("#gamePanel").classList.remove("open");});

  let authMode = "signup";
  function showCharacterCreation(mode){
    authMode=mode;
    $("#characterName").value=mode==="login"?(state.name||""):"";
    $("#characterProvince").value=state.province||"Saskatchewan";
    const chosen=$('input[name="characterAvatar"][value="'+(state.avatar||"🧑🏽")+'"]');
    if(chosen)chosen.checked=true;
    updateCharacterPreview();
    $("#authScreen").classList.add("auth-hidden");
    $("#characterScreen").classList.add("character-visible");
    document.body.classList.remove("auth-complete");
  }
  function updateCharacterPreview(){
    const name=$("#characterName").value.trim()||"New Resident";
    const avatar=$('input[name="characterAvatar"]:checked')?.value||"🧑🏽";
    const province=$("#characterProvince").value||"Saskatchewan";
    $("#characterAvatarPreview").textContent=avatar;
    $("#characterNamePreview").textContent=name;
    $("#characterProvincePreview").textContent=province+", Canada";
  }
  $("#authSignup").addEventListener("click",()=>showCharacterCreation("signup"));
  $("#authLogin").addEventListener("click",()=>showCharacterCreation("login"));
  $("#characterBack").addEventListener("click",()=>{
    $("#characterScreen").classList.remove("character-visible");
    $("#authScreen").classList.remove("auth-hidden");
  });
  $("#characterName").addEventListener("input",updateCharacterPreview);
  $("#characterProvince").addEventListener("change",updateCharacterPreview);
  document.querySelectorAll('input[name="characterAvatar"]').forEach(input=>input.addEventListener("change",updateCharacterPreview));
  $("#characterForm").addEventListener("submit",event=>{
    event.preventDefault();
    const name=$("#characterName").value.trim();
    if(!name){$("#characterName").focus();return;}
    state.name=name;
    state.avatar=$('input[name="characterAvatar"]:checked')?.value||"🧑🏽";
    state.province=$("#characterProvince").value||"Saskatchewan";
    saveState();
    // Switch screens before refreshing HUD data so the game is always revealed.
    $("#characterScreen").classList.remove("character-visible");
    $("#authScreen").classList.add("auth-hidden");
    document.body.classList.add("auth-complete");
    try { render(); } catch(error) { console.error("Maple Life HUD refresh failed:",error); }
    gameToast("Welcome to Maplewood, "+state.name+"! Your story starts now.");
  });
  document.querySelectorAll("[data-enter-game]").forEach(button => {
    button.addEventListener("click", () => {
      if (!state.name) state.name = "New Resident";
      saveState();
      render();
      document.body.classList.add("auth-complete");
      gameToast(button.dataset.enterGame === "signup" ? "Welcome to Maple Life! Let's get started." : "Welcome back! Enjoy your Maple Life.");
    });
  });

  document.addEventListener("maple:interact",e=>{
    const id=e.detail?.id;
    if(state.job&&state.job.siteId===id){beginWorkShift();return;}
    const buildingActions={midtown:"market",senator:"cafe",cityhall:"square",library:"library",bessborough:"cafe",remai:"square",tcu:"square",drinkle:"square",alt:"cafe",nutrien:"square"};
    if(buildingActions[id]){openPlace(buildingActions[id]);return;}
    if(["jobs","home-life","shop","wallet"].includes(id)){navigate(id);gameToast("Welcome!");}
    else if(["cafe","park","market","library","square"].includes(id)){openPlace(id);}
    else if(id==="police")gameToast("Maplewood Police Station");
  });
  document.addEventListener("maple:workstation-interact",e=>completeWorkStation(e.detail?.id));
  document.dispatchEvent(new CustomEvent("maple:work-shift-state",{detail:{active:!!state.workShift}}));
  $("#gamePanelContent")?.addEventListener("click",e=>{if(e.target.closest("[data-work-close]"))$("#gamePanel").classList.remove("open");});
  document.addEventListener("maple:game-toast",e=>gameToast(e.detail?.message||""));
  const oldRender=render;render=function(){oldRender();renderGameHud();};


  const lifeSidebar=$("#lifeSidebar"),lifeSidebarToggle=$("#lifeSidebarToggle");
  lifeSidebarToggle?.addEventListener("click",()=>{
    const collapsed=lifeSidebar.classList.toggle("collapsed");
    lifeSidebarToggle.setAttribute("aria-expanded",String(!collapsed));
    lifeSidebarToggle.setAttribute("aria-label",collapsed?"Expand menu":"Collapse menu");
  });
  render();
  $("#welcomeModal").classList.remove("open");
})();