import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
let planes = []; //speichert alle sechs Seiten der Cubes als einzelen Objekte [c1s1, c1s2, c1s3, c1s5, c1s6, c2s1...]
let planeGeometry = new THREE.PlaneGeometry(1, 1); // Geometry/Form des Objekts 
let planeMaterial = new THREE.MeshStandardMaterial({ //Oberfläsche des Objekts
	color: 0x000fff, 
	side: 2 // zeigt beide Seiten des Objekts an (Keine oreintierung nötig)

});

let comeToLifeMin = 5; //Game of Life Regeln: Man kann diese Konstanten verändern um verschiedene Entwicklungen zu beobachten
let comeToLifeMax = 5;
let stayAliveMin = 4;
let stayAliveMax = 5;

let lifeState = []; //Spielfeld
let lifeDimensions = 20; //Spielfelddimensionen (n*n*n Würfel)
let lifeGeneratingDimensions = 10; // damit das Spiel nach dem Generieren noch expandieren kann

for (let x = 0; x < lifeDimensions; x++) { //Instanziierung von 3d array
	lifeState[x] = [];
	for (let y = 0; y < lifeDimensions; y++) {
		lifeState[x][y] = [];
		for (let z = 0; z < lifeDimensions; z++) {
			lifeState[x][y][z] = false;
		}
	}
}

for (let x = 0; x < lifeGeneratingDimensions; x++) {
	for (let y = 0; y < lifeGeneratingDimensions; y++) {
		for (let z = 0; z < lifeGeneratingDimensions; z++) {
			lifeState[x][y][z] = Math.random() > 0.85; //15% Wahrscheinlichkeit, dass eine Zelle am Anfang am Leben ist;
		}
	}
}

let scene = new THREE.Scene(); // Szene in der alle Objekte vorhanden sind und angezeigt werden
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000); // Perspektive der Kamera
camera.position.set(lifeGeneratingDimensions/2, lifeGeneratingDimensions/2, lifeGeneratingDimensions*2); // Positioniert die Kamera, abhängig von der Größe des generierten Cubes 

let renderer = new THREE.WebGLRenderer(); // Instanziiert den Renderer
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';

new OrbitControls(camera, renderer.domElement); // Ermöglich raus- und reinzoomen sowie Bewegung der Camera 

render();
function render() { //wird jedes Frame wiederholt,rendert die 3-Dimensionalen Objekte zu anzeigabren, 2-Dimensionan Objekten
	requestAnimationFrame(render);
	renderer.render(scene, camera);
}

setInterval(step, 500); // wiederhole function step alle 500 ms

let pointlLight = new THREE.PointLight(0xffffff, 10); // Erstellt die Beleuchtung des Szene 
pointlLight.position.set(10, 10, 5);
scene.add(pointlLight); // Positioniert Lichtquelle
let ambientLight = new THREE.AmbientLight();
scene.add(ambientLight); // Sorg selbt bei Schatten für "Ambientes Licht"

function step() {
	let newState = [];

	for (let x = 0; x < lifeDimensions; x++) { 
		newState[x] = [];
		for (let y = 0; y < lifeDimensions; y++) {
			newState[x][y] = []; // instanziiert Übergabearray
			for (let z = 0; z < lifeDimensions; z++) {
				let neighbours = 0;

				for (let neighbourX = -1; neighbourX < 2; neighbourX++) { //läuft Nachbarn jeder Zelle ab und zählt diese
					for (let neighbourY = -1; neighbourY < 2; neighbourY++) {
						for (let neighbourZ = -1; neighbourZ < 2; neighbourZ++) {
							if (
								x + neighbourX >= 0 && //kontrollieren dass die Nachbarn auch innerhalb des Array Indexes (IndexOutOfBoundsException) sind
								x + neighbourX < lifeDimensions &&
								y + neighbourY >= 0 &&
								y + neighbourY < lifeDimensions &&
								z + neighbourZ >= 0 &&
								z + neighbourZ < lifeDimensions &&
								Math.abs(neighbourX) + Math.abs(neighbourY) + Math.abs(neighbourZ) != 0 && //sodass die eigene Zelle nicht mitgezählt wird; Math.abs Absolutwert sodass Fälle wie (0,1,-1) vermieden werden
								lifeState[x + neighbourX][y + neighbourY][z + neighbourZ] //prüft ob der Nachbar am Leben ist
							) {
								neighbours++; 
							}
						}
					}
				}

				if (lifeState[x][y][z] && neighbours >= stayAliveMin && neighbours <= stayAliveMax) { //Spielregeln, überträgt den neuen Zustand in den Übergabe Array
					newState[x][y][z] = true;
				} else if (lifeState[x][y][z] && (neighbours < stayAliveMin || neighbours > stayAliveMax)) {
					newState[x][y][z] = false;
				} else if (!lifeState[x][y][z] && neighbours >= comeToLifeMin && neighbours <= comeToLifeMax) {
					newState[x][y][z] = true;
				} else {
					newState[x][y][z] = false;
				}
			}
		}
	}
	lifeState = newState;

	deleteRects();
	drawRects();
}

function drawRects() { 
	for (let x = 0; x < lifeDimensions; x++) { 
		for (let y = 0; y < lifeDimensions; y++) {
			for (let z = 0; z < lifeDimensions; z++) { //loopen durch die Zellen
				if (lifeState[x][y][z]) { // gibt die Zelle an, schaut ob sie am Leben ist  
					for (let neighbourX = -1; neighbourX < 2; neighbourX++) { 
						for (let neighbourY = -1; neighbourY < 2; neighbourY++) {
							for (let neighbourZ = -1; neighbourZ < 2; neighbourZ++) { 
								if (Math.abs(neighbourX) + Math.abs(neighbourY) + Math.abs(neighbourZ) == 1) { 
									let posX = x + neighbourX;
									let posY = y + neighbourY;
									let posZ = z + neighbourZ; 

									if ( //schaut ob die Zelle keinen Nachtbarn hat
										posX >= lifeState.length || 
										posX < 0 ||
										posY >= lifeState[posX].length ||
										posY < 0 || // 127 - 30 schaut ob es nicht im Arry vorhanden ist 
										!lifeState[posX][posY][posZ] // schaut ob die Zelle tot ist 
									) { 
										let mesh = new THREE.Mesh(planeGeometry, planeMaterial); // erzeugt das Objekt 
										mesh.position.set(x + neighbourX / 2, y + neighbourY / 2, z + neighbourZ / 2); // Position des Objekts 
										mesh.rotation.set( // Ausrichtung des Objekts 
											(neighbourY * Math.PI) / 2,
											(neighbourX * Math.PI) / 2,
											(neighbourZ * Math.PI) / 2
										);
										scene.add(mesh); // Beim nächsten Rendern wird das Objekt angezeigt 
										planes.push(mesh); // hängt hinten an den Plane Array dran 
									}
								}
							}
						}
					}
				}
			}
		}
	}
}

function deleteRects() { 
	for (let i = 0; i < planes.length; i++) {
		scene.remove(planes[i]); // Entfernt alle Seitenobjekte aus der Szene 
	}
	planes = []; // Das Feld, das Die Seitenobjekte hatte wird zu einem leeren Feld 
}