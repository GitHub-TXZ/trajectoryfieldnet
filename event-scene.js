import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

const coverHost = document.getElementById('event3d-cover');
const demoHost = document.getElementById('event3d-demo');
const slider = document.getElementById('event-time');
const timeLabel = document.getElementById('event-time-label');
const targetToggle = document.getElementById('event-target');
const playButton = document.getElementById('event-play');
let playing = true;
let lastFrame = 0;

function lowerBound(values, threshold) {
  let lo = 0, hi = values.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (values[mid] < threshold) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

function pointSet(events, predicate, color, size, opacity) {
  const rows = events.filter(predicate);
  const coordinates = new Float32Array(rows.length * 3);
  const times = new Uint16Array(rows.length);
  rows.forEach(([t, x, y], i) => {
    times[i] = t;
    coordinates[3 * i] = (t / 7999 - .5) * 12;
    coordinates[3 * i + 1] = (x / 345 - .5) * 5;
    coordinates[3 * i + 2] = (y / 259 - .5) * 3.7;
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(coordinates, 3));
  const material = new THREE.PointsMaterial({color, size, opacity, transparent:true, depthWrite:false, sizeAttenuation:true});
  return {mesh:new THREE.Points(geometry, material), times, geometry, material};
}

function axes() {
  const coordinates = [
    -6,-2.6,-2, 6,-2.6,-2, -6,-2.6,-2, -6,2.6,-2, -6,-2.6,-2, -6,-2.6,2,
    6,-2.6,-2, 6,2.6,-2, 6,-2.6,-2, 6,-2.6,2,
    -6,2.6,-2, 6,2.6,-2, -6,-2.6,2, 6,-2.6,2,
  ];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(coordinates, 3));
  return new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({color:0x4b7471,transparent:true,opacity:.7}));
}

function sceneFor(host, events, interactive) {
  const renderer = new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x102c2b);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x102c2b);
  scene.fog = new THREE.FogExp2(0x102c2b, .015);
  const camera = new THREE.PerspectiveCamera(42, 1, .1, 100);
  const home = new THREE.Vector3(13.5, 7.4, 12.5);
  camera.position.copy(home);
  camera.lookAt(0, 0, 0);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = .06;
  controls.enablePan = false;
  controls.minDistance = 8;
  controls.maxDistance = 40;
  controls.autoRotate = !interactive;
  controls.autoRotateSpeed = .42;
  scene.add(axes());

  const negative = pointSet(events, row => row[4] === 0 && row[3] === 0, 0x6ab9be, .065, interactive ? .62 : .5);
  const positive = pointSet(events, row => row[4] === 0 && row[3] === 1, 0x9bccc1, .065, interactive ? .62 : .5);
  const target = pointSet(events, row => row[4] === 1, 0xf36f53, .13, 1);
  for (const points of [negative, positive, target]) scene.add(points.mesh);

  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(5.05,3.8),
    new THREE.MeshBasicMaterial({color:0xf36f53,side:THREE.DoubleSide,transparent:true,opacity:.075,depthWrite:false}),
  );
  plane.rotation.y = Math.PI / 2;
  plane.visible = interactive;
  scene.add(plane);

  function resize() {
    const width = host.clientWidth, height = host.clientHeight;
    if (!width || !height) return;
    const pixelRatio = Math.min(devicePixelRatio, 2);
    if (renderer.domElement.width !== Math.round(width * pixelRatio) || renderer.domElement.height !== Math.round(height * pixelRatio)) {
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
  }
  function windowAt(time) {
    const start = Math.max(0, time - 800), end = Math.min(8000, time + 800);
    for (const points of [negative,positive,target]) {
      points.geometry.setDrawRange(lowerBound(points.times,start),lowerBound(points.times,end)-lowerBound(points.times,start));
    }
    plane.position.x = (time / 7999 - .5) * 12;
  }
  function render() { resize(); controls.update(); renderer.render(scene,camera); }
  function reset() { camera.position.copy(home); controls.target.set(0,0,0); controls.update(); }
  return {render,windowAt,reset,negative,positive,target};
}

try {
  const response = await fetch('./assets/val015_events.json');
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const {events} = await response.json();
  const cover = sceneFor(coverHost,events,false);
  const demo = sceneFor(demoHost,events,true);
  playButton.textContent = 'Ⅱ';
  playButton.setAttribute('aria-label','暂停时间窗');
  function updateTime() {
    const time = Number(slider.value);
    demo.windowAt(time);
    timeLabel.textContent = `${(time / 1000).toFixed(1)} s`;
  }
  slider.addEventListener('input',updateTime);
  targetToggle.addEventListener('change',() => {
    demo.target.material.opacity = targetToggle.checked ? 1 : .2;
    demo.negative.material.opacity = targetToggle.checked ? .62 : .85;
    demo.positive.material.opacity = targetToggle.checked ? .62 : .85;
  });
  playButton.addEventListener('click',() => {
    playing = !playing;
    playButton.textContent = playing ? 'Ⅱ' : '▶';
    playButton.setAttribute('aria-label',playing ? '暂停时间窗' : '播放时间窗');
  });
  document.getElementById('event-reset').addEventListener('click',demo.reset);
  updateTime();
  setInterval(() => {
    const active = document.querySelector('.slide.active');
    if (!playing || !active?.contains(demoHost)) return;
    slider.value = String((Number(slider.value) + 48) % 8000);
    updateTime();
  }, 48);
  function frame(now) {
    requestAnimationFrame(frame);
    const active = document.querySelector('.slide.active');
    if (active?.contains(coverHost)) cover.render();
    else if (active?.contains(demoHost)) {
      if (playing && lastFrame) {
        slider.value = String((Number(slider.value) + (now - lastFrame) * .6) % 8000);
        updateTime();
      }
      demo.render();
    }
    lastFrame = now;
  }
  requestAnimationFrame(frame);
} catch (error) {
  for (const host of [coverHost,demoHost]) host.textContent = `三维事件流未载入：${error.message}`;
  console.error(error);
}
