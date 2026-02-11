// 1. Инициализация Telegram
const tg = window.Telegram.WebApp;
tg.expand();

// Игровые данные
let blocks = parseInt(localStorage.getItem('blocks')) || 0;
let currentLoc = 'house'; // house или mine

// 2. Настройка Three.js
let scene, camera, renderer, raycaster, mouse;
const container = document.getElementById('game-canvas');

function init3D() {
    scene = new THREE.Scene();
    
    // Камера
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 5);

    // Рендерер
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Свет
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(5, 10, 7);
    scene.add(sunLight);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    loadHouse(); // Начинаем в доме
    animate();
}

// 3. Создание ДОМА (Деревня жителей)
function loadHouse() {
    clearCurrentScene();
    scene.background = new THREE.Color(0x87CEEB); // Голубое небо
    document.getElementById('location-name').innerText = "ДЕРЕВНЯ";
    document.getElementById('hint').innerText = "НАЖМИ НА ДВЕРЬ";

    // Пол (трава)
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshStandardMaterial({color: 0x4caf50}));
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Стены дома
    const walls = new THREE.Mesh(new THREE.BoxGeometry(3, 2.5, 3), new THREE.MeshStandardMaterial({color: 0x8B4513}));
    walls.position.y = 1.25;
    scene.add(walls);

    // Крыша
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.5, 1.5, 4), new THREE.MeshStandardMaterial({color: 0x5C4033}));
    roof.position.y = 3.5;
    roof.rotation.y = Math.PI / 4;
    scene.add(roof);

    // Дверь (активный объект)
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.4, 0.1), new THREE.MeshStandardMaterial({color: 0x3d2b1f}));
    door.position.set(0, 0.7, 1.51);
    door.name = "DOOR";
    scene.add(door);
}

// 4. Создание ШАХТЫ
function loadMine() {
    clearCurrentScene();
    scene.background = new THREE.Color(0x1a1a1a); // Темно в шахте
    document.getElementById('location-name').innerText = "ШАХТА";
    document.getElementById('hint').innerText = "ЛОМАЙ БЛОК!";

    // Пол (камень)
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshStandardMaterial({color: 0x333333}));
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Главный блок для копания
    const cubeGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    const cubeMat = new THREE.MeshStandardMaterial({color: 0x808080});
    const mainBlock = new THREE.Mesh(cubeGeo, cubeMat);
    mainBlock.position.y = 1;
    mainBlock.name = "MINE_BLOCK";
    scene.add(mainBlock);
}

// Очистка сцены перед сменой локации
function clearCurrentScene() {
    while(scene.children.length > 0){ 
        scene.remove(scene.children[0]); 
    }
    // Возвращаем свет
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(5, 10, 7);
    scene.add(sunLight);
}

// 5. Обработка кликов (Raycasting)
window.addEventListener('click', (event) => {
    // Не считаем клики, если нажаты кнопки UI
    if (event.target.tagName === 'BUTTON') return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children);

    if (intersects.length > 0) {
        const object = intersects[0].object;

        if (object.name === "DOOR") {
            tg.HapticFeedback.impactOccurred('medium');
            currentLoc = 'mine';
            loadMine();
        } 
        
        else if (object.name === "MINE_BLOCK") {
            blocks++;
            updateUI();
            saveData();
            
            // Визуальный отклик (сжатие блока)
            object.scale.set(0.9, 0.9, 0.9);
            setTimeout(() => object.scale.set(1, 1, 1), 50);
            
            tg.HapticFeedback.impactOccurred('light');
            createFloatingText(event.clientX, event.clientY, "+1");
        }
    }
});

// Обновление интерфейса
function updateUI() {
    document.getElementById('block-count').innerText = blocks;
}

// Сохранение
function saveData() {
    localStorage.setItem('blocks', blocks);
}

// Анимация текста
function createFloatingText(x, y, text) {
    const el = document.createElement('div');
    el.className = 'floating-text';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.innerText = text;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 800);
}

// Цикл рендеринга
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

// Запуск
window.onload = () => {
    init3D();
    updateUI();
};

// Обработка изменения размера экрана
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
