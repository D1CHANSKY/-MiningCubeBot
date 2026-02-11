// 1. Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

// Игровые переменные
let blocks = parseInt(localStorage.getItem('blocks')) || 0;
let hp = 5;
let isDead = false;
let currentLoc = 'house_inside';

// 3D Переменные
let scene, camera, renderer, raycaster, mouse;
const container = document.getElementById('game-canvas');

function init3D() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    loadLocation(currentLoc);
    animate();
}

// Переключатель локаций
function loadLocation(loc) {
    currentLoc = loc;
    clearScene();
    
    if (loc === 'house_inside') {
        renderHouseInside();
    } else if (loc === 'street') {
        renderStreet();
    } else if (loc === 'mine') {
        renderMine();
    }
    
    updateUI();
}

// --- ЛОКАЦИЯ: ВНУТРИ ДОМА ---
function renderHouseInside() {
    scene.background = new THREE.Color(0x3d2b1f);
    document.getElementById('location-display').innerText = "В ДОМЕ";
    
    // Коробка комнаты
    const room = new THREE.Mesh(
        new THREE.BoxGeometry(8, 5, 8),
        new THREE.MeshStandardMaterial({ color: 0x5C4033, side: THREE.BackSide })
    );
    scene.add(room);

    // Дверь на улицу
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 0.2), new THREE.MeshStandardMaterial({color: 0x221100}));
    door.position.set(0, -1.4, 3.9);
    door.name = "TO_STREET";
    scene.add(door);

    camera.position.set(0, 0, 0);
}

// --- ЛОКАЦИЯ: УЛИЦА ---
function renderStreet() {
    scene.background = new THREE.Color(0x87CEEB);
    document.getElementById('location-display').innerText = "УЛИЦА";

    // Земля
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), new THREE.MeshStandardMaterial({color: 0x4caf50}));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.5;
    scene.add(ground);

    // Домик (снаружи)
    const house = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 4), new THREE.MeshStandardMaterial({color: 0x8B4513}));
    house.position.set(0, 0, -6);
    scene.add(house);

    // Магазин (Золотой куб)
    const shop = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshStandardMaterial({color: 0xffd700}));
    shop.position.set(-6, -0.5, -3);
    shop.name = "SHOP_TRIGGER";
    scene.add(shop);

    // Вход в шахту (Черный туннель)
    const mine = new THREE.Mesh(new THREE.BoxGeometry(2.5, 3.5, 1), new THREE.MeshStandardMaterial({color: 0x000000}));
    mine.position.set(6, 0.25, -3);
    mine.name = "TO_MINE";
    scene.add(mine);

    camera.position.set(0, 1, 5);
}

// --- ЛОКАЦИЯ: ШАХТА ---
function renderMine() {
    scene.background = new THREE.Color(0x0a0a0a);
    document.getElementById('location-display').innerText = "ШАХТА";

    // Факел (Свет)
    const light = new THREE.PointLight(0xffaa00, 2, 15);
    light.position.set(0, 2, 2);
    scene.add(light);

    // Каменный блок
    const stone = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1.5), new THREE.MeshStandardMaterial({color: 0x808080}));
    stone.position.set(-1.5, 0, -2);
    stone.name = "STONE_BLOCK";
    scene.add(stone);

    // TNT Блок
    const tnt = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1.5), new THREE.MeshStandardMaterial({color: 0xff0000}));
    tnt.position.set(1.5, 0, -2);
    tnt.name = "TNT_BLOCK";
    scene.add(tnt);

    camera.position.set(0, 1.5, 4);
}

// Логика кликов
window.addEventListener('click', (event) => {
    if (isDead || event.target.tagName === 'BUTTON') return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children);

    if (intersects.length > 0) {
        const obj = intersects[0].object;

        if (obj.name === "TO_STREET") loadLocation('street');
        if (obj.name === "TO_MINE") loadLocation('mine');
        
        if (obj.name === "STONE_BLOCK") {
            blocks++;
            animateHit(obj);
            tg.HapticFeedback.impactOccurred('light');
        }

        if (obj.name === "TNT_BLOCK") {
            takeDamage();
            animateHit(obj);
        }
        
        if (obj.name === "SHOP_TRIGGER") {
            tg.showAlert("Вы зашли в магазин! Тут можно купить Premium.");
        }
    }
    updateUI();
});

function takeDamage() {
    hp--;
    tg.HapticFeedback.notificationOccurred('error');
    document.body.classList.add('damage-shake');
    setTimeout(() => document.body.classList.remove('damage-shake'), 300);
    
    if (hp <= 0) {
        die();
    }
}

function die() {
    isDead = true;
    document.getElementById('death-screen').classList.remove('hidden');
    setTimeout(() => {
        hp = 5;
        isDead = false;
        document.getElementById('death-screen').classList.add('hidden');
        loadLocation('house_inside');
    }, 3000); // 3 секунды "обморока" для теста (можно сменить на 30 мин)
}

function animateHit(obj) {
    obj.scale.set(0.8, 0.8, 0.8);
    setTimeout(() => obj.scale.set(1, 1, 1), 100);
}

function updateUI() {
    document.getElementById('block-count').innerText = blocks;
    // Обновление сердечек
    for (let i = 1; i <= 5; i++) {
        const heart = document.getElementById('h' + i);
        if (i > hp) heart.classList.add('empty');
        else heart.classList.remove('empty');
    }
}

function clearScene() {
    while(scene.children.length > 0) scene.remove(scene.children[0]);
    const light = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(light);
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

init3D();
