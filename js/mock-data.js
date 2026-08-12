/* ============================================================
   SafeCook Pro — Mock Data & Telemetry Simulator
   Note: Simulated data is used for local preview & testing.
   Production integration connects via MQTT/Firebase broker.
   ============================================================ */

const MockData = (() => {
  const isSimulation = true; // Set to false when connecting physical ESP32 SVR hardware
  const integrationStatus = 'Simulation Mode (Local Preview Server Active)';

  // Simulate live sensor readings
  let _gasHistory = [];
  let _tempHistory = [];
  let _simInterval = null;
  let _tickCallbacks = [];
  let _dbSynced = false; // true after server db is loaded

  // Generate 60 points of gas PPM history
  function initHistory() {
    let base = 40;
    for (let i = 0; i < 60; i++) {
      base += (Math.random() - 0.5) * 5;
      base = Math.max(20, Math.min(120, base));
      _gasHistory.push(Math.round(base * 10) / 10);
    }
    let tempBase = 28;
    for (let i = 0; i < 60; i++) {
      tempBase += (Math.random() - 0.5) * 0.5;
      tempBase = Math.max(25, Math.min(35, tempBase));
      _tempHistory.push(Math.round(tempBase * 10) / 10);
    }
  }

  function tick() {
    const s = State.get('sensor');
    const appStatus = State.get('appStatus');
    let newSensor;

    if (appStatus === 'emergency') {
      // Emergency: gas level climbing
      const newGas = Math.min(s.gasLevel + (Math.random() * 8), 800);
      newSensor = { ...s, gasLevel: Math.round(newGas), leakDetected: true, valveOpen: false, updatedAt: Date.now() };
      State.set('sensor', newSensor);
      _gasHistory.push(Math.round(newGas));
    } else if (appStatus === 'warning') {
      // Warning: normal cooking but vessel removed
      const drift = (Math.random() - 0.5) * 6;
      const newGas = Math.max(20, Math.min(120, s.gasLevel + drift));
      newSensor = { ...s, gasLevel: Math.round(newGas * 10) / 10, vesselPresent: false, updatedAt: Date.now() };
      State.set('sensor', newSensor);
      _gasHistory.push(Math.round(newGas));
    } else {
      // Safe: gentle drift
      const drift = (Math.random() - 0.5) * 4;
      const newGas = Math.max(18, Math.min(95, s.gasLevel + drift));
      const newTemp = Math.max(25, Math.min(38, s.temperature + (Math.random() - 0.5) * 0.3));
      const newHum  = Math.max(40, Math.min(85, s.humidity  + (Math.random() - 0.5) * 1));
      const newBat  = Math.max(10, s.batteryPercent - (Math.random() < 0.01 ? 1 : 0));
      newSensor = {
        ...s,
        gasLevel: Math.round(newGas * 10) / 10,
        temperature: Math.round(newTemp * 10) / 10,
        humidity: Math.round(newHum),
        batteryPercent: newBat,
        updatedAt: Date.now(),
      };
      State.set('sensor', newSensor);
      _gasHistory.push(Math.round(newGas * 10) / 10);
      _tempHistory.push(Math.round(newTemp * 10) / 10);
    }

    // Keep history at 60 points locally
    if (_gasHistory.length > 60) _gasHistory.shift();
    if (_tempHistory.length > 60) _tempHistory.shift();

    // Persist sensor tick to server DB (fire-and-forget)
    if (_dbSynced) {
      fetch('/api/sensor-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSensor)
      })
      .then(r => r.json())
      .then(resp => {
        // Sync server-maintained history back (authoritative)
        if (resp.gasHistory && resp.gasHistory.length) {
          _gasHistory.length = 0;
          resp.gasHistory.forEach(v => _gasHistory.push(v));
        }
        if (resp.tempHistory && resp.tempHistory.length) {
          _tempHistory.length = 0;
          resp.tempHistory.forEach(v => _tempHistory.push(v));
        }
      })
      .catch(() => { /* offline — continue using local history */ });
    }

    _tickCallbacks.forEach(fn => fn());
  }

  function start() {
    // Only seed random history if server DB didn't provide data
    if (!_dbSynced || _gasHistory.length === 0) {
      initHistory();
    }
    _simInterval = setInterval(tick, 2000);
  }

  // ── Server DB Integration ─────────────────────────────────────────
  // Loads the full database from the server on startup.
  // If db doesn't exist yet, seeds it with the current mock data.
  async function loadFromServer() {
    try {
      const res = await fetch('/api/data');
      const db = await res.json();

      if (!db || db.initialized === false) {
        // First launch: seed database with testing data
        await _seedDatabase();
        return;
      }

      // Hydrate in-memory arrays from server-persisted data
      if (db.gasHistory && db.gasHistory.length) {
        _gasHistory.length = 0;
        db.gasHistory.forEach(v => _gasHistory.push(v));
      }
      if (db.tempHistory && db.tempHistory.length) {
        _tempHistory.length = 0;
        db.tempHistory.forEach(v => _tempHistory.push(v));
      }

      // Hydrate alerts list
      if (db.alerts && db.alerts.length) {
        mockAlerts.length = 0;
        db.alerts.forEach(a => mockAlerts.push(a));
      }

      // Hydrate family members
      if (db.familyMembers && db.familyMembers.length) {
        familyMembers.length = 0;
        db.familyMembers.forEach(m => familyMembers.push(m));
      }

      // Restore last sensor state from DB if available
      if (db.sensorState) {
        State.set('sensor', { ...State.get('sensor'), ...db.sensorState, updatedAt: Date.now() });
      }

      _dbSynced = true;
      console.log('[SafeCook DB] Loaded from server. Gas history:', _gasHistory.length, 'points.');
    } catch (err) {
      console.warn('[SafeCook DB] Server unavailable, using local mock data.', err.message);
    }
  }

  async function _seedDatabase() {
    // Generate initial history before seeding so the DB has real data from the start
    initHistory();

    const seed = {
      alerts: mockAlerts,
      familyMembers,
      testerIds,
      emergencyContacts,
      gasHistory: [..._gasHistory],
      tempHistory: [..._tempHistory],
      sensorState: State.get('sensor'),
      analyticsData,
      seededAt: Date.now(),
    };
    try {
      const res = await fetch('/api/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(seed)
      });
      const resp = await res.json();
      if (resp.status === 'success') {
        _dbSynced = true;
        console.log('[SafeCook DB] Database seeded with testing data.');
      }
    } catch (err) {
      console.warn('[SafeCook DB] Could not seed database.', err.message);
    }
  }

  function stop() {
    if (_simInterval) clearInterval(_simInterval);
  }

  function onTick(fn) { _tickCallbacks.push(fn); }

  function getGasHistory() { return [..._gasHistory]; }
  function getTempHistory() { return [..._tempHistory]; }

  // Mock alerts
  const mockAlerts = [
    {
      id: 'a1', type: 'GAS_LEAK', severity: 'critical',
      title: 'Gas Leak Detected',
      desc: 'Gas levels reached 450 PPM. Valve automatically closed.',
      action: 'Ensure ventilation and call LPG provider.',
      timestamp: Date.now() - 1000 * 60 * 45,
      acknowledged: false,
      icon: '🔴',
    },
    {
      id: 'a2', type: 'NO_VESSEL', severity: 'warning',
      title: 'Vessel Removed',
      desc: 'Cooking vessel was removed while burner was ON. Valve closed after 30 second countdown.',
      action: 'Place vessel back on stove to resume cooking.',
      timestamp: Date.now() - 1000 * 60 * 120,
      acknowledged: false,
      icon: '🟠',
    },
    {
      id: 'a3', type: 'NO_VESSEL', severity: 'warning',
      title: 'Vessel Removed',
      desc: 'Vessel removed briefly. Valve closed. User reset manually.',
      action: 'Valve reopened after vessel placed back.',
      timestamp: Date.now() - 1000 * 60 * 60 * 3,
      acknowledged: true,
      icon: '🟠',
    },
    {
      id: 'a4', type: 'OFFLINE', severity: 'info',
      title: 'Device Offline',
      desc: 'SafeCook Pro lost Wi-Fi connection for 2 minutes.',
      action: 'Check your Wi-Fi router.',
      timestamp: Date.now() - 1000 * 60 * 60 * 8,
      acknowledged: true,
      icon: '🔵',
    },
    {
      id: 'a5', type: 'POWER_FAIL', severity: 'warning',
      title: 'Power Failure',
      desc: 'Main power lost. Running on battery backup.',
      action: 'Restore power supply. Battery at 78%.',
      timestamp: Date.now() - 1000 * 60 * 60 * 24,
      acknowledged: true,
      icon: '⚫',
    },
  ];

  // Mock analytics
  const analyticsData = {
    safetyScore: 88,
    weeklyData: [72, 95, 88, 110, 65, 80, 92], // cooking minutes per day
    gasConsumption: [1.2, 1.8, 1.5, 2.1, 1.0, 1.6, 1.4], // arbitrary units
    monthlyReport: {
      totalCookTime: '38h 20m',
      leakIncidents: 1,
      avgSafetyScore: 87,
    },
    leakDates: [5, 12], // day of month had a leak
  };

  // Mock family members
  const familyMembers = [
    { id: 'u1', name: 'kazuha(sarvesh)(owner)', role: 'owner',  avatar: 'K', status: 'online' },
    { id: 'u2', name: 'iffy(director)(irfan)', role: 'owner',  avatar: 'I', status: 'online' },
    { id: 'u3', name: 'cursemecrazy(sri ram)(executive)', role: 'member', avatar: 'C', status: 'online' },
    { id: 'u4', name: 'professor(sathish)(executive)', role: 'member', avatar: 'P', status: 'online' },
    { id: 'u5', name: 'shammer(executive)', role: 'guest', avatar: 'S', status: 'offline' },
  ];

  // 5 Pre-configured Tester Accounts
  const testerIds = [
    {
      inviteCode: 'TEST-OWNER-001',
      email: 'kazuha@safecook.pro',
      name: 'kazuha(sarvesh)(owner)',
      role: 'owner',
      theme: 'dark',
      fontsize: 'normal',
      contrast: 'normal',
      voiceEnabled: true,
      sensor: { gasLevel: 45, valveOpen: true, vesselPresent: true, leakDetected: false, temperature: 28.3, humidity: 61, batteryPercent: 92, wifiRSSI: -55, sensorHealth: 'good', deviceTemp: 31.5 }
    },
    {
      inviteCode: 'TEST-MEMBER-002',
      email: 'iffy@safecook.pro',
      name: 'iffy(director)(irfan)',
      role: 'owner',
      theme: 'dark',
      fontsize: 'normal',
      contrast: 'normal',
      voiceEnabled: true,
      sensor: { gasLevel: 38, valveOpen: true, vesselPresent: true, leakDetected: false, temperature: 27.1, humidity: 58, batteryPercent: 80, wifiRSSI: -65, sensorHealth: 'good', deviceTemp: 30.2 }
    },
    {
      inviteCode: 'TEST-GUEST-003',
      email: 'curse@safecook.pro',
      name: 'cursemecrazy(sri ram)(executive)',
      role: 'member',
      theme: 'dark',
      fontsize: 'normal',
      contrast: 'normal',
      voiceEnabled: false,
      sensor: { gasLevel: 50, valveOpen: true, vesselPresent: true, leakDetected: false, temperature: 29.0, humidity: 63, batteryPercent: 85, wifiRSSI: -70, sensorHealth: 'good', deviceTemp: 32.0 }
    },
    {
      inviteCode: 'TEST-ELDER-004',
      email: 'professor@safecook.pro',
      name: 'professor(sathish)(executive)',
      role: 'member',
      theme: 'light',
      fontsize: 'xlarge',
      contrast: 'high',
      voiceEnabled: true,
      sensor: { gasLevel: 40, valveOpen: true, vesselPresent: true, leakDetected: false, temperature: 27.8, humidity: 59, batteryPercent: 95, wifiRSSI: -45, sensorHealth: 'good', deviceTemp: 30.8 }
    },
    {
      inviteCode: 'TEST-LEAKY-005',
      email: 'shammer@safecook.pro',
      name: 'shammer(executive)',
      role: 'guest',
      theme: 'dark',
      fontsize: 'normal',
      contrast: 'normal',
      voiceEnabled: true,
      sensor: { gasLevel: 320, valveOpen: false, vesselPresent: true, leakDetected: true, temperature: 34.5, humidity: 72, batteryPercent: 75, wifiRSSI: -60, sensorHealth: 'degraded', deviceTemp: 38.2 }
    }
  ];

  // Mock emergency contacts
  const emergencyContacts = [
    { id: 'c1', name: 'Meena Kumar',    phone: '+91 98765 43210', relation: 'Wife',    notify: true },
    { id: 'c2', name: 'Arjun Kumar',    phone: '+91 87654 32109', relation: 'Son',     notify: true },
    { id: 'c3', name: 'Gas Emergency',  phone: '1906',            relation: 'LPG Help', notify: false },
  ];

  function timeAgo(ts) {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60)   return I18n.t('common.now');
    if (diff < 3600) return `${Math.floor(diff/60)} ${I18n.t('common.minutes')} ${I18n.t('common.ago')}`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ${I18n.t('common.ago')}`;
    return `${Math.floor(diff/86400)}d ${I18n.t('common.ago')}`;
  }


  // Mock Recipes — Veg & Non-Veg
  const recipes = [
    // ── VEGETARIAN ──────────────────────────────────────────────────────
    {
      id: 1, type: 'veg', category: 'breakfast',
      name: 'Masala Dosa', emoji: '🫓',
      tagline: 'Crispy golden crepe with spiced potato filling',
      time: '30 min', servings: '2–3', difficulty: 'Medium', flameLevel: 'Medium',
      safetyTip: 'Use medium flame when spreading batter. High flame causes uneven cooking and carbon buildup on the burner.',
      ingredients: [
        { name: 'Dosa batter', qty: '2 cups' },
        { name: 'Boiled potatoes', qty: '3 large' },
        { name: 'Mustard seeds', qty: '1 tsp' },
        { name: 'Green chillies', qty: '2' },
        { name: 'Curry leaves', qty: '8–10' },
        { name: 'Turmeric', qty: '½ tsp' },
        { name: 'Oil', qty: '2 tbsp' },
        { name: 'Salt', qty: 'to taste' }
      ],
      steps: [
        'Heat a non-stick tawa on medium flame. Grease lightly with oil.',
        'Pour a ladle of batter in the center and spread in a thin circle outward.',
        'Drizzle oil around edges. Cook until golden and crisp.',
        'In a pan, heat oil. Add mustard seeds and let them splutter.',
        'Add curry leaves, green chillies, and turmeric. Sauté 30 seconds.',
        'Add mashed potatoes and salt. Mix well for 2 minutes.',
        'Place potato masala on one half of dosa. Fold and serve with chutney.'
      ],
      nutrition: { Calories: '320 kcal', Protein: '8g', Carbs: '55g', Fat: '9g' },
      chefTip: 'Resting the batter overnight gives a tangy, fermented flavour that makes perfect crispy dosas.'
    },
    {
      id: 2, type: 'veg', category: 'lunch',
      name: 'Dal Tadka', emoji: '🍲',
      tagline: 'Comforting yellow lentils with smoky tempering',
      time: '25 min', servings: '4', difficulty: 'Easy', flameLevel: 'Low-Medium',
      safetyTip: 'When adding ghee tadka to hot dal, stand back — it splatters. Ensure your SafeCook sensor is in range to detect any gas fluctuation.',
      ingredients: [
        { name: 'Yellow toor dal', qty: '1 cup' },
        { name: 'Tomatoes', qty: '2, chopped' },
        { name: 'Onion', qty: '1, chopped' },
        { name: 'Ghee', qty: '2 tbsp' },
        { name: 'Cumin seeds', qty: '1 tsp' },
        { name: 'Garlic', qty: '4 cloves' },
        { name: 'Red chilli powder', qty: '1 tsp' },
        { name: 'Salt & turmeric', qty: 'to taste' }
      ],
      steps: [
        'Pressure cook dal with turmeric and salt for 3 whistles.',
        'In a pan, heat ghee. Add cumin seeds and let them crackle.',
        'Add minced garlic and sliced onion. Sauté until golden.',
        'Add tomatoes and cook until soft and oil separates.',
        'Pour the cooked dal into the pan. Mix and simmer 5 minutes.',
        'Finish with a pinch of garam masala. Serve hot with rice or roti.'
      ],
      nutrition: { Calories: '280 kcal', Protein: '14g', Carbs: '42g', Fat: '7g' },
      chefTip: 'Char a dried red chilli directly on flame for 10 seconds, then add to tadka for a smoky restaurant-style flavour.'
    },
    {
      id: 3, type: 'veg', category: 'dinner',
      name: 'Palak Paneer', emoji: '🌿',
      tagline: 'Silky spinach curry with soft cottage cheese',
      time: '35 min', servings: '3–4', difficulty: 'Medium', flameLevel: 'Medium',
      safetyTip: 'Blanching spinach requires boiling water — always keep handles turned inward to avoid accidental spills near the gas burner.',
      ingredients: [
        { name: 'Spinach (palak)', qty: '3 cups' },
        { name: 'Paneer', qty: '200g, cubed' },
        { name: 'Onion', qty: '1 large' },
        { name: 'Tomato', qty: '2 medium' },
        { name: 'Ginger-garlic paste', qty: '1 tbsp' },
        { name: 'Cream', qty: '2 tbsp' },
        { name: 'Spices', qty: 'cumin, coriander, garam masala' },
        { name: 'Oil/Butter', qty: '2 tbsp' }
      ],
      steps: [
        'Blanch spinach in boiling water for 2 minutes. Drain and blend smooth.',
        'Shallow fry paneer cubes until golden. Set aside.',
        'Heat butter in a pan. Sauté onions until caramelised.',
        'Add ginger-garlic paste and spices. Cook 2 minutes.',
        'Add blended spinach and simmer on low flame 10 minutes.',
        'Add paneer and cream. Stir gently and cook 5 minutes.',
        'Serve with naan or jeera rice.'
      ],
      nutrition: { Calories: '370 kcal', Protein: '18g', Carbs: '15g', Fat: '28g' },
      chefTip: 'Add a pinch of kasuri methi (dried fenugreek) at the end for an authentic dhaba taste.'
    },
    {
      id: 4, type: 'veg', category: 'snack',
      name: 'Aloo Tikki', emoji: '🥔',
      tagline: 'Crispy spiced potato patties',
      time: '20 min', servings: '4', difficulty: 'Easy', flameLevel: 'Medium',
      safetyTip: 'Shallow frying needs 1–2 cm of oil. Never leave the pan unattended — SafeCook will alert you if the vessel is removed.',
      ingredients: [
        { name: 'Boiled potatoes', qty: '4 medium' },
        { name: 'Bread crumbs', qty: '3 tbsp' },
        { name: 'Green chilli', qty: '1, minced' },
        { name: 'Coriander leaves', qty: '2 tbsp' },
        { name: 'Chaat masala', qty: '1 tsp' },
        { name: 'Oil', qty: 'for shallow frying' },
        { name: 'Salt', qty: 'to taste' }
      ],
      steps: [
        'Mash boiled potatoes in a bowl.',
        'Add bread crumbs, green chilli, coriander, chaat masala, and salt. Mix.',
        'Shape into round flat patties.',
        'Heat a flat pan on medium flame. Add 2 tbsp oil.',
        'Place tikkis and cook 3–4 minutes per side until golden.',
        'Serve with mint chutney and tamarind sauce.'
      ],
      nutrition: { Calories: '180 kcal', Protein: '3g', Carbs: '30g', Fat: '6g' },
      chefTip: 'Refrigerate shaped tikkis for 15 minutes before frying — they hold shape better and get crispier.'
    },
    {
      id: 5, type: 'veg', category: 'dessert',
      name: 'Kheer', emoji: '🍮',
      tagline: 'Creamy rice pudding with cardamom and saffron',
      time: '40 min', servings: '4–5', difficulty: 'Easy', flameLevel: 'Low',
      safetyTip: 'Kheer requires constant stirring on low flame. Do not increase flame — milk burns easily and can overflow causing a gas hazard.',
      ingredients: [
        { name: 'Basmati rice', qty: '¼ cup' },
        { name: 'Full-fat milk', qty: '1 litre' },
        { name: 'Sugar', qty: '4–5 tbsp' },
        { name: 'Cardamom', qty: '3 pods, crushed' },
        { name: 'Saffron strands', qty: 'a pinch' },
        { name: 'Cashews & raisins', qty: '2 tbsp each' },
        { name: 'Rose water', qty: '1 tsp (optional)' }
      ],
      steps: [
        'Wash and soak rice for 20 minutes. Drain.',
        'Bring milk to a boil in a heavy pan on medium-low flame.',
        'Add rice. Reduce to low flame and stir every 3–4 minutes.',
        'Cook for 25 minutes until rice is soft and milk thickens.',
        'Add sugar, cardamom, and saffron dissolved in warm milk.',
        'Stir well and cook another 5 minutes.',
        'Garnish with cashews and raisins. Serve warm or chilled.'
      ],
      nutrition: { Calories: '240 kcal', Protein: '7g', Carbs: '35g', Fat: '8g' },
      chefTip: 'Soak saffron in 2 tbsp warm milk for 10 minutes before adding — it releases more colour and aroma.'
    },
    {
      id: 6, type: 'veg', category: 'lunch',
      name: 'Chole Bhature', emoji: '🫘',
      tagline: 'Bold chickpea curry with fluffy fried bread',
      time: '50 min', servings: '3–4', difficulty: 'Hard', flameLevel: 'High',
      safetyTip: 'Deep frying bhature needs high heat. Keep a fire extinguisher nearby and never leave hot oil unattended. SafeCook monitors gas flow continuously.',
      ingredients: [
        { name: 'Chickpeas', qty: '1 cup, soaked overnight' },
        { name: 'Onions', qty: '2, finely chopped' },
        { name: 'Tomatoes', qty: '3' },
        { name: 'Chole masala', qty: '2 tbsp' },
        { name: 'Oil', qty: 'for deep frying' },
        { name: 'Maida (for bhature)', qty: '2 cups' },
        { name: 'Yoghurt', qty: '¼ cup' },
        { name: 'Spices', qty: 'bay leaf, cinnamon, cloves' }
      ],
      steps: [
        'Pressure cook chickpeas with tea bag for colour, 6 whistles.',
        'In a pan, make masala with oil, onions, tomatoes and spices.',
        'Add chole masala and cooked chickpeas. Simmer 15 minutes.',
        'Knead maida with yoghurt, salt and warm water into soft dough.',
        'Rest dough 30 minutes. Roll into oval shapes.',
        'Deep fry bhaturas in hot oil until puffed and golden.',
        'Serve hot chole with bhatura, onion, and pickle.'
      ],
      nutrition: { Calories: '550 kcal', Protein: '16g', Carbs: '75g', Fat: '22g' },
      chefTip: 'Adding a black tea bag while pressure cooking gives chickpeas that authentic dark colour without artificial colour.'
    },
    {
      id: 7, type: 'veg', category: 'dinner',
      name: 'Vegetable Biryani', emoji: '🍚',
      tagline: 'Fragrant layered rice with seasonal vegetables',
      time: '60 min', servings: '4', difficulty: 'Hard', flameLevel: 'Low-Medium',
      safetyTip: 'Dum cooking seals steam inside the pot. Never open the lid on a hot flame — reduce heat to minimum and wait before opening.',
      ingredients: [
        { name: 'Basmati rice', qty: '2 cups' },
        { name: 'Mixed vegetables', qty: '2 cups (carrot, peas, potato)' },
        { name: 'Fried onions (birista)', qty: '½ cup' },
        { name: 'Biryani masala', qty: '2 tbsp' },
        { name: 'Saffron milk', qty: '3 tbsp' },
        { name: 'Ghee', qty: '3 tbsp' },
        { name: 'Mint & coriander', qty: 'a handful each' }
      ],
      steps: [
        'Par-cook basmati rice (70%) with whole spices. Drain.',
        'Sauté vegetables with biryani masala and yoghurt-based gravy.',
        'Layer: gravy → rice → fried onions → mint → saffron milk → ghee.',
        'Seal pot with dough or foil. Cook on dum (low flame) 20 minutes.',
        'Remove seal carefully. Fluff gently and serve with raita.'
      ],
      nutrition: { Calories: '460 kcal', Protein: '10g', Carbs: '72g', Fat: '14g' },
      chefTip: 'Place a flat tawa under the biryani pot to diffuse heat for perfect dum without burning the bottom.'
    },
    {
      id: 8, type: 'veg', category: 'breakfast',
      name: 'Poha', emoji: '🌾',
      tagline: 'Light flattened rice with mustard, peas and lemon',
      time: '15 min', servings: '2', difficulty: 'Easy', flameLevel: 'Low-Medium',
      safetyTip: 'Poha cooks very quickly on low-medium flame. Keep gas on minimal setting to avoid burning. Always stay near the stove.',
      ingredients: [
        { name: 'Thick poha (flattened rice)', qty: '1.5 cups' },
        { name: 'Onion', qty: '1, chopped' },
        { name: 'Green peas', qty: '¼ cup' },
        { name: 'Mustard seeds', qty: '1 tsp' },
        { name: 'Turmeric', qty: '¼ tsp' },
        { name: 'Lemon juice', qty: '1 tbsp' },
        { name: 'Oil & salt', qty: 'to taste' }
      ],
      steps: [
        'Rinse poha in water until just softened. Drain and set aside.',
        'Heat oil in pan. Add mustard seeds and let them pop.',
        'Add curry leaves, green chillies, and onion. Sauté 2 minutes.',
        'Add turmeric and peas. Cook 2 minutes.',
        'Add softened poha and salt. Mix gently. Cook 2 more minutes.',
        'Squeeze lemon juice. Garnish with coriander. Serve hot.'
      ],
      nutrition: { Calories: '200 kcal', Protein: '4g', Carbs: '38g', Fat: '4g' },
      chefTip: 'Soak poha only briefly — over-soaking makes it mushy. It should just be moist, not wet.'
    },
    {
      id: 9, type: 'veg', category: 'snack',
      name: 'Samosa', emoji: '🔺',
      tagline: 'Crispy pastry pockets stuffed with spiced potatoes',
      time: '45 min', servings: '4–6', difficulty: 'Medium', flameLevel: 'High',
      safetyTip: 'Deep frying samosas needs consistent high heat. Monitor oil temperature and keep water away from hot oil to avoid dangerous splattering.',
      ingredients: [
        { name: 'Maida', qty: '2 cups' },
        { name: 'Boiled potatoes', qty: '3 large' },
        { name: 'Green peas', qty: '½ cup' },
        { name: 'Cumin & coriander', qty: '1 tsp each' },
        { name: 'Garam masala', qty: '½ tsp' },
        { name: 'Oil', qty: 'for deep frying + 2 tbsp for dough' },
        { name: 'Amchur (dry mango)', qty: '½ tsp' }
      ],
      steps: [
        'Make stiff dough with maida, salt, oil, and water. Rest 30 minutes.',
        'Mix mashed potatoes, peas, and all spices for filling.',
        'Divide dough. Roll into ovals. Cut into semicircles.',
        'Shape each half into a cone. Fill with potato mix. Seal edges.',
        'Heat oil on medium-high. Fry samosas on medium flame until golden.',
        'Drain on paper. Serve with chutney.'
      ],
      nutrition: { Calories: '220 kcal', Protein: '5g', Carbs: '32g', Fat: '9g' },
      chefTip: 'Frying on medium (not high) flame gives slow, even browning and a properly crispy shell.'
    },
    {
      id: 10, type: 'veg', category: 'dinner',
      name: 'Pav Bhaji', emoji: '🍞',
      tagline: 'Spiced mashed vegetable curry with buttered buns',
      time: '30 min', servings: '4', difficulty: 'Easy', flameLevel: 'Medium',
      safetyTip: 'Mashing vegetables on high heat causes hot splatter. Lower the flame before mashing vigorously and keep a splatter guard handy.',
      ingredients: [
        { name: 'Mixed vegetables', qty: '3 cups (potato, cauliflower, carrot)' },
        { name: 'Butter', qty: '4 tbsp' },
        { name: 'Onion + tomato', qty: '1 each, chopped' },
        { name: 'Pav bhaji masala', qty: '2 tbsp' },
        { name: 'Pav (soft dinner rolls)', qty: '8' },
        { name: 'Lemon & coriander', qty: 'to garnish' }
      ],
      steps: [
        'Pressure cook all vegetables until very soft. Mash well.',
        'Heat butter in a pan. Sauté onions until golden.',
        'Add tomatoes and cook until soft. Add pav bhaji masala.',
        'Add mashed vegetables. Mix and mash further in the pan.',
        'Simmer on low flame 10 minutes, stirring often.',
        'Toast pav with butter on a flat tawa.',
        'Serve bhaji topped with butter, lemon, and coriander with pav.'
      ],
      nutrition: { Calories: '380 kcal', Protein: '9g', Carbs: '58g', Fat: '14g' },
      chefTip: 'The secret is lots of butter and extended mashing — the bhaji should have no chunks for best texture.'
    },

    // ── NON-VEGETARIAN ───────────────────────────────────────────────────
    {
      id: 11, type: 'nonveg', category: 'dinner',
      name: 'Butter Chicken', emoji: '🍗',
      tagline: 'Velvety tomato-butter sauce with tender chicken',
      time: '45 min', servings: '4', difficulty: 'Medium', flameLevel: 'Medium',
      safetyTip: 'Ensure chicken is cooked to an internal temperature of 75°C. Cook on consistent medium flame — high heat makes the sauce separate.',
      ingredients: [
        { name: 'Chicken', qty: '500g, cubed' },
        { name: 'Tomatoes', qty: '4, blanched and pureed' },
        { name: 'Butter', qty: '4 tbsp' },
        { name: 'Cream', qty: '½ cup' },
        { name: 'Cashew paste', qty: '2 tbsp' },
        { name: 'Ginger-garlic paste', qty: '2 tbsp' },
        { name: 'Spices', qty: 'tandoori masala, garam masala, chilli' },
        { name: 'Salt', qty: 'to taste' }
      ],
      steps: [
        'Marinate chicken in yoghurt, spices, and ginger-garlic paste for 2 hours.',
        'Grill or pan-cook marinated chicken until charred. Set aside.',
        'In a pan, heat butter. Add tomato puree. Cook 10 minutes on medium.',
        'Add cashew paste, cream, and spices. Simmer 8 minutes.',
        'Add cooked chicken to the sauce. Mix and simmer 10 more minutes.',
        'Finish with a knob of butter and more cream. Serve with naan.'
      ],
      nutrition: { Calories: '430 kcal', Protein: '32g', Carbs: '12g', Fat: '28g' },
      chefTip: 'Charring the chicken slightly before adding to sauce gives it that authentic smoky tandoor flavour.'
    },
    {
      id: 12, type: 'nonveg', category: 'lunch',
      name: 'Chicken Biryani', emoji: '🍛',
      tagline: 'Aromatic rice layered with marinated chicken',
      time: '70 min', servings: '4–5', difficulty: 'Hard', flameLevel: 'Low-Medium',
      safetyTip: 'Never cook on full flame while doing dum. Keep the flame on its lowest setting. The sealed steam does the cooking — patience is key.',
      ingredients: [
        { name: 'Chicken', qty: '600g, pieces' },
        { name: 'Basmati rice', qty: '2.5 cups' },
        { name: 'Yoghurt', qty: '½ cup' },
        { name: 'Fried onions', qty: '¾ cup' },
        { name: 'Biryani masala', qty: '3 tbsp' },
        { name: 'Saffron milk', qty: '4 tbsp' },
        { name: 'Ghee & mint', qty: 'generous amounts' }
      ],
      steps: [
        'Marinate chicken in yoghurt and biryani masala for 2 hours.',
        'Cook marinated chicken in a pan with oil until half done.',
        'Par-boil basmati rice with whole spices to 70% doneness.',
        'Layer chicken, rice, fried onions, mint, and saffron milk alternately.',
        'Seal pot tightly. Cook on low dum flame for 25 minutes.',
        'Open gently, mix bottom-up lightly. Serve with raita and mirchi ka salan.'
      ],
      nutrition: { Calories: '580 kcal', Protein: '35g', Carbs: '65g', Fat: '18g' },
      chefTip: 'Use a flat iron tawa under the biryani vessel to prevent the bottom from burning on dum.'
    },
    {
      id: 13, type: 'nonveg', category: 'breakfast',
      name: 'Egg Bhurji', emoji: '🥚',
      tagline: 'Spicy scrambled eggs with onion and tomatoes',
      time: '12 min', servings: '2', difficulty: 'Easy', flameLevel: 'Medium',
      safetyTip: 'Eggs cook quickly on high heat and can dry out. Use medium flame and stir constantly. Never leave the pan unattended.',
      ingredients: [
        { name: 'Eggs', qty: '4' },
        { name: 'Onion', qty: '1, finely chopped' },
        { name: 'Tomato', qty: '1, chopped' },
        { name: 'Green chilli', qty: '1' },
        { name: 'Turmeric & chilli powder', qty: '¼ tsp each' },
        { name: 'Oil', qty: '2 tbsp' },
        { name: 'Salt & coriander', qty: 'to taste' }
      ],
      steps: [
        'Heat oil in pan. Add green chilli and onion. Sauté until pink.',
        'Add tomato and cook 2 minutes until soft.',
        'Add turmeric, chilli powder, and salt.',
        'Beat eggs and pour into pan.',
        'Scramble continuously on medium flame until just set.',
        'Garnish with coriander. Serve with pav or roti.'
      ],
      nutrition: { Calories: '220 kcal', Protein: '14g', Carbs: '6g', Fat: '16g' },
      chefTip: 'Remove from heat just before fully set — residual heat finishes cooking and keeps eggs soft.'
    },
    {
      id: 14, type: 'nonveg', category: 'snack',
      name: 'Chicken 65', emoji: '🌶️',
      tagline: 'Crispy spiced deep-fried chicken bites',
      time: '30 min', servings: '3–4', difficulty: 'Medium', flameLevel: 'High',
      safetyTip: 'Deep frying requires high flame and hot oil. Never exceed 180°C. Keep a fire blanket nearby and ensure your SafeCook valve is operational.',
      ingredients: [
        { name: 'Chicken', qty: '400g, boneless cubes' },
        { name: 'Yoghurt', qty: '3 tbsp' },
        { name: 'Cornflour', qty: '2 tbsp' },
        { name: 'Red chilli powder', qty: '1.5 tsp' },
        { name: 'Ginger-garlic paste', qty: '1 tbsp' },
        { name: 'Curry leaves', qty: '10–12' },
        { name: 'Oil', qty: 'for deep frying' },
        { name: 'Food colour (red)', qty: 'a pinch (optional)' }
      ],
      steps: [
        'Marinate chicken in yoghurt, cornflour, chilli powder, ginger-garlic paste, and salt. Rest 30 minutes.',
        'Heat oil in deep pan to 170–180°C.',
        'Fry chicken in batches on high heat until golden and cooked through (8–10 min).',
        'In another pan, heat 1 tbsp oil. Fry curry leaves until crisp.',
        'Toss fried chicken in the curry leaf oil. Serve immediately.'
      ],
      nutrition: { Calories: '310 kcal', Protein: '28g', Carbs: '8g', Fat: '19g' },
      chefTip: 'Double frying — once to cook through, once to crisp — gives the best restaurant-style crunch.'
    },
    {
      id: 15, type: 'nonveg', category: 'dinner',
      name: 'Fish Curry', emoji: '🐟',
      tagline: 'Tangy coconut fish curry from coastal India',
      time: '30 min', servings: '3', difficulty: 'Medium', flameLevel: 'Medium',
      safetyTip: 'Fish releases moisture quickly when hot. Reduce flame when adding fish to prevent excessive boiling that breaks the pieces.',
      ingredients: [
        { name: 'Fish (pomfret or kingfish)', qty: '400g, pieces' },
        { name: 'Coconut milk', qty: '1 cup' },
        { name: 'Tamarind extract', qty: '2 tbsp' },
        { name: 'Onion & tomato', qty: '1 each' },
        { name: 'Green chillies', qty: '2' },
        { name: 'Mustard seeds', qty: '1 tsp' },
        { name: 'Fish masala', qty: '2 tbsp' },
        { name: 'Kokum or raw mango', qty: '2–3 pieces' }
      ],
      steps: [
        'Marinate fish with salt, turmeric, and chilli powder. Set aside.',
        'Heat oil. Add mustard seeds, curry leaves, and sliced onions. Sauté.',
        'Add tomatoes, green chillies, and fish masala. Cook until oil separates.',
        'Pour in coconut milk and tamarind extract. Add kokum.',
        'Bring to a gentle simmer. Do not boil hard.',
        'Slide in fish pieces carefully. Simmer 8–10 minutes until cooked.',
        'Serve with steamed rice.'
      ],
      nutrition: { Calories: '340 kcal', Protein: '30g', Carbs: '10g', Fat: '20g' },
      chefTip: 'Never stir fish curry after adding fish — gently swirl the pan to prevent pieces from breaking.'
    },
    {
      id: 16, type: 'nonveg', category: 'lunch',
      name: 'Keema Pav', emoji: '🥩',
      tagline: 'Spiced minced meat with buttered bread rolls',
      time: '35 min', servings: '4', difficulty: 'Easy', flameLevel: 'Medium',
      safetyTip: 'Ensure minced meat is cooked thoroughly (no pink colour). Cook on consistent medium flame and stir often to ensure even cooking.',
      ingredients: [
        { name: 'Minced chicken or mutton', qty: '500g' },
        { name: 'Onions', qty: '2, finely chopped' },
        { name: 'Tomatoes', qty: '2, chopped' },
        { name: 'Green peas', qty: '½ cup' },
        { name: 'Ginger-garlic paste', qty: '1.5 tbsp' },
        { name: 'Keema masala', qty: '2 tbsp' },
        { name: 'Butter & pav', qty: 'to serve' }
      ],
      steps: [
        'Heat oil. Brown onions until golden. Add ginger-garlic paste.',
        'Add minced meat. Cook on high, breaking lumps, for 5 minutes.',
        'Add tomatoes and keema masala. Mix well.',
        'Reduce to medium and cook 15 minutes until oil separates.',
        'Add green peas and simmer 5 more minutes.',
        'Toast pav in butter. Serve with keema, chopped onion, and lime.'
      ],
      nutrition: { Calories: '410 kcal', Protein: '30g', Carbs: '30g', Fat: '18g' },
      chefTip: 'Cooking on slightly higher heat initially helps caramelise the meat and deepen the flavour.'
    },
    {
      id: 17, type: 'nonveg', category: 'dinner',
      name: 'Mutton Rogan Josh', emoji: '🍖',
      tagline: 'Slow-cooked Kashmiri mutton in aromatic red gravy',
      time: '90 min', servings: '4', difficulty: 'Hard', flameLevel: 'Low-Medium',
      safetyTip: 'Slow cooking for 90+ minutes — ensure the gas cylinder level is adequate before starting. SafeCook monitors gas consumption in real time.',
      ingredients: [
        { name: 'Mutton (bone-in)', qty: '700g' },
        { name: 'Mustard oil', qty: '4 tbsp' },
        { name: 'Kashmiri red chilli paste', qty: '2 tbsp' },
        { name: 'Whole spices', qty: 'bay leaf, cinnamon, cardamom, cloves' },
        { name: 'Yoghurt', qty: '½ cup' },
        { name: 'Fennel powder', qty: '2 tsp' },
        { name: 'Ginger powder', qty: '1 tsp' }
      ],
      steps: [
        'Heat mustard oil to smoking point, then reduce flame. Add whole spices.',
        'Add mutton pieces. Brown well on medium heat — about 10 minutes.',
        'Add Kashmiri chilli paste, fennel, and ginger powder. Coat mutton well.',
        'Add whisked yoghurt gradually, stirring constantly.',
        'Add 1 cup water. Cover and simmer on low flame 60–70 minutes.',
        'Cook until mutton is tender and oil floats on top.',
        'Serve with steamed rice or naan.'
      ],
      nutrition: { Calories: '480 kcal', Protein: '38g', Carbs: '6g', Fat: '34g' },
      chefTip: 'Authentic Rogan Josh uses no onions or garlic — the deep colour comes purely from Kashmiri chillies.'
    },
    {
      id: 18, type: 'nonveg', category: 'snack',
      name: 'Prawn Fritters', emoji: '🦐',
      tagline: 'Crispy batter-fried prawns with coastal spices',
      time: '20 min', servings: '2–3', difficulty: 'Easy', flameLevel: 'High',
      safetyTip: 'Prawns contain water — patting them dry before frying prevents dangerous oil splatters. Keep a splatter screen over the pan.',
      ingredients: [
        { name: 'Prawns', qty: '300g, peeled and deveined' },
        { name: 'Gram flour (besan)', qty: '4 tbsp' },
        { name: 'Rice flour', qty: '2 tbsp' },
        { name: 'Red chilli powder', qty: '1 tsp' },
        { name: 'Turmeric', qty: '¼ tsp' },
        { name: 'Lemon juice', qty: '1 tsp' },
        { name: 'Oil', qty: 'for deep frying' }
      ],
      steps: [
        'Pat prawns completely dry with kitchen towel.',
        'Marinate with chilli, turmeric, lemon, and salt for 10 minutes.',
        'Mix besan and rice flour with water into a thick batter.',
        'Dip prawns in batter.',
        'Deep fry in hot oil (175°C) until golden, 2–3 minutes per batch.',
        'Drain on paper. Serve with lemon wedges and chutney.'
      ],
      nutrition: { Calories: '270 kcal', Protein: '22g', Carbs: '14g', Fat: '14g' },
      chefTip: 'Rice flour in the batter is the secret to an extra-crispy coating that stays crunchy even after a few minutes.'
    }
  ];

  return {
    start, stop, onTick,
    getGasHistory, getTempHistory,
    mockAlerts, analyticsData, familyMembers, testerIds, emergencyContacts,
    timeAgo, recipes,
    loadFromServer,
  };
})();

window.MockData = MockData;

