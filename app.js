const slides = [...document.querySelectorAll('.slide')];
const deck = document.getElementById('deck');
const counter = document.getElementById('counter');
const progress = document.getElementById('progress');
const overview = document.getElementById('overview');
const notes = document.getElementById('notes');
let index = 0;

function fit() {
  if (matchMedia('(max-width: 760px)').matches) {
    deck.style.setProperty('--scale', 1);
    return;
  }
  const scale = Math.min(innerWidth / 1600, (innerHeight - 48) / 900);
  deck.style.setProperty('--scale', scale);
}

function show(next, updateHash = true) {
  index = Math.max(0, Math.min(slides.length - 1, next));
  slides.forEach((slide, i) => slide.classList.toggle('active', i === index));
  const slide = slides[index];
  slide.scrollTop = 0;
  counter.textContent = `${String(index + 1).padStart(2, '0')} / ${slides.length}`;
  progress.style.width = `${(index + 1) / slides.length * 100}%`;
  document.getElementById('note-copy').textContent = slide.querySelector('.speaker')?.textContent || '';
  document.getElementById('note-duration').textContent = slide.dataset.time || '';
  document.getElementById('note-source').textContent = `依据：${slide.dataset.source || ''}`;
  document.querySelectorAll('#overview-items button').forEach((button, i) => button.classList.toggle('current', i === index));
  if (updateHash) history.replaceState(null, '', `#${index + 1}`);
  dispatchEvent(new Event('slidechange'));
}

function toggle(element) { element.hidden = !element.hidden; }

document.getElementById('prev').addEventListener('click', () => show(index - 1));
document.getElementById('next').addEventListener('click', () => show(index + 1));
document.getElementById('overview-button').addEventListener('click', () => toggle(overview));
document.getElementById('overview-close').addEventListener('click', () => overview.hidden = true);
document.getElementById('notes-button').addEventListener('click', () => toggle(notes));
document.getElementById('notes-close').addEventListener('click', () => notes.hidden = true);
document.getElementById('fullscreen-button').addEventListener('click', async () => {
  if (document.fullscreenElement) await document.exitFullscreen();
  else await document.documentElement.requestFullscreen();
});

const list = document.getElementById('overview-items');
slides.forEach((slide, i) => {
  const button = document.createElement('button');
  button.innerHTML = String.raw`<b>${String(i + 1).padStart(2, '0')}</b> ${slide.querySelector('h2,h1')?.textContent || ''}<small>${slide.dataset.section} · ${slide.dataset.time}</small>`;
  button.addEventListener('click', () => { overview.hidden = true; show(i); });
  list.append(button);
});

addEventListener('hashchange', () => {
  const target = Number(location.hash.slice(1)) - 1;
  if (Number.isInteger(target)) show(target, false);
});
addEventListener('resize', fit);
document.addEventListener('keydown', e => {
  if (e.target.matches('input,textarea,select')) return;
  if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); show(index + 1); }
  if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); show(index - 1); }
  if (e.key.toLowerCase() === 'o') toggle(overview);
  if (e.key.toLowerCase() === 'n') toggle(notes);
  if (e.key.toLowerCase() === 'f') document.getElementById('fullscreen-button').click();
  if (e.key === 'Escape') { overview.hidden = true; notes.hidden = true; }
});
let touchX = null;
deck.addEventListener('touchstart', e => { touchX = e.touches[0]?.clientX ?? null; }, { passive: true });
deck.addEventListener('touchend', e => {
  if (touchX == null || e.target.closest('input,.scene')) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 80) show(index + (dx < 0 ? 1 : -1));
  touchX = null;
}, { passive: true });

const methodSlides = [...document.querySelectorAll('.slide')];
const exactSlide = methodSlides.find(slide => slide.querySelector('.chapter')?.textContent.includes('EXACT-EVENT'));
if (exactSlide) {
  exactSlide.querySelector('h2').textContent = '事件域路径：保留原始时间精度，稳定稀疏事件邻域';
  exactSlide.querySelector('.detail-grid').innerHTML = String.raw`<div class="detail-main"><p class="method-motivation"><b>动机：</b>逐事件处理保留微秒级时间地址，但稀疏区域的邻域不稳定；相同毫秒坐标的重复事件还会违反稀疏卷积的唯一坐标约束。</p><div class="formula"><span class="math" data-tex="f_i=[\bar x_i,\bar y_i,\bar t_i,p_i,\sin(2\pi\bar t_i),\cos(2\pi\bar t_i),d_x,d_y,\rho_{50},\rho_{local}]\in\mathbb R^{10}"></span><span class="eqno">(3)</span></div><p>输入特征加入边界距离、50 ms 全局密度和局部密度，使事件携带位置、时间相位与周围活动强度。</p><div class="formula"><span class="math" data-tex="h_i^0=\operatorname{MLP}_{evt}(f_i)\in\mathbb R^{64}"></span><span class="eqno">(4)</span></div><div class="formula"><span class="math" data-tex="c_i=|\mathcal S|^{-1/2}\sum_{s\in\mathcal S}\frac{1}{|\mathcal N_s(i)|}\sum_{j\in\mathcal N_s(i)}W_vh_j^0"></span><span class="eqno">(5)</span></div><p>三个尺度 <span class="math" data-tex="\mathcal S=\{(2,2,32),(4,4,128),(8,8,512)\}"></span> 提供局部到中程上下文。</p><div class="formula"><span class="math" data-tex="h_i=h_i^0+\tanh(\gamma)\,\sigma(W_g[h_i^0;c_i])W_u[h_i^0;c_i]"></span><span class="eqno">(6)</span></div></div><aside class="detail-aside"><h3>坐标规范化</h3><p>相同 <span class="math" data-tex="(x,y,t_{ms})"></span> 的事件执行均值聚合，得到 <span class="math" data-tex="M\le N"></span> 个唯一稀疏站点。</p><div class="formula"><span class="math" data-tex="\pi:\{1,\ldots,N\}\to\{1,\ldots,M\}"></span></div><h3>关键不变量</h3><ul><li>规范化不是语义删点</li><li>每条原始事件通过 <span class="math" data-tex="\pi"></span> 映回预测</li><li>事件路径始终保留精确 <span class="math" data-tex="t_i"></span></li></ul><p class="aside-end">事件域解决“事件发生在哪里、何时发生”。</p></aside>`;
}
const fieldSlide = methodSlides.find(slide => slide.querySelector('.chapter')?.textContent.includes('SPATIOTEMPORAL FIELD'));
if (fieldSlide) {
  fieldSlide.querySelector('h2').textContent = '规则时空场：用局部 3D、运动对齐与全局时间建模补足上下文';
  fieldSlide.querySelector('.field-story').innerHTML = String.raw`<div class="field-tensor"><p class="method-motivation"><b>动机：</b>事件 token 保留精度，却在稀疏背景中难以形成稳定长程邻域；场分支将事件散射为规则上下文，但不承担最终输出坐标。</p><span class="math" data-tex="F\in\mathbb R^{B\times12\times96\times130\times173}"></span><p>12 个通道包括计数、正负极性计数、极性平衡、占据率、bin 内时间均值/方差、局部密度、正弦/余弦时间和归一化坐标。96 个 bin 覆盖 8 秒，每个上下文切片约 83.3 ms。</p><div class="formula"><span class="math" data-tex="e=D_{d_t}^{3D}(\operatorname{LN}Z)+D^{xy}(\operatorname{LN}Z)"></span><span class="eqno">(7)</span></div><div class="formula"><span class="math" data-tex="\operatorname{Block}(Z)=Z+\gamma\odot\operatorname{MLP}(\operatorname{GELU}(e))"></span><span class="eqno">(8)</span></div></div><table class="research-table"><thead><tr><th>层级</th><th>操作</th><th>形状 <span class="math" data-tex="(C,T,H,W)"></span></th><th>作用</th></tr></thead><tbody><tr><td>L0</td><td>局部膨胀 3D</td><td>32,96,130,173</td><td>形成局部证据</td></tr><tr><td>L1</td><td>空间下采样</td><td>64,96,65,86</td><td>保留完整时间轴</td></tr><tr><td>L2</td><td>时空下采样 + 对齐</td><td>128,48,32,43</td><td>融合相邻时间状态</td></tr><tr><td>L3</td><td>全局时间注意力</td><td>256,24,16,21</td><td>传播长时依赖</td></tr><tr><td>D0</td><td>三线性上采样 + skip</td><td>32,96,130,173</td><td>恢复查询场</td></tr></tbody></table>`;
  fieldSlide.querySelector('.field-bottom').innerHTML = String.raw`<div><b>多尺度时间膨胀</b><span><span class="math" data-tex="d_t\in\{1,2,4,8\}"></span>，扩大局部时间感受野</span></div><div><b>运动对齐</b><span><span class="math" data-tex="M_t=r_t^0Z_t+r_t^-W(Z_{t-1},v_t^-)+r_t^+W(Z_{t+1},v_t^+)"></span></span></div><div><b>全局建模</b><span>L3 对每个粗粒度空间位置沿时间做 8 头注意力</span></div>`;
}
const querySlide = methodSlides.find(slide => slide.querySelector('.chapter')?.textContent.includes('CONTINUOUS-TIME QUERY'));
if (querySlide) {
  querySlide.querySelector('h2').textContent = '连续时间查询：把规则场特征返回每一条原始事件';
  querySlide.querySelector('.query-formula').innerHTML = String.raw`<p class="method-motivation"><b>动机：</b>若直接把 96 个时间 bin 当作输出，时间分辨率约为 83.3 ms；这会抹平事件顺序。因此场只提供上下文，输出必须回到原始 <span class="math" data-tex="t_i"></span>。</p><div class="formula"><span class="math" data-tex="\tau_i=\frac{t_i}{T_{max}-1}(T_f-1),\quad a_i=\lfloor\tau_i\rfloor,\quad\alpha_i=\tau_i-a_i"></span><span class="eqno">(10)</span></div><div class="formula"><span class="math" data-tex="g_i=(1-\alpha_i)G_{a_i,\bar y_i,\bar x_i}+\alpha_iG_{a_i+1,\bar y_i,\bar x_i}"></span><span class="eqno">(11)</span></div><div class="formula"><span class="math" data-tex="z_i=\operatorname{MLP}([h_i;g_i])\in\mathbb R^{96},\quad q_i=\sigma(z_i)"></span><span class="eqno">(12)</span></div><p class="query-conclusion">事件 token 决定精确地址，连续查询提供规则上下文，融合 head 对每个原始事件输出概率。</p>`;
  querySlide.querySelector('.query-interaction p').innerHTML = '拖动事件时刻：线性插值连续改变 <span class="math" data-tex="g_i"></span>，而输出索引仍是事件 <span class="math" data-tex="i"></span>。';
}

document.querySelectorAll('.math').forEach(element => {
  try { katex.render(element.dataset.tex, element, { throwOnError: true, strict: 'ignore' }); }
  catch (error) { console.warn('Equation not rendered:', element.dataset.tex, error); }
});

const textWalker = document.createTreeWalker(deck, NodeFilter.SHOW_TEXT);
while (textWalker.nextNode()) textWalker.currentNode.nodeValue = textWalker.currentNode.nodeValue
  .replace(/\$([^$]+)\$/g, '$1')
  .replace(/Fig\.\s*\d+\s*[·:]?\s*/gi, '')
  .replace(/Table\s*[IVX\d]+\s*[·:]?\s*/gi, '');
document.querySelectorAll('[data-source]').forEach(element => {
  element.dataset.source = element.dataset.source
    .replace(/Fig\.\s*\d+\s*[·:]?\s*/gi, '')
    .replace(/Table\s*[IVX\d]+\s*[·:]?\s*/gi, '');
});

const formalResultTable = document.querySelector('.our-result table tbody');
if (formalResultTable) {
  formalResultTable.innerHTML = String.raw`
    <tr class="ours-row"><td><b>TrajectoryFieldNet</b></td><td>public val</td><td>0.968651</td><td>0.942803</td><td>0.969545</td><td>0.985300</td><td>0.0373×10⁻⁴</td><td>4.61M</td></tr>
    <tr class="ours-row"><td><b>TrajectoryFieldNet</b></td><td>frozen test</td><td><b>0.941637</b></td><td>0.917858</td><td>0.968399</td><td>0.949598</td><td>0.0641×10⁻⁴</td><td>4.61M</td></tr>`;
  const resultBlock = formalResultTable.closest('.our-result');
}

const lossSketches = [
  // Dice：预测集合左右移动，交集用双 clipPath 求两椭圆真实交集（透镜形），随移动实时变化
  `<svg viewBox="0 0 320 200" role="img" aria-label="Dice 集合覆盖动画">
    <defs>
      <clipPath id="diceTruthClip"><ellipse cx="190" cy="105" rx="74" ry="44"/></clipPath>
      <clipPath id="dicePredClip"><ellipse cx="130" cy="105" rx="74" ry="44">
        <animate attributeName="cx" values="130;190;130" keyTimes="0;0.5;1" dur="3.2s" repeatCount="indefinite"/>
      </ellipse></clipPath>
    </defs>
    <rect x="8" y="8" width="304" height="184" fill="#f7f8f5" stroke="#c5cecf"/>
    <ellipse cx="190" cy="105" rx="74" ry="44" fill="#a84d39" fill-opacity=".16" stroke="#a84d39" stroke-width="2.5"/>
    <ellipse cx="130" cy="105" rx="74" ry="44" fill="#3478d1" fill-opacity=".16" stroke="#3478d1" stroke-width="2.5">
      <animate attributeName="cx" values="130;190;130" keyTimes="0;0.5;1" dur="3.2s" repeatCount="indefinite"/>
    </ellipse>
    <g clip-path="url(#diceTruthClip)"><g clip-path="url(#dicePredClip)"><rect x="20" y="55" width="260" height="100" fill="#7a5c8d" fill-opacity=".62"/></g></g>
    <text x="222" y="40" fill="#a84d39" font-size="15">truth</text>
    <text x="82" y="40" fill="#3478d1" font-size="15">prediction
      <animate attributeName="x" values="82;142;82" keyTimes="0;0.5;1" dur="3.2s" repeatCount="indefinite"/>
    </text>
    <text x="190" y="112" fill="#4a2d5c" font-size="17" font-weight="bold" text-anchor="middle" opacity="0">overlap
      <animate attributeName="opacity" values="0;0;1;0;0" keyTimes="0;0.34;0.5;0.66;1" dur="3.2s" repeatCount="indefinite"/>
    </text>
    <text x="160" y="180" fill="#64737a" font-size="14" text-anchor="middle">2|P∩G| / (|P|+|G|)</text>
  </svg>`,
  // STC：真实目标在时空里形成连续轨迹（曲线上的点依次点亮、互相呼应）；轨迹外的孤立噪点被压暗
  `<svg viewBox="0 0 320 200" role="img" aria-label="STC 邻域支持动画">
    <rect x="8" y="8" width="304" height="184" fill="#f7f8f5" stroke="#c5cecf"/>
    <path d="M30 158 Q120 36 288 130" fill="none" stroke="#b8c8c3" stroke-width="2.5" stroke-dasharray="2 9" stroke-linecap="round"/>
    ${Array.from({ length: 13 }, (_, i) => {
      const t = i / 12, x = (1 - t) ** 2 * 30 + 2 * (1 - t) * t * 120 + t * t * 288, y = (1 - t) ** 2 * 158 + 2 * (1 - t) * t * 36 + t * t * 130;
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7" fill="#398a68" opacity=".22"><animate attributeName="opacity" values=".22;1;.22" dur="2.6s" begin="${(0.16 * i).toFixed(2)}s" repeatCount="indefinite"/></circle>`;
    }).join('')}
    <circle cx="119.4" cy="93.6" r="33" fill="#398a68" fill-opacity=".07" stroke="#398a68" stroke-width="1.4" stroke-dasharray="4 4">
      <animate attributeName="r" values="31;35;31" dur="2.2s" repeatCount="indefinite"/>
    </circle>
    <circle cx="119.4" cy="93.6" r="9" fill="#a84d39" stroke="#f7f8f5" stroke-width="1.5">
      <animate attributeName="r" values="8.5;12;8.5" dur="2.2s" repeatCount="indefinite"/>
    </circle>
    <g fill="#d77a32">
      <circle cx="44" cy="78" r="7"><animate attributeName="opacity" values="1;.12;1" dur="2.8s" begin="0.3s" repeatCount="indefinite"/></circle>
      <circle cx="262" cy="46" r="7"><animate attributeName="opacity" values="1;.12;1" dur="2.8s" begin="1.1s" repeatCount="indefinite"/></circle>
      <circle cx="186" cy="166" r="7"><animate attributeName="opacity" values="1;.12;1" dur="2.8s" begin="1.8s" repeatCount="indefinite"/></circle>
    </g>
    <text x="150" y="28" fill="#2f7a5b" font-size="14" text-anchor="middle">continuous target trajectory</text>
    <text x="120" y="140" fill="#398a68" font-size="12" text-anchor="middle">neighbors</text>
    <text x="252" y="182" fill="#d77a32" font-size="14" text-anchor="middle">isolated noise</text>
  </svg>`,
  // Topo：一条连通目标管；断裂处先被挖空（红虚线/断点），再愈合接通；长在管上的假分叉被剪掉淡出
  `<svg viewBox="0 0 320 200" role="img" aria-label="Topo 连通性与断裂动画">
    <rect x="8" y="8" width="304" height="184" fill="#f7f8f5" stroke="#c5cecf"/>
    <path d="M25 150 C90 50 200 50 295 130" fill="none" stroke="#398a68" stroke-width="9" stroke-linecap="round"/>
    <path d="M25 150 C90 50 200 50 295 130" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 17" opacity=".7">
      <animate attributeName="stroke-dashoffset" values="0;-210" dur="1.8s" repeatCount="indefinite"/>
    </path>
    <circle cx="102" cy="83" r="12" fill="#f7f8f5">
      <animate attributeName="r" values="12;12;0;0;12" keyTimes="0;0.30;0.42;0.92;1" dur="3.6s" repeatCount="indefinite"/>
    </circle>
    <path d="M94 86 C100 83 105 81 110 80" fill="none" stroke="#a84d39" stroke-width="6" stroke-dasharray="7 7" stroke-linecap="round">
      <animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;0.30;0.42;0.92;1" dur="3.6s" repeatCount="indefinite"/>
    </path>
    <g fill="#a84d39">
      <circle cx="94" cy="86" r="4.5"><animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;0.30;0.42;0.92;1" dur="3.6s" repeatCount="indefinite"/></circle>
      <circle cx="110" cy="80" r="4.5"><animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;0.30;0.42;0.92;1" dur="3.6s" repeatCount="indefinite"/></circle>
    </g>
    <path d="M196 36 L213 82 L238 38" fill="none" stroke="#d77a32" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round">
      <animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;0.55;0.67;0.92;1" dur="3.6s" repeatCount="indefinite"/>
    </path>
    <text x="102" y="62" fill="#a84d39" font-size="14" text-anchor="middle">break      <animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;0.30;0.42;0.92;1" dur="3.6s" repeatCount="indefinite"/>    </text>
    <text x="217" y="28" fill="#d77a32" font-size="14" text-anchor="middle">spurious branch      <animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;0.55;0.67;0.92;1" dur="3.6s" repeatCount="indefinite"/>    </text>
    <text x="160" y="184" fill="#2f7a5b" font-size="14" text-anchor="middle">connected target tube</text>
  </svg>`
];
document.querySelectorAll('.loss-three article').forEach((article, index) => {
  const sketch = document.createElement('div');
  sketch.className = 'loss-sketch';
  sketch.innerHTML = lossSketches[index];
  article.append(sketch);
});
document.querySelectorAll('.stc-paper-figure').forEach(element => element.remove());
document.querySelectorAll('.window-gap,.bridge').forEach(element => element.remove());
const priorSpeaker = document.querySelector('[data-section="已有研究"] .speaker');
if (priorSpeaker) priorSpeaker.textContent = 'EV-UAV 的核心价值在于任务定义、事件级标注和 STC 监督。该基线说明了事件级点云分割如何利用目标运动形成的时空结构。';

const datasetTable = document.querySelector('.paper-mini-table');
if (datasetTable && !datasetTable.parentElement.querySelector('.dataset-legend')) {
  const legend = document.createElement('p');
  legend.className = 'dataset-legend';
  legend.textContent = '缩写：L = bright light（强光）；NL = normal light（正常光）；LL = low light（低光）；MS = multi-scene（多场景）；MT = multi-target（多目标）。';
  datasetTable.parentElement.append(legend);
}

const setupLeft = document.querySelector('.setup-slide .setup-left');
if (setupLeft && !setupLeft.querySelector('.setup-protocol')) {
  const protocol = document.createElement('div');
  protocol.className = 'setup-protocol';
  protocol.innerHTML = String.raw`
    <div class="protocol-block"><h3>数据增强与采样</h3><p>水平翻转 0.50；垂直翻转 0.10；时间反转 0.10；时间尺度扰动 σ=0.015；时间平移 σ=0.003；极性翻转 0.02；事件丢弃 0.02；负例丢弃 0.05。</p><p>Copy-paste 概率 0.15；最多复制 8,192 条事件；保留全部正例；负例按时间均匀采样；单样本上限 700,000 条事件。</p></div>
    <div class="protocol-block"><h3>评测与测试策略</h3><p>验证集扫描阈值 0.20–0.99，按官方 Score 选择阈值；验证阶段使用原始视图 TTA，推理采用 AMP 与事件分块接口。</p><p>测试预测、阈值和 TTA 先冻结，再读取测试真值计算最终指标；测试真值不参与训练、模型选择、阈值选择或后处理拟合。</p></div>`;
  setupLeft.append(protocol);
}

const query = document.getElementById('query-time');
function updateQuery() {
  const right = Number(query.value) / 100;
  document.getElementById('weight-left').textContent = (1 - right).toFixed(2);
  document.getElementById('weight-right').textContent = right.toFixed(2);
  document.getElementById('query-dot').style.left = `${right * 100}%`;
}
query.addEventListener('input', updateQuery);
updateQuery();
fit();
show(Math.max(0, Number(location.hash.slice(1) || 1) - 1), false);
