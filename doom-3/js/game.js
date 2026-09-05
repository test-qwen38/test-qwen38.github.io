/* DOOM 3 — браузерный FPS на three.js (vanilla JS, без сборки) */
(function () {
  "use strict";

  /* ===================== КОНСТАНТЫ ===================== */
  var PLAYER_R = 0.35;
  var PLAYER_EYE = 1.65;
  var WALK = 4.6;
  var RUN = 7.4;
  var JUMP_V = 5.2;
  var GRAV = 14;
  var MOUSE_SENS = 0.0022;
  var VIEW_RANGE = 120;

  var WEAPONS = {
    pistol: {
      name: "ПИСТОЛЕТ", hits: 1, dmg: 5, rate: 300,
      mag: 8, reserve: 16, reload: 1100, spread: 0.008, pellets: 1
    },
    shotgun: {
      name: "ДРОБОВИК", hits: 1, dmg: 11, rate: 900,
      mag: 5, reserve: 10, reload: 1700, spread: 0.02, pellets: 7
    }
  };

  var WALLS_FULL = [
    // периметр (правая стенка разбита: проём для двери выхода у z=0)
    [0, -16, 40, 1],
    [0, 16, 40, 1],
    [-20, 0, 1, 32],
    [20, -8.35, 1, 15.3],
    [20, 8.35, 1, 15.3],
    // внутренняя перепланировка
    [2, -8, 1, 16],
    [-16, -11, 28, 1],
    [-10, -3, 12, 1]
  ];
  var WALL_H = 3;
  var WALL_COLORS = [0x4a443c, 0x453f38, 0x514a3f];

  var CEILINGS = [
    [-10, -13.5, 20, 5],
    [2.5, -4, 35, 14],
    [-10, 1, 20, 14],
    [10, 13.5, 20, 5]
  ];

  /* Подбираемое: key, med, pistolAmmo, shotgunAmmo */
  var PICKUPS = [
    { type: "med", x: -6, z: 10 },
    { type: "pistolAmmo", x: -14, z: 6 },
    { type: "shotgunAmmo", x: -12, z: 1 },
    { type: "med", x: 14, z: 12 },
    { type: "pistolAmmo", x: 12, z: -12 },
    { type: "shotgunAmmo", x: 14, z: -14 },
    { type: "key", x: 16, z: -14.2 }
  ];

  var ENEMIES = [
    { x: -16, z: -14 },
    { x: 8, z: 3 },
    { x: -14, z: 4 },
    { x: 6, z: -12 },
    { x: 12, z: -6 },
    { x: 16, z: 12 },
    { x: -6, z: -2.2 }
  ];

  var EXIT = { x: 19.5, z: 0, w: 2, d: 1.4, height: 3 };

  /* ===================== СОСТОЯНИЕ ===================== */
  var canvas, renderer, scene, camera, raycaster, clock;
  var worldObjects = [];   // меши стен/потолка/двери для коллизий и raycast
  var staticBoxes = [];    // ящики стен (на всю игру)
  var entityBoxes = [];    // ящики сущностей (дверь; пересоздаётся при рестарте)
  var enemies = [];
  var pickups = [];
  var tracers = [], particles = [];
  var gunModel, flashlight, exitDoor, exitLight;

  var state = {
    mode: "menu", // menu | playing | paused | over
    pos: { x: -17.5, z: 13, y: 0 },
    vel: { x: 0, z: 0, y: 0 },
    yaw: 0.4, pitch: 0,
    grounded: true,
    health: 100,
    weapon: "pistol",
    ammo: {
      pistol: { cur: 8, reserve: 16 },
      shotgun: { cur: 5, reserve: 10 }
    },
    hasKey: false,
    flashlightOn: true,
    lastShot: 0,
    reloading: false,
    reloadEnd: 0,
    kills: 0,
    totalEnemies: ENEMIES.length,
    startTime: 0,
    bob: 0,
    keys: {},
    msgTimer: 0,
    lastHint: 0
  };

  /* ===================== УТИЛИТЫ ===================== */
  function $(id) { return document.getElementById(id); }

  function showMessage(text, ms) {
    var el = $("msg");
    el.textContent = text;
    el.classList.remove("hidden");
    state.msgTimer = ms || 2500;
  }

  function dist2(ax, az, bx, bz) {
    var dx = ax - bx, dz = az - bz;
    return dx * dx + dz * dz;
  }

  /* AABB-коллизия: развёртка по осям X и Z по всем ящикам */
  function collide(px, pz, r, vel) {
    var boxes = staticBoxes.concat(entityBoxes);
    for (var i = 0; i < boxes.length; i++) {
      var b = boxes[i];
      var minX = b.minX - r, maxX = b.maxX + r;
      var minZ = b.minZ - r, maxZ = b.maxZ + r;
      if (px > minX && px < maxX && pz > minZ && pz < maxZ) {
        var pushL = px - minX, pushR = maxX - px;
        var pushD = pz - minZ, pushU = maxZ - pz;
        var m = Math.min(pushL, pushR, pushD, pushU);
        if (m === pushL) { px = minX; if (vel) vel.x = 0; }
        else if (m === pushR) { px = maxX; if (vel) vel.x = 0; }
        else if (m === pushD) { pz = minZ; if (vel) vel.z = 0; }
        else { pz = maxZ; if (vel) vel.z = 0; }
      }
    }
    return { x: px, z: pz };
  }

  function addBox(x, z, w, d, isDoor) {
    var b = {
      minX: x - w / 2, maxX: x + w / 2,
      minZ: z - d / 2, maxZ: z + d / 2,
      door: !!isDoor
    };
    if (isDoor) entityBoxes.push(b);
    else staticBoxes.push(b);
  }

  function hasLineOfSight(ax, ay, az, bx, by, bz) {
    var dir = { x: bx - ax, y: by - ay, z: bz - az };
    var len = Math.sqrt(dir.x * dir.x + dir.y * dir.y + dir.z * dir.z);
    dir.x /= len; dir.y /= len; dir.z /= len;
    raycaster.set({ x: ax, y: ay, z: az }, dir);
    raycaster.far = len + 0.1;
    var hits = raycaster.intersectObjects(worldObjects);
    for (var i = 0; i < hits.length; i++) {
      if (!hits[i].object.userData.door) return false;
    }
    return true;
  }

  /* ===================== СВЕТ + СЦЕНА ===================== */
  function makeWallTexture(base) {
    var c = document.createElement("canvas");
    c.width = 128; c.height = 128;
    var g = c.getContext("2d");
    g.fillStyle = base;
    g.fillRect(0, 0, 128, 128);
    // потёки и пятна
    for (var i = 0; i < 40; i++) {
      g.fillStyle = "rgba(0,0,0," + (Math.random() * 0.25) + ")";
      g.fillRect(Math.random() * 128, Math.random() * 128,
        2 + Math.random() * 10, 2 + Math.random() * 18);
    }
    // панели
    g.strokeStyle = "rgba(0,0,0,0.45)";
    g.lineWidth = 2;
    g.strokeRect(4, 4, 120, 120);
    g.strokeRect(14, 14, 100, 100);
    var t = new THREE.CanvasTexture(c);
    t.magFilter = THREE.NearestFilter;
    return t;
  }

  /* Аварийные лампы: тёплый свет + красные маяки, расставлены по уровню */
  function buildLamps() {
    var spots = [
      { x: -13, z: -13, c: 0xffd9a0 },
      { x: -17, z: 10, c: 0xffd9a0 },
      { x: 8, z: -10, c: 0xffd9a0 },
      { x: 13, z: 10, c: 0xffd9a0 },
      { x: -10, z: 0, c: 0xff4433 }
    ];
    for (var i = 0; i < spots.length; i++) {
      var s = spots[i];
      var light = new THREE.PointLight(s.c, 1.1, 20, 2);
      light.position.set(s.x, WALL_H - 0.3, s.z);
      scene.add(light);
      // маленький светящийся «светильник» на потолке
      var bulb = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.12, 0.5),
        new THREE.MeshBasicMaterial({ color: s.c })
      );
      bulb.position.set(s.x, WALL_H - 0.05, s.z);
      scene.add(bulb);
    }
  }

  function buildScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x181f24);
    scene.fog = new THREE.Fog(0x181f24, 8, 70);

    camera = new THREE.PerspectiveCamera(75, 4 / 3, 0.05, VIEW_RANGE);
    scene.add(camera);

    raycaster = new THREE.Raycaster();
    raycaster.far = VIEW_RANGE;

    // пол
    var floorC = document.createElement("canvas");
    floorC.width = floorC.height = 128;
    var fg = floorC.getContext("2d");
    fg.fillStyle = "#46403a";
    fg.fillRect(0, 0, 128, 128);
    for (var i = 0; i < 60; i++) {
      fg.fillStyle = "rgba(0,0,0," + (Math.random() * 0.3) + ")";
      fg.fillRect(Math.random() * 128, Math.random() * 128,
        1 + Math.random() * 8, 1 + Math.random() * 8);
    }
    fg.strokeStyle = "rgba(0,0,0,0.5)";
    fg.lineWidth = 3;
    fg.beginPath(); fg.moveTo(64, 0); fg.lineTo(64, 128);
    fg.moveTo(0, 64); fg.lineTo(128, 64); fg.stroke();
    var floorTex = new THREE.CanvasTexture(floorC);
    floorTex.magFilter = THREE.NearestFilter;
    floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(20, 16);

    var floor = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 32),
      new THREE.MeshLambertMaterial({ map: floorTex })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);
    worldObjects.push(floor);

    // стены
    var wallMats = [];
    for (var w = 0; w < 3; w++) {
      wallMats.push(new THREE.MeshLambertMaterial({
        map: makeWallTexture(["#6b6152", "#625a4c", "#746a58"][w])
      }));
    }
    for (var i = 0; i < WALLS_FULL.length; i++) {
      var W = WALLS_FULL[i];
      var m = new THREE.Mesh(
        new THREE.BoxGeometry(W[2], WALL_H, W[3]),
        wallMats[i % 3]
      );
      m.position.set(W[0], WALL_H / 2, W[1]);
      scene.add(m);
      worldObjects.push(m);
      addBox(W[0], W[1], W[2], W[3], false);
    }

    // потолок
    var ceilMat = new THREE.MeshLambertMaterial({ color: 0x3a362f });
    for (var ce = 0; ce < CEILINGS.length; ce++) {
      var C = CEILINGS[ce];
      var cm = new THREE.Mesh(new THREE.BoxGeometry(C[2], 0.4, C[3]), ceilMat);
      cm.position.set(C[0], WALL_H + 0.2, C[1]);
      scene.add(cm);
      worldObjects.push(cm);
    }

    // свет
    // Фоновый ambient поднимает весь уровень — сцена больше не «чёрная»
    var ambient = new THREE.AmbientLight(0x61707a, 0.9);
    scene.add(ambient);
    var hemi = new THREE.HemisphereLight(0x9aa7b5, 0x2a2a26, 0.8);
    scene.add(hemi);

    // аварийные лампы уровня (тёплый свет + красные маяки)
    buildLamps();

    // фонарик (привязан к камере)
    flashlight = new THREE.SpotLight(0xffe9c0, 2.6, 55, 0.5, 0.5, 1.2);
    flashlight.position.set(0, 0, 0);
    camera.add(flashlight);
    var ft = new THREE.Object3D();
    ft.position.set(0, -0.1, -1);
    camera.add(ft);
    flashlight.target = ft;

    // выходы-маяки
    exitLight = new THREE.PointLight(0x33ff66, 1.2, 8);
    exitLight.position.set(EXIT.x - 0.6, 2.6, EXIT.z);
    scene.add(exitLight);

    // дверь выхода
    var door = new THREE.Mesh(
      new THREE.BoxGeometry(EXIT.w, EXIT.height, 0.3),
      new THREE.MeshLambertMaterial({ color: 0x663322 })
    );
    door.position.set(EXIT.x - 0.15, EXIT.height / 2, EXIT.z);
    door.userData.door = true;
    door.userData.isExit = true;
    door.userData.doorGroup = door;
    scene.add(door);
    worldObjects.push(door);
    exitDoor = door;
    addBox(EXIT.x, EXIT.z, EXIT.w, EXIT.d, true);

    buildPickups();
    buildEnemies();
    buildGun();
  }

  /* ===================== ПРЕДМЕТЫ ===================== */
  function bobbing(mesh, baseY) {
    mesh.userData.baseY = baseY;
    mesh.userData.phase = Math.random() * Math.PI * 2;
  }

  function buildPickups() {
    for (var i = 0; i < PICKUPS.length; i++) {
      var p = PICKUPS[i];
      var grp = new THREE.Group();
      var col, type = p.type;
      if (type === "med") {
        var body = new THREE.Mesh(
          new THREE.BoxGeometry(0.5, 0.35, 0.5),
          new THREE.MeshLambertMaterial({ color: 0xdddddd }));
        var cross1 = new THREE.Mesh(
          new THREE.BoxGeometry(0.34, 0.4, 0.08),
          new THREE.MeshLambertMaterial({ color: 0xcc2222 }));
        var cross2 = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, 0.4, 0.34),
          new THREE.MeshLambertMaterial({ color: 0xcc2222 }));
        grp.add(body, cross1, cross2);
      } else if (type === "key") {
        var ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.18, 0.05, 8, 16),
          new THREE.MeshLambertMaterial({ color: 0xffcc33, emissive: 0x775511 }));
        var shaft = new THREE.Mesh(
          new THREE.BoxGeometry(0.07, 0.3, 0.07),
          new THREE.MeshLambertMaterial({ color: 0xffcc33, emissive: 0x775511 }));
        shaft.position.y = -0.3;
        grp.add(ring, shaft);
        col = 0xffcc33;
      } else {
        var ammoCol = type === "shotgunAmmo" ? 0x995522 : 0x334455;
        var box = new THREE.Mesh(
          new THREE.BoxGeometry(0.42, 0.28, 0.42),
          new THREE.MeshLambertMaterial({ color: ammoCol }));
        var top = new THREE.Mesh(
          new THREE.BoxGeometry(0.3, 0.1, 0.3),
          new THREE.MeshLambertMaterial({ color: 0xccaa44 }));
        top.position.y = 0.16;
        grp.add(box, top);
      }
      if (p.type === "key") {
        var glow = new THREE.PointLight(0xffcc33, 0.9, 5);
        glow.position.y = 0.3;
        grp.add(glow);
      }
      grp.position.set(p.x, 0.55, p.z);
      bobbing(grp, 0.55);
      scene.add(grp);
      pickups.push({ group: grp, type: p.type, taken: false });
    }
  }

  function updatePickups(t) {
    for (var i = 0; i < pickups.length; i++) {
      var p = pickups[i];
      if (p.taken) continue;
      p.group.rotation.y += 0.03;
      p.group.position.y = p.group.userData.baseY + Math.sin(t * 2 + p.group.userData.phase) * 0.08;
      // подбор: E вблизи
      var dx = p.group.position.x - state.pos.x;
      var dz = p.group.position.z - state.pos.z;
      if (dist2(p.group.position.x, p.group.position.z, state.pos.x, state.pos.z) < 2.2 && state.keys["KeyE"]) {
        takePickup(p);
      }
    }
  }

  function takePickup(p) {
    p.taken = true;
    scene.remove(p.group);
    switch (p.type) {
      case "med":
        state.health = Math.min(100, state.health + 25);
        showMessage("Аптечка +25");
        break;
      case "pistolAmmo":
        state.ammo.pistol.reserve += 8;
        showMessage("Патроны для пистолета +8");
        break;
      case "shotgunAmmo":
        state.ammo.shotgun.reserve += 3;
        showMessage("Патроны для дробовика +3");
        break;
      case "key":
        state.hasKey = true;
        showMessage("КЛЮЧ ВОЙСК! Дверь выхода открыта.");
        SFX.key();
        updateExitDoor();
        return;
    }
    SFX.pickup();
    updateHUD();
  }

  /* Ящик двери: заблокирована, пока нет ключа */
  function getDoorBox() {
    var b = null;
    for (var i = 0; i < entityBoxes.length; i++) if (entityBoxes[i].door) b = entityBoxes[i];
    if (!b) return null;
    b.doorOpen = state.hasKey;
    return b;
  }

  /* Мягкий отскок от закрытой двери, если коллизия "зажала" игрока внутрь */
  function pushOutDoor() {
    if (state.hasKey) return;
    var b = getDoorBox();
    if (!b) return;
    var r = PLAYER_R;
    if (state.pos.x > b.minX - r && state.pos.x < b.maxX + r &&
        state.pos.z > b.minZ - r && state.pos.z < b.maxZ + r) {
      // толкаем в сторону с меньшей глубиной проникновения
      var dLeft = state.pos.x - (b.minX - r);   // выйти влево
      var dRight = (b.maxX + r) - state.pos.x;  // выйти вправо (наружу)
      var dDown = state.pos.z - (b.minZ - r);
      var dUp = (b.maxZ + r) - state.pos.z;
      var m = Math.min(dLeft, dRight, dDown, dUp);
      if (performance.now() - state.lastHint > 3000) {
        state.lastHint = performance.now();
        showMessage("Дверь заперта — нужен ключ.");
      }
      if (m === dLeft) state.pos.x = b.minX - r;
      else if (m === dRight) state.pos.x = b.maxX + r;
      else if (m === dDown) state.pos.z = b.minZ - r;
      else state.pos.z = b.maxZ + r;
    }
  }

  function checkWin() {
    if (!state.hasKey) return;
    var e = EXIT;
    if (state.pos.x > e.x - 1.2 && Math.abs(state.pos.z - e.z) < 2.0) {
      endGame(true);
    }
  }

  /* ===================== ВРАГИ ===================== */
  function buildEnemyMesh() {
    var g = new THREE.Group();
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x8a4a3a });
    var body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.85, 0.45), bodyMat);
    body.position.y = 0.95;
    var head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.4, 0.4), bodyMat);
    head.position.y = 1.65;
    var eyeMat = new THREE.MeshBasicMaterial({ color: 0xffcc33 });
    var e1 = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.07, 0.02), eyeMat);
    e1.position.set(-0.11, 1.7, 0.21);
    var e2 = e1.clone();
    e2.position.x = 0.11;
    var legMat = new THREE.MeshLambertMaterial({ color: 0x5a3a30 });
    var l1 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.6, 0.2), legMat);
    l1.position.set(-0.16, 0.3, 0);
    var l2 = l1.clone();
    l2.position.x = 0.16;
    g.body = body; g.head = head; g.leg1 = l1; g.leg2 = l2;
    g.add(body, head, e1, e2, l1, l2);
    return g;
  }

  function buildEnemies() {
    for (var i = 0; i < ENEMIES.length; i++) {
      var e = ENEMIES[i];
      var g = buildEnemyMesh();
      g.position.set(e.x, 0, e.z);
      scene.add(g);
      var hitbox = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 2, 0.7),
        new THREE.MeshBasicMaterial({ visible: false }));
      hitbox.position.y = 1;
      hitbox.userData.enemy = null; // привяжем ниже
      g.add(hitbox);
      var ent = {
        group: g, hitbox: hitbox,
        body: g.body, head: g.head, leg1: g.leg1, leg2: g.leg2,
        health: 20, speed: 2.0 + Math.random() * 1.2,
        state: "idle", windup: 0, attackEnd: 0,
        painEnd: 0, dead: false, dieStart: 0,
        hitMeshes: [g.body, g.head, g.leg1, g.leg2, hitbox]
      };
      hitbox.userData.enemy = ent;
      ent.hitMeshes.forEach(function (m) { m.userData.enemy = ent; });
      enemies.push(ent);
    }
  }

  var tmpVec = new THREE.Vector3();

  function updateEnemies(dt, now) {
    var px = state.pos.x, pz = state.pos.z;
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (e.dead) {
        // падение
        var dt2 = (now - e.dieStart) / 1000;
        if (dt2 < 1.2) {
          e.group.rotation.z = Math.min(Math.PI / 2, dt2 * 2.2);
          e.group.position.y = -Math.sin(Math.min(Math.PI / 2, dt2 * 2.2)) * 0.25;
        } else if (dt2 < 2.2) {
          e.group.scale.multiplyScalar(0.94);
        } else if (e.group.parent) {
          scene.remove(e.group);
          e.group.parent = null;
          e.hitboxRemoved = true;
        }
        continue;
      }
      var ex = e.group.position.x, ez = e.group.position.z;
      var dx = px - ex, dz = pz - ez;
      var dist = Math.sqrt(dx * dx + dz * dz);
      var see = dist < 26 && hasLineOfSight(ex, PLAYER_EYE, ez, px, PLAYER_EYE, pz);

      if (now < e.painEnd) {
        e.state = "idle";
      } else if (e.state === "windup" && now >= e.attackEnd) {
        // выпад и урон
        e.state = "recover";
        e.attackEnd = now + 700;
        SFX.enemyAttack();
        if (dist < 9) damagePlayer(10 + Math.floor(Math.random() * 8));
      } else if (e.state === "recover") {
        if (now >= e.attackEnd) e.state = "idle";
      }

      if (e.state === "idle" && see) {
        e.state = "active";
        e.group.rotation.y = Math.atan2(dx, dz);
      }
      if (e.state === "active" || e.state === "windup") {
        // анимация ног
        var ph = now * 0.012;
        e.leg1.rotation.x = Math.sin(ph) * 0.6;
        e.leg2.rotation.x = -Math.sin(ph) * 0.6;
        e.head.rotation.x = Math.sin(ph * 0.5) * 0.08;
      } else {
        e.leg1.rotation.x *= 0.9;
        e.leg2.rotation.x *= 0.9;
      }

      if (e.state === "active") {
        if (dist > 6.5) {
          // движение к игроку
          var nx = dx / dist, nz = dz / dist;
          var mx = nx * e.speed * dt, mz = nz * e.speed * dt;
          var pos = collide(
            Math.max(-19.2, Math.min(19.2, ex + mx)),
            Math.max(-15.2, Math.min(15.2, ez + mz)),
            0.4, null);
          ex = pos.x; ez = pos.z;
          // расталкивание: если врезались в игрока — стоп
          if (dist2(ex, ez, px, pz) < 1.4 * 1.4) {
            e.windup = now + 450;
            e.attackEnd = e.windup;
            e.state = "windup";
          }
        } else {
          e.windup = now + 450;
          e.attackEnd = e.windup;
          e.state = "windup";
        }
        e.group.position.x = ex;
        e.group.position.z = ez;
      }
    }
  }

  /* ===================== ОРУЖИЕ (view model) ===================== */
  function buildGun() {
    gunModel = new THREE.Group();
    var dark = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var grey = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });

    var pistol = new THREE.Group();
    var pBody = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.16, 0.42), dark);
    var pGrip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.12), grey);
    pGrip.position.set(0, -0.17, 0.12);
    pGrip.rotation.x = 0.3;
    pistol.add(pBody, pGrip);
    pistol.name = "pistol";

    var shotgun = new THREE.Group();
    var sBarrel = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.8), dark);
    var sBody = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.14, 0.5), grey);
    sBody.position.z = 0.2;
    var sStock = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.16, 0.3), new THREE.MeshLambertMaterial({ color: 0x5a3a1a }));
    sStock.position.set(0, -0.02, 0.5);
    shotgun.add(sBarrel, sBody, sStock);
    shotgun.name = "shotgun";

    gunModel.add(pistol, shotgun);
    gunModel.position.set(0.28, -0.26, -0.55);
    gunModel.userData.baseY = -0.26;

    // вспышка выстрела
    var flash = new THREE.PointLight(0xffcc66, 0, 4);
    flash.position.set(0, 0, -0.4);
    gunModel.add(flash);
    gunModel.userData.flash = flash;

    camera.add(gunModel);
    switchGun(state.weapon);
  }

  function switchGun(name) {
    state.weapon = name;
    if (gunModel) {
      ["pistol", "shotgun"].forEach(function (n) {
        var m = gunModel.getObjectByName(n);
        if (m) m.visible = (n === name);
      });
    }
    state.reloading = false;
    updateHUD();
  }

  function muzzleWorldPos() {
    return gunModel.localToWorld(new THREE.Vector3(0, 0, -0.7));
  }

  function tryShoot(now) {
    if (state.reloading) return;
    var w = WEAPONS[state.weapon];
    if (now - state.lastShot < w.rate) return;
    if (state.ammo[state.weapon].cur <= 0) {
      SFX.empty();
      state.lastShot = now;
      if (state.ammo[state.weapon].reserve > 0) startReload(now);
      return;
    }
    state.lastShot = now;
    state.ammo[state.weapon].cur--;
    if (state.weapon === "pistol") SFX.pistol(); else SFX.shotgun();

    // разброс и raycast
    var dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    dir.x += (Math.random() - 0.5) * 2 * w.spread;
    dir.y += (Math.random() - 0.5) * 2 * w.spread;
    dir.z += (Math.random() - 0.5) * 2 * w.spread;
    dir.normalize();

    var muzzle = muzzleWorldPos();
    raycaster.set(muzzle, dir);
    raycaster.far = VIEW_RANGE;

    var targets = worldObjects.slice();
    for (var i = 0; i < enemies.length; i++) {
      if (!enemies[i].dead && enemies[i].group.parent) targets.push.apply(targets, enemies[i].hitMeshes);
    }
    var hits = raycaster.intersectObjects(targets, true);

    var end = {
      x: muzzle.x + dir.x * 40,
      y: muzzle.y + dir.y * 40,
      z: muzzle.z + dir.z * 40
    };
    if (hits.length > 0) {
      var h = hits[0];
      end = { x: h.point.x, y: h.point.y, z: h.point.z };
      var ent = h.object.userData.enemy || hitOwner(h.object);
      if (ent && !ent.dead) {
        ent.health -= w.dmg;
        ent.painEnd = performance.now() + 250;
        SFX.hitEnemy();
        spawnBlood(h.point);
        if (ent.health <= 0) killEnemy(ent);
      }
    }
    spawnTracer(muzzle, end);
    var f = gunModel.userData.flash;
    f.intensity = 2.2;
    setTimeout(function () { f.intensity = 0; }, 60);
    gunModel.position.z = -0.45; // откат
    if (state.ammo[state.weapon].cur <= 0 && state.ammo[state.weapon].reserve > 0) startReload(now);
    updateHUD();
  }

  function hitOwner(obj) {
    while (obj) {
      if (obj.userData.enemy) return obj.userData.enemy;
      obj = obj.parent;
    }
    return null;
  }

  function killEnemy(e) {
    e.dead = true;
    e.dieStart = performance.now();
    state.kills++;
    SFX.enemyDie();
  }

  function startReload(now) {
    var w = WEAPONS[state.weapon];
    if (state.reloading || state.ammo[state.weapon].reserve <= 0) return;
    state.reloading = true;
    state.reloadEnd = now + w.reload;
    SFX.reload();
    showMessage("ПЕРЕЗАРЯДКА...", w.reload);
  }

  function updateReload(now) {
    if (state.reloading && now >= state.reloadEnd) {
      var w = WEAPONS[state.weapon];
      var need = w.mag - state.ammo[state.weapon].cur;
      var take = Math.min(need, state.ammo[state.weapon].reserve);
      state.ammo[state.weapon].cur += take;
      state.ammo[state.weapon].reserve -= take;
      state.reloading = false;
      updateHUD();
    }
  }

  /* ===================== ЭФФЕКТЫ ===================== */
  function spawnTracer(a, b) {
    var geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(a.x, a.y, a.z),
      new THREE.Vector3(b.x, b.y, b.z)
    ]);
    var line = new THREE.Line(geo, new THREE.LineBasicMaterial({
      color: 0xffdd88, transparent: true, opacity: 0.9
    }));
    scene.add(line);
    tracers.push({ obj: line, born: performance.now() });
  }

  function spawnBlood(p) {
    var mat = new THREE.MeshBasicMaterial({ color: 0x991111, transparent: true });
    for (var i = 0; i < 5; i++) {
      var s = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), mat);
      s.position.set(
        p.x + (Math.random() - 0.5) * 0.3,
        p.y + (Math.random() - 0.5) * 0.3,
        p.z + (Math.random() - 0.5) * 0.3);
      scene.add(s);
      particles.push({
        obj: s, mat: mat, born: performance.now(),
        vx: (Math.random() - 0.5) * 1.5,
        vy: Math.random() * 1.5,
        vz: (Math.random() - 0.5) * 1.5
      });
    }
  }

  function updateFx(dt) {
    var now = performance.now();
    for (var i = tracers.length - 1; i >= 0; i--) {
      var t = tracers[i];
      var age = (now - t.born) / 90;
      t.obj.material.opacity = Math.max(0, 0.9 * (1 - age));
      if (age >= 1) {
        scene.remove(t.obj);
        t.obj.geometry.dispose();
        tracers.splice(i, 1);
      }
    }
    for (var j = particles.length - 1; j >= 0; j--) {
      var p = particles[j];
      var age = (now - p.born) / 500;
      p.obj.position.x += p.vx * dt;
      p.obj.position.y += p.vy * dt;
      p.obj.position.z += p.vz * dt;
      p.vy -= 4 * dt;
      p.mat.opacity = Math.max(0, 1 - age);
      if (age >= 1) {
        scene.remove(p.obj);
        p.obj.geometry.dispose();
        particles.splice(j, 1);
      }
    }
  }

  /* ===================== ИГРОК ===================== */
  function damagePlayer(n) {
    if (state.mode !== "playing") return;
    state.health -= n;
    SFX.hurt();
    $("dmg-vignette").classList.add("active");
    setTimeout(function () { $("dmg-vignette").classList.remove("active"); }, 250);
    if (state.health <= 0) {
      state.health = 0;
      endGame(false);
    }
    updateHUD();
  }

  function updatePlayer(dt) {
    var k = state.keys;
    var fx = k["KeyW"] ? 1 : 0;
    var fx2 = k["KeyS"] ? 1 : 0;
    var strafe = (k["KeyD"] ? 1 : 0) - (k["KeyA"] ? 1 : 0);
    var speed = (k["ShiftLeft"] || k["ShiftRight"]) ? RUN : WALK;

    var sin = Math.sin(state.yaw), cos = Math.cos(state.yaw);
    // forward в плоскости: (-sin, -cos) в yaw-конвенции three
    var dx = (-sin * (fx - fx2) + cos * strafe) * speed * dt;
    var dz = (-cos * (fx - fx2) - sin * strafe) * speed * dt;

    var moving = (fx || fx2 || strafe) && state.grounded;
    if (moving) state.bob += dt * speed * 2.2;

    var np = collide(state.pos.x + dx, state.pos.z + dz, PLAYER_R, null);
    state.pos.x = np.x;
    state.pos.z = np.z;
    pushOutDoor();

    // прыжок/гравитация
    if (k["Space"] && state.grounded) {
      state.vel.y = JUMP_V;
      state.grounded = false;
      SFX.jump();
    }
    state.vel.y -= GRAV * dt;
    state.pos.y += state.vel.y * dt;
    if (state.pos.y <= 0) {
      state.pos.y = 0;
      state.vel.y = 0;
      state.grounded = true;
    }

    camera.position.set(state.pos.x, PLAYER_EYE + state.pos.y, state.pos.z);
    camera.rotation.order = "YXZ";
    camera.rotation.y = state.yaw;
    camera.rotation.x = state.pitch;

    // покачивание оружия
    if (gunModel) {
      gunModel.position.x = 0.28 + Math.sin(state.bob) * 0.012;
      var baseY = gunModel.userData.baseY + Math.abs(Math.sin(state.bob)) * 0.015;
      gunModel.position.y += (baseY - gunModel.position.y) * 0.3;
      gunModel.position.z += (-0.55 - gunModel.position.z) * 0.25;
      gunModel.rotation.x = state.reloading ? -0.6 : camera.rotation.x * 0.02;
    }

    checkWin();
  }

  /* ===================== HUD ===================== */
  function updateHUD() {
    $("health").textContent = state.health;
    var w = WEAPONS[state.weapon];
    $("ammo").textContent = state.ammo[state.weapon].cur + "/" + state.ammo[state.weapon].reserve;
    $("ammoReserve").textContent = state.ammo[state.weapon].reserve;
    var nm = $("weaponName");
    nm.textContent = state.reloading ? "ПЕРЕЗАРЯДКА" : w.name;
    $("health").classList.toggle("low", state.health <= 25);
  }

  /* ===================== СОСТОЯНИЯ ===================== */
  function setMode(m) {
    state.mode = m;
    $("menu").classList.toggle("hidden", m !== "menu");
    $("pause").classList.toggle("hidden", m !== "paused");
    $("over").classList.toggle("hidden", m !== "over");
    $("hud").classList.toggle("hidden", m !== "playing");
    if (m === "playing") {
      canvas.requestPointerLock && canvas.requestPointerLock();
    }
  }

  function endGame(won) {
    setMode("over");
    $("over-title").textContent = won ? "УРОВЕНЬ ПРОЙДЕН" : "ВЫ ПОГИБЛИ";
    var secs = Math.round((performance.now() - state.startTime) / 1000);
    $("over-sub").textContent = "Убито: " + state.kills + "/" + state.totalEnemies +
      "  ·  Здоровье: " + state.health + "  ·  Время: " + secs + " с";
    if (won) SFX.win(); else SFX.lose();
    if (document.pointerLockElement === canvas) document.exitPointerLock();
  }

  function resetGame() {
    // удалить врагов/предметы/эффекты
    enemies.forEach(function (e) { if (e.group.parent) scene.remove(e.group); });
    pickups.forEach(function (p) { if (p.group.parent) scene.remove(p.group); });
    tracers.forEach(function (t) { scene.remove(t.obj); });
    particles.forEach(function (p) { scene.remove(p.obj); });
    enemies = []; pickups = []; tracers = []; particles = [];
    buildPickups();
    buildEnemies();

    state.pos = { x: -17.5, z: 13, y: 0 };
    state.vel = { x: 0, z: 0, y: 0 };
    state.yaw = 0.4; state.pitch = 0;
    state.grounded = true;
    state.health = 100;
    state.ammo = {
      pistol: { cur: 8, reserve: 16 },
      shotgun: { cur: 5, reserve: 10 }
    };
    state.hasKey = false;
    state.lastShot = 0;
    state.reloading = false;
    state.kills = 0;
    state.startTime = performance.now();
    switchGun("pistol");
    if (exitDoor) exitDoor.rotation.y = 0;
    updateHUD();
    setMode("playing");
  }

  /* Дверь анимируется при наличии ключа */
  function updateDoor(dt) {
    if (!exitDoor) return;
    var target = state.hasKey ? -Math.PI / 2 : 0;
    exitDoor.rotation.y += (target - exitDoor.rotation.y) * Math.min(1, dt * 4);
    if (state.hasKey && Math.abs(exitDoor.rotation.y - target) < 0.02 &&
        Math.random() < dt * 2) {
      // уже открыта — ничего
    }
  }

  /* ===================== ВВОД ===================== */
  var locked = false;

  function bindInput() {
    document.addEventListener("pointerlockchange", function () {
      locked = document.pointerLockElement === canvas;
      if (!locked && state.mode === "playing") {
        setMode("paused");
      }
    });

    canvas.addEventListener("mousedown", function (ev) {
      if (state.mode !== "playing") return;
      if (ev.button === 0) SFX.unlock();
    });

    document.addEventListener("mousemove", function (ev) {
      if (!locked || state.mode !== "playing") return;
      state.yaw -= ev.movementX * MOUSE_SENS;
      state.pitch -= ev.movementY * MOUSE_SENS;
      var lim = Math.PI / 2 - 0.05;
      state.pitch = Math.max(-lim, Math.min(lim, state.pitch));
    });

    document.addEventListener("mousedown", function (ev) {
      if (state.mode !== "playing" || !locked) return;
      if (ev.button === 0) tryShoot(performance.now());
    });

    document.addEventListener("keydown", function (ev) {
      state.keys[ev.code] = true;
      if (state.mode !== "playing") return;
      if (ev.code === "Digit1") { switchGun("pistol"); showMessage("ПИСТОЛЕТ"); }
      if (ev.code === "Digit2") { switchGun("shotgun"); showMessage("ДРОБОВИК"); }
      if (ev.code === "KeyR") startReload(performance.now());
      if (ev.code === "KeyF") {
        state.flashlightOn = !state.flashlightOn;
        flashlight.intensity = state.flashlightOn ? 2.6 : 0;
        $("flashlight-icon").style.opacity = state.flashlightOn ? 1 : 0.35;
      }
    });

    document.addEventListener("keyup", function (ev) {
      state.keys[ev.code] = false;
    });

    $("btn-start").addEventListener("click", function () {
      SFX.unlock();
      resetGame();
    });
    $("btn-restart").addEventListener("click", function () {
      SFX.unlock();
      resetGame();
    });
    $("pause").addEventListener("click", function () {
      if (state.mode === "paused") setMode("playing");
    });
  }

  /* ===================== ЦИКЛ ===================== */
  function animate() {
    requestAnimationFrame(animate);
    var dt = clock.getDelta();
    if (dt > 0.1) dt = 0.1;
    var now = performance.now();

    if (state.mode === "playing") {
      updatePlayer(dt);
      updateEnemies(dt, now);
      updatePickups(now / 1000);
      updateReload(now);
      updateDoor(dt);
      // мигание света выхода
      if (exitLight) exitLight.intensity = 0.9 + Math.sin(now * 0.005) * 0.3;
    }
    updateFx(dt);

    if (state.msgTimer > 0) {
      state.msgTimer -= dt * 1000;
      if (state.msgTimer <= 0) $("msg").classList.add("hidden");
    }

    renderer.render(scene, camera);
  }

  /* ===================== СТАРТ ===================== */
  function resize() {
    // 4:3 с letterbox, как в оригинале
    var ww = window.innerWidth, wh = window.innerHeight;
    var scale = Math.min(ww / 640, wh / 480);
    var rw = Math.floor(640 * scale), rh = Math.floor(480 * scale);
    renderer.setSize(rw, rh, false);
    canvas.style.width = rw + "px";
    canvas.style.height = rh + "px";
    camera.aspect = 4 / 3;
    camera.updateProjectionMatrix();
    document.body.style.background = "black";
  }

  window.addEventListener("DOMContentLoaded", function () {
    if (typeof THREE === "undefined") {
      $("menu").innerHTML = "<h2>Ошибка</h2><p>Не удалось загрузить three.js из CDN.</p>";
      return;
    }
    canvas = $("game");
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false });
    renderer.setPixelRatio(1);
    clock = new THREE.Clock();
    buildScene();
    bindInput();
    updateHUD();
    resize();
    window.addEventListener("resize", resize);
    animate();
  });
})();
